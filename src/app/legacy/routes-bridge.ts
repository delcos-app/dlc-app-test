import * as components from '../components';
import { planSettings, withHours } from '../screens/routes/planner/settings';
import { scheduleVisits } from '../screens/routes/planner/visits';
import { durationText, mapLibrary, PALETTE, reasonText, streetRoute } from '../screens/routes/today/service';
import * as legacyFreeScreensRoutes from '../screens/routes';
import * as legacyFreeCoreServices from '../core/services';
import { routesStore } from '../screens/routes/store';
/**
 * Bridge of Rutas to the legacy code (kept apart from bridge.ts, which is at its size limit). The planner (conHor, programarVisitas,
 * PLANCFG), the day map (rmLib, rmRuta and its palette and reasons) and the page chain (cargarRutas) stay in legacy: the Agenda and
 * Configuración use them too. The route being edited stays in the legacy RN and the cards in RN_LISTA, because the tests, the main
 * menu (legado 083) and the day map (servicios/mapas.js) read them.
 */
export const routesLegacy = {
  draft: (): RouteDraft | null => routesStore.wizard,
  setDraft: (draft: RouteDraft | null): void => { routesStore.wizard = draft; },
  setCards: (cards: RouteCard[]): void => { routesStore.routeList = cards; },
  setRoutes: (list: SavedRoute[]): void => { routesStore.routes = list; },
  /** Repaints the whole page (list, day in progress and today's map). */
  reload: (): void => { void legacyFreeScreensRoutes.loadRoutesPage(); },
  withSchedule: <T>(hours: { salida: string | null; vuelta: string | null }, work: () => T): T => withHours(hours, work),
  schedule: (items: PlanItem[], start: number): { seq: { it: PlanItem }[]; fuera: { it: PlanItem }[] } => scheduleVisits(items, start) as unknown as { seq: { it: PlanItem }[]; fuera: { it: PlanItem }[] },
  settings: (): PlanSettings => planSettings(),
  start: (): PlanStart => salidaUsuario(),
  minutesOf: (time: string | null | undefined): number | null => legacyFreeCoreServices.calendar.timeToMinutes(time),
  travelMinutes: (from: [number, number], to: [number, number]): number => minutosEntre(from, to),
  nextWorkingDay: (): string => siguienteLaborable(),
  mapLibrary: (): Promise<MapLibrary> => mapLibrary(),
  streetRoute: (points: [number, number][], start: string): Promise<StreetRoute> => streetRoute(points, start),
  durationText: (minutes: number): string => durationText(minutes),
  reasonText: (reason: string | undefined): string => reasonText(reason),
  palette: (): Readonly<Record<string, string>> => PALETTE,
  map: (): RouteMap | null => routesStore.todayMap,
  setMap: (map: RouteMap | null): void => { routesStore.todayMap = map; },
  pendingMap: (): PendingMap | null => routesStore.wizardMapPoints,
  setPendingMap: (pending: PendingMap): void => { routesStore.wizardMapPoints = pending; },
  improveFields: (root: Element): void => { components.enhanceFields(root); },
  askField: (title: string, type: string, value: string, label: string): Promise<string | null> => components.askField(title, type, value, label),
  blockedDays: (from: string, to: string): Promise<Record<string, string>> => bloqueadosSemana(from, to),
  firstOpenState: (): string => CITA_ABIERTA[0] ?? '',
};
