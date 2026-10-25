/**
 * The product editor: photo, name, presentation, price without or with VAT (the other one follows), reference, barcode, units per
 * pack, cost, active, custom fields, and — for a saved product — its state, regulated samples, promotion, equipment, packs and
 * material to present, and «Eliminar producto». Everything is read first and painted at once (the legacy painted the form and then
 * added eight layers after timeouts). Migrated from the legacy editorProductoBase–8 and editorProducto (v2.427.0); editorProducto
 * stays as an adapter (Productos, Configuración and the tests open it by that name).
 */
import { currentScreen, legacyDb } from '../../../legacy/bridge';
import { billing2Legacy } from '../../../legacy/billing2-bridge';
import { t } from '../../../i18n';
import { can, canDeleteProduct } from '../../../core/permissions';
import { planIncludesSection } from '../../../core/plans';
import { paintCustomFieldsBlock } from '../../settings/custom-fields/card';
import { insertCustomFields } from '../../settings/custom-fields/form';
import { loadMaterials } from '../../visit/presentation';
import { escapeHtml } from '../../../services/format';
import { equipmentHtml, materialHtml, packsHtml, promotionHtml, samplesForNewHtml, samplesHtml, stateHtml, type ProductExtras } from './blocks';
import { bindEquipment, bindPromotion, bindSamples, bindState } from './blocks-bind';
import { bindMaterials } from './materials';
import { bindPacks } from './packs';
import { addRemoveButton } from './remove';
import { bindForm, type Product } from './form';
import { paintProducts } from '../catalog';
import { round2 } from '../../../services/money';

const EXTRAS = 'muestra_regulada,muestra_desde,muestra_max,promocionado,es_equipo,revision_meses,packs,pvp_recomendado';

interface Loaded { admin: boolean; extras: ProductExtras; materials: readonly PresentationMaterial[]; promotion: boolean; equipment: boolean }

const disabled = (admin: boolean): string => (admin ? '' : 'disabled');

function headerHtml(product: Product, admin: boolean): string {
  const photo = product.foto_url ?? '';
  return `<div class="fh"><div><h2>${product.id ? escapeHtml(product.nombre) : t('productsMore.editor.newTitle')}</h2>
      <div class="sm">${t(admin ? 'productsMore.editor.hintAdmin' : 'productsMore.editor.hintOthers')}</div></div>
      <button class="x" data-cerrar aria-label="${t('productsMore.editor.close')}">✕</button></div>
    <div style="display:flex;gap:14px;align-items:center;margin-top:8px">
      <span class="pfoto" id="prfprev" style="width:72px;height:72px;${photo ? `background-image:url('${escapeHtml(photo)}')` : ''}">${photo ? '' : '◧'}</span>
      ${admin ? `<div class="u-flex-1"><label for="prfoto" class="u-mt-0">${t('productsMore.editor.photo')}</label><input id="prfoto" type="file" accept="image/*"></div>` : ''}</div>`;
}

/** Price without VAT (4 decimals), VAT (10 by default) and price with VAT, kept in step by bindForm. */
function pricesHtml(product: Product, off: string): string {
  const price = product.precio ?? null, vat = product.iva ?? 10;
  const net = price === null ? '' : String(Number(Number(price).toFixed(4))), gross = price === null ? '' : String(round2(Number(price) * (1 + (Number(product.iva) || 0) / 100)));
  return `<div class="pvp">
      <div><label for="prpr">${t('productsMore.editor.priceWithoutVat')}</label><input id="prpr" type="number" step="0.01" min="0" value="${net}" ${off}></div>
      <div><label for="priva">${t('productsMore.editor.vat')}</label><input id="priva" type="number" step="1" min="0" max="21" value="${vat}" ${off}></div>
      <div><label for="prpvp">${t('productsMore.editor.priceWithVat')}</label><input id="prpvp" type="number" step="0.01" min="0" value="${gross}" ${off}></div></div>`;
}

