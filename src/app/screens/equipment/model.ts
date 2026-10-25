/**
 * What an installed piece of equipment is (values stored in the database), when its contract or warranty ends, and its pills.
 * Migrated from the legacy EQ_REV, eqVence, eqDias, eqRevPill and eqVencePill (v2.409.0).
 */
import { equipmentLegacy } from '../../legacy/bridge';
import { t } from '../../i18n';
import { formatShortDate } from '../../services/date-format';
import { fromIsoDate, todayIso } from '../../services/dates';
import { formatNumber } from '../../services/format';

export const STATES = { installed: 'Instalado', retired: 'Retirado' } as const;
/** A sale has a warranty; a rental or a loan has a contract with an end. */
export const SALE = 'Venta';
export const REVIEW_TYPES = ['Preventiva', 'Correctiva', 'Instalación'] as const;

const DAY_MS = 864e5, SOON_DAYS = 30;

export interface Equipment {
  id: string; serie?: string | null; ubicacion?: string | null; instalado?: string | null; contrato?: string | null; contrato_fin?: string | null;
  garantia_hasta?: string | null; proxima_revision?: string | null; revision_meses?: number | null; estado?: string; nota?: string | null;
  cuenta_id?: string; producto_id?: string; cuentas?: { nombre?: string | null } | null; productos?: { nombre?: string | null } | null;
}

/** The date the contract (rental, loan) or the warranty (sale) ends. */
export const expiryOf = (item: Equipment): string | null | undefined => (item.contrato !== SALE ? item.contrato_fin : item.garantia_hasta);

/** Days from today to `isoDate` (negative if past), or null without a date. */
export const daysUntil = (isoDate: string | null | undefined): number | null =>
  (isoDate ? Math.round((fromIsoDate(isoDate).getTime() - fromIsoDate(todayIso()).getTime()) / DAY_MS) : null);

/** The widest warning of contracts and warranties (days before they end). */
export const warningLimit = (): number => Math.max(...equipmentLegacy.warningDays(), 0);

export function reviewPill(item: Equipment): string {
  if (item.estado === STATES.retired) return `<span class="pill p-anu">${t('equipment.pills.retired')}</span>`;
  const days = daysUntil(item.proxima_revision), date = formatShortDate(item.proxima_revision ?? '');
  if (days === null) return '';
  if (days < 0) return `<span class="pill p-urg">${t('equipment.pills.reviewPast', { date })}</span>`;
  return days <= SOON_DAYS ? `<span class="pill p-warn">${t('equipment.pills.reviewOn', { date })}</span>` : `<span class="pill p-per">${t('equipment.pills.nextReview', { date })}</span>`;
}

function expiresText(what: string, days: number): string {
  if (days === 0) return t('equipment.pills.expiresToday', { what });
  return days === 1 ? t('equipment.pills.expiresInOneDay', { what }) : t('equipment.pills.expiresInDays', { what, count: formatNumber(days) });
}

export function expiryPill(item: Equipment): string {
  const days = daysUntil(expiryOf(item));
  if (days === null || item.estado === STATES.retired) return '';
  const what = t(item.contrato !== SALE ? 'equipment.pills.contract' : 'equipment.pills.warranty');
  if (days < 0) return `<span class="pill p-anu">${t('equipment.pills.expired', { what })}</span>`;
  return days <= warningLimit() ? `<span class="pill p-urg">${expiresText(what, days)}</span>` : '';
}

/** «No puedes cambiar los equipos de esta ficha» when row security refuses, otherwise the database message. */
export const failureText = (error: unknown): string => {
  const message = (error as { message?: string } | null)?.message ?? '';
  return /row-level|policy/i.test(message) ? t('equipment.noPermission') : t('equipment.couldNotSave', { error: message });
};
