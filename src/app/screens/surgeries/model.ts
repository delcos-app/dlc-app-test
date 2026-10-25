/** What a surgery is (values stored in the database), its pills and the messages of its errors. */
import { t, type MessageKey } from '../../i18n';
import { escapeHtml } from '../../services/format';

export const STATES = { scheduled: 'Programada', done: 'Hecha', cancelled: 'Anulada' } as const;
/** Where the material comes from: the centre's deposit or the store of whoever assists. */
export const ORIGINS = ['deposito', 'personal'] as const;
export type Origin = (typeof ORIGINS)[number];
export const originLabel = (origin: string): string => (ORIGINS.includes(origin as Origin) ? t(`surgeries.origins.${origin}` as MessageKey) : '');

export type Replenishment = 'vencida' | 'pendiente' | 'repuesta' | null;

export interface Surgery {
  id: string; fecha: string; hora?: string | null; estado: string; procedimiento?: string | null; quirofano?: string | null; nota?: string | null;
  hospital_id?: string; cirujano_id?: string; asistente_id?: string; origen?: string; referencia_caso?: string | null; pedido_id?: string | null;
  reposicion?: Replenishment; reposicion_limite?: string | null; repuesta_en?: string | null;
  hospital?: string | null; cirujano?: string | null; especialidad?: string | null; asistente?: string | null;
}

export const timeOf = (surgery: { hora?: string | null }): string => (surgery.hora ? String(surgery.hora).slice(0, 5) : '');

export function statePill(surgery: { estado: string }): string {
  const kind = surgery.estado === STATES.done ? 'p-est' : surgery.estado === STATES.cancelled ? 'p-anu' : 'p-per';
  return `<span class="pill ${kind}">${escapeHtml(surgery.estado)}</span>`;
}

/** The replenishment of what was used: overdue, pending (before its deadline) or done. */
export function replenishmentPill(surgery: Pick<Surgery, 'reposicion' | 'reposicion_limite'>): string {
  if (surgery.reposicion === 'vencida') return `<span class="pill p-urg">${t('surgeries.pills.overdue')}</span>`;
  if (surgery.reposicion === 'repuesta') return `<span class="pill p-est">${t('surgeries.pills.replenished')}</span>`;
  if (surgery.reposicion !== 'pendiente') return '';
  const deadline = new Date(surgery.reposicion_limite ?? '').toLocaleString(t('dates.locale'), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  return `<span class="pill p-warn">${t('surgeries.pills.replenishBefore', { date: escapeHtml(deadline) })}</span>`;
}

/** Error codes of the database functions and their message. */
const ERRORS = new Map<string, MessageKey>([
  ['permiso', 'surgeries.errors.permission'], ['faltan', 'surgeries.errors.missing'], ['hospital', 'surgeries.errors.centre'],
  ['sin_deposito', 'surgeries.errors.noDeposit'], ['sin_almacen', 'surgeries.errors.noStore'], ['hecha', 'surgeries.errors.done'],
  ['sin_stock', 'surgeries.errors.noStock'], ['series', 'surgeries.errors.serials'], ['linea', 'surgeries.errors.line'],
  ['vacio', 'surgeries.errors.empty'], ['anulada', 'surgeries.errors.cancelled'], ['no_hecha', 'surgeries.errors.notDone'],
  ['sin_origen', 'surgeries.errors.noSource'], ['cirujano', 'surgeries.errors.responsible'], ['asistente', 'surgeries.errors.assistant'],
  ['valores', 'surgeries.errors.values'],
]);

export const errorText = (result: { error?: string } | null): string => t(ERRORS.get(result?.error ?? '') ?? 'surgeries.errors.generic');
