/**
 * Configuración → Ventas → Canales de venta (plan 12.2, VEN-1, D4 A, v2.470.0), for administration. The company's channels as the
 * classifier rows of D-044: one compact row per channel with its name and, under it, what it does in plain words («Compra: un
 * cliente · Atribuye a la cuenta de referencia · Cuenta en el portal»), «Por defecto» and «Desactivado» when they apply, and «›».
 * The whole row opens its editor (channel-editor.ts) in the window of Configuración, embedded in the page under the list (pantallas.md,
 * Configuración: windows go embedded, with their own «Cancelar» / «Guardar» always in view); «+ Nuevo canal» is in the bar at the
 * bottom. The «i» of the introduction says what a channel is. The list comes with the settings (ajustes_lista, SQL 195) and is read
 * again before painting.
 */
import { callRpc, cycleLegacy } from '../../../legacy/bridge';
import { t, type MessageKey } from '../../../i18n';
import { escapeHtml, formatNumber } from '../../../services/format';
import { SETTING_CHANNELS, salesChannels, type SalesChannel } from '../../../core/sales-channels';
import { infoButton } from './card';
import { bindChannelEditor, channelEditorHtml } from './channel-editor';

const PANEL = 'cvpanel', SEPARATOR = ' · ';


/** «portal de la cuenta, servicios con material y consigna». */
export function originsText(origins: readonly string[]): string {
  const names = origins.map(origin => t(`salesChannels.origins.${origin}` as MessageKey));
  return names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')}${t('salesChannels.origins.and')}${names[names.length - 1] ?? ''}`;
}

const ATTRIBUTION: Readonly<Record<string, MessageKey>> = {
  referencia: 'salesChannels.summary.toReference', compradora: 'salesChannels.summary.toBuyer', ninguna: 'salesChannels.summary.toNobody',
};

/** The line under the name: what the channel does, in plain words. */
export function summaryText(channel: SalesChannel): string {
  const parts = [t(channel.compra === 'cuenta' ? 'salesChannels.summary.buysAccount' : 'salesChannels.summary.buysCustomer'),
    t(ATTRIBUTION[channel.atribucion] ?? 'salesChannels.summary.toNobody')];
  if (channel.en_portal) parts.push(t('salesChannels.summary.inPortal'));
  if (channel.descuento) parts.push(t('salesChannels.summary.discount', { discount: formatNumber(channel.descuento) }));
  if (channel.origenes.length) parts.push(t('salesChannels.summary.receives', { origins: originsText(channel.origenes) }));
  return parts.join(SEPARATOR);
}

/** One single way in: the whole row opens the editor (a button for the keyboard), with a chevron as its only sign. */
function rowHtml(channel: SalesChannel): string {
  const name = escapeHtml(channel.nombre);
  const pills = `${channel.por_defecto ? `<span class="pill p-est">${t('salesChannels.list.isDefault')}</span>` : ''}${channel.activo ? '' : `<span class="pill p-anu">${t('salesChannels.list.inactive')}</span>`}`;
  return `<div class="item vrow ${channel.activo ? '' : 'off'}" data-cvcanal="${escapeHtml(channel.clave)}" role="button" tabindex="0" aria-label="${t('salesChannels.list.openOf', { name })}">
        <span class="tx"><b>${name}</b><span class="sm">${escapeHtml(summaryText(channel))}</span></span>${pills}<span class="vchev" aria-hidden="true">${t('salesChannels.list.open')}</span>
      </div>`;
}

function listHtml(): string {
  const channels = salesChannels(), title = t('salesChannels.list.title');
  // The title repeats the page's and is hidden (D-042), so the «i» goes with the introduction, as in the rule cards
  return `<h2>${title}</h2>
    <p class="sm">${t('salesChannels.list.intro')} ${infoButton(t('salesChannels.list.infoTitle'), t('salesChannels.list.info'))}</p>
    <div class="lista vlist">${channels.map(rowHtml).join('') || `<div class="vacio">${t('salesChannels.list.none')}</div>`}</div>
    <div class="acts u-end"><button type="button" class="btn" id="cvnuevo">${t('salesChannels.list.newChannel')}</button></div>`;
}

/** Reads the channels again (they come with the settings) and keeps them for every screen. */
export async function reloadChannels(): Promise<void> {
  const { data } = await callRpc<Record<string, unknown>>('ajustes_lista');
  const list = data?.[SETTING_CHANNELS];
  if (Array.isArray(list)) cycleLegacy.setSetting(SETTING_CHANNELS, list);
}

/** Opens the editor of a channel (null: a new one) in the window; saving closes it and paints the list again on its row. */
function openEditor(channel: SalesChannel | null): void {
  const body = document.getElementById('dbody'), box = document.getElementById('dlg') as HTMLDialogElement | null;
  if (!body || !box) return;
  body.innerHTML = channelEditorHtml(channel);
  bindChannelEditor(channel, async key => { delete box.dataset.sucio; box.close(); await reloadChannels(); showChannels(key); });
  if (!box.open) box.showModal();
}

function bindList(panel: HTMLElement): void {
  const open = (key: string | undefined): void => { const channel = salesChannels().find(item => item.clave === key); if (channel) openEditor(channel); };
  panel.querySelectorAll<HTMLElement>('[data-cvcanal]').forEach(row => {
    row.onclick = (): void => { open(row.dataset.cvcanal); };
    row.onkeydown = (event): void => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(row.dataset.cvcanal); } };
  });
  const add = document.getElementById('cvnuevo'); if (add) add.onclick = (): void => { openEditor(null); };
}

/** Paints the list in the card, with the row of `focus` in view and focused. */
export function showChannels(focus?: string): void {
  const panel = document.getElementById(PANEL); if (!panel) return;
  panel.innerHTML = listHtml(); bindList(panel);
  const row = focus ? panel.querySelector<HTMLElement>(`[data-cvcanal="${focus}"]`) : null;
  if (row) { row.scrollIntoView({ block: 'nearest' }); row.focus({ preventScroll: true }); }
}

/** Paints Ventas → Canales de venta (the list read again, painted at once). */
export async function paintChannelsSettings(): Promise<void> {
  if (!document.getElementById('cfgcuerpo')) return;
  await reloadChannels();
  const box = document.getElementById('cfgcuerpo'); if (!box) return;
  box.innerHTML = `<div class="card cfgpanel" id="${PANEL}"></div>`;
  showChannels();
}
