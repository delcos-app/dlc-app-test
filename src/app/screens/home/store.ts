/**
 * Inicio and Analítica: its state in one object (plan 6.6, v2.439.0) instead of loose legacy globals. The legacy names (KV_INI, KV_GRAF, ALERTAS_OCULTAS…)
 * stay on window as accessors to this same object, for the remaining legacy code and the tests.
 */
import { exposeLegacyNames } from '../../state/legacy-names';

export interface HomeStore {
  panel: HomePanel | null;
  charts: HomeCharts | null;
  hiddenAlerts: LegacyHiddenAlert[] | null;
  analyticsAccount: { id: string; nombre: string } | null;
  analyticsSection: string;
  salesTeam: { id: string; nombre: string }[];
  commissionSchemes: unknown[];
  contractWarningDays: number[];
  manualReturn: { tab: string; y: number } | null;
}

export const homeStore: HomeStore = {
  panel: null,
  charts: null,
  hiddenAlerts: null,
  analyticsAccount: null,
  analyticsSection: 'resumen',
  salesTeam: [],
  commissionSchemes: [],
  contractWarningDays: [90, 30],
  manualReturn: null,
};

exposeLegacyNames(homeStore, [
  ['KV_INI', 'panel'],
  ['KV_GRAF', 'charts'],
  ['ALERTAS_OCULTAS', 'hiddenAlerts'],
  ['AN_MED', 'analyticsAccount'],
  ['ANSEC', 'analyticsSection'],
  ['COMS', 'salesTeam'],
  ['ESQUEMAS', 'commissionSchemes'],
  ['CON_AVISOS', 'contractWarningDays'],
  ['MANUAL_VUELTA', 'manualReturn'],
]);
