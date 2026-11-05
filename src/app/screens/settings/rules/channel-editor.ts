/**
 * Configuración → Ventas → Canales de venta → a channel or «+ Nuevo canal» (plan 12.2, VEN-1, v2.470.0): everything a channel has in
 * one form, in the window of Configuración (embedded in the page, D-044 fields): name, who buys, attribution, whether it joins the customer to its
 * reference account, whether it counts in the portal, its discount, the orders that arrive by themselves, default and active, each
 * field with its label and a line of help; «Cancelar» closes it and the list stays as it was. guardar_canal_venta (SQL 195) saves it and checks the
 * rules (one default, always active; one origin, one channel; at least one active channel).
 */
import { callRpc, notices } from '../../../legacy/bridge';
import { t, type MessageKey } from '../../../i18n';
import { escapeHtml, formatNumber } from '../../../services/format';
import { ORIGINS, type SalesChannel } from '../../../core/sales-channels';

const ERRORS = ['nombre', 'nombre_largo', 'nombre_repetido', 'descuento', 'por_defecto', 'ultimo', 'permiso'];
const MAX_NAME = 60;

const help = (text: string): string => `<span class="sm vhelp">${escapeHtml(text)}</span>`;
const field = (id: string): HTMLInputElement | null => document.getElementById(id) as HTMLInputElement | null;
const valueOf = (id: string): string => (document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null)?.value ?? '';

/** A channel to start a new one from: a customer buys, attributed to the reference account, as the database proposes. */
const NEW_CHANNEL: SalesChannel = {
  clave: '', nombre: '', compra: 'cliente', atribucion: 'referencia', une_cliente: true, en_portal: true, descuento: null, origenes: [],
  por_defecto: false, orden: 0, activo: true,
};

function selectHtml(id: string, chosen: string, options: readonly [string, MessageKey][]): string {
  return `<select id="${id}">${options.map(([value, text]) => `<option value="${value}" ${value === chosen ? 'selected' : ''}>${t(text)}</option>`).join('')}</select>`;
}

/** A yes/no field: a switch with its name, saved with «Guardar» (fixed: shown but not changed here). */
function switchHtml(id: string, label: string, text: string, state: { checked: boolean; fixed?: boolean }): string {
  return `<div class="vfield"><label class="vfswitch u-mt-12"><input type="checkbox" role="switch" id="${id}" ${state.checked ? 'checked' : ''} ${state.fixed ? 'disabled' : ''}><span class="sw"></span><b>${escapeHtml(label)}</b></label>${help(text)}</div>`;
}

function nameHtml(channel: SalesChannel): string {
  const key = channel.clave ? help(t('salesChannels.editor.key', { key: channel.clave })) : '';
  return `<div class="vfield"><label for="cvname">${t('salesChannels.editor.name')}</label><input id="cvname" value="${escapeHtml(channel.nombre)}" maxlength="${MAX_NAME}" autocomplete="off" placeholder="${t('salesChannels.editor.namePlaceholder')}">${help(t('salesChannels.editor.nameHelp'))}${key}</div>`;
}

function rulesHtml(channel: SalesChannel): string {
  return `<div class="vfield"><label for="cvbuyer">${t('salesChannels.editor.buyer')}</label>${selectHtml('cvbuyer', channel.compra,
      [['cliente', 'salesChannels.editor.buyerCustomer'], ['cuenta', 'salesChannels.editor.buyerAccount']])}${help(t('salesChannels.editor.buyerHelp'))}</div>
    <div class="vfield"><label for="cvattr">${t('salesChannels.editor.attribution')}</label>${selectHtml('cvattr', channel.atribucion,
      [['referencia', 'salesChannels.editor.toReference'], ['compradora', 'salesChannels.editor.toBuyer'], ['ninguna', 'salesChannels.editor.toNobody']])}${help(t('salesChannels.editor.attributionHelp'))}</div>
    ${switchHtml('cvjoins', t('salesChannels.editor.joins'), t('salesChannels.editor.joinsHelp'), { checked: channel.une_cliente })}
    ${switchHtml('cvportal', t('salesChannels.editor.portal'), t('salesChannels.editor.portalHelp'), { checked: channel.en_portal })}
    <div class="vfield"><label for="cvdisc">${t('salesChannels.editor.discount')}</label><input id="cvdisc" type="number" min="0" max="100" step="0.01" inputmode="decimal" value="${channel.descuento ? formatNumber(channel.descuento).replace(',', '.') : ''}">${help(t('salesChannels.editor.discountHelp'))}</div>`;
}

