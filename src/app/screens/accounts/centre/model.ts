/** The centre sheet: its data, its professionals and the opening hours text. Shared by the sheet and its editor (v2.417.0). */
import { miscLegacy } from '../../../legacy/misc-bridge';

export interface Centre {
  id: string; nombre: string; telefono?: string | null; direccion?: string | null; cp?: string | null; municipio?: string | null;
  provincia?: string | null; lat?: number | string | null; lon?: number | string | null; horario?: Record<string, string> | null;
}
export interface CentreProfessional { id: string; nombre: string; urgente?: boolean; especialidad?: string | null; planta?: string | null; sala?: string | null; dias?: Record<string, string> | null; consultas?: number | string }
export interface CentreSheet { datos?: Centre | null; profesionales?: CentreProfessional[]; puede_editar?: boolean; puede_fichas?: boolean }

/** «Lunes 8:00-15:00 · Martes …» from a timetable keyed by day letter. */
export const hoursText = (hours: Record<string, string> | null | undefined): string =>
  miscLegacy.weekDays().filter(([day]) => hours?.[day]).map(([day, name]) => `${name} ${hours?.[day] ?? ''}`).join(' · ');
