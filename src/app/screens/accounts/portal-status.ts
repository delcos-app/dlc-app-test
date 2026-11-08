/**
 * The professional's portal next to their name (v2.474.0, D-051, SQL 197): a small portal icon for the accounts that have a portal
 * user, only for who can see portal access today (administration, who sees everything or gives access; cuentas_con_acceso answers
 * nothing to the rest). Pressing it opens the «i» bubble (the same one, with its ✕) with whether the portal is active, when they
 * last connected and, for administration, the email. Active and connected in the last 30 days: the icon in its colour; active but
 * without a connection in 30 days, never connected or deactivated: muted grey. Pedidos uses it in its professional column and the
 * mobile cards copy it (data-plcico). Without SQL 197 the rows bring no account, so no icon; with the account but without the last
 * connection, the bubble says only «Activo» or «Desactivado».
 */
import { accountColumnsLegacy } from '../../legacy/bridge';
import { registerError } from '../../core/errors';
import { registerPopoverSource } from '../../core/legacy-a/outside-clicks';
import { t } from '../../i18n';
import { daysBetween, isoDateOf, todayIso } from '../../services/dates';
import { formatNumericDate } from '../../services/date-format';
import { escapeHtml } from '../../services/format';

/** One account with a portal user, as cuentas_con_acceso answers (ultima_conexion since SQL 197; email only for administration). */
interface PortalAccess { cuenta_id: string; activo?: boolean | null; email?: string | null; ultima_conexion?: string | null }

/** Last connection: within the 30 days, older, never, or unknown (a database without SQL 197). */
type ConnectionKind = 'recent' | 'old' | 'never' | 'unknown';
interface Connection { kind: ConnectionKind; day?: string; days?: number }

const RECENT_DAYS = 30;
// Door ajar (Lucide «door-open»), the same stroke as the other line icons
const PORTAL_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 20H2"/><path d="M11 4.562v16.157a1 1 0 0 0 1.242.97L19 20V5.562a2 2 0 0 0-1.515-1.94l-4-1A2 2 0 0 0 11 4.561z"/><path d="M11 4H8a2 2 0 0 0-2 2v14"/><path d="M14 12h.01"/><path d="M22 20h-3"/></svg>';

const accessOf = (accountId: string): PortalAccess | null =>
  (accountColumnsLegacy.accessOf() as Record<string, PortalAccess | undefined> | null)?.[accountId] ?? null;

/** Who has a portal, loaded once per session (before painting, so that the icons arrive with the table). */
export async function loadPortalAccess(): Promise<void> {
  if (accountColumnsLegacy.accessOf()) return;
  try { await accountColumnsLegacy.loadAccess(); } catch (error) { registerError('portal', error, { where: 'loadPortalAccess' }); }
}

function connectionOf(access: PortalAccess): Connection {
  if (!('ultima_conexion' in access)) return { kind: 'unknown' };
  const date = access.ultima_conexion ? new Date(access.ultima_conexion) : null;
  if (!date || isNaN(date.getTime())) return { kind: 'never' };
  const day = isoDateOf(date), days = Math.max(0, daysBetween(day, todayIso()));
  return { kind: days <= RECENT_DAYS ? 'recent' : 'old', day, days };
}

/** Muted when it is deactivated, never connected or has not connected in the last 30 days. */
const isMuted = (access: PortalAccess): boolean => !access.activo || ['old', 'never'].includes(connectionOf(access).kind);

/** «Última conexión: hace 3 días (05/11/2026)», «… hoy (08/11/2026)», «Nunca se ha conectado» or nothing (unknown). */
function connectionText(connection: Connection): string {
  if (connection.kind === 'unknown') return '';
  if (connection.kind === 'never' || !connection.day) return t('accounts.portalStatus.never');
  const days = connection.days ?? 0;
  const when = days === 0 ? t('accounts.portalStatus.today') : days === 1 ? t('accounts.portalStatus.yesterday') : t('accounts.portalStatus.daysAgo', { days });
  return t('accounts.portalStatus.lastConnection', { when, date: formatNumericDate(connection.day) });
}

const stateText = (access: PortalAccess): string => t(access.activo ? 'accounts.portalStatus.active' : 'accounts.portalStatus.disabled');

/** The portal icon of an account (empty if it has no portal user or whoever looks cannot see portal access). */
export function portalBadgeHtml(accountId: string | null | undefined, name: string): string {
  const access = accountId ? accessOf(accountId) : null;
  if (!accountId || !access) return '';
  const label = t('accounts.portalStatus.label', { name, state: stateText(access).toLowerCase() });
  return `<button type="button" class="ppico${isMuted(access) ? ' ppoff' : ''}" data-portal="${escapeHtml(accountId)}" data-plcico aria-label="${escapeHtml(label)}">${PORTAL_ICON}</button>`;
}

/** What the bubble says: «Portal», its state, the last connection and (for administration) the email. */
export function portalBubbleHtml(accountId: string): string {
  const access = accessOf(accountId);
  if (!access) return `<b>${t('accounts.portalStatus.title')}</b>`;
  const connection = connectionText(connectionOf(access));
  return `<b>${t('accounts.portalStatus.title')}</b><div data-pp="state">${stateText(access)}</div>`
    + (connection ? `<div data-pp="connection">${escapeHtml(connection)}</div>` : '')
    + (access.email ? `<div data-pp="email">${escapeHtml(access.email)}</div>` : '');
}

registerPopoverSource({ selector: '.ppico', manualLink: false, content: button => portalBubbleHtml(button.dataset.portal ?? '') });
