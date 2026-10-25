/**
 * Panel delcos: the companies (organizations) as the platform lists them, their plan text and state pills, the names of the extras,
 * and small helpers the panel tabs share. Migrated from the legacy orgPlanTxt, orgEstado, orgEstadoBase and extraNombre (v2.413.0).
 */
import { platformLegacy } from '../../legacy/platform-bridge';
import { t, type MessageKey } from '../../i18n';
import { formatShortDate } from '../../services/date-format';
import { formatNumber } from '../../services/format';

export interface PlanData {
  plan?: string; usuarios?: number | null; pago?: string; estado?: string; prueba_hasta?: string; impago_desde?: string; extras?: string[];
  stripe_suscripcion?: string | null; stripe_cliente?: string | null; compromiso_hasta?: string | null; baja_al_final?: boolean; origen?: string;
  cambio_previsto?: { plan?: string; usuarios?: number; desde?: string } | null;
}

export interface Organization {
  id: string; nombre: string; nif?: string | null; plan?: string; plan_datos?: PlanData | null; usuarios: number; cuentas: number; pendiente?: string | null;
  dominios?: string[] | null; creado_en?: string | null; principal?: boolean; activa?: boolean; bloqueada?: string | null; facturas?: number | null;
}

const MEDIDA = 'medida';

/** What the panel remembers: the company being viewed from inside, and the error filters. */
export const platformState = {
  viewed: null as { id: string; nombre: string; bloqueada?: string | null } | null,
  companyErrors: { tipo: '', estado: 'Nuevo' },
  platformErrors: { estado: 'abiertos', dias: 15 },
};

export const planOf = (organization: Organization): PlanData => organization.plan_datos ?? {};

/** «plan Empresa · 5 contratados · anual». */
export function planText(organization: Organization): string {
  const data = planOf(organization), name = platformLegacy.planName(data.plan ?? organization.plan);
  const users = data.plan === MEDIDA || data.usuarios === null || data.usuarios === undefined ? '' : t('platform.orgs.hired', { count: formatNumber(data.usuarios) });
  const payment = data.pago === 'anual' ? t('platform.orgs.yearly') : data.plan === MEDIDA ? '' : t('platform.orgs.monthly');
  return t('platform.orgs.planText', { name }) + users + payment;
}

const EXTRAS = new Map<string, MessageKey>([['oportunidades', 'platform.extras.opportunities'], ['portal', 'platform.extras.portal']]);

export const extraName = (key: string): string => { const label = EXTRAS.get(key); return label ? t(label) : key; };

function blockedPill(organization: Organization, data: PlanData): string {
  if (organization.bloqueada === 'desactivada') return `<span class="pill p-anu">${t('platform.orgs.deactivated')}</span> `;
  if (organization.bloqueada === 'prueba_terminada') return `<span class="pill p-warn">${t('platform.orgs.trialEnded', { date: formatShortDate(data.prueba_hasta ?? '') })}</span> `;
  if (data.estado === 'prueba') return `<span class="pill p-est">${t('platform.orgs.trialUntil', { date: formatShortDate(data.prueba_hasta ?? '') })}</span> `;
  return '';
}

/** Cancelled, unpaid, deactivated, in trial… and «Stripe» when it pays through Stripe. */
export function statePills(organization: Organization): string {
  const data = planOf(organization);
  if (organization.bloqueada === 'cancelada') return `<span class="pill p-anu">${t('platform.orgs.cancelled')}</span> `;
  if (data.estado === 'impago') return `<span class="pill p-urg">${t('platform.orgs.unpaidSince', { date: formatShortDate(data.impago_desde ?? '') })}</span> `;
  return blockedPill(organization, data) + (data.stripe_suscripcion ? '<span class="pill p-est">Stripe</span> ' : '');
}

/** The message of a database error. */
export const errorMessage = (error: unknown): string => (error as { message?: string } | null)?.message ?? '';

/** «24/10/26, 10:30». */
export const shortDateTime = (value: string): string => new Date(value).toLocaleString(t('dates.locale'), { dateStyle: 'short', timeStyle: 'short' });

/** Saves `data` as a JSON file. */
export function downloadJson(data: unknown, fileName: string, keepUrlMs = 0): void {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' }));
  link.download = fileName; link.click();
  if (keepUrlMs) setTimeout(() => { URL.revokeObjectURL(link.href); }, keepUrlMs);
}

/** The box of the panel page; null when the user has left it. */
export const panelBox = (): HTMLElement | null => document.getElementById('cfgcuerpo');

/** Still on tab `tab` of the panel after an answer arrived. */
export const stillOnTab = (tab: string): boolean => Boolean(panelBox()) && platformLegacy.panelTab() === tab;
