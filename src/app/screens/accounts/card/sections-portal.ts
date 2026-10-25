/**
 * Portal sections of the account card: the material it requested and the messages with it, and (a centre) the products it can
 * order from its portal with their price. Migrated from the legacy fichaPortal / fichaProductosCentro (v2.404.0).
 */
import { cachedRpc, callRpc, legacyDb, notices, permissions, portalLegacy } from '../../../legacy/bridge';
import { t } from '../../../i18n';
import { escapeHtml, formatNumber } from '../../../services/format';
import { stillShown } from './card-tools';
import { failureText, messageThread } from '../../portal/model';

/** Values stored in the database. */
const PENDING = 'Pendiente', DELIVERED = 'Entregado', CENTRE = 'Centro', ACTIVE = 'Activo', SERVICE = 'servicio';
const SHOWN_REQUESTS = 10, MESSAGES_LIMIT = 200;

interface MaterialRequest { id: string; material: string; cantidad: number; nota?: string | null; estado: string; creado_en: string }

const canShow = (id: string, blockId: string): boolean =>
  !permissions.isProfessionalPortal() && portalLegacy.hasPortal() && stillShown(id) && Boolean(document.getElementById('fbody')) && !document.getElementById(blockId);

const shortDateTime = (value: string): string => new Date(value).toLocaleString(t('dates.locale'), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

function requestRow(request: MaterialRequest): string {
  return `<div class="item u-cursor-default"><span class="tx"><b>${formatNumber(request.cantidad)} × ${escapeHtml(request.material)}</b>
        <span class="sm">${t('accounts.portal.requested', { date: shortDateTime(request.creado_en) })}${request.nota ? ` · ${escapeHtml(request.nota)}` : ''}</span></span>${portalLegacy.materialPill(request.estado)}
        ${request.estado === PENDING ? `<button type="button" class="btn chico" data-fpent="${request.id}">${t('accounts.portal.delivered')}</button>` : ''}</div>`;
}

function portalHtml(requests: readonly MaterialRequest[], messages: PortalMessage[]): string {
  const pending = requests.filter(request => request.estado === PENDING).length, unread = messages.filter(message => message.del_portal && !message.leido_en).length;
  return `<section class="blk" id="fportal"><h3>${t('accounts.portal.title')}${pending ? ` <span class="pill p-warn">${t('accounts.portal.toDeliver', { count: formatNumber(pending) })}</span>` : ''}${unread ? ` <span class="pill p-urg">${t('accounts.portal.unread', { count: formatNumber(unread) })}</span>` : ''}</h3>
    ${requests.length ? `<div class="lista">${requests.map(requestRow).join('')}</div>` : ''}
    <div class="fpmsg"><b class="sm">${t('accounts.portal.messages')}</b><div id="fphilo">${messageThread(messages, false)}</div>
      <div class="fpresp"><input id="fpmsgt" placeholder="${t('accounts.portal.reply')}" aria-label="${t('accounts.portal.reply')}"><button type="button" class="btn sec" id="fpmsgok">${t('accounts.portal.send')}</button></div></div></section>`;
}

/** Paints the portal block again (after a change, or when something arrives live). */
export function refreshPortal(id: string): void {
  document.getElementById('fportal')?.remove();
  void portalActivity(id);
}

function bindPortal(id: string): void {
  document.querySelectorAll<HTMLElement>('#fportal [data-fpent]').forEach(button => {
    button.onclick = async (): Promise<void> => {
      const { data: result } = await legacyDb().rpc<PortalResult>('cerrar_material', { p_id: button.dataset.fpent, p_estado: DELIVERED });
      if (!result?.ok) { notices.toast(failureText(result), true); return; }
      notices.toast(t('accounts.portal.deliveredDone')); refreshPortal(id);
    };
  });
  const send = document.getElementById('fpmsgok') as HTMLButtonElement | null;
  if (send) send.onclick = async (): Promise<void> => {
    const text = (document.getElementById('fpmsgt') as HTMLInputElement | null)?.value.trim() ?? '';
    if (!text) { notices.toast(t('accounts.portal.writeMessage'), true); return; }
    send.disabled = true;
    const { data: result } = await legacyDb().rpc<PortalResult>('enviar_mensaje_cuenta', { p_cuenta: id, p_texto: text });
    send.disabled = false;
    if (!result?.ok) { notices.toast(failureText(result), true); return; }
    notices.toast(t('accounts.portal.sent')); refreshPortal(id);
  };
}

/** Material requested from the portal and the messages (only when it has a portal user or some activity). */
interface PortalData { readonly requests: MaterialRequest[]; readonly messages: PortalMessage[]; readonly hasUser: boolean }

async function loadPortal(id: string): Promise<PortalData> {
  const db = legacyDb();
  const [{ data: requests }, { data: messages }, { data: users }] = await Promise.all([
    db.from<MaterialRequest[]>('solicitudes_material').select('id,material,cantidad,nota,estado,creado_en,cerrado_en').eq('cuenta_id', id).order('creado_en', { ascending: false }).limit(SHOWN_REQUESTS),
    db.from<PortalMessage[]>('mensajes_cuenta').select('id,texto,del_portal,creado_en,leido_en').eq('cuenta_id', id).order('creado_en', { ascending: true }).limit(MESSAGES_LIMIT),
    db.from<{ id: string }[]>('perfiles').select('id').eq('cuenta_id', id).eq('activo', true).limit(1),
  ]);
  return { requests: requests ?? [], messages: messages ?? [], hasUser: Boolean(users?.length) };
}

export async function portalActivity(id: string): Promise<void> {
  if (!canShow(id, 'fportal')) return;
  const { requests: requestList, messages: messageList, hasUser } = await loadPortal(id);
  const body = document.getElementById('fbody');
  if (!stillShown(id) || !body || document.getElementById('fportal')) return;
  if (!requestList.length && !messageList.length && !hasUser) return;   // no portal and no activity: no space taken
  const html = portalHtml(requestList, messageList), visit = body.querySelector('section.fvis');
  if (visit) visit.insertAdjacentHTML('afterend', html); else body.insertAdjacentHTML('beforeend', html);
  bindPortal(id);
  if (messageList.some(message => message.del_portal && !message.leido_en)) void callRpc('leer_mensajes_cuenta', { p_cuenta: id });
}

function productRow(product: CatalogProduct, chosen: ReadonlyMap<string, { precio?: number | null }>): string {
  const own = chosen.get(product.id), name = escapeHtml(product.nombre);
  const tariff = product.precio !== null && product.precio !== undefined ? portalLegacy.euros(product.precio) : '—';
  return `<label class="item u-cursor-default"><input type="checkbox" data-fpcp="${product.id}" ${own ? 'checked' : ''}>
        <span class="tx"><b>${name}</b><span class="sm">${t('accounts.portal.tariff', { price: tariff })}</span></span>
        <input type="number" min="0" step="0.01" data-fpcx="${product.id}" value="${own?.precio !== null && own?.precio !== undefined ? Number(own.precio) : ''}" placeholder="${t('accounts.portal.tariffPlaceholder')}" style="max-width:120px" aria-label="${t('accounts.portal.priceFor', { name })}"></label>`;
}

async function saveProducts(id: string, button: HTMLButtonElement): Promise<void> {
  const block = document.getElementById('fprodc'); if (!block) return;
  const items = [...block.querySelectorAll<HTMLInputElement>('[data-fpcp]')].filter(box => box.checked).map(box => {
    const value = block.querySelector<HTMLInputElement>(`[data-fpcx="${box.dataset.fpcp ?? ''}"]`)?.value ?? '';
    return { producto_id: box.dataset.fpcp, precio: value === '' ? null : Math.max(0, Number(value)) };
  });
  button.disabled = true;
  const { data: result } = await legacyDb().rpc<PortalResult>('guardar_productos_cuenta', { p_cuenta: id, p_items: items });
  button.disabled = false;
  if (!result?.ok) { notices.toast(failureText(result), true); return; }
  notices.toast(t('accounts.portal.productsSaved', { count: formatNumber(result.productos ?? 0) }));
  document.getElementById('fprodc')?.remove(); void centreProducts(id);
}

function productsHtml(catalog: readonly CatalogProduct[], chosenRows: readonly { producto_id: string; precio?: number | null }[]): string {
  const chosen = new Map(chosenRows.map(row => [row.producto_id, row]));
  const list = catalog.filter(product => product.tipo !== SERVICE && (product.estado ?? ACTIVE) === ACTIVE);
  return `<section class="blk" id="fprodc"><h3>${t('accounts.portal.productsTitle')} <span class="n">${formatNumber(chosenRows.length)}</span></h3>
    <p class="sm">${t('accounts.portal.productsNote')}</p>
    <div class="lista">${list.map(product => productRow(product, chosen)).join('') || `<div class="sm">${t('accounts.portal.noProducts')}</div>`}</div>
    <div class="acts" style="margin:8px 0 0;justify-content:flex-end"><button type="button" class="btn sec" id="fpcok">${t('accounts.portal.saveProducts')}</button></div></section>`;
}

/** A centre: the products it can order from its portal, each with its own price (empty: the tariff). */
const isCentre = async (id: string): Promise<boolean> => (await cachedRpc<CardData>('ficha_cuenta', { p_id: id }, `ficha-${id}`)).data?.medico?.tipo === CENTRE;

export async function centreProducts(id: string): Promise<void> {
  if (!canShow(id, 'fprodc') || !await isCentre(id) || !canShow(id, 'fprodc')) return;
  const catalog = await portalLegacy.products();
  const { data: chosenRows } = await legacyDb().from<{ producto_id: string; precio?: number | null }[]>('productos_cuenta').select('producto_id,precio').eq('cuenta_id', id);
  const body = document.getElementById('fbody');
  if (!body || !canShow(id, 'fprodc')) return;
  const html = productsHtml(catalog, chosenRows ?? []);
  const after = document.getElementById('fportal') ?? body.querySelector('section.fvis');
  if (after) after.insertAdjacentHTML('afterend', html); else body.insertAdjacentHTML('beforeend', html);
  const save = document.getElementById('fpcok') as HTMLButtonElement | null; if (save) save.onclick = (): void => { void saveProducts(id, save); };
}
