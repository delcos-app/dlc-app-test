/**
 * Cuentas and the account card: its state in one object (plan 6.6, v2.439.0) instead of loose legacy globals. The legacy names (FICHA_ID, FICHA_PAC, FICHA_CENTRO…)
 * stay on window as accessors to this same object, for the remaining legacy code and the tests.
 */
import { exposeLegacyNames } from '../../state/legacy-names';

export interface AccountsStore {
  shownId: string | null;
  cardPatients: unknown;
  cardCentre: string | null;
  cardEffect: unknown;
  nearby: LegacyNearbyResult | null;
  filterOptions: unknown;
  mapMode: boolean;
  portalAccess: unknown;
  duplicates: { pendientes?: number; parecidos?: number } | null;
  currentVisit: VisitDraft | null;
  toolsContext: string | null;
}

export const accountsStore: AccountsStore = {
  shownId: null,
  cardPatients: null,
  cardCentre: null,
  cardEffect: 0,
  nearby: null,
  filterOptions: { provincias: [], municipios: [], especialidades: [], estados: [], centros: [] },
  mapMode: false,
  portalAccess: null,
  duplicates: null,
  currentVisit: null,
  toolsContext: null,
};

exposeLegacyNames(accountsStore, [
  ['FICHA_ID', 'shownId'],
  ['FICHA_PAC', 'cardPatients'],
  ['FICHA_CENTRO', 'cardCentre'],
  ['FX_FICHA', 'cardEffect'],
  ['CERCA', 'nearby'],
  ['OPF', 'filterOptions'],
  ['MODO_MAPA', 'mapMode'],
  ['MED_ACCESO', 'portalAccess'],
  ['DUP_RES', 'duplicates'],
  ['VISITA_ACTUAL', 'currentVisit'],
  ['HERR_CTX', 'toolsContext'],
]);
