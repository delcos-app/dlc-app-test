/**
 * Where an appointment comes from and where it went: «movida al jueves 30/10 (visitada)», «viene del lunes 27/10 · Ruta». Migrated
 * from the legacy diaCita and textoOrigenCita (v2.414.0); textoOrigenCita stays as an adapter (the tests call it).
 */
import { t } from '../../i18n';
import { escapeHtml } from '../../services/format';
import { isOpen } from './appointment-state';

/** Values stored in the database. */
const POSTPONED = 'Aplazada', RESCHEDULED = 'Reprogramada';

export interface OriginOf {
  estado: string; origen?: string | null; origen_inicial?: string | null;
  aplazada_a_fecha?: string | null; aplazada_a_estado?: string | null; aplazada_de_fecha?: string | null;
}

/** «jueves 30/10». */
export function appointmentDay(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  return `${date.toLocaleDateString(t('dates.locale'), { weekday: 'long' })} ${date.getDate()}/${date.getMonth() + 1}`;
}

function movedTo(item: OriginOf): string | null {
  if (item.estado !== POSTPONED || !item.aplazada_a_fecha) return null;
  const state = item.aplazada_a_estado, closed = state && !isOpen(state) && state !== POSTPONED ? ` (${state.toLowerCase()})` : '';
  return t('agendaMore.origin.movedTo', { day: appointmentDay(item.aplazada_a_fecha) }) + closed;
}

function comesFrom(item: OriginOf): string[] {
  if (item.aplazada_de_fecha) {
    const first = item.origen_inicial && ![POSTPONED, RESCHEDULED].includes(item.origen_inicial) ? [item.origen_inicial] : [];
    return [t('agendaMore.origin.comesFrom', { day: appointmentDay(item.aplazada_de_fecha) }), ...first];
  }
  const ownMove = item.estado === POSTPONED && Boolean(item.aplazada_a_fecha) && item.origen === POSTPONED;
  return item.origen && !ownMove ? [item.origen] : [];
}

/** « · movida al … · viene del … · Ruta», already escaped (empty if there is nothing to say). */
export function originText(item: OriginOf): string {
  const parts = [movedTo(item), ...comesFrom(item)].filter((part): part is string => Boolean(part));
  return parts.length ? ` · ${escapeHtml(parts.join(' · '))}` : '';
}
