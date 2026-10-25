/**
 * Cuentas (directorio) in the list bar: quick filters, search, the five indicators that filter, «Eliminar filtros», columns, map and
 * «⋯» (Calidad del dato, Cerca de mí). Migrated from PL.directorio (v2.236.0; v2.304.0; v2.421.0). The mobile cards are painted by
 * rowHtml (src/app/screens/accounts/list/table.ts).
 */
import { term } from '../../../legacy/bridge';
import { listBarLegacy } from '../../../legacy/listbar-bridge';
import { t } from '../../../i18n';
import { filterHasValue } from '../../filters';
import type { Indicator, ListConfig } from '../types';

const PERSON = 'Persona', CENTRE = 'Centro';
const SELECT_FILTERS = ['tipo', 'prov', 'muni', 'esp', 'est', 'rep', 'com'] as const;
const FLAG_FILTERS = ['urg', 'mios', 'sin'] as const;
const FIELD_IDS = ['ftipo', 'fest', 'fprov', 'fmuni', 'fesp', 'fcom', 'frep', 'q'];

const byId = (id: string): HTMLElement | null => document.getElementById(id);

function activeFilters(): number {
  const filters = listBarLegacy.accountFilters();
  return SELECT_FILTERS.filter(key => filters[key]).length + FLAG_FILTERS.filter(key => filters[key]).length
    + Object.values((filters.campos as Record<string, unknown> | undefined) ?? {}).filter(filterHasValue).length;
}

function clearFilters(): void {
  Object.assign(listBarLegacy.accountFilters(), { q: '', tipo: '', prov: '', muni: '', esp: '', est: '', urg: false, mios: false, sin: false, com: '', rep: '', campos: {} });
  FIELD_IDS.forEach(id => { const field = byId(id) as HTMLInputElement | null; if (field) field.value = ''; });
  const tools = byId('tools'); if (tools?.classList.contains('abierto') && listBarLegacy.toolsContext() === 'directorio') tools.classList.remove('abierto');
  listBarLegacy.loadAccountFilters(); listBarLegacy.searchAccounts(true);
}

/** v2.304.0: professionals and centres apart (before, one figure named after the professionals also counted the centres). */
async function indicators(): Promise<Indicator[]> {
  const count = (filters: Record<string, unknown>): Promise<number> => Promise.resolve(listBarLegacy.countRows<{ total?: number }>('buscar_cuentas', { q: null, lim: 1, desplaz: 0, ...filters }))
    .then(result => result.data?.total ?? 0, () => 0);
  const [people, centres, urgent, never, mine] = await Promise.all([count({ f_tipo: PERSON }), count({ f_tipo: CENTRE }), count({ f_urgentes: true }), count({ f_sin_visitar: true }), count({ f_mios: true })]);
  return [
    { k: PERSON, t: term('medico', { number: 'p', capital: 'C' }), n: people, s: t('listBar.directory.inTotal') },
    { k: CENTRE, t: t('listBar.directory.centres'), n: centres, s: t('listBar.directory.inTotal') },
    { k: 'urg', t: t('listBar.directory.urgent'), n: urgent, s: t('listBar.directory.markedUrgent') },
    { k: 'sin', t: t('listBar.directory.neverVisited'), n: never, s: t('listBar.directory.withoutVisits', { visits: term('visita', { number: 'p' }) }) },
    { k: 'mios', t: t('listBar.directory.mine'), n: mine, s: t('listBar.directory.assignedToYou') },
  ];
}

const isType = (key: string): boolean => key === PERSON || key === CENTRE;

function pressIndicator(key: string): void {
  const filters = listBarLegacy.accountFilters() as unknown as Record<string, unknown> & { tipo?: string };
  if (isType(key)) { filters.tipo = filters.tipo === key ? '' : key; const select = byId('ftipo') as HTMLSelectElement | null; if (select) select.value = filters.tipo; }
  else filters[key] = !filters[key];
  listBarLegacy.searchAccounts(true);
}

export const directoryConfig = (): ListConfig => ({
  que: () => term('medico', { number: 'p' }),
  nuevo: () => byId('nuevoBtn'),
  textoNuevo: () => t('listBar.directory.add', { professional: term('medico') }),
  cuerpo: () => byId('lista'), tabla: () => byId('tabla'), pie: () => byId('dirpag'), cuenta: () => byId('cuenta'),
  conDatos: element => Boolean(element.querySelector('.trow, .vacio')),
  rapidos: [['ftipo', t('listBar.directory.type')], ['fest', t('listBar.directory.state')], ['fcom', ''], ['fprov', t('listBar.directory.province')], ['fmuni', t('listBar.directory.municipality')], ['fesp', t('listBar.directory.speciality')]],
  q: () => listBarLegacy.accountFilters().q || '',
  buscarQ: value => { listBarLegacy.accountFilters().q = value; listBarLegacy.searchAccounts(true); },
  buscaTxt: () => t('listBar.directory.search'),
  // v2.304.0: the skeleton with the same five places
  nKpis: 5,
  // v2.296: an emptied custom field stayed as a key and counted as a filter without being seen in the panel
  activos: activeFilters,
  quitar: clearFilters,
  filtros: () => { byId('dirtools')?.click(); },
  columnas: () => { listBarLegacy.openAccountColumns(); },
  mapa: () => byId('mapaBtn'),
  mas: () => [['dircalidad', t('listBar.directory.quality')], ['cercaBtn', t('listBar.directory.nearby')]],
  kpis: indicators,
  kpiOn: key => (isType(key) ? listBarLegacy.accountFilters().tipo === key : Boolean((listBarLegacy.accountFilters() as unknown as Record<string, unknown>)[key])),
  kpiPulsar: pressIndicator,
  card: null,
});
