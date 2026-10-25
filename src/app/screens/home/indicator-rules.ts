/**
 * The rules of the Inicio indicators: each person's chosen indicators (or the default ones), and who may see each one — by
 * administration, by access to its module (v2.87.0) and by the level of its area; the duplicates one also needs the duplicates
 * review. Migrated from the legacy kpiConfig, kpiPermitidoBase and kpiPermitido of componentes/graficos.js (v2.427.0); kpiConfig and
 * kpiPermitido stay as adapters (Inicio, the bridges and the tests call them). The catalog (KPI_CAT) and the default list (KPI_DEF,
 * extended by legado 028) stay in legacy data.
 */
import { leftoversLegacy, type IndicatorSetting } from '../../legacy/leftovers-bridge';

/** The module each indicator belongs to: only who can open that module sees it. */
const MODULE = new Map<string, string>([
  ...['citas', 'visitas_sem', 'visitas_mes', 'visitas_7d', 'citas_7d', 'muestras_mes', 'material_mes'].map(id => [id, 'agenda'] as const),
  ...['urgentes', 'interesados', 'sin_contactar', 'cartera', 'dups', 'sin_visita_60', 'sin_horario'].map(id => [id, 'directorio'] as const),
  ...['uds_mes', 'importe_mes', 'prescriptores', 'nuevos_presc', 'activos_90', 'borradores'].map(id => [id, 'ventas'] as const),
  ['conversion', 'analitica'],
]);

/** The area letter and minimum level some indicators need. */
const LEVEL = new Map<string, readonly [string, number]>([['importe_mes', ['E', 1]], ['borradores', ['V', 1]], ['dups', ['Q', 1]], ['sin_horario', ['M', 1]]]);
const DUPLICATES = 'dups';

/** The person's indicators, or the catalog with the default ones on. */
export function indicatorSettings(): IndicatorSetting[] {
  const chosen = leftoversLegacy.chosenIndicators();
  if (Array.isArray(chosen) && chosen.length) return chosen;
  const defaults = leftoversLegacy.defaultIndicators();
  return leftoversLegacy.indicatorCatalog().map(indicator => ({ id: indicator.id, on: defaults.includes(indicator.id), t: '' }));
}

interface Indicator { id: string; admin?: boolean | null }

function allowedBy(indicator: Indicator, checkAdmin: boolean): boolean {
  if (checkAdmin && indicator.admin && !leftoversLegacy.can('administrar')) return false;
  const module = MODULE.get(indicator.id);
  if (module && !leftoversLegacy.canUseModule(module)) return false;
  const level = LEVEL.get(indicator.id);
  return !level || leftoversLegacy.levelOf(level[0]) >= level[1];
}

/** Whether the user may see an indicator. */
export function indicatorAllowed(indicator: Indicator | null | undefined): boolean {
  if (!indicator) return false;
  if (indicator.id === DUPLICATES) return leftoversLegacy.canReviewDuplicates() && allowedBy(indicator, false);
  return allowedBy(indicator, true);
}
