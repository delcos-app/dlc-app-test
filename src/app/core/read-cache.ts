/**
 * Reads with a copy on the device (rpcCache: without network, the last copy; Inicio, Agenda and Pedidos keep what they need of the
 * answer), the visit write (escribirRpc: how it was done, the products shown, the samples with signature and the photos go with it;
 * without network it stays queued), turns of a module (only the last read paints) and the local loading mark. Migrated from the legacy
 * servicios/api.js (v2.425.0): the five layers of rpcCache and of escribirRpc are one function each, in the same order.
 */
import { coreLegacy } from '../legacy/core-bridge';
import { keepPendingPhotos } from '../services/files';
import { t } from '../i18n';
import { writeOrQueue } from './write-queue';
import { wordFor } from './vocabulary';

const SAMPLES_NOTICE_MS = 2600, MODULE_CACHE_MS = 10 * 60000, LOCAL_MIN_MS = 80, LOCAL_MAX_MS = 4000, LOCAL_TICK_MS = 40, QUIET_TICKS = 3;
const VISIT = 'registrar_actividad';

interface Cached { data: unknown; cache: boolean; fecha?: number }
type RangeParams = { p_desde?: string; p_hasta?: string } | null | undefined;

const deviceKey = (key: string): string => `dlc-cache-${coreLegacy.profile()?.id ?? ''}-${key}`;

export const saveCopy = (key: string, data: unknown): void => { try { localStorage.setItem(deviceKey(key), JSON.stringify({ t: Date.now(), d: data })); } catch { /* not kept */ } };

export const readCopy = (key: string): { t: number; d: unknown } | null => {
  try { return JSON.parse(localStorage.getItem(deviceKey(key)) ?? 'null') as { t: number; d: unknown } | null; } catch { return null; }
};

async function readWithCopy(name: string, params: unknown, key: string): Promise<Cached> {
  if (navigator.onLine) {
    const { data, error } = await coreLegacy.db().rpc(name, params as Record<string, unknown>);
    if (!error) { saveCopy(key, data); return { data, cache: false }; }
  }
  const copy = readCopy(key);
  return copy ? { data: copy.d, cache: true, fecha: copy.t } : { data: null, cache: true };
}

const oneDay = (params: RangeParams): string | null => (params?.p_desde && params.p_desde === params.p_hasta ? params.p_desde : null);

/** The Agenda's day: a preset answer is used once; the last day read is remembered. */
async function readAgendaDay(name: string, params: unknown, key: string): Promise<Cached> {
  const range = params as RangeParams, preset = coreLegacy.agendaPreset();
  if (name === 'agenda_rango' && preset && range && range.p_desde === preset.fecha && range.p_hasta === preset.fecha) {
    coreLegacy.setAgendaPreset(null); return { data: preset.data, cache: false };
  }
  const answer = await readWithCopy(name, params, key), day = name === 'agenda_rango' ? oneDay(range) : null;
  if (day && answer.data) coreLegacy.setLastAgendaDay(day, answer.data);
  return answer;
}

/** Inicio asks its charts at the same time and keeps both answers. */
async function readHome(name: string, params: unknown, key: string): Promise<Cached> {
  if (name !== 'panel_inicio') return readAgendaDay(name, params, key);
  const [answer, charts] = await Promise.all([readAgendaDay(name, params, key), readAgendaDay('inicio_graficas', {}, 'inicio-graficas').catch(() => null)]);
  const chartData = charts?.data as { por_dia?: unknown } | null | undefined;
  coreLegacy.setHomeData(answer.data ?? null, chartData?.por_dia ? chartData : null);
  return answer;
}

/** Calls a server function and keeps a copy; without connection returns the last copy. */
export function readCached(name: string, params: unknown, key: string): Promise<Cached> {
  // What the Agenda preloaded (screens/agenda/preload.ts) is used without going to the network
  if (name === 'agenda_rango' && params) { const preloaded = coreLegacy.peekAgendaRange(params); if (preloaded !== undefined) return Promise.resolve(preloaded as Cached); }
  // The order of Pedidos is part of the key of its pages
  const order = name === 'pedidos_pagina' ? coreLegacy.ordersSort() : null;
  const fullKey = order && key ? `${key}|orden:${order.k}${order.dir}` : key;
  return readHome(name, params, fullKey).then(answer => {
    const day = name === 'agenda_rango' ? oneDay(params as RangeParams) : null;
    if (day && answer.data) coreLegacy.rememberAgendaDay(day, answer.data);
    return answer;
  });
}

interface Samples { items: { producto_id: string; unidades: number }[]; firma: unknown; firmante: unknown }

