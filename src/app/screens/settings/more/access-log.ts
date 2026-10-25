/**
 * Who entered and when: the last connection of a person («Conectado hace 5 min», «Última conexión: ayer a las 9:30»), the
 * «Accesos» list of Seguridad and the line in the account card (administration only). Migrated from the legacy conexionTxt,
 * pintarAccesos and facccon (v2.415.0).
 */
import { callRpc, cardSectionsLegacy, legacyDb } from '../../../legacy/bridge';
import { settingsMoreLegacy } from '../../../legacy/settings2-bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';

const MINUTE_MS = 60000, DAY_MS = 864e5, NOW_MINUTES = 5, HOUR_MINUTES = 60, AGENT_LENGTH = 60, LIMIT = 200;

export interface Connection { ultima_conexion?: string | null; ultimo_acceso?: string | null }

/** When it was, in words: «ahora mismo», «hace 12 min», «hoy a las 9:30», «ayer a las…», «el 3 oct». */
function whenText(date: Date, long: boolean): string {
  const locale = t('dates.locale'), minutes = Math.round((Date.now() - date.getTime()) / MINUTE_MS);
  const time = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  const today = new Date(); today.setHours(0, 0, 0, 0); const yesterday = new Date(today.getTime() - DAY_MS);
  if (minutes < NOW_MINUTES) return t('settingsMore.access.now');
  if (minutes < HOUR_MINUTES) return t('settingsMore.access.minutesAgo', { minutes });
  if (date >= today) return t('settingsMore.access.todayAt', { time });
  if (date >= yesterday) return t('settingsMore.access.yesterdayAt', { time });
  const day = date.toLocaleDateString(locale, { day: 'numeric', month: 'short', ...(date.getFullYear() === today.getFullYear() ? {} : { year: 'numeric' }) });
  return t('settingsMore.access.onDay', { day }) + (long ? t('settingsMore.access.atTime', { time }) : '');
}

/** The last connection of a person (`long` for the detail: «Última conexión: …»). */
export function connectionText(connection: Connection | null | undefined, long = false): string {
  const moment = connection?.ultima_conexion ?? connection?.ultimo_acceso, date = moment ? new Date(moment) : null;
  if (!date || isNaN(date.getTime())) return connection ? t('settingsMore.access.never') : (long ? t('settingsMore.access.noData') : '');
  return t(long ? 'settingsMore.access.lastLong' : 'settingsMore.access.connected', { when: whenText(date, long) });
}

interface AccessEntry { usuario: string; evento: string; creado_en: string; agente?: string | null }

function entryHtml(entry: AccessEntry): string {
  const entering = entry.evento === 'Entrada';
  const when = new Date(entry.creado_en).toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  return `<div class="item u-cursor-default">
      <span class="ic ${entering ? 'o' : ''}">${entering ? '→' : '←'}</span>
      <span class="tx"><b>${escapeHtml(entry.usuario)}</b><span class="sm">${escapeHtml(entry.evento)} ·
        ${when}
        ${entry.agente ? ` · ${escapeHtml(String(entry.agente).slice(0, AGENT_LENGTH))}` : ''}</span></span></div>`;
}

/** Seguridad → «Accesos»: the last entries and exits. */
export async function paintAccesses(): Promise<void> {
  settingsMoreLegacy.loading(document.getElementById('admcuerpo'), t('settingsMore.access.loading'));
  const { data } = await legacyDb().rpc<AccessEntry[]>('accesos_lista', { p_usuario: null, lim: LIMIT });
  const list = data ?? [], box = document.getElementById('admcuerpo'); if (!box) return;
  box.innerHTML = `<h2>${t('settingsMore.access.title')}<span class="n">${list.length}</span></h2>
    <p class="sm">${t('settingsMore.access.hint')}</p>
    <div class="lista">${list.map(entryHtml).join('')
      || `<div class="vacio">${t('settingsMore.access.none')}</div>`}</div>`;
}

/** Fills the last connection of a person in its [data-facccon] line (session data, administration only). */
export async function fillConnection(userId: string): Promise<void> {
  if (!cardSectionsLegacy.can('administrar')) return;
  const { data } = await callRpc<(Connection & { id: string })[]>('ultimas_conexiones', { p_ids: [userId] });
  const line = document.querySelector(`[data-facccon="${userId}"]`); if (!line) return;
  const connection = (data ?? []).find(item => item.id === userId);
  line.textContent = connection ? connectionText(connection, true) : '';
}
