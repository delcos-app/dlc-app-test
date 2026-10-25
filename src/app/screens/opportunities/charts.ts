/** Oportunidades → the indicators and the charts of the period (what they ask for, how they end, when, how they arrive, by whom). */
import { opportunitiesLegacy, portalLegacy, term } from '../../legacy/bridge';
import { t, type MessageKey } from '../../i18n';
import { escapeHtml, formatNumber } from '../../services/format';

interface Ratio { n: string; p: number; t: number }
interface Counted { n: number; pedidos: number }
export interface Summary {
  total?: number; sin_cerrar?: number; con_pedido?: number; importe_ganado?: number; importe_perdido?: number;
  por_producto?: { producto: string; unidades_ganadas?: number; unidades?: number }[]; por_resultado?: { resultado: string; n: number }[];
  por_hora?: (Counted & { hora: number })[]; por_dia?: (Counted & { dia: number })[]; por_origen?: (Counted & { origen: string })[];
  por_medico?: (Counted & { medico: string })[]; por_comercial?: (Counted & { comercial: string })[];
}

export function indicatorsHtml(summary: Summary): string {
  const total = summary.total ?? 0, orders = summary.con_pedido ?? 0, closed = total - (summary.sin_cerrar ?? 0);
  const kpi = (value: string, key: MessageKey): string => `<div class="kpi"><b>${value}</b><span>${t(key)}</span></div>`;
  return [
    kpi(formatNumber(total), 'opportunities.list.kpiOpportunities'), kpi(formatNumber(orders), 'opportunities.list.kpiOrders'),
    kpi(closed ? `${Math.round(orders / closed * 100)}%` : '—', 'opportunities.list.kpiConversion'),
    kpi(portalLegacy.euros(summary.importe_ganado ?? 0), 'opportunities.list.kpiSold'), kpi(portalLegacy.euros(summary.importe_perdido ?? 0), 'opportunities.list.kpiUnsold'),
    kpi(formatNumber(summary.sin_cerrar ?? 0), 'opportunities.list.kpiNotClosed'),
  ].join('\n      ');
}

/** The bar is the total (light blue) and, inside, in blue, the part that ends in an order; the text says «won of total». */
function ratioRow(item: Ratio, max: number): string {
  return `<div class="bh bhr"><span class="bhn">${escapeHtml(item.n)}</span><span class="bhb" title="${t('opportunities.list.endInOrder', { won: formatNumber(item.p), total: formatNumber(item.t) })}"><i style="width:${Math.max(3, item.t / max * 100)}%"><em style="width:${item.t ? Math.round(item.p / item.t * 100) : 0}%"></em></i></span><b>${formatNumber(item.p)}<span>/${formatNumber(item.t)}</span></b></div>`;
}

const ratioBars = (items: readonly Ratio[]): string => { const max = Math.max(1, ...items.map(item => item.t)); return `<div class="barrash">${items.map(item => ratioRow(item, max)).join('')}</div>`; };

const card = (id: string, title: string, body: string, read: string): string => `<div class="card ancard" id="${id}"><h2>${title}</h2>${body}<p class="leer">${read}</p></div>`;

const ratiosOr = <T>(list: readonly T[] | undefined, toRatio: (item: T) => Ratio, empty: string): string =>
  (list ?? []).length ? ratioBars((list ?? []).map(toRatio)) : opportunitiesLegacy.emptyChart(empty);

const words = (): Record<string, string> => ({
  professional: term('medico'), professionals: term('medico', { number: 'p' }), aProfessional: term('medico', { article: 'un', articleCapital: 'C' }),
  ofProfessional: term('medico', { article: 'del' }),
});

const HOW = 'opportunities.list.howToRead', FOR = 'opportunities.list.whatFor';

export function chartsHtml(summary: Summary): string {
  const weekdays = t('opportunities.weekdays').split(','), read = (lead: MessageKey, key: MessageKey): string => t(lead) + t(key, words());
  const results = (summary.por_resultado ?? []).length ? opportunitiesLegacy.barChart((summary.por_resultado ?? []).map(item => ({ n: item.resultado, v: item.n })), formatNumber)
    : opportunitiesLegacy.emptyChart(t('opportunities.list.resultsEmpty'));
  return card('llgprod', t('opportunities.list.productsTitle'), ratiosOr(summary.por_producto, item => ({ n: item.producto, p: Number(item.unidades_ganadas) || 0, t: Number(item.unidades) || 0 }), t('opportunities.list.productsEmpty')), read(HOW, 'opportunities.list.productsRead'))
    + card('llgres', t('opportunities.list.resultsTitle'), results, read(HOW, 'opportunities.list.resultsRead'))
    + card('llghora', t('opportunities.list.hoursTitle'), ratiosOr(summary.por_hora, item => ({ n: `${String(item.hora).padStart(2, '0')}:00`, p: item.pedidos, t: item.n }), t('opportunities.list.hoursEmpty')), read(FOR, 'opportunities.list.hoursRead'))
    + card('llgdia', t('opportunities.list.daysTitle'), ratiosOr(summary.por_dia, item => ({ n: weekdays[item.dia] ?? '', p: item.pedidos, t: item.n }), t('opportunities.list.daysEmpty')), read(HOW, 'opportunities.list.daysRead'))
    + card('llgori', t('opportunities.list.originsTitle'), ratiosOr(summary.por_origen, item => ({ n: item.origen, p: item.pedidos, t: item.n }), t('opportunities.list.originsEmpty')), read(HOW, 'opportunities.list.originsRead'))
    + card('llgmed', t('opportunities.list.referencesTitle', words()), ratiosOr(summary.por_medico, item => ({ n: item.medico, p: item.pedidos, t: item.n }), t('opportunities.list.referencesEmpty', words())), read(HOW, 'opportunities.list.referencesRead'))
    + card('llcom', t('opportunities.list.salesTitle', words()), ratiosOr(summary.por_comercial, item => ({ n: item.comercial, p: item.pedidos, t: item.n }), t('opportunities.list.salesEmpty', words())), read(HOW, 'opportunities.list.salesRead'));
}
