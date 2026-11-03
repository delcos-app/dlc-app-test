/**
 * Everything «Registrar visita» needs, asked at once so the window is painted complete: the card and its results (from the offline
 * copy without connection), the account type and «sin reporting», the regulated samples left this year, the promoted products
 * and whether their timetable is missing. v2.464.0 (VIS-2): for an account «sin reporting» the results that are a report for it are
 * left out here, by their mark in the list (by the word «reporting» with a database without SQL 192).
 */
import { accountCardLegacy, cachedRpc, legacyDb } from '../../../legacy/bridge';
import { visitLegacy } from '../../../legacy/visit-bridge';
import { missingTimetable as lacksTimetable } from '../../accounts/timetable';
import { isReportResult } from '../../../core/catalog-roles';

export interface ResultValue { valor: string; extra?: string | null; papel?: string | null; informe?: boolean | null; oculto?: boolean; dato_tipo?: string | null }
export interface ResultGroup { clave: string; papel?: string | null; nombre: string; descripcion?: string | null; valores: ResultValue[] }
export interface SampleLeft { producto_id: string; nombre: string; en_plazo: boolean; quedan: number; max: number; hasta?: string | null }
export type RecordAccount = CardAccount & { urgente_motivo?: string | null };

export interface VisitData {
  account: RecordAccount;
  consultations: CardConsultation[];
  groups: ResultGroup[];
  samples: SampleLeft[];
  products: readonly { id: string; nombre: string }[];
  noReporting: boolean;
  /** Some results were left out because they are a report and the account does not receive them. */
  reportsHidden: boolean;
  missingTimetable: boolean;
}

const CENTRE = 'Centro';

/** The card and the results of the visit: from the network and, without it, from the saved copy. */
async function cardAndResults(id: string): Promise<{ card: CardData | null; groups: ResultGroup[] }> {
  const [card, results] = await Promise.all([
    cachedRpc<CardData>('ficha_cuenta', { p_id: id }, `ficha-${id}`), cachedRpc<ResultGroup[]>('clasificadores_actividad', { p_cuenta: id }, `clasact-${id}`),
  ]);
  let groups = results.data;
  if (groups && !results.cache) visitLegacy.saveCopy('clasact', groups);
  groups ??= visitLegacy.readCopy('clasact') as ResultGroup[] | null;
  return { card: card.data, groups: groups ?? [] };
}

async function accountFlags(id: string): Promise<{ tipo?: string | null; sin_reporting?: boolean | null } | null> {
  try { return (await legacyDb().from<{ tipo?: string | null; sin_reporting?: boolean | null }>('cuentas').select('tipo,sin_reporting').eq('id', id).maybeSingle()).data; } catch { return null; }
}

/** Samples need connection (the legal limit is checked in the server) and are only given to professionals. */
async function samplesLeft(id: string, type: string | null | undefined): Promise<SampleLeft[]> {
  if (!navigator.onLine || type === CENTRE) return [];
  const { data } = await legacyDb().rpc<SampleLeft[]>('muestras_de_cuenta', { p_cuenta: id });
  return Array.isArray(data) ? data : [];
}

/** Without the results that are a report (for an account that does not receive them). */
function withoutReports(groups: readonly ResultGroup[]): { groups: ResultGroup[]; hidden: boolean } {
  const kept = groups.map(group => ({ ...group, valores: group.valores.filter(value => !isReportResult(value)) }));
  return { groups: kept, hidden: kept.some((group, index) => group.valores.length !== groups[index]?.valores.length) };
}

/** The data of the window, or why the card cannot be read ('online' or 'offline'). */
export async function loadVisitData(id: string): Promise<VisitData | string> {
  const coverage = accountCardLegacy.planIncludes('cobertura');
  const [{ card, groups }, flags, products, missingTimetable] = await Promise.all([
    cardAndResults(id), accountFlags(id), coverage ? visitLegacy.promotedProducts().catch(() => []) : Promise.resolve([]), lacksTimetable(id).catch(() => false),
  ]);
  if (!card?.medico) return navigator.onLine ? 'online' : 'offline';
  const samples = await samplesLeft(id, flags?.tipo).catch(() => []);
  const noReporting = Boolean(flags?.sin_reporting), shown = noReporting ? withoutReports(groups) : { groups, hidden: false };
  return { account: card.medico, consultations: card.consultas ?? [], groups: shown.groups, samples, products, noReporting, reportsHidden: shown.hidden, missingTimetable };
}
