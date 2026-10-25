/**
 * The indicators of Analítica → Resumen: the catalogue by area (v2.148.0), which areas each user sees, which filters make sense in
 * each area, the user's settings (preferencias.analitica = { comp, kpis: [{ u, id, on, f, comp, t }] }), how a figure is written
 * and its comparison. Migrated from the legacy AN_FAM, AN_FILTROS, anCatalogo, anConfig, anGuardar, anFmt, anDelta and anFiltroTxt
 * (v2.419.0).
 */
import { legacyDb, permissions, salesTeam, term } from '../../../legacy/bridge';
import { panelsLegacy } from '../../../legacy/panels-bridge';
import { t, type MessageKey } from '../../../i18n';
import { escapeHtml, formatCurrency, formatNumber } from '../../../services/format';
import { titleCase } from '../../routes/title-case';
import { round2 } from '../../../services/money';

export type KpiFormat = 'eur' | 'num' | 'pct' | 'dec' | 'dias' | 'txt';
export interface Kpi { id: string; fam: string; fmt: KpiFormat; sube: boolean | null; hoy: boolean; imp: boolean; def: boolean }
export interface KpiFilter { comercial?: string; producto?: string; canal?: string; municipio?: string }
export interface KpiSetting { u: string; id: string; on: boolean; f: KpiFilter; comp: string; t: string }
export interface AnalyticsConfig { comp: string; kpis: KpiSetting[] }

/** The user's settings and the figures of the last load (AN_CFG and AN_DATOS before). */
export const analyticsState: { config: AnalyticsConfig | null } = { config: null };

const AREA_NAMES = new Map<string, MessageKey>([
  ['ventas', 'panels.families.sales'], ['clientes', 'panels.families.customers'], ['equipo', 'panels.families.team'],
  ['oportunidades', 'panels.families.opportunities'], ['cobros', 'panels.families.collections'], ['stock', 'panels.families.stock'],
]);

/** The areas, in order, with who sees each one. */
export const FAMILIES: readonly (readonly [string, () => boolean])[] = [
  ['ventas', (): boolean => panelsLegacy.canUseModule('ventas')],
  ['clientes', (): boolean => panelsLegacy.canUseModule('ventas')],
  ['equipo', (): boolean => panelsLegacy.canUseModule('agenda')],
  ['oportunidades', (): boolean => panelsLegacy.canUseModule('ventas') && permissions.hasOpportunities()],
  ['cobros', (): boolean => panelsLegacy.canUseModule('facturacion')],
  ['stock', (): boolean => panelsLegacy.canUseModule('productos') && permissions.levelOf('P') >= 1],
];

/** Which filters make sense in each area. */
export const FILTERS_BY_FAMILY: Readonly<Record<string, readonly (keyof KpiFilter)[]>> = {
  ventas: ['comercial', 'producto', 'canal', 'municipio'], clientes: ['comercial', 'producto', 'canal', 'municipio'],
  equipo: ['comercial', 'municipio'], oportunidades: ['comercial', 'producto'], cobros: [], stock: ['producto'],
};

export const familyName = (family: string): string => {
  const key = AREA_NAMES.get(family);
  return key ? t(key, { visits: term('visita', { number: 'p' }) }) : family;
};
export const familyVisible = (family: string): boolean => Boolean(FAMILIES.find(([name]) => name === family)?.[1]());
export const kpiVisible = (kpi: Kpi): boolean => familyVisible(kpi.fam) && (!kpi.imp || permissions.canSeeAmounts());

