/**
 * Notifications: what each one offers to do and which day group it belongs to. Migrated from the legacy notifAcciones and notifDia
 * (v2.417.0).
 */
import { agendaActions, appLegacy, legacyDb, notices, term } from '../../../legacy/bridge';
import { settingsExtraLegacy } from '../../../legacy/settings3-bridge';
import { t } from '../../../i18n';

export interface AppNotification {
  id: string; tipo: string; titulo: string; cuerpo?: string | null; enlace?: string | null; datos?: Record<string, string | null | undefined> | null;
  creado_en: string; visible_desde?: string | null; leida_en?: string | null; resumen?: boolean;
}

/** [text, action, main]: the buttons of a notification. */
export type NotificationAction = readonly [string, () => void, boolean];

export type DayGroup = 'today' | 'yesterday' | 'week' | 'before';

const DAY_MS = 864e5, WEEK_DAYS = 7;

export function dayGroup(isoDate: string): DayGroup {
  const date = new Date(isoDate), today = new Date(); today.setHours(0, 0, 0, 0);
  const days = Math.round((today.getTime() - new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()) / DAY_MS);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return days < WEEK_DAYS ? 'week' : 'before';
}

function restockActions(data: Record<string, string | null | undefined>, id: string): NotificationAction[] {
  const phone = data.telefono, out: NotificationAction[] = [];
  if (phone) out.push([t('settingsExtra.notifications.call'), () => { location.href = `tel:${String(phone).replace(/\s+/g, '')}`; }, true]);
  out.push([t('settingsExtra.notifications.newSale'), () => { settingsExtraLegacy.newSale({ contacto_id: data.contacto_id ?? id, cliente: data.nombre, telefono: phone }); }, !phone]);
  return out;
}

function linkActions(notification: AppNotification, kind: string, id: string): NotificationAction[] {
  if (kind === 'pedido' && id) return [[t('settingsExtra.notifications.seeOrder'), () => { appLegacy.openOrder(id); }, true]];
  if (kind === 'ficha' && id) return [[t('settingsExtra.notifications.seeCard'), () => { agendaActions.openAccount(id); }, true]];
  const link = notification.enlace;
  return link ? [[t('settingsExtra.notifications.open'), () => { settingsExtraLegacy.followLink(link); }, true]] : [];
}

/** The buttons of each notification: [text, action, main]. */
export function actionsOf(notification: AppNotification): NotificationAction[] {
  const data = notification.datos ?? {}, [kind = '', id = ''] = String(notification.enlace ?? '').split(':');
  const account = data.cuenta_id ?? id;
  if (notification.tipo === 'reponer') return restockActions(data, id);
  if (notification.tipo === 'caida_ventas') {
    return [[t('settingsExtra.notifications.seeCard'), () => { agendaActions.openAccount(account); }, true], [t('settingsExtra.notifications.appoint'), () => { agendaActions.newAppointment(account, null); }, false]];
  }
  if (notification.tipo === 'visita_sin_registrar') {
    const visited = data.cuenta_id ?? '';
    return [[t('settingsExtra.notifications.recordVisit', { visit: term('visita') }), () => { settingsExtraLegacy.recordVisit(visited); }, true],
      [t('settingsExtra.notifications.seeCard'), () => { agendaActions.openAccount(visited); }, false]];
  }
  return linkActions(notification, kind, id);
}

/** Removes some notifications (or the read ones, or all of them when `ids` is null). */
export async function removeNotifications(ids: readonly string[] | null, onlyRead: boolean): Promise<boolean> {
  const { data, error } = await legacyDb().rpc<{ ok?: boolean }>('borrar_notificaciones', { p_ids: ids, p_leidas: onlyRead });
  if (error || !data?.ok) { notices.toast(t('settingsExtra.notifications.couldNotRemove'), true); return false; }
  return true;
}
