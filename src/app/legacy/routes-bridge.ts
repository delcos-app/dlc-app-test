import * as components from '../components';
import { planSettings, withHours } from '../screens/routes/planner/settings';
import { scheduleVisits } from '../screens/routes/planner/visits';
import { durationText, mapLibrary, PALETTE, reasonText, streetRoute } from '../screens/routes/today/service';
import * as legacyFreeScreensRoutes from '../screens/routes';
/**
 * Bridge of Rutas to the legacy code (kept apart from bridge.ts, which is at its size limit). The planner (conHor, programarVisitas,
 * PLANCFG), the day map (rmLib, rmRuta and its palette and reasons) and the page chain (cargarRutas) stay in legacy: the Agenda and
 * Configuración use them too. The route being edited stays in the legacy RN and the cards in RN_LISTA, because the tests, the main
 * menu (legado 083) and the day map (servicios/mapas.js) read them.
 */
export const routesLegacy = {
  draft: (): RouteDraft | null => RN,
  setDraft: (draft: RouteDraft | null): void => { RN = draft; },
  setCards: (cards: RouteCard[]): void => { RN_LISTA = cards; },
  setRoutes: (list: SavedRoute[]): void => { RUTAS = list; },
  /** Repaints the whole page (list, day in progress and today's map). */
  reload: (): void => { void legacyFreeScreensRoutes.loadRoutesPage(); },
  withSchedule: <T>(hours: { salida: string | null; vuelta: string | null }, work: () => T): T => withHours(hours, work),
  schedule: (items: PlanItem[], start: number): { seq: { it: PlanItem }[]; fuera: { it: PlanItem }[] } => scheduleVisits(items, start) as unknown as { seq: { it: PlanItem }[]; fuera: { it: PlanItem }[] },
  settings: (): PlanSettings => planSettings(),
  start: (): PlanStart => salidaUsuario(),
  minutesOf: (time: string | null | undefined): number | null => minHora(time),
  travelMinutes: (from: [number, number], to: [number, number]): number => minutosEntre(from, to),
  nextWorkingDay: (): string => siguienteLaborable(),
  mapLibrary: (): Promise<MapLibrary> => mapLibrary(),
  streetRoute: (points: [number, number][], start: string): Promise<StreetRoute> => streetRoute(points, start),
  durationText: (minutes: number): string => durationText(minutes),
  reasonText: (reason: string | undefined): string => reasonText(reason),
  palette: (): Readonly<Record<string, string>> => PALETTE,
  map: (): RouteMap | null => RM_MAPA,
  setMap: (map: RouteMap | null): void => { RM_MAPA = map; },
  pendingMap: (): PendingMap | null => RN_MAPA_P,
  setPendingMap: (pending: PendingMap): void => { RN_MAPA_P = pending; },
  improveFields: (root: Element): void => { components.enhanceFields(root); },
  askField: (title: string, type: string, value: string, label: string): Promise<string | null> => components.askField(title, type, value, label),
  blockedDays: (from: string, to: string): Promise<Record<string, string>> => bloqueadosSemana(from, to),
  firstOpenState: (): string => CITA_ABIERTA[0] ?? '',
};
