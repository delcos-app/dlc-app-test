/**
 * The Inicio indicators (the legacy KPI_CAT of legado 007 plus the sales ones of legado 028): how each value and colour is read from
 * the summary, and which list it opens. The labels are in i18n/es/content-lists.ts; the default indicators are KPI_DEF.
 */
import { contentLegacy } from '../legacy/content-bridge';
import { contentLists } from '../i18n/es/content-lists';
import { nonZeroOr, orFallback } from '../services/values';
import { fill } from './fill';

type Kpis = Record<string, number>;
interface Indicator { id: string; t: string; v: (kpis: Kpis) => unknown; cls?: (kpis: Kpis) => string; h?: string; admin?: boolean }
interface Rule { id: string; v: (kpis: Kpis) => unknown; cls?: (kpis: Kpis) => string; h?: string; admin?: boolean }

const warnIf = (key: string) => (kpis: Kpis): string => (kpis[key] ? 'warn' : 'ok');
const okIf = (key: string) => (kpis: Kpis): string => (kpis[key] ? 'ok' : '');
const ANALYTICS = 'x-analitica';

/** In the legacy order: the first eight (legado 007), then the sales and activity ones (legado 028). */
const RULES: readonly Rule[] = [
  { id: 'citas', v: kpis => `${kpis.citas_hechas}/${kpis.citas_hoy}` },
  { id: 'urgentes', v: kpis => kpis.urgentes, cls: warnIf('urgentes'), h: 'urgentes' },
  { id: 'visitas_sem', v: kpis => kpis.visitas_semana },
  { id: 'visitas_mes', v: kpis => kpis.visitas_mes },
  { id: 'interesados', v: kpis => kpis.interesados, cls: () => 'ok', h: 'interesados' },
  { id: 'sin_contactar', v: kpis => kpis.sin_contactar, h: 'sin_contactar' },
  { id: 'cartera', v: kpis => kpis.medicos, h: 'todos' },
  { id: 'dups', v: kpis => kpis.pendientes_unificar, cls: () => 'warn', admin: true, h: 'dups' },
  { id: 'uds_mes', v: kpis => kpis.uds_mes, cls: kpis => (Number(kpis.uds_mes) >= Number(kpis.uds_mes_ant) ? 'ok' : 'warn'), h: ANALYTICS },
  { id: 'importe_mes', v: kpis => contentLegacy.roundEuros(nonZeroOr(kpis.importe_mes, 0)).replace(',00', ''), h: ANALYTICS },
  { id: 'prescriptores', v: kpis => kpis.prescriptores_mes, h: ANALYTICS },
  { id: 'nuevos_presc', v: kpis => kpis.nuevos_prescriptores, cls: okIf('nuevos_prescriptores') },
  { id: 'activos_90', v: kpis => kpis.activos_90 },
  { id: 'conversion', v: kpis => `${contentLegacy.percent(kpis.prescriben, kpis.en_embudo)}%` },
  { id: 'visitas_7d', v: kpis => kpis.visitas_7d },
  { id: 'citas_7d', v: kpis => kpis.citas_7d, h: 'x-semana' },
  { id: 'muestras_mes', v: kpis => kpis.muestras_mes },
  { id: 'material_mes', v: kpis => kpis.material_mes },
  { id: 'sin_visita_60', v: kpis => kpis.sin_visita_60, cls: warnIf('sin_visita_60') },
  { id: 'sin_horario', v: kpis => kpis.sin_horario, cls: warnIf('sin_horario') },
  { id: 'borradores', v: kpis => kpis.borradores, cls: (kpis: Kpis): string => (kpis.borradores ? 'warn' : ''), h: 'x-ventas' },
];

/** The indicators shown at first (the legacy KPI_DEF, with the four added in v2.29.0). */
export const DEFAULT_INDICATORS: readonly string[] = ['citas', 'urgentes', 'visitas_sem', 'visitas_mes', 'interesados', 'sin_contactar', 'cartera', 'dups',
  'uds_mes', 'prescriptores', 'citas_7d', 'sin_visita_60'];

/** KPI_CAT. «conversion» keeps a getter: it names the positive state, which the company may rename after loading. */
export function indicatorCatalog(words: Readonly<Record<string, string>>): Indicator[] {
  const labels: Readonly<Record<string, string | undefined>> = contentLists.indicatorLabels;
  return RULES.map(rule => {
    if (rule.id !== 'conversion') return { ...rule, t: fill(labels[rule.id] ?? '', words) };
    const indicator = { ...rule, t: '' };
    Object.defineProperty(indicator, 't', { enumerable: true, get: () => fill(contentLists.conversionLabel.text, { state: orFallback(contentLegacy.stateOf('positivo'), 'positivo') }) });
    return indicator;
  });
}