function originsHtml(channel: SalesChannel): string {
  const boxes = ORIGINS.map(origin => `<label class="opt"><input type="checkbox" data-cvori="${origin}" ${channel.origenes.includes(origin) ? 'checked' : ''}> ${escapeHtml(t(`salesChannels.origins.${origin}` as MessageKey))}</label>`).join('');
  return `<div class="vfield"><label>${t('salesChannels.editor.origins')}</label><div class="u-flex u-gap-8 u-wrap">${boxes}</div>${help(t('salesChannels.editor.originsHelp'))}</div>`;
}

function stateHtml(channel: SalesChannel, isNew: boolean): string {
  const fixedDefault = channel.por_defecto;
  return `${switchHtml('cvdefault', t('salesChannels.editor.isDefault'), t(fixedDefault ? 'salesChannels.editor.defaultFixed' : 'salesChannels.editor.defaultHelp'), { checked: channel.por_defecto, fixed: fixedDefault })}
    ${isNew ? '' : switchHtml('cvactive', t('salesChannels.editor.active'), t(fixedDefault ? 'salesChannels.editor.activeFixed' : 'salesChannels.editor.activeHelp'), { checked: channel.activo, fixed: fixedDefault })}`;
}

/** The form of a channel (null: a new one). */
export function channelEditorHtml(existing: SalesChannel | null): string {
  const channel = existing ?? NEW_CHANNEL, isNew = !existing;
  return `<div class="fh"><div><h2>${t(isNew ? 'salesChannels.editor.newTitle' : 'salesChannels.editor.editTitle')}</h2><div class="sm">${escapeHtml(isNew ? t('salesChannels.editor.in') : channel.nombre)}</div></div>
      <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
    <div class="vform">${nameHtml(channel)}${rulesHtml(channel)}${originsHtml(channel)}${stateHtml(channel, isNew)}</div>
    <div class="acts u-end"><button type="button" class="btn sec" data-cerrar>${t('common.cancel')}</button><button type="button" class="btn" id="cvok">${t(isNew ? 'salesChannels.editor.add' : 'common.save')}</button></div>`;
}

/** What guardar_canal_venta takes, from the form. */
function readChannel(channel: SalesChannel | null): Record<string, unknown> {
  const checked = (id: string): boolean => Boolean(field(id)?.checked);
  return {
    clave: channel?.clave ?? '', nombre: valueOf('cvname').trim(), compra: valueOf('cvbuyer'), atribucion: valueOf('cvattr'),
    une_cliente: checked('cvjoins'), en_portal: checked('cvportal'), descuento: valueOf('cvdisc').trim(),
    origenes: [...document.querySelectorAll<HTMLInputElement>('[data-cvori]')].filter(box => box.checked).map(box => box.dataset.cvori ?? ''),
    por_defecto: checked('cvdefault'), activo: field('cvactive') ? checked('cvactive') : true,
  };
}

const errorText = (error: string | undefined): string =>
  (error && ERRORS.includes(error) ? t(`salesChannels.errors.${error}` as MessageKey) : t('salesChannels.errors.other'));

/** Saves the channel; its key when it is saved, null (with the reason) when not. */
async function saveChannel(channel: SalesChannel | null): Promise<string | null> {
  const fields = readChannel(channel);
  if (!fields.nombre) { notices.toast(t('salesChannels.errors.nombre'), true); return null; }
  const { data, error } = await callRpc<{ ok?: boolean; clave?: string; error?: string }>('guardar_canal_venta', { p: fields });
  if (error || !data?.ok) { notices.toast(errorText(data?.error), true); return null; }
  notices.toast(t(channel ? 'salesChannels.editor.saved' : 'salesChannels.editor.added'));
  return data.clave ?? channel?.clave ?? '';
}

/** Binds the form just painted: «Guardar» / «Añadir» saves and then `saved` (with the channel's key); «Cancelar» and ✕ close the window. */
export function bindChannelEditor(channel: SalesChannel | null, saved: (key: string) => Promise<void>): void {
  const ok = document.getElementById('cvok') as HTMLButtonElement | null; if (!ok) return;
  const save = async (): Promise<void> => {
    ok.disabled = true;
    const key = await saveChannel(channel);
    ok.disabled = false;
    if (key !== null) await saved(key);
  };
  ok.onclick = (): void => { void save(); };
  const name = field('cvname');
  if (name) { name.focus({ preventScroll: true }); name.onkeydown = (event): void => { if (event.key === 'Enter') { event.preventDefault(); void save(); } }; }
}
