/**
 * Parque instalado → «Equipos»: reviews in the next 30 days, contracts and warranties about to end, and every piece of equipment
 * with a search. Migrated from the legacy pintarParque (v2.409.0); pintarParque stays as an adapter.
 */
import { currentScreen, equipmentLegacy, legacyDb, relatedLegacy } from '../../legacy/bridge';
import { t } from '../../i18n';
import { formatShortDate } from '../../services/date-format';
import { addDays, todayIso } from '../../services/dates';
import { escapeHtml, formatNumber } from '../../services/format';
import { orFallback } from '../../services/values';
import { editEquipment } from './editor';
import { daysUntil, expiryOf, expiryPill, reviewPill, STATES, warningLimit, type Equipment } from './model';

const LIMIT = 500, SOON_DAYS = 30, SEARCH_WAIT_MS = 300;

/** What the page remembers: the search. */
const listState = { query: '' };

const plain = (text: unknown): string => String(text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function rowHtml(item: Equipment): string {
  const details = [item.serie ? t('equipment.list.serial', { serial: item.serie }) : '', item.cuentas?.nombre, item.ubicacion, item.contrato].filter(Boolean).join(' · ');
  return `<button type="button" class="item conrow" data-eq="${item.id}"><span class="tx"><b>${escapeHtml(orFallback(item.productos?.nombre, t('equipment.equipment')))}</b>
      <span class="sm">${escapeHtml(details)}${t('equipment.list.since', { date: formatShortDate(item.instalado ?? '') })}</span></span>
    <span class="cirest">${reviewPill(item)}${expiryPill(item)}</span></button>`;
}

const block = (title: string, list: readonly Equipment[]): string =>
  `<section class="card cirbloque"><h2>${title}</h2>${list.length ? `<div class="lista">${list.map(rowHtml).join('')}</div>` : '<div class="vacio vlinea"></div>'}</section>`;

/** Installed ones with a review in the next 30 days, and those whose contract or warranty ends within the warning. */
function upcoming(list: readonly Equipment[]): { reviews: Equipment[]; expiring: Equipment[] } {
  const installed = list.filter(item => item.estado === STATES.installed), limit = addDays(todayIso(), SOON_DAYS), warning = warningLimit();
  const reviews = installed.filter(item => item.proxima_revision && item.proxima_revision <= limit)
    .sort((first, second) => String(first.proxima_revision).localeCompare(String(second.proxima_revision)));
  const expiring = installed.filter(item => { const days = daysUntil(expiryOf(item)); return days !== null && days <= warning; })
    .sort((first, second) => String(expiryOf(first)).localeCompare(String(expiryOf(second))));
  return { reviews, expiring };
}

function pageHtml(list: readonly Equipment[]): string {
  const { reviews, expiring } = upcoming(list), query = plain(listState.query);
  const found = list.filter(item => !listState.query || plain([item.serie, item.productos?.nombre, item.cuentas?.nombre, item.ubicacion].join(' ')).includes(query));
  const empty = list.length ? t('equipment.list.noneFound') : t('equipment.list.noneYet');
  return `<div class="cirpag"><div class="evcab"><button type="button" class="btn" id="eqnuevo">${t('equipment.list.newEquipment')}</button></div>
    ${reviews.length ? block(t('equipment.list.reviewsSoon'), reviews) : ''}
    ${expiring.length ? block(t('equipment.list.expiring'), expiring) : ''}
    <section class="card cirbloque"><div class="cicbcab"><h2>${t('equipment.list.all', { count: formatNumber(list.length) })}</h2><input id="eqq" type="search" placeholder="${t('equipment.list.searchPlaceholder')}" value="${escapeHtml(listState.query)}" aria-label="${t('equipment.list.searchLabel')}"></div>
      ${found.length ? `<div class="lista">${found.map(rowHtml).join('')}</div>` : `<div class="vacio vlinea">${empty}</div>`}</section></div>`;
}

let searchTimer: ReturnType<typeof setTimeout> | undefined;

function bind(box: HTMLElement, wasSearching: boolean): void {
  const add = document.getElementById('eqnuevo'); if (add) add.onclick = (): void => { void editEquipment(null); };
  const search = document.getElementById('eqq') as HTMLInputElement | null;
  if (search) {
    search.oninput = (): void => { clearTimeout(searchTimer); searchTimer = setTimeout(() => { listState.query = search.value.trim(); void paintEquipment(); }, SEARCH_WAIT_MS); };
    // Typing repaints the page: the search keeps the focus and the cursor at the end
    if (wasSearching) { search.focus(); search.setSelectionRange(search.value.length, search.value.length); }
  }
  box.querySelectorAll<HTMLElement>('[data-eq]').forEach(button => { button.onclick = (): void => { relatedLegacy.openEquipment(button.dataset.eq ?? ''); }; });
}

/** The warning days of contracts are company settings shared with Concursos. */
function rememberWarningDays(setting: { valor?: { dias?: unknown } } | null): void {
  const days = setting?.valor?.dias;
  if (Array.isArray(days)) equipmentLegacy.setWarningDays(days.map(Number).filter(day => day > 0));
}

export async function paintEquipment(): Promise<void> {
  if (!document.getElementById('cfgcuerpo')) return;
  const [{ data, error }, { data: setting }] = await Promise.all([
    legacyDb().from<Equipment[]>('equipos').select('id,serie,ubicacion,instalado,contrato,contrato_fin,garantia_hasta,proxima_revision,estado,cuenta_id,cuentas(nombre),productos(nombre)')
      .order('creado_en', { ascending: false }).limit(LIMIT),
    legacyDb().from<{ valor?: { dias?: unknown } }>('ajustes').select('valor').eq('clave', 'avisos_vencimiento').maybeSingle(),
  ]);
  // Looked up after the answer: the page may have been painted again meanwhile
  const box = document.getElementById('cfgcuerpo');
  if (!box || currentScreen() !== 'parque') return;
  if (error) { box.innerHTML = `<div class="vacio">${t('equipment.list.couldNotLoad')}</div>`; return; }
  rememberWarningDays(setting);
  const search = document.getElementById('eqq'), wasSearching = Boolean(search) && document.activeElement === search;
  box.innerHTML = pageHtml(data ?? []);
  bind(box, wasSearching);
}