function formHtml(product: Product, admin: boolean): string {
  const off = disabled(admin);
  return `${headerHtml(product, admin)}
    <div class="g2">
      <div><label for="prn">${t('productsMore.editor.name')}</label><input id="prn" value="${escapeHtml(product.nombre ?? '')}" ${off}></div>
      <div><label for="prp">${t('productsMore.editor.presentation')}</label><input id="prp" value="${escapeHtml(product.presentacion ?? '')}" placeholder="${t('productsMore.editor.presentationPlaceholder')}" ${off}></div></div>
    ${pricesHtml(product, off)}
    <div class="g2">
      <div><label for="prref">${t('productsMore.editor.reference')}</label><input id="prref" value="${escapeHtml(product.referencia ?? '')}" ${off}></div>
      <div><label for="prcb">${t('productsMore.editor.barcode')}</label><input id="prcb" value="${escapeHtml(product.codigo_barras ?? '')}" ${off}></div></div>
    <div class="g2">
      <div><label for="prue">${t('productsMore.editor.unitsPerPack')}</label><input id="prue" type="number" min="1" value="${Number(product.unidades_envase) || 1}" ${off}></div>
      <div><label for="prco">${t('productsMore.editor.cost')}</label><input id="prco" type="number" step="0.01" min="0" value="${product.coste ?? ''}" ${off}></div></div>
    ${admin && product.id ? `<label class="opt u-mt-12"><input type="checkbox" id="pract" ${product.activo ? 'checked' : ''}> ${t('productsMore.editor.active')}</label>` : ''}`;
}

const actionsHtml = (product: Product, admin: boolean): string => `<div class="acts u-end">
      <button class="btn sec" data-cerrar>${t(admin ? 'productsMore.editor.cancel' : 'productsMore.editor.close')}</button>
      ${admin ? `<button class="btn" id="prok">${t(product.id ? 'productsMore.editor.save' : 'productsMore.editor.create')}</button>` : ''}</div>`;

/** The blocks of a saved product, in their order (state for everyone; the rest for administration, each as its plan allows). */
function blocksHtml(product: Product, loaded: Loaded): string {
  if (!product.id) return loaded.admin ? samplesForNewHtml() : '';
  const state = billing2Legacy.productStates()[product.id] ?? product.estado ?? 'Activo';
  if (!loaded.admin) return stateHtml(state);
  return [stateHtml(state), samplesHtml(loaded.extras), loaded.promotion ? promotionHtml(loaded.extras) : '', loaded.equipment ? equipmentHtml(loaded.extras) : '',
    packsHtml(loaded.extras), materialHtml()].join('');
}

async function load(product: Product): Promise<Loaded> {
  const admin = can('administrar'), promotion = planIncludesSection('cobertura'), equipment = planIncludesSection('parque');
  if (!admin || !product.id) return { admin, extras: {}, materials: [], promotion, equipment };
  const [{ data }, all] = await Promise.all([legacyDb().from<ProductExtras>('productos').select(EXTRAS).eq('id', product.id).maybeSingle(), loadMaterials(true)]);
  return { admin, extras: data ?? {}, materials: all.filter(item => item.producto_id === product.id), promotion, equipment };
}

function bindBlocks(body: HTMLElement, product: Product & { id: string }, loaded: Loaded): void {
  bindState(body, product);
  if (!loaded.admin) return;
  bindSamples(product.id);
  if (loaded.promotion) bindPromotion(product.id);
  if (loaded.equipment) bindEquipment(product.id);
  bindPacks(product.id, loaded.extras);
  bindMaterials(product, loaded.materials);
  if (canDeleteProduct()) addRemoveButton(product);
}

/** Opens the editor of a product, or of a new one. */
export async function editProduct(given: Product | null): Promise<void> {
  const product: Product = given ?? { iva: 10, activo: true, unidades_envase: 1 };
  const loaded = await load(product), body = document.getElementById('dbody'), box = document.getElementById('dlg') as HTMLDialogElement | null;
  if (!body || !box) return;
  body.innerHTML = formHtml(product, loaded.admin) + blocksHtml(product, loaded) + actionsHtml(product, loaded.admin);
  if (loaded.admin) await insertCustomFields(body, 'producto', product.id ?? null, body.querySelector('.blk') ?? body.querySelector('.acts:last-of-type'));
  if (product.id) await paintCustomFieldsBlock('productos', product.id, body).catch(() => undefined);
  if (!box.open) box.showModal();
  if (loaded.admin) bindForm(body, product, () => { if (currentScreen() === 'productos') void paintProducts(); });
  if (product.id) bindBlocks(body, { ...product, id: product.id }, loaded);
}
