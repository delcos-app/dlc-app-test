/**
 * Agenda and «Tu día»: its state in one object (plan 6.6, v2.439.0) instead of loose legacy globals. The legacy names (AG_FECHA, AG_MODO, AG_MET…)
 * stay on window as accessors to this same object, for the remaining legacy code and the tests.
 */
import { exposeLegacyNames } from '../../state/legacy-names';

export interface AgendaStore {
  selectedDate: string | null;
  mode: string;
  metrics: AgendaMetrics | null;
  pendingSuggestions: PendingAppointment[] | null;
  suggestions: { fecha: string; toca: DueAccount[]; centros: SameCentreGroup[] } | null;
  weekOpen: boolean;
  viewedUser: { id: string; nombre: string } | null;
  stripStart: string | null;
  dayTasks: { f: string; l: (DayTask & { orden?: number })[] } | null;
  dayAppointments: AgendaAppointment[];
  stopInfo: Record<string, StopInfo>;
  dayStops: RouteAppointment[];
  presetDay: { fecha: string; data?: AgendaAppointment[] } | null;
  lastPaintedDay: { fecha: string; data?: AgendaAppointment[] } | null;
  trafficCalculated: boolean;
  realTimes: RealTraffic | null;
  dialogEpoch: number;
  openWeekPlan: boolean;
}

export const agendaStore: AgendaStore = {
  selectedDate: null,
  mode: 'dia',
  metrics: null,
  pendingSuggestions: null,
  suggestions: null,
  weekOpen: false,
  viewedUser: null,
  stripStart: null,
  dayTasks: null,
  dayAppointments: [],
  stopInfo: {},
  dayStops: [],
  presetDay: null,
  lastPaintedDay: null,
  trafficCalculated: false,
  realTimes: null,
  dialogEpoch: 0,
  openWeekPlan: false,
};

exposeLegacyNames(agendaStore, [
  ['AG_FECHA', 'selectedDate'],
  ['AG_MODO', 'mode'],
  ['AG_MET', 'metrics'],
  ['AG_PEND', 'pendingSuggestions'],
  ['AG_SUG', 'suggestions'],
  ['AG_SEM_ABIERTA', 'weekOpen'],
  ['AG_VISTA', 'viewedUser'],
  ['CINTA_INI', 'stripStart'],
  ['TAREAS_DIA', 'dayTasks'],
  ['TD_CITAS', 'dayAppointments'],
  ['TD_INFO', 'stopInfo'],
  ['TD_PARADAS', 'dayStops'],
  ['TD_PRESET', 'presetDay'],
  ['TD_ULTIMO', 'lastPaintedDay'],
  ['TD_CALC', 'trafficCalculated'],
  ['TD_REAL', 'realTimes'],
  ['DLG_EPOCA', 'dialogEpoch'],
  ['ABRIR_PLAN_SEMANA', 'openWeekPlan'],
]);
