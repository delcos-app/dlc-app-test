/**
 * The notifications window of the bell: last 7 days, new and earlier, filtered by area, with each notification's actions,
 * «Posponer a mañana» and deleting. Migrated from the legacy panelNotificaciones and notifPintar (v2.417.0); panelNotificaciones
 * stays as an adapter (the bell of nucleo/notificaciones.js and the tests open it by that name).
 */
import { legacyDb, notices } from '../../../legacy/bridge';
import { settingsExtraLegacy } from '../../../legacy/settings3-bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { actionsOf, dayGroup, removeNotifications, type AppNotification } from './model';

const LEAVE_MS = 220;

/** The list shown and the chosen area (they live while the page is open). */
const state: { list: AppNotification[]; filter: string } = { list: [], filter: '' };

const whenOf = (item: AppNotification): string => item.visible_desde ?? item.creado_en;

function whenText(item: AppNotification): string {
  const date = new Date(whenOf(item)), group = dayGroup(whenOf(item)), locale = t('dates.locale');
  if (group === 'today') return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  return group === 'yesterday' ? t('settingsExtra.notifications.yesterday') : date.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });
}

function rowHtml(item: AppNotification): string {
  const actions = actionsOf(item).map(([text, , main], index) => `<button type="button" class="btn chico ${main ? '' : 'sec'}" data-nacc="${index}">${escapeHtml(text)}</button>`).join('');
  return `<div class="notit2 ${item.leida_en ? '' : 'nuevo'}" data-nidx="${state.list.indexOf(item)}">
      <span class="ic" aria-hidden="true">${settingsExtraLegacy.iconOf(item.tipo)}</span>
      <div class="tx"><b>${escapeHtml(item.titulo)}</b>${item.cuerpo ? `<span class="sm">${escapeHtml(item.cuerpo)}</span>` : ''}
        <span class="sm notcuando">${whenText(item)}${item.resumen ? t('settingsExtra.notifications.fromDigest') : ''}</span>
        <div class="notacts">${actions}
          ${item.leida_en ? '' : `<button type="button" class="btn sec chico" data-npos>${t('settingsExtra.notifications.postpone')}</button>`}
          <button type="button" class="notbor" data-nbor aria-label="${t('settingsExtra.notifications.removeOne')}" title="${t('settingsExtra.notifications.remove')}">${settingsExtraLegacy.icon('trash-2')}</button></div></div></div>`;
}

function filterHtml(areas: readonly (readonly [string, string, readonly string[]])[]): string {
  if (areas.length <= 1) return '';
  return `<div class="segs notfil" role="group" aria-label="${t('settingsExtra.notifications.filter')}">${[['', t('settingsExtra.notifications.all')], ...areas.map(area => [area[0], area[1]])].map(([key = '', text = '']) =>
    `<button type="button" data-nfil="${key}" class="${state.filter === key ? 'on' : ''}" aria-pressed="${String(state.filter === key)}">${escapeHtml(text)}</button>`).join('')}</div>`;
}

function listHtml(shown: readonly AppNotification[]): string {
  const fresh = shown.filter(item => !item.leida_en), earlier = shown.filter(item => item.leida_en);
  return `<div class="notlista2">
      ${fresh.length ? `<h3 class="notdia">${t('settingsExtra.notifications.fresh', { count: fresh.length })}</h3>${fresh.map(rowHtml).join('')}` : ''}
      ${earlier.length ? `<h3 class="notdia">${t('settingsExtra.notifications.earlier')}</h3>${earlier.map(rowHtml).join('')}` : ''}
      ${shown.length ? '' : `<div class="vacio">${t(state.filter ? 'settingsExtra.notifications.noneInArea' : 'settingsExtra.notifications.none')}</div>`}</div>`;
}

function panelHtml(): string {
  const unread = settingsExtraLegacy.unread(), list = state.list;
  const areas = settingsExtraLegacy.notificationAreas().filter(area => list.some(item => settingsExtraLegacy.areaOf(item.tipo) === area[0]));
  if (state.filter && !areas.some(area => area[0] === state.filter)) state.filter = '';
  const shown = list.filter(item => !state.filter || settingsExtraLegacy.areaOf(item.tipo) === state.filter);
  return `<div class="fh"><div><h2>${t('settingsExtra.notifications.title')}</h2><div class="sm">${unread ? t('settingsExtra.notifications.unread', { count: unread }) : t('settingsExtra.notifications.upToDate')}${t('settingsExtra.notifications.lastWeek')}</div></div>
      <span class="acts u-m-0"><button type="button" class="icobtn notcfgb" id="notcfg" title="${t('settingsExtra.notifications.choose')}" aria-label="${t('settingsExtra.notifications.choose')}">${settingsExtraLegacy.icon('settings')}</button>
      <button class="x" data-cerrar aria-label="${t('settingsExtra.notifications.close')}">✕</button></span></div>
    ${filterHtml(areas)}
    ${listHtml(shown)}
    <p class="sm notpie">${t('settingsExtra.notifications.keptFor')}</p>
    <div class="acts u-end u-wrap">
      ${unread ? `<button class="btn sec" id="notleer">${t('settingsExtra.notifications.markAllRead')}</button>` : ''}
      ${list.some(item => item.leida_en) ? `<button class="btn sec" id="notlimpiar">${t('settingsExtra.notifications.removeRead')}</button>` : ''}
      ${list.length ? `<button class="btn sec dang" id="notvaciar">${t('settingsExtra.notifications.removeAll')}</button>` : ''}</div>`;
}

