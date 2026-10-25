/**
 * Calidad del dato → the follow-up list: each account with its last visit, visits and samples, and its next action («Hecha» or
 * «Aplazar»), filtered and paginated. Migrated from the legacy listaSeguimiento (v2.410.0).
 */
import { accountListLegacy, agendaActions, legacyDb, notices, term } from '../../legacy/bridge';
import { t } from '../../i18n';
import { formatShortDate } from '../../services/date-format';
import { addDays, todayIso } from '../../services/dates';
import { escapeHtml, formatNumber } from '../../services/format';
import { orFallback } from '../../services/values';
import { load as loadHome } from '../home';

const POSTPONE_DAYS = 7;

/** The filters of the page and the page shown (SEG in legacy). */
export const followUpState = { estado: '', prov: '', muni: '', modo: 'todos', pagina: 0 };

interface FollowUpRow {
  id: string; nombre: string; urgente?: boolean; sin_reporting?: boolean; especialidad?: string | null; centro_nombre?: string | null; municipio?: string | null;
  ultima_visita?: string | null; ultimo_resultado?: string | null; n_visitas: number; muestras?: number; proxima_fecha?: string | null; proxima_accion?: string | null; estado_comercial: string;
}

/** The parameters of the follow-up reads (list and export). */
export const filterParams = (): Record<string, unknown> => ({
  f_estado: followUpState.estado || null, f_provincia: followUpState.prov || null, f_municipio: followUpState.muni || null, f_modo: followUpState.modo,
});

const loadingHtml = (text: string): string => `<div class="cargador"><span class="spin"></span><span class="sm">${escapeHtml(text)}</span></div>`;

function nameHtml(row: FollowUpRow): string {
  const urgent = row.urgente ? `<span class="pill p-urg">${t('quality.followUp.urgent')}</span> ` : '';
  const reporting = row.sin_reporting ? `<span class="pill p-sr" title="${t('quality.followUp.noReportingHelp', { visit: term('visita') })}">${t('quality.followUp.noReporting')}</span> ` : '';
  return `<span class="nm">${urgent}${reporting}${escapeHtml(row.nombre)}</span>`;
}

function nextActionHtml(row: FollowUpRow): string {
  if (!row.proxima_fecha) return '';
  return `<b style="color:${row.proxima_fecha < todayIso() ? 'var(--warn)' : 'var(--navy)'}">${formatShortDate(row.proxima_fecha)}</b><br>${escapeHtml(orFallback(row.proxima_accion, ''))}
           <br><span class="acts" style="margin:4px 0 0"><button class="btn sec chico" data-acc="hecha|${row.id}">${t('quality.followUp.done')}</button>
           <button class="btn sec chico" data-acc="aplazar|${row.id}">${t('quality.followUp.postpone')}</button></span>`;
}

function rowHtml(row: FollowUpRow): string {
  const last = row.ultima_visita ? t('quality.followUp.last', { date: formatShortDate(row.ultima_visita), result: escapeHtml(orFallback(row.ultimo_resultado, '')) }) : t('quality.followUp.notVisited');
  return `
    <button class="fila" data-id="${row.id}">
      <span>${nameHtml(row)}
        <span class="sm">${escapeHtml(orFallback(row.especialidad, ''))} · ${escapeHtml(orFallback(row.centro_nombre, ''))} ${escapeHtml(orFallback(row.municipio, ''))}</span></span>
      <span class="c2"><span class="sm">${last}</span>
        <span class="sm">${row.n_visitas} ${term('visita', { number: 'p' })}${row.muestras ? t('quality.followUp.samples', { count: row.muestras }) : ''}</span></span>
      <span class="c3"><span class="sm">${nextActionHtml(row)}</span></span>
      <span class="pill p-est">${escapeHtml(row.estado_comercial)}</span>
    </button>`;
}

async function resolveAction(action: string): Promise<void> {
  const [mode = '', accountId = ''] = action.split('|');
  let date: string | null = null;
  if (mode === 'aplazar') {
    date = await notices.askDate(t('quality.followUp.postponeQuestion'), addDays(todayIso(), POSTPONE_DAYS), { titulo: t('quality.followUp.postponeTitle'), ok: t('quality.followUp.postpone') });
    if (!date) return;
  }
  const { data: result } = await legacyDb().rpc<{ ok?: boolean }>('resolver_accion', { p_medico: accountId, p_modo: mode, p_fecha: date });
  if (result?.ok === false) { notices.toast(t('quality.followUp.couldNot'), true); return; }
  notices.toast(t(mode === 'hecha' ? 'quality.followUp.markedDone' : 'quality.followUp.postponed'));
  void paintFollowUp(true); void loadHome();
}

function bind(list: HTMLElement): void {
  list.onclick = (event): void => {
    const target = event.target as Element, action = target.closest<HTMLElement>('[data-acc]');
    if (action) { event.stopPropagation(); void resolveAction(action.dataset.acc ?? ''); return; }
    const row = target.closest<HTMLElement>('[data-id]'); if (row) agendaActions.openAccount(row.dataset.id ?? '');
  };
}

function paintRows(list: HTMLElement, rows: readonly FollowUpRow[]): void {
  if (!rows.length) { list.innerHTML = `<div class="vacio">${t('quality.followUp.nothing')}</div>`; return; }
  list.innerHTML = '';
  list.insertAdjacentHTML('beforeend', rows.map(rowHtml).join(''));
}

/** Paints the list (`restart` goes back to the first page). */
export async function paintFollowUp(restart: boolean): Promise<void> {
  const list = document.getElementById('slista'), count = document.getElementById('scuenta');
  if (!list || !count) return;
  if (restart) followUpState.pagina = 0;
  list.innerHTML = loadingHtml(t('quality.page.loadingFollowUp'));
  count.textContent = t('quality.followUp.searching');
  const size = accountListLegacy.pageSize();
  const { data, error } = await legacyDb().rpc<{ total: number; filas?: FollowUpRow[] }>('seguimiento_lista', { ...filterParams(), lim: size, desplaz: followUpState.pagina * size });
  if (error || !data) { count.textContent = t('quality.followUp.couldNotLoad', { error: (error as { message?: string } | null)?.message ?? '' }); return; }
  count.innerHTML = `<b>${formatNumber(data.total)}</b> ${term('medico', { number: 'p' })}`;
  paintRows(list, data.filas ?? []);
  accountListLegacy.paginate({
    element: document.getElementById('spag'), total: data.total, page: followUpState.pagina,
    onPage: page => { followUpState.pagina = page; void paintFollowUp(false); list.scrollIntoView({ block: 'start', behavior: 'smooth' }); },
    onSize: () => { void paintFollowUp(true); },
  });
  bind(list);
}
