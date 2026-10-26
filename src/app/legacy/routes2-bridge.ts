/**
 * Bridge of the Rutas planner, today's map, the route bar and the Agenda traffic to the legacy code (kept apart from bridge.ts,
 * which is at its size limit). What stays in legacy: the plan card (pintarPlan, in Configuración), the shared plan and route state
 * (PLAN, RUTAS, RSEC, PROPUESTAS, ULTIMO_PLAN, SEM_BORRADOR, RN, RM_MAPA, RM_ANIM), the day estimate and its real times (estimarDia,
 * TD_REAL, TD_CALC, RM_MEM, TD_PARADAS), the geography helpers (salidaUsuario, minutosEntre, km, xyCita) and the navigation app.
 */
import type { DayPlan, PlanMember, PlanOptions } from '../screens/routes/planner/plan';
import type { WeekSplit } from '../screens/routes/planner/week-split';
import * as legacyFreeScreensRoutes from '../screens/routes';
import * as legacyFreeCoreServices from '../core/services';
import * as legacyFreeCoreLeftovers from '../core/leftovers';
import * as legacyFreeComponents from '../components';
import { sessionStore } from '../core/session-store';
import { routesStore } from '../screens/routes/store';
import { agendaStore } from '../screens/agenda/store';

interface LastPlan { conXY: PlanMember[]; rutaId: string; opts: PlanOptions }
interface Profile { id: string; preferencias?: Record<string, unknown> | null }

const profile = (): Profile | null => sessionStore.profile as Profile | null;

export const routes2Legacy = {
  // Plan and route state
  plan: (): DayPlan | null => routesStore.plan as DayPlan | null,
  setPlan: (plan: unknown): void => { routesStore.plan = plan; },
  lastPlan: (): LastPlan | null => routesStore.lastPlan as LastPlan | null,
  setLastPlan: (value: unknown): void => { routesStore.lastPlan = value; },
  paintPlan: (): void => { pintarPlan(); },
  savedRoutes: (): SavedRoute[] => (Array.isArray(routesStore.routes) ? routesStore.routes : []),
  setSection: (section: string): void => { routesStore.section = section; },
  proposals: (): Record<string, unknown> | null => routesStore.proposals,
  setProposals: (data: unknown): void => { routesStore.proposals = data as Record<string, unknown>; },
  weekDraft: (): WeekSplit | null => routesStore.weekDraft as unknown as WeekSplit | null,
  setWeekDraft: (draft: unknown): void => { routesStore.weekDraft = draft as WeekDraft | null; },
  draft: (): RouteDraft | null => routesStore.wizard,
  reloadRoutes: (): void => { void legacyFreeScreensRoutes.loadRoutesPage(); },
  reloadAgenda: (): void => { void cargarAgenda(); },
  /** The legacy rutasMapa: today's map, moved under the route cards. */
  paintDayMapAround: (): Promise<void> => rutasMapa(),
  // Preferences and the agenda shown
  ownPreferences: (): Record<string, unknown> | null => profile()?.preferencias ?? null,
  setOwnPreferences: (preferences: Record<string, unknown>): void => { const own = profile(); if (own) own.preferencias = preferences; },
  viewedPreferences: (): Record<string, unknown> | null => (agendaStore.viewedUser as { preferencias?: Record<string, unknown> | null } | null)?.preferencias ?? null,
  agendaOwner: (): string => legacyFreeCoreLeftovers.agendaOwnerId(),
  selectedDate: (): string | null => agendaStore.selectedDate,
  // Places, hours and times
  start: (): PlanStart => salidaUsuario(),
  pointOf: (item: object): [number, number] | null => xyCita(item),
  travelMinutes: (from: unknown, to: unknown): number => minutosEntre(from as [number, number], to as [number, number]),
  km: (from: unknown, to: unknown): number => km(from, to),
  minutesOf: (time: string | null | undefined): number | null => legacyFreeCoreServices.calendar.timeToMinutes(time),
  possibleStart: (item: object, arrival: number, length: number): number | null => inicioPosible(item, arrival, length),
  windowsOf: (days: Record<string, string | null> | null | undefined, isoDate: string): [number, number][] | null => ventanasDe(days, isoDate) as [number, number][] | null,
  windowsText: (windows: readonly [number, number][]): string => txtVentanas(windows),
  hoursOfAppointments: (list: readonly object[]): { salida: string | null; vuelta: string | null } | null => horDeCitas(list),
  estimateDay: (list: readonly object[], isoDate: string): { est: Record<string, number | undefined>; tope: number } => estimarDia(list, isoDate) as unknown as { est: Record<string, number | undefined>; tope: number },
  nextWorkingDay: (): string => siguienteLaborable(),
  shortDate: (isoDate: string): string => legacyFreeCoreServices.calendar.shortDate(isoDate),
  weekdayName: (isoDate: string): string => DIAN[LETRA_DIA(isoDate)] ?? '',
  weekdayOf: (letter: string): string => DIAN[letter] ?? '',
  isDone: (state: string): boolean => citaHecha(state),
  myPlannedAppointments: (): Promise<Record<string, string | undefined>> => legacyFreeCoreLeftovers.myPlannedAppointments(),
  recentContacts: (ids: string[], isoDate: string): Promise<Record<string, RecentContact[] | undefined>> => recientesDe(ids, isoDate),
  recentText: (list: RecentContact[]): string => txtReciente(list),
  revisitNotice: (): { on: boolean; dias: number } => avisoRevisita(),
  noStartWarning: (element: Element | null): void => { legacyFreeComponents.noStartNotice((element as HTMLElement | null)); },
  openPlanTimes: (): void => { abrirHorarioPlan(); },
  navigate: (destination: [number, number] | null, stops: [number, number][] | null): void => {
    void (navegarA as unknown as (point: [number, number] | null, stops?: [number, number][] | null) => Promise<void>)(destination, stops);
  },
  iconOrEmpty: (name: string): string => svgIco(ICON_NOM[name] ?? ''),
  // Working day
  workingDay: (): { fecha: string; inicio: number } | null => jornadaActiva(),
  endWorkingDay: (): Promise<void> => terminarJornada(),
  // Stops of «Tu día» and their real times
  stops: (): RouteAppointment[] => agendaStore.dayStops,
  setStops: (list: readonly object[]): void => { agendaStore.dayStops = list as RouteAppointment[]; },
  realTraffic: (): RealTraffic | null => agendaStore.realTimes,
  setRealTraffic: (value: RealTraffic | null): void => { agendaStore.realTimes = value; },
  realTrafficValid: (): boolean => tdRealVigente(),
  setCalculating: (on: boolean): void => { agendaStore.trafficCalculated = on; },
  legKey: (from: unknown, to: unknown): string => tdClaveXY(from, to),
  routeMemory: (): Map<string, { t: number; r: StreetRoute }> => RM_MEM,
  // Maps
  mapLibre: (): MapLibrary | null => (window as unknown as { maplibregl?: MapLibrary }).maplibregl ?? null,
  dayMap: (): RouteMap | null => routesStore.todayMap,
  setDayMap: (map: RouteMap | null): void => { routesStore.todayMap = map; },
  animation: (): number | null => routesStore.todayMapAnimation,
  setAnimation: (frame: number | null): void => { routesStore.todayMapAnimation = frame; },
  invokeRoutes: (body: unknown): Promise<{ data: StreetRoute | null; error: RoutesFunctionError | null }> => db.functions.invoke<StreetRoute>('rutas', { body }),
};