const dialog = (): HTMLDialogElement | null => document.getElementById('dlg') as HTMLDialogElement | null;
const closeAndRefresh = (): void => { dialog()?.close(); settingsExtraLegacy.refreshBell(); };
const markRead = (id: string): PromiseLike<unknown> => legacyDb().rpc('leer_notificacion', { p_id: id });

function drop(items: readonly AppNotification[]): void {
  state.list = state.list.filter(item => !items.includes(item));
  settingsExtraLegacy.setUnread(Math.max(0, settingsExtraLegacy.unread() - items.filter(item => !item.leida_en).length));
  paint(); settingsExtraLegacy.refreshBell();
}

async function postpone(item: AppNotification): Promise<void> {
  const { data } = await legacyDb().rpc<{ ok?: boolean }>('posponer_notificacion', { p_id: item.id });
  if (!data?.ok) { notices.toast(t('settingsExtra.notifications.couldNotPostpone'), true); return; }
  notices.toast(t('settingsExtra.notifications.postponed')); drop([item]);
}

async function openItem(item: AppNotification): Promise<void> {
  await markRead(item.id);
  const actions = actionsOf(item), main = actions.find(action => action[2]) ?? actions[0];
  if (main) { closeAndRefresh(); main[1](); return; }
  if (item.leida_en) return;
  item.leida_en = new Date().toISOString(); settingsExtraLegacy.setUnread(Math.max(0, settingsExtraLegacy.unread() - 1)); paint(); settingsExtraLegacy.refreshBell();
}

function bindRow(row: HTMLElement): void {
  const item = state.list[Number(row.dataset.nidx)]; if (!item) return;
  const actions = actionsOf(item), stop = (event: Event): void => { event.stopPropagation(); };
  row.querySelectorAll<HTMLElement>('[data-nacc]').forEach(button => {
    button.onclick = async (event): Promise<void> => { stop(event); await markRead(item.id); closeAndRefresh(); actions[Number(button.dataset.nacc)]?.[1](); };
  });
  const later = row.querySelector<HTMLElement>('[data-npos]'); if (later) later.onclick = (event): void => { stop(event); void postpone(item); };
  const bin = row.querySelector<HTMLElement>('[data-nbor]');
  if (bin) bin.onclick = async (event): Promise<void> => { stop(event); if (!await removeNotifications([item.id], false)) return; row.classList.add('notsale'); setTimeout(() => { drop([item]); }, LEAVE_MS); };
  row.onclick = (): void => { void openItem(item); };
}

async function markAllRead(): Promise<void> {
  await legacyDb().rpc('leer_notificaciones', {});
  const now = new Date().toISOString();
  state.list.forEach(item => { if (!item.leida_en) item.leida_en = now; });
  settingsExtraLegacy.setUnread(0); paint(); settingsExtraLegacy.refreshBell();
}

async function removeAll(): Promise<void> {
  const choice = await notices.choose(t('settingsExtra.notifications.removeAllTitle'), t('settingsExtra.notifications.removeAllText'),
    [{ k: 'no', t: t('settingsExtra.templates.cancel'), cls: 'sec' }, { k: 'si', t: t('settingsExtra.notifications.removeAll') }]);
  if (choice === 'si' && await removeNotifications(null, false)) { notices.toast(t('settingsExtra.notifications.removed')); closeAndRefresh(); }
}

function bind(body: HTMLElement): void {
  body.querySelectorAll<HTMLElement>('[data-nfil]').forEach(button => { button.onclick = (): void => { state.filter = button.dataset.nfil ?? ''; paint(); }; });
  body.querySelectorAll<HTMLElement>('.notit2').forEach(bindRow);
  const on = (id: string, action: () => void): void => { const button = document.getElementById(id); if (button) button.onclick = action; };
  on('notleer', () => { void markAllRead(); });
  on('notlimpiar', () => { void (async (): Promise<void> => { if (await removeNotifications(null, true)) { notices.toast(t('settingsExtra.notifications.readRemoved')); drop(state.list.filter(item => item.leida_en)); } })(); });
  on('notvaciar', () => { void removeAll(); });
  on('notcfg', () => { dialog()?.close(); settingsExtraLegacy.openNotificationSettings(); });
}

function paint(): void {
  const body = document.getElementById('dbody'); if (!body) return;
  body.innerHTML = panelHtml();
  bind(body);
}

/** Opens the window with the notifications of the bell. */
export function showNotifications(list: readonly AppNotification[] | null): void {
  state.list = [...(list ?? [])];
  paint();
  const box = dialog(); if (box && !box.open) box.showModal();
}