// [id, área, formato, mejor si sube, a hoy, solo con importes, por defecto]; «conversion_pct» left (v2.320.0): «Pedidos tras la visita» measures it
const CATALOGUE: readonly (readonly [string, string, KpiFormat, boolean | null, boolean, boolean, boolean])[] = [
  ['importe', 'ventas', 'eur', true, false, true, true], ['unidades', 'ventas', 'num', true, false, false, true],
  ['pedidos', 'ventas', 'num', true, false, false, false], ['ticket', 'ventas', 'eur', true, false, true, true],
  ['web_pct', 'ventas', 'pct', true, false, true, true], ['margen', 'ventas', 'eur', true, false, true, false],
  ['margen_pct', 'ventas', 'pct', true, false, true, false], ['top10_pct', 'ventas', 'pct', false, false, true, false],
  ['clientes', 'clientes', 'num', true, false, false, true], ['clientes_nuevos', 'clientes', 'num', true, false, false, false],
  ['repiten_pct', 'clientes', 'pct', true, false, false, true], ['perdidos', 'clientes', 'num', false, false, false, true],
  ['valor_cliente', 'clientes', 'eur', true, false, true, false], ['visitas', 'equipo', 'num', true, false, false, false],
  ['visitas_dia', 'equipo', 'dec', true, false, false, true], ['citas_pct', 'equipo', 'pct', true, false, false, false],
  ['cobertura_pct', 'equipo', 'pct', true, false, false, true], ['activados', 'equipo', 'num', true, false, false, false],
  ['op_abiertas', 'oportunidades', 'num', null, false, false, false], ['cierre_pct', 'oportunidades', 'pct', true, false, false, true],
  ['ganado', 'oportunidades', 'eur', true, false, true, true], ['perdido', 'oportunidades', 'eur', false, false, true, false],
  ['motivo_perdida', 'oportunidades', 'txt', null, false, false, false], ['facturado', 'cobros', 'eur', true, false, true, false],
  ['pendiente', 'cobros', 'eur', null, true, true, true], ['vencido', 'cobros', 'eur', false, true, true, true],
  ['dias_cobro', 'cobros', 'dias', false, false, true, false], ['valor_stock', 'stock', 'eur', null, true, true, true],
  ['bajo_minimo', 'stock', 'num', false, true, false, true], ['caducan', 'stock', 'num', false, true, false, false],
  ['compras', 'stock', 'eur', null, false, true, false],
];

export const catalogue = (): Kpi[] => CATALOGUE.map(([id, fam, fmt, sube, hoy, imp, def]) => ({ id, fam, fmt, sube, hoy, imp, def }));

/** «web_pct» → «webPct»: the key of its texts. */
const textKey = (id: string): string => id.split('_').map((part, index) => (index ? part.charAt(0).toUpperCase() + part.slice(1) : part)).join('');

const words = (): Record<string, string> => ({
  professionals: term('medico', { number: 'p' }), Professionals: term('medico', { number: 'p', capital: 'C' }),
  visit: term('visita'), visits: term('visita', { number: 'p' }), Visits: term('visita', { number: 'p', capital: 'C' }),
  VisitsRecorded: term('visita', { number: 'p', capital: 'C', adjective: 'registrado' }),
});

export const kpiTitle = (kpi: Kpi): string => t(`panels.kpiTitles.${textKey(kpi.id)}` as MessageKey, words());
export const kpiHelp = (kpi: Kpi): string => t(`panels.kpiHelp.${textKey(kpi.id)}` as MessageKey, words());

const defaultSetting = (kpi: Kpi): KpiSetting => ({ u: kpi.id, id: kpi.id, on: kpi.def, f: {}, comp: '', t: '' });

export const defaultSettings = (): KpiSetting[] => catalogue().map(defaultSetting);

/** The user's settings, with the indicators added since they last saved. */
export function loadConfig(): AnalyticsConfig {
  const kpis = catalogue(), saved = panelsLegacy.analyticsPreferences() as Partial<AnalyticsConfig> | undefined;
  const list = Array.isArray(saved?.kpis) ? saved.kpis.filter(item => kpis.some(kpi => kpi.id === item.id)) : [];
  kpis.forEach(kpi => { if (!list.some(item => item.id === kpi.id)) list.push(defaultSetting(kpi)); });
  return { comp: saved?.comp ?? 'anterior', kpis: list };
}

