/**
 * The offline queue indicator (legado 003, v2.424.0): «Sin conexión», how many changes are waiting and «Enviando…». The queue is
 * sent again when the network comes back and every minute. pintarConexionBase stays as an adapter (legado 104 wraps it).
 */
import { connectionLegacy } from '../../legacy/legado-a-bridge';
import { t } from '../../i18n';

const RETRY_MS = 60000;

const changes = (count: number): string => (count === 1 ? t('legacyA.connection.oneChange') : t('legacyA.connection.changes', { count }));

/** Paints the connection indicator. */
export function paintConnection(): void {
  const count = connectionLegacy.queued(), element = document.getElementById('conex');
  if (!element) return;
  if (!navigator.onLine) { element.className = 'conex off'; element.textContent = count ? t('legacyA.connection.offlineWaiting', { changes: changes(count) }) : t('legacyA.connection.offline'); }
  else if (count) { element.className = 'conex esp'; element.textContent = t('legacyA.connection.sending', { changes: changes(count) }); }
  else { element.className = 'conex hide'; element.textContent = ''; }
}

/** Sends the queue when the network comes back and every minute (legado 003). */
export function watchConnection(): void {
  window.addEventListener('online', () => { connectionLegacy.paint(); connectionLegacy.sendQueue(); });
  window.addEventListener('offline', () => { connectionLegacy.paint(); });
  setInterval(() => { connectionLegacy.sendQueue(); }, RETRY_MS);
}
