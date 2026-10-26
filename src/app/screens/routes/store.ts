/**
 * Rutas: its state in one object (plan 6.6, v2.439.0) instead of loose legacy globals. The legacy names (PLAN, RUTAS, PROPUESTAS…)
 * stay on window as accessors to this same object, for the remaining legacy code and the tests.
 */
import { exposeLegacyNames } from '../../state/legacy-names';

export interface RoutesStore {
  plan: unknown;
  routes: SavedRoute[];
  proposals: Record<string, unknown> | null;
  section: string;
  wizard: RouteDraft | null;
  routeList: RouteCard[] | null;
  wizardMapPoints: PendingMap | null;
  todayMap: RouteMap | null;
  todayMapAnimation: number | null;
  dayProposals: unknown;
  weekDraft: WeekDraft | null;
  lastPlan: unknown;
}

export const routesStore: RoutesStore = {
  plan: null,
  routes: [],
  proposals: null,
  section: 'mis',
  wizard: null,
  routeList: null,
  wizardMapPoints: null,
  todayMap: null,
  todayMapAnimation: null,
  dayProposals: null,
  weekDraft: null,
  lastPlan: null,
};

exposeLegacyNames(routesStore, [
  ['PLAN', 'plan'],
  ['RUTAS', 'routes'],
  ['PROPUESTAS', 'proposals'],
  ['RSEC', 'section'],
  ['RN', 'wizard'],
  ['RN_LISTA', 'routeList'],
  ['RN_MAPA_P', 'wizardMapPoints'],
  ['RM_MAPA', 'todayMap'],
  ['RM_ANIM', 'todayMapAnimation'],
  ['RPROP', 'dayProposals'],
  ['SEM_BORRADOR', 'weekDraft'],
  ['ULTIMO_PLAN', 'lastPlan'],
]);
