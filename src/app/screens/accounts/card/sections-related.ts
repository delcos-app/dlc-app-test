/**
 * Blocks of other modules in the account card, each only if the plan includes it and there is something to show: samples this
 * year, events, material in deposit, surgeries, tenders and installed equipment. Migrated from the legacy abrirFichaBase8–15.
 */
import { accountCardLegacy, legacyDb, permissions, relatedLegacy } from '../../../legacy/bridge';
import { t } from '../../../i18n';
import { formatShortDate } from '../../../services/date-format';
import { escapeHtml, formatNumber } from '../../../services/format';
import { orFallback, sum } from '../../../services/values';
import { reviewPill } from '../../equipment/model';
import { statePill } from '../../surgeries/model';
import { contractEnd, daysLeft, statePill as tenderPill } from '../../tenders/model';
import { accountKind, addBeforeFields, closeCardAnd, fieldsPlace, onEach, stillShown } from './card-tools';

/** Values stored in the database (each module names its states). */
const ATTENDED = 'Asistió', NOT_ATTENDED = 'No asistió', AWARDED = 'Adjudicado', INSTALLED = 'Instalado', CENTRE = 'Centro';
const OPEN_TENDERS = ['En estudio', 'Oferta enviada', AWARDED];
const SHOWN_EVENTS = 5;

const canAdd = (blockId: string, section?: string): boolean =>
  Boolean(fieldsPlace()) && !document.getElementById(blockId) && (!section || accountCardLegacy.planIncludes(section));

interface Sample { nombre: string; entregadas: number; max: number; en_plazo: boolean; quedan: boolean }

/** What was given this year of each regulated product. */
export async function samples(id: string): Promise<void> {
  if (!canAdd('fmuestras')) return;
  const { data } = await legacyDb().rpc<Sample[]>('muestras_de_cuenta', { p_cuenta: id });
  if (!Array.isArray(data) || !data.length) return;
  const pill = (sample: Sample): string => {
    if (!sample.en_plazo) return `<span class="pill p-anu">${t('accounts.card.samplesOutOfTime')}</span>`;
    return sample.quedan ? '' : `<span class="pill p-warn">${t('accounts.card.samplesNoneLeft')}</span>`;
  };
  addBeforeFields(id, 'fmuestras', `<div class="blk" id="fmuestras"><h3>${t('accounts.card.samplesTitle')}</h3>
      ${data.map(sample => `<div class="fmrow"><span>${escapeHtml(sample.nombre)}</span><b>${t('accounts.card.samplesGiven', { given: sample.entregadas, max: sample.max })}</b>${pill(sample)}</div>`).join('')}</div>`);
}

interface Attendance { estado: string; eventos: { id: string; titulo: string; fecha: string } | null }

/** The last events of this professional and whether they attended. */
export async function events(id: string): Promise<void> {
  if (!canAdd('feventos', 'eventos')) return;
  const { data } = await legacyDb().from<Attendance[]>('eventos_asistentes').select('estado,eventos(id,titulo,fecha)').eq('cuenta_id', id).limit(30);
  const list = (data ?? []).filter((item): item is Attendance & { eventos: NonNullable<Attendance['eventos']> } => item.eventos !== null)
    .sort((first, second) => String(second.eventos.fecha).localeCompare(String(first.eventos.fecha))).slice(0, SHOWN_EVENTS);
  if (!list.length) return;
  const pillClass = (state: string): string => (state === ATTENDED ? 'p-est' : state === NOT_ATTENDED ? 'p-anu' : 'p-per');
  const block = addBeforeFields(id, 'feventos', `<div class="blk" id="feventos"><h3>${t('accounts.card.eventsTitle')}</h3>
      ${list.map(item => `<div class="fmrow"><span><button type="button" class="lnk" data-fev="${item.eventos.id}">${escapeHtml(item.eventos.titulo)}</button><span class="sm"> · ${formatShortDate(item.eventos.fecha)}</span></span><span class="pill ${pillClass(item.estado)}">${escapeHtml(item.estado)}</span></div>`).join('')}</div>`);
  if (block) onEach(block, 'fev', event => { closeCardAnd(() => { relatedLegacy.openEvent(event); }); });
}

interface DepositState { ok?: boolean; existe?: boolean; lineas?: { unidades: number; producto_id: string; caducidad?: string | null }[] }

function depositText(state: DepositState): string {
  const lines = (state.lineas ?? []).filter(line => line.unidades > 0), total = sum(lines.map(line => line.unidades));
  if (!state.existe || !total) return t('accounts.card.depositNone');
  const productCount = new Set(lines.map(line => line.producto_id)).size, expiring = lines.filter(line => relatedLegacy.expiresSoon(line.caducidad)).length;
  const products = productCount === 1 ? t('accounts.card.oneProduct') : t('accounts.card.products', { count: productCount });
  const soon = expiring ? ` · <b class="u-warn">${expiring === 1 ? t('accounts.card.oneBatchExpires') : t('accounts.card.batchesExpire', { count: expiring })}${t('accounts.card.inLessThan60Days')}</b>` : '';
  return t('accounts.card.depositUnits', { units: formatNumber(total), products }) + soon;
}