export async function saveConfig(config: AnalyticsConfig): Promise<void> {
  const preferences = { ...panelsLegacy.profilePreferences(), analitica: config };
  const { data } = await legacyDb().rpc<Record<string, unknown>>('guardar_preferencias', { p: preferences });
  panelsLegacy.setProfilePreferences(data ?? preferences);
}

const oneDecimal = (value: number): string => String(Math.round(value * 10) / 10).replace('.', ',');

export function formatValue(value: unknown, format: KpiFormat): string {
  if (value === null || value === undefined || value === '') return '—';
  const number = Number(value);
  switch (format) {
    case 'txt': return escapeHtml(value);
    case 'eur': return formatCurrency(round2(number));
    case 'pct': return `${oneDecimal(number)} %`;
    case 'dec': return oneDecimal(number);
    case 'dias': return t('panels.kpis.days', { count: String(Math.round(number)) });
    default: return formatNumber(value);
  }
}

function noData(comparison: string, previous: unknown, current: unknown, kpi: Kpi): string | null {
  if (current !== null && current !== undefined && previous !== null && previous !== undefined && !(Number(previous) === 0 && kpi.fmt !== 'pct')) return null;
  return `<span class="sm">${t(comparison === 'anio' ? 'panels.kpis.noDataLastYear' : 'panels.kpis.noDataPrevious')}</span>`;
}

function changeHtml(kpi: Kpi, change: number, comparison: string): string {
  const lastYear = comparison === 'anio';
  if (Math.abs(change) < 0.05) return `<span class="ankdel igual">${t(lastYear ? 'panels.kpis.sameLastYear' : 'panels.kpis.samePrevious')}</span>`;
  const good = kpi.sube === null ? null : (change > 0) === kpi.sube;
  const amount = kpi.fmt === 'pct' ? `${oneDecimal(Math.abs(change))} pt` : `${Math.round(Math.abs(change))} %`;
  return `<span class="ankdel ${good === null ? 'neutro' : good ? 'up' : 'down'}">${change > 0 ? '▲' : '▼'} ${amount} <span class="sm">${t(lastYear ? 'panels.kpis.vsLastYear' : 'panels.kpis.vsPrevious')}</span></span>`;
}

/** The comparison of a figure: ▲/▼ and the change (points for percentages), green when it goes the good way. */
export function deltaHtml(kpi: Kpi, current: unknown, previous: unknown, comparison: string): string {
  if (kpi.hoy) return `<span class="sm">${t('panels.kpis.asOfToday')}</span>`;
  if (kpi.fmt === 'txt') return '';
  const missing = noData(comparison, previous, current, kpi); if (missing) return missing;
  const change = kpi.fmt === 'pct' ? Number(current) - Number(previous) : (Number(current) - Number(previous)) / Math.abs(Number(previous)) * 100;
  return changeHtml(kpi, change, comparison);
}

/** The text of a channel, as the screen's «Canal» select shows it. */
function channelText(channel: string): string {
  const select = document.getElementById('acanal') as HTMLSelectElement | null;
  return [...select?.options ?? []].find(option => option.value === channel)?.textContent ?? channel;
}

/** «Ana · Producto X · Venta a centro · Sevilla»: the own filter of an indicator. */
export function filterText(filter: KpiFilter): string {
  const parts: string[] = [];
  if (filter.comercial) parts.push(salesTeam.members().find(member => member.id === filter.comercial)?.nombre ?? t('panels.kpis.aCommercial'));
  if (filter.producto) parts.push(panelsLegacy.products().find(product => product.id === filter.producto)?.nombre ?? t('panels.kpis.aProduct'));
  if (filter.canal) parts.push(channelText(filter.canal));
  if (filter.municipio) parts.push(titleCase(filter.municipio));
  return parts.join(' · ');
}
