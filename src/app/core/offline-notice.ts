/**
 * Screens that need the network (plan 11.4, docs/sin_conexion.md, v2.443.0): without it they say so at once, instead of an empty
 * list or a list that never loads. Inicio, Agenda, the account card (Profesionales) and the order list (Pedidos) show the device copy
 * and keep their own «Sin conexión · datos guardados» notice.
 */
import { notices } from '../legacy/bridge';
import { t } from '../i18n';

const WITH_COPY = new Set(['inicio', 'agenda', 'directorio', 'ventas']);

/** Warns that `screen` needs the network when there is none; true when it warned. */
export function warnIfOffline(screen: string): boolean {
  if (navigator.onLine || WITH_COPY.has(screen)) return false;
  notices.toast(t('core.offline.needsNetwork'), true);
  return true;
}