/** A centre: its material in deposit (or the button to leave some). */
export async function deposit(id: string): Promise<void> {
  if (!canAdd('fdeposito', 'deposito')) return;
  const account = await accountKind(id);
  if (account?.tipo !== CENTRE) return;
  const { data: state } = await legacyDb().rpc<DepositState>('deposito_estado', { p_cuenta: id });
  if (!state || state.ok === false || !canAdd('fdeposito') || !stillShown(id)) return;
  addBeforeFields(id, 'fdeposito', `<div class="blk" id="fdeposito"><h3>${t('accounts.card.depositTitle')}</h3>
      <p class="sm">${depositText(state)}</p>
      <button type="button" class="btn sec" id="fdepabrir">${t(state.existe ? 'accounts.card.depositOpen' : 'accounts.card.depositLeave')}</button></div>`);
  const open = document.getElementById('fdepabrir');
  if (open) open.onclick = (): void => { closeCardAnd(() => { relatedLegacy.openDeposit(id, account.nombre ?? ''); }); };
}

/** The responsible professional or the centre: their last surgeries. */
export async function surgeries(id: string): Promise<void> {
  if (permissions.isProfessionalPortal() || !canAdd('fcirugias', 'cirugias')) return;
  const { data } = await legacyDb().from<{ id: string; fecha: string; procedimiento?: string | null; estado: string }[]>('cirugias').select('id,fecha,procedimiento,estado')
    .or(`cirujano_id.eq.${id},hospital_id.eq.${id}`).order('fecha', { ascending: false }).limit(5);
  if (!(data ?? []).length) return;
  const block = addBeforeFields(id, 'fcirugias', `<div class="blk" id="fcirugias"><h3>${t('accounts.card.surgeriesTitle')}</h3>
      ${(data ?? []).map(item => `<div class="fmrow"><span><button type="button" class="lnk" data-fcir="${item.id}">${escapeHtml(orFallback(item.procedimiento, t('accounts.card.surgery')))}</button><span class="sm"> · ${formatShortDate(item.fecha)}</span></span>${statePill(item)}</div>`).join('')}</div>`);
  if (block) onEach(block, 'fcir', surgery => { closeCardAnd(() => { relatedLegacy.openSurgery(surgery); }); });
}

interface Tender { id: string; titulo: string; estado: string; fin?: string | null; prorroga_hasta?: string | null }

function tenderEnd(tender: Tender): string {
  const left = daysLeft(tender);
  if (tender.estado !== AWARDED || left === null) return '';
  return ` · ${left < 0 ? t('accounts.card.tenderExpired') : t('accounts.card.tenderExpiresOn', { date: formatShortDate(contractEnd(tender) ?? '') })}`;
}

/** Its tenders in progress and contracts. */
export async function tenders(id: string): Promise<void> {
  if (permissions.isProfessionalPortal() || !canAdd('fconcursos', 'concursos')) return;
  const { data } = await legacyDb().from<Tender[]>('concursos').select('id,titulo,estado,fin,prorroga_hasta').eq('cuenta_id', id).in('estado', OPEN_TENDERS)
    .order('creado_en', { ascending: false }).limit(6);
  if (!(data ?? []).length) return;
  const block = addBeforeFields(id, 'fconcursos', `<div class="blk" id="fconcursos"><h3>${t('accounts.card.tendersTitle')}</h3>
      ${(data ?? []).map(item => `<div class="fmrow"><span><button type="button" class="lnk" data-fcon="${item.id}">${escapeHtml(item.titulo)}</button>${tenderEnd(item) ? `<span class="sm">${tenderEnd(item)}</span>` : ''}</span>${tenderPill(item.estado)}</div>`).join('')}</div>`);
  if (block) onEach(block, 'fcon', tender => { closeCardAnd(() => { relatedLegacy.openTender(tender); }); });
}

interface Equipment { id: string; serie?: string | null; ubicacion?: string | null; productos?: { nombre?: string | null } | null }

function equipmentRow(item: Equipment): string {
  const details = (item.serie ? t('accounts.card.serial', { serial: escapeHtml(item.serie) }) : '') + (item.ubicacion ? ` · ${escapeHtml(item.ubicacion)}` : '');
  return `<div class="fmrow"><span><button type="button" class="lnk" data-feq="${item.id}">${escapeHtml(orFallback(item.productos?.nombre, t('accounts.card.equipment')))}</button><span class="sm">${details}</span></span>${reviewPill(item)}</div>`;
}

/** Installed equipment (a centre always shows the block, to add the first one). */
export async function equipment(id: string): Promise<void> {
  if (permissions.isProfessionalPortal() || !canAdd('fequipos', 'parque')) return;
  const { data } = await legacyDb().from<Equipment[]>('equipos').select('id,serie,ubicacion,estado,contrato,contrato_fin,garantia_hasta,proxima_revision,productos(nombre)')
    .eq('cuenta_id', id).eq('estado', INSTALLED).order('instalado', { ascending: false }).limit(20);
  if (!canAdd('fequipos') || !stillShown(id)) return;
  const list = data ?? [], account = await accountKind(id);
  if (!list.length && account?.tipo !== CENTRE) return;
  const block = addBeforeFields(id, 'fequipos', equipmentHtml(list));
  if (block) bindEquipment(block, id, account?.nombre ?? '');
}

function equipmentHtml(list: readonly Equipment[]): string {
  return `<div class="blk" id="fequipos"><h3>${t('accounts.card.equipmentTitle')}${list.length ? ` <span class="n">${list.length}</span>` : ''}</h3>
      ${list.map(equipmentRow).join('') || `<p class="sm">${t('accounts.card.equipmentNone')}</p>`}
      <button type="button" class="btn sec" id="feqmas">${t('accounts.card.addEquipment')}</button></div>`;
}

function bindEquipment(block: HTMLElement, id: string, name: string): void {
  onEach(block, 'feq', item => { closeCardAnd(() => { relatedLegacy.openEquipment(item); }); });
  const add = document.getElementById('feqmas');
  if (add) add.onclick = (): void => { closeCardAnd(() => { relatedLegacy.newEquipment({ id, nombre: name }); }); };
}
