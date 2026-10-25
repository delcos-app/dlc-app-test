/**
 * «Pedir reposición» of the centre portal: its products at its price, by units or by packs (bought + free, with the real cost per
 * unit and the margin over the reference retail price), delivered to the centre or shared among several addresses. The sales rep
 * confirms it. Migrated from the legacy pcPintarPedido (v2.413.0).
 */
import { legacyDb, notices, portalLegacy } from '../../legacy/bridge';
import { t } from '../../i18n';
import { escapeHtml, formatNumber } from '../../services/format';
import { failureText, helpButton, portalState } from './model';

const MAX_UNITS = 1000, MAX_PACKS = 50;

interface Pack { compra?: number; regalo?: number }
export interface CentreProduct { producto_id: string; nombre: string; precio?: number | null; iva?: number | null; propio?: boolean; pvp_recomendado?: number | null; packs?: Pack[] | null }
interface Review { wrong: number; units: number; shared: boolean; sharedUnits: number }

const euros = (value: number): string => portalLegacy.euros(value);
const round2 = (value: number): number => Math.round((Number(value) || 0) * 100) / 100;
const withVat = (product: CentreProduct): number => round2((Number(product.precio) || 0) * (1 + (Number(product.iva) || 0) / 100));
const percent = (value: number): string => `${(Math.round(value * 1000) / 10).toLocaleString(t('dates.locale'), { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;

function packRow(product: CentreProduct, pack: Pack, index: number): string {
  const unitPrice = withVat(product), bought = Number(pack.compra) || 0, free = Number(pack.regalo) || 0, retail = Number(product.pvp_recomendado) || 0;
  const amount = round2(bought * unitPrice), cost = bought + free ? amount / (bought + free) : 0, name = `${formatNumber(bought)}${free ? `+${formatNumber(free)}` : ''}`;
  return `<div class="pclin pcpack"><span class="pcpk"><b>${t('portal.order.pack', { pack: `${formatNumber(bought)}${free ? ` + ${formatNumber(free)}` : ''}` })}</b><span class="sm">${t('portal.order.packUnits', { units: formatNumber(bought + free) })}${free ? t('portal.order.packFree', { free: formatNumber(free) }) : ''}</span></span>
          <span class="pcdato"><b>${euros(amount)}</b><span class="sm">${t('portal.order.withVat')}</span></span>
          <span class="pcdato"><b>${euros(cost)}</b><span class="sm">${t('portal.order.perUnit')}</span></span>
          ${retail ? `<span class="pcdato"><b>${percent((retail - cost) / retail)}</b><span class="sm">${t('portal.order.margin')}</span></span>` : '<span></span>'}
          <input type="number" step="1" value="0" data-pcpk="${product.producto_id}" data-pci="${index}" data-pcc="${bought}" data-pcg="${free}" data-pcimp="${amount}" aria-label="${t('portal.order.howManyPacks', { pack: name })}">
          <span class="pcerr" hidden></span></div>`;
}

function productHtml(product: CentreProduct): string {
  const unitPrice = withVat(product), packs = Array.isArray(product.packs) ? product.packs : [], retail = Number(product.pvp_recomendado) || 0;
  if (!packs.length) return `<div class="pcprod"><div class="pcpcab"><b>${escapeHtml(product.nombre)}</b><span class="sm">${t('portal.order.unitPrice', { price: euros(unitPrice) })}${product.propio ? t('portal.order.yourPrice') : ''}</span></div>
      <div class="pclin"><span class="sm">${t('portal.order.units')}</span><input type="number" step="1" value="0" data-ctp="${product.producto_id}" data-ctpr="${unitPrice}" aria-label="${t('portal.order.unitsOf', { name: escapeHtml(product.nombre) })}"><span class="pcerr" hidden></span></div></div>`;
  return `<div class="pcprod"><div class="pcpcab"><b>${escapeHtml(product.nombre)}</b><span class="sm">${t('portal.order.unitPrice', { price: euros(unitPrice) })}${retail ? t('portal.order.retail', { price: euros(retail) }) : ''}</span></div>
      <div class="pcpacks">${packs.map((pack, index) => packRow(product, pack, index)).join('')}</div></div>`;
}

function formHtml(products: readonly CentreProduct[]): string {
  const addresses = [...new Set(portalState.places.map(place => [place.direccion, place.municipio].filter(Boolean).join(', ')).filter(Boolean))];
  return `<div id="ctprods">${products.map(productHtml).join('')}</div>
      <div class="pcent"><b>${t('portal.order.delivery')}</b>
        <label class="opt"><input type="radio" name="pcent" value="una" checked> ${t('portal.order.deliverCentre')}</label>
        <label class="opt"><input type="radio" name="pcent" value="varias"> ${t('portal.order.deliverShared')}</label>
        <div id="pcentl" class="pcentl" hidden><datalist id="pcdirs">${addresses.map(address => `<option value="${escapeHtml(address)}">`).join('')}</datalist>
          <div id="pcentf"></div><button type="button" class="btn sec chico" id="pcentmas">${t('portal.order.otherAddress')}</button><span class="sm" id="pcentres"></span></div></div>
      ${portalState.prepayment ? `<p class="sm pcant">${t('portal.order.prepayment')}</p>` : ''}<label for="ctnota">${t('portal.order.note')}</label><input id="ctnota" placeholder="${t('portal.order.notePlaceholder')}">
      <div class="pctot"><span id="pctxt">${t('portal.order.total', { total: `<b id="cttot">${euros(0)}</b>` })}</span><button type="button" class="btn" id="ctok">${t('portal.order.send')}</button></div>`;
}

const deliveryRow = (): string => `<div class="pcef"><input list="pcdirs" placeholder="${t('portal.order.addressPlaceholder')}" value="" data-pced><input type="number" step="1" placeholder="${t('portal.order.units')}" value="" data-pceu><button type="button" class="pmhx" data-pcex aria-label="${t('portal.order.removeAddress')}">✕</button></div>`;

/** Marks a wrong quantity in its row; true when it is fine. */
function checkQuantity(input: HTMLInputElement): boolean {
  const count = Number(input.value || 0), error = input.closest('.pclin')?.querySelector<HTMLElement>('.pcerr'), isPack = Boolean(input.dataset.pcpk), max = isPack ? MAX_PACKS : MAX_UNITS;
  const wrong = !Number.isInteger(count) || count < 0 || count > max;
  if (error) {
    error.hidden = !wrong;
    error.textContent = !wrong ? '' : count > max ? t(isPack ? 'portal.order.maxPacks' : 'portal.order.maxUnits', { max: formatNumber(max) }) : t('portal.order.wholeNumber');
  }
  return !wrong;
}

function sharedUnits(box: HTMLElement): number {
  // Without repainting: what was written would be lost
  const rows = document.getElementById('pcentf'); if (rows && !rows.children.length) rows.innerHTML = deliveryRow() + deliveryRow();
  let units = 0; box.querySelectorAll<HTMLInputElement>('[data-pceu]').forEach(input => { units += Math.max(0, Math.floor(Number(input.value) || 0)); });
  return units;
}

function paintTotals(totals: { amount: number; units: number; free: number }, review: Review): void {
  const list = document.getElementById('pcentl'); if (list) list.hidden = !review.shared;
  const result = document.getElementById('pcentres');
  if (result) { result.textContent = review.shared ? t('portal.order.shared', { shared: formatNumber(review.sharedUnits), units: formatNumber(review.units) }) : ''; result.classList.toggle('pcmal', review.shared && review.sharedUnits !== review.units); }
  const units = totals.units ? ` · ${t('portal.order.totalUnits', { units: formatNumber(totals.units) })}${totals.free ? t('portal.order.packFree', { free: formatNumber(totals.free) }) : ''}` : '';
  const text = document.getElementById('pctxt'); if (text) text.innerHTML = t('portal.order.total', { total: `<b id="cttot">${euros(totals.amount)}</b>` }) + units;
}

/** Checks every quantity, adds up the total and the shared units. */
function review(box: HTMLElement): Review {
  const totals = { amount: 0, units: 0, free: 0 }; let wrong = 0;
  box.querySelectorAll<HTMLInputElement>('[data-ctp], [data-pcpk]').forEach(input => {
    if (!checkQuantity(input)) { wrong++; return; }
    const count = Number(input.value || 0), data = input.dataset;
    if (data.pcpk) { totals.amount += count * (Number(data.pcimp) || 0); totals.units += count * ((Number(data.pcc) || 0) + (Number(data.pcg) || 0)); totals.free += count * (Number(data.pcg) || 0); }
    else { totals.amount += count * (Number(data.ctpr) || 0); totals.units += count; }
  });
  const shared = box.querySelector<HTMLInputElement>('[name=pcent]:checked')?.value === 'varias';
  const result: Review = { wrong, units: totals.units, shared, sharedUnits: shared ? sharedUnits(box) : 0 };
  paintTotals(totals, result);
  return result;
}

function orderLines(box: HTMLElement): Record<string, unknown>[] {
  const lines: Record<string, unknown>[] = [], count = (input: HTMLInputElement): number => Math.floor(Number(input.value) || 0);
  box.querySelectorAll<HTMLInputElement>('[data-pcpk]').forEach(input => { if (count(input) > 0) lines.push({ producto_id: input.dataset.pcpk, pack: { compra: Number(input.dataset.pcc), regalo: Number(input.dataset.pcg) }, packs: count(input) }); });
  box.querySelectorAll<HTMLInputElement>('[data-ctp]').forEach(input => { if (count(input) > 0) lines.push({ producto_id: input.dataset.ctp, unidades: count(input) }); });
  return lines;
}

const deliveries = (box: HTMLElement): { direccion: string; unidades: number }[] => [...box.querySelectorAll('.pcef')]
  .map(row => ({ direccion: row.querySelector<HTMLInputElement>('[data-pced]')?.value.trim() ?? '', unidades: Math.floor(Number(row.querySelector<HTMLInputElement>('[data-pceu]')?.value) || 0) }))
  .filter(item => item.direccion && item.unidades > 0);

interface OrderAnswer { ok?: boolean; motivo?: string; producto?: string; total?: number }

function orderFailure(answer: OrderAnswer | null): string {
  const reason = answer?.motivo;
  if (reason === 'vacio') return t('portal.order.chooseSomething');
  if (reason === 'pack') return t('portal.order.packGone', { product: answer?.producto ?? t('portal.order.product') });
  if (reason === 'unidades') return t('portal.order.checkProduct', { product: answer?.producto ?? t('portal.order.aProduct') });
  return reason === 'entregas' ? t('portal.order.deliveriesMustAdd', { total: formatNumber(answer?.total) }) : failureText(answer);
}

async function send(box: HTMLElement, button: HTMLButtonElement, onSent: () => Promise<void>): Promise<void> {
  const checked = review(box);
  if (checked.wrong) { notices.toast(t('portal.order.checkRed'), true); return; }
  const lines = orderLines(box);
  if (!lines.length) { notices.toast(t('portal.order.chooseSomething'), true); return; }
  const shared = checked.shared ? deliveries(box) : null;
  if (shared && (shared.length < 2 || checked.sharedUnits !== checked.units)) { notices.toast(t('portal.order.shareUnits', { units: formatNumber(checked.units) }), true); return; }
  button.disabled = true;
  const note = (document.getElementById('ctnota') as HTMLInputElement | null)?.value.trim() ?? '';
  const { data: answer } = await legacyDb().rpc<OrderAnswer>('pedido_portal', { p_lineas: lines, p_nota: note || null, p_entregas: shared });
  button.disabled = false;
  if (!answer?.ok) { notices.toast(orderFailure(answer), true); return; }
  notices.toast(t('portal.order.sent')); await onSent();
}

/** Paints «Pedir reposición»; `onSent` repaints the portal on «Resumen». */
export function paintOrder(products: readonly CentreProduct[], onSent: () => Promise<void>): void {
  const box = document.getElementById('pcped'); if (!box) return;
  const title = t('portal.order.title');
  box.innerHTML = `<div class="card ancard pmcons pcped"><h2>${title} ${helpButton(title, t('portal.order.help', { packs: formatNumber(MAX_PACKS) }))}</h2>
    ${products.length ? formHtml(products) : `<p class="sm">${t('portal.order.noProducts')}</p>`}</div>`;
  if (!products.length) return;
  const check = (): void => { review(box); };
  box.addEventListener('input', check); box.addEventListener('change', check);
  box.addEventListener('click', event => {
    const target = event.target as Element;
    if (target.closest('#pcentmas')) { document.getElementById('pcentf')?.insertAdjacentHTML('beforeend', deliveryRow()); review(box); }
    const remove = target.closest('[data-pcex]'); if (remove) { remove.closest('.pcef')?.remove(); review(box); }
  });
  const ok = document.getElementById('ctok') as HTMLButtonElement | null; if (ok) ok.onclick = (): void => { void send(box, ok, onSent); };
  review(box);
}
