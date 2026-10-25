/**
 * Small settings applied while the app loads (legado 018, 019 and 022, v2.424.0): more cached requests, the anchors of three help
 * buttons, the colours of the appointment states and the clean-up of the old «ruta en curso».
 */
import { loadTimeLegacy } from '../../legacy/legado-a-bridge';
import { t, type MessageKey } from '../../i18n';

/** Seconds each request is reused (legado 018). */
export function cacheMoreRequests(): void {
  Object.assign(loadTimeLegacy.cacheTimes(), { clientes_lista: 30, responsable_de_cuenta: 60 });
}

/** «i» buttons of Pacientes, Productos and the route in progress (legado 019). */
export function addHelpAnchors(): void {
  loadTimeLegacy.helpAnchors().push(['#v-pacientes .saludo h1', 'pacientes'], ['#v-productos .saludo h1', 'productos'], ['#renc .card > h2', 'rutas']);
}

/** Appointment states (database values) and their colour (legado 022). */
const STATE_COLOURS: Readonly<Record<string, string>> = {
  Planificada: 'var(--navy)', Confirmada: 'var(--sky)', Visitada: 'var(--ok)', 'No estaba': 'var(--warn)', Aplazada: 'var(--muted)', Descartada: 'var(--muted)',
};

/** The colours of the appointment states, and the old «ruta en curso» replaced by the working day is forgotten (legado 022). */
export function appointmentStates(): void {
  Object.assign(loadTimeLegacy.stateColours(), STATE_COLOURS);
  try { Object.keys(localStorage).filter(key => key.startsWith('dlc-ruta-')).forEach(key => { localStorage.removeItem(key); }); } catch { /* no storage */ }
}

const UNITS_LEGENDS = new Map<string, MessageKey>([['semana', 'legacyA.unitsLegend.week'], ['mes', 'legacyA.unitsLegend.month'], ['anio', 'legacyA.unitsLegend.year']]);

/** The legend of the units chart of the account card for a series (week, month, year), as legado 001 had it. */
export function unitsLegend(series: string): string | undefined {
  const key = UNITS_LEGENDS.get(series);
  return key ? t(key) : undefined;
}
