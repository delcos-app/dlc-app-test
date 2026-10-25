/**
 * Comisiones: the commission schemes (kept in the legacy ESQUEMAS, which the user editor of Configuración also reads), the
 * settlement states and the assignment pill. Migrated from the legacy helpers of pantallas/comisiones.js (v2.411.0).
 */
import { commissionsLegacy } from '../../legacy/commissions-bridge';
import { t } from '../../i18n';
import { todayIso } from '../../services/dates';

/** Settlement states (database values). */
export const SETTLEMENT = { draft: 'Borrador', approved: 'Aprobada', paid: 'Pagada' } as const;

/** The date an assignment «to the whole history» starts on. */
export const ALL_HISTORY = '2000-01-01';

export interface Tier { desde_u: number; hasta_u: number | null; valor: number }
export interface Scheme {
  id: string; nombre: string; atribucion?: string | null; calculo: string; canal?: string | null; valor_fijo?: number | null;
  tramos?: Tier[] | null; personas?: string[] | null;
}
export interface Assignment { usuario_id: string; esquema_id: string; persona: string; rol: string; esquema: string; desde: string; hasta?: string | null; vigente?: boolean }

export const schemes = (): Scheme[] => commissionsLegacy.schemes() as Scheme[];

/** Asks for the schemes again next time (after a change). */
export const forgetSchemes = (): void => { commissionsLegacy.setSchemes([]); };

/** Vigente, Programado or Terminado, with its pill class. */
export function assignmentState(assignment: Assignment): { text: string; pill: string } {
  if (assignment.vigente) return { text: t('commissions.people.current'), pill: 'p-est' };
  return assignment.desde > todayIso() ? { text: t('commissions.people.scheduled'), pill: 'p-per' } : { text: t('commissions.people.ended'), pill: 'p-anu' };
}

/** «2026-02» → «2026-02-28». */
export function monthEnd(period: string): string {
  const [year = 0, month = 0] = period.split('-').map(Number);
  return `${period}-${String(new Date(year, month, 0).getDate()).padStart(2, '0')}`;
}