async function saveSamples(payload: { p: Record<string, unknown> }, answer: { data?: unknown; error?: unknown }, samples: Samples | null): Promise<void> {
  if (!samples?.items.length || answer.error) return;
  const { items } = samples;
  const id = (answer.data as { id?: string } | null)?.id, operation = String(payload.p.op_id ?? '');
  const params = { cuenta_id: payload.p.cuenta_id, fecha: payload.p.fecha, items, firma: samples.firma, firmante: samples.firmante, op_id: `m-${operation}`,
    ...(id ? { actividad_id: id } : { actividad_op: operation }) };
  const result = await writeOrQueue('registrar_muestras', { p: params });
  const saved = wordFor('visita', 's', { nounCase: 'C', adjective: 'guardado' }), refused = result.data as { ok?: boolean } | null;
  if (!result.error && refused?.ok === false) setTimeout(() => { coreLegacy.toast(t('core.visit.samplesRefused', { visit: saved, reason: coreLegacy.sampleError(refused) }), true); }, SAMPLES_NOTICE_MS);
  else if (result.error) setTimeout(() => { coreLegacy.toast(t('core.visit.samplesFailed', { visit: saved }), true); }, SAMPLES_NOTICE_MS);
}

function savePhotos(visit: VisitDraft, payload: { p: Record<string, unknown> }, answer: { data?: unknown; error?: unknown }): void {
  if (!visit.fotos.length || answer.error) return;
  const id = (answer.data as { id?: string } | null)?.id;
  // Without connection the photos wait on the device and go up with the visit
  if (id) void coreLegacy.uploadVisitPhotos(id, visit.fotos); else void keepPendingPhotos(String(payload.p.op_id ?? ''), visit.fotos);
}

/** The visit being recorded goes with its write: how it was done, the products shown, the samples and the photos. */
async function writeVisit(payload: { p: Record<string, unknown> }, visit: VisitDraft): Promise<{ data?: unknown; error?: unknown }> {
  if (visit.productos) payload.p.productos = visit.productos.slice();
  // The samples (and their signature) are read before the window is forgotten
  const samples: Samples | null = visit.muestras
    ? { items: visit.muestras.items().map(item => ({ producto_id: item.producto_id, unidades: item.unidades })), firma: visit.muestras.firma(), firmante: visit.muestras.firmante() } : null;
  payload.p.modo = visit.modo;
  coreLegacy.setVisitDraft(null);
  const answer = await writeOrQueue(VISIT, payload);
  savePhotos(visit, payload, answer);
  await saveSamples(payload, answer, samples);
  return answer;
}

/** A write through the device queue (escribirRpc); a visit takes what the open visit window collected. */
export async function writeQueued(name: string, payload: unknown): Promise<{ data?: unknown; error?: unknown }> {
  const visit = coreLegacy.visitDraft(), params = payload as { p?: Record<string, unknown> } | null;
  const ofVisit = name === VISIT && visit && params?.p && params.p.cuenta_id === visit.id;
  const answer = ofVisit ? await writeVisit(params as { p: Record<string, unknown> }, visit) : await writeOrQueue(name, payload);
  if (name === VISIT && (answer.data as { encolada?: boolean } | null)?.encolada) setTimeout(() => { if (coreLegacy.currentScreen() === 'agenda') coreLegacy.markQueuedVisits(); }, 0);
  return answer;
}

const turns: Record<string, number> = {};

/** The reads of a module that is no longer on screen are dropped: only the last turn paints. */
export const takeTurn = (key: string): number => (turns[key] = (turns[key] ?? 0) + 1);
export const isMyTurn = (key: string, turn: number): boolean => turns[key] === turn;

/** Loading inside a card (pages, page changes): the mark goes when the network is quiet (at most 4 seconds). */
export function localLoading(element: Element | null): void {
  if (!element) return;
  element.classList.add('cargandolocal');
  const start = performance.now(); let quiet = 0;
  const timer = setInterval(() => {
    quiet = coreLegacy.pendingReads() === 0 ? quiet + 1 : 0;
    const elapsed = performance.now() - start;
    if ((quiet >= QUIET_TICKS && elapsed > LOCAL_MIN_MS) || elapsed > LOCAL_MAX_MS) { clearInterval(timer); element.classList.remove('cargandolocal'); }
  }, LOCAL_TICK_MS);
}

/** The module's screen can be shown again as it is (same filters, no writes since, less than 10 minutes). */
export function canReuseScreen(module: string): boolean {
  const cached = coreLegacy.moduleCache(module), section = document.getElementById(`v-${module}`);
  if (!cached || coreLegacy.arrivedVia() !== module || !section?.children.length) return false;
  return cached.clave === coreLegacy.moduleState(module) && cached.esc === coreLegacy.writeCount() && Date.now() - cached.t < MODULE_CACHE_MS;
}
