/**
 * Ventas → «Oportunidades»: who to call back, the indicators and charts of the period, and the list (date, client, what they
 * want, reference, how it ends, next step, who attended). Migrated from the legacy pintarLlamadas (v2.410.0); pintarLlamadas
 * stays as an adapter (Pedidos and Clientes repaint the tab by that name).
 */
import { accountListLegacy, legacyDb, opportunitiesLegacy, portalLegacy, term } from '../../legacy/bridge';
import { t } from '../../i18n';
import { formatShortDate } from '../../services/date-format';
import { escapeHtml, formatNumber } from '../../services/format';
import { orFallback } from '../../services/values';
import { chartsHtml, indicatorsHtml, type Summary } from './charts';
import { editOpportunity, type Opportunity } from './editor';
import { paintFollowUps } from './follow-ups';
import { catalog, loadOpportunityCatalogs, ORDER_DONE } from './model';

const SEARCH_WAIT_MS = 300;

type Listed = Omit<Opportunity, 'interes'> & {
  id: string; fecha: string; usuario?: string | null; importe_estimado?: number | null;
  interes?: ({ producto_id: string; unidades: number; producto?: string })[] | null;
};

function pageHtml(): string {
  const results = catalog('resultado_llamada').map(entry => `<option>${escapeHtml(entry.valor)}</option>`).join('');
  return `<div class="panel">
    <div id="llsegz"></div>
    <div class="filtros"><div id="llper"></div>
      <div><label for="llq">${t('opportunities.list.search')}</label><input id="llq" type="search" placeholder="${t('opportunities.list.searchPlaceholder', { professional: term('medico') })}"></div>
      <div><label for="llfres">${t('opportunities.list.result')}</label><select id="llfres"><option value="">${t('opportunities.list.all')}</option><option>${t('opportunities.list.notClosed')}</option>${results}</select></div></div>
    <div class="kpis vtot" id="lltot"></div>
    <div class="angrid" id="llres2" style="margin:0 0 14px"></div>
    <div id="lllista"></div></div>`;
}

const interestText = (item: Listed): string => (item.interes ?? []).map(line => `${orFallback(line.producto, '')} × ${formatNumber(line.unidades)}`).join(', ');

function endsHtml(item: Listed): string {
  const ends = item.pedido_id || item.resultado ? escapeHtml(orFallback(item.resultado, ORDER_DONE)) : `<span class="pill p-warn">${t('opportunities.list.notClosed')}</span>`;
  return `${ends}${item.pedido ? `<span class="sm">${t('opportunities.list.order', { number: escapeHtml(item.pedido) })}</span>` : ''}`;
}

function rowHtml(item: Listed): string {
  const when = new Date(item.fecha).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
  const reference = typeof item.medico === 'string' ? item.medico : '';
  return `<button class="dr" data-ll="${item.id}"><span>${when}<span class="sm">${escapeHtml(orFallback(item.origen, orFallback(item.direccion, '')))}</span></span>
        <span><b>${escapeHtml(orFallback(item.cliente, orFallback(item.nombre, '—')))}</b><span class="sm">${escapeHtml(orFallback(item.tel_cliente, orFallback(item.telefono, '')))}</span></span>
        <span class="corta">${escapeHtml(interestText(item) || '—')}${item.importe_estimado ? `<span class="sm">${portalLegacy.euros(item.importe_estimado)}</span>` : ''}</span>
        <span class="corta">${escapeHtml(orFallback(reference, orFallback(item.cuenta_texto, '—')))}</span>
        <span>${endsHtml(item)}</span>
        <span class="sm">${item.proxima_fecha ? `${formatShortDate(item.proxima_fecha)} · ` : ''}${escapeHtml(orFallback(item.proxima_accion, ''))}</span><span class="sm">${escapeHtml(orFallback(item.usuario, ''))}</span></button>`;
}

function tableHtml(shown: readonly Listed[]): string {
  const heads = [t('opportunities.list.date'), t('opportunities.list.client'), t('opportunities.list.wants'), term('medico', { capital: 'C' }), t('opportunities.list.ends'), t('opportunities.list.next'), t('opportunities.list.attended')];
  return `<div class="dgrid-wrap"><div class="dgrid llam opor">
      <div class="dh">${heads.map(head => `<span>${head}</span>`).join('')}</div>
      ${shown.map(rowHtml).join('')}</div></div>`;
}

function paintList(list: HTMLElement, rows: readonly Listed[]): void {
  const size = accountListLegacy.pageSize();
  opportunitiesLegacy.setPage(Math.min(opportunitiesLegacy.page(), Math.max(0, Math.ceil(rows.length / size) - 1)));
  const start = opportunitiesLegacy.page() * size;
  list.innerHTML = rows.length ? tableHtml(rows.slice(start, start + size)) : `<div class="vacio">${t('opportunities.list.empty')}</div>`;
  list.querySelectorAll<HTMLElement>('[data-ll]').forEach(button => { button.onclick = (): void => { void editOpportunity(rows.find(item => item.id === button.dataset.ll) ?? null); }; });
  list.insertAdjacentHTML('beforeend', '<div id="llpag"></div>');
  accountListLegacy.paginate({
    element: document.getElementById('llpag'), total: rows.length, page: opportunitiesLegacy.page(),
    onPage: page => { opportunitiesLegacy.setPage(page); void paintPeriod(); }, onSize: () => { opportunitiesLegacy.setPage(0); void paintPeriod(); },
  });
}

const fieldValue = (id: string): string => (document.getElementById(id) as HTMLInputElement | null)?.value ?? '';

/** The indicators, charts and list of the chosen period, search and result. */
async function paintPeriod(): Promise<void> {
  const period = opportunitiesLegacy.periodOf(document.getElementById('llper'));
  const [{ data: rows }, { data: summary }] = await Promise.all([
    legacyDb().rpc<Listed[]>('llamadas_lista', { p_desde: period.desde, p_hasta: period.hasta, q: fieldValue('llq').trim() || null, p_resultado: fieldValue('llfres') || null }),
    legacyDb().rpc<Summary>('llamadas_resumen', { p_desde: period.desde, p_hasta: period.hasta }),
  ]);
  const list = document.getElementById('lllista'), totals = document.getElementById('lltot'), charts = document.getElementById('llres2');
  if (!list || !totals || !charts) return;
  totals.innerHTML = indicatorsHtml(summary ?? {});
  charts.innerHTML = chartsHtml(summary ?? {});
  paintList(list, rows ?? []);
}

let searchTimer: ReturnType<typeof setTimeout> | undefined;

export async function paintOpportunities(): Promise<void> {
  await loadOpportunityCatalogs();
  const box = document.getElementById('vcuerpo'); if (!box) return;
  box.innerHTML = pageHtml();
  const search = document.getElementById('llq'), result = document.getElementById('llfres');
  opportunitiesLegacy.mountPeriod(document.getElementById('llper'), { id: 'llamadas', valor: 'mes', alCambiar: () => { void paintPeriod(); } });
  if (search) search.oninput = (): void => { clearTimeout(searchTimer); searchTimer = setTimeout(() => { void paintPeriod(); }, SEARCH_WAIT_MS); };
  if (result) result.onchange = (): void => { void paintPeriod(); };
  void paintFollowUps(); void paintPeriod();
}
