/**
 * The lots of a tender in its window: number, description, state, amounts, who won it when it is lost, and the products with
 * their prices. Every change is saved on the spot. Migrated from the legacy verConcurso (v2.409.0).
 */
import { legacyDb, notices } from '../../legacy/bridge';
import { t } from '../../i18n';
import { escapeHtml } from '../../services/format';
import { isPresent, orFallback } from '../../services/values';
import { LOT_STATE_LIST, LOT_STATES, type TenderLot, type TenderPrice } from './model';

export interface LotContext { tenderId: string; products: readonly CatalogProduct[]; reopen: () => void; fail: (error: { message?: string }) => void }

const DISCONTINUED = 'Descatalogado';
const amount = (value: number | null | undefined): string => (isPresent(value) ? String(Number(value)) : '');

function priceHtml(price: TenderPrice, products: readonly CatalogProduct[]): string {
  const name = orFallback(products.find(product => product.id === price.producto_id)?.nombre, t('tenders.lot.product'));
  return `<div class="conpf" data-cp="${price.id}"><span>${escapeHtml(name)}</span>
          <label><span class="sm">${t('tenders.lot.price')}</span><input type="number" min="0" step="0.01" data-cpf="precio" value="${Number(price.precio)}"></label>
          <label><span class="sm">${t('tenders.lot.units')}</span><input type="number" min="0" step="1" data-cpf="unidades" value="${isPresent(price.unidades) ? price.unidades : ''}"></label>
          <button type="button" class="x" data-cpq aria-label="${t('tenders.lot.removeProduct')}">✕</button></div>`;
}

function addProductHtml(lot: TenderLot, products: readonly CatalogProduct[]): string {
  const prices = lot.concurso_precios ?? [];
  const options = products.filter(product => orFallback(product.estado, 'Activo') !== DISCONTINUED && !prices.some(price => price.producto_id === product.id))
    .map(product => `<option value="${product.id}">${escapeHtml(product.nombre)}</option>`).join('');
  return `<div class="conpadd"><select data-cpnuevo aria-label="${t('tenders.lot.addProduct')}"><option value="">${t('tenders.lot.addProductOption')}</option>${options}</select></div>`;
}

export function lotHtml(lot: TenderLot, products: readonly CatalogProduct[]): string {
  const states = LOT_STATE_LIST.map(state => `<option ${state === lot.estado ? 'selected' : ''}>${state}</option>`).join('');
  return `<div class="conlote" data-lote="${lot.id}">
      <div class="conlcab"><input data-lf="numero" value="${escapeHtml(lot.numero ?? '')}" placeholder="${t('tenders.lot.number')}" aria-label="${t('tenders.lot.numberLabel')}" class="conln">
        <input data-lf="descripcion" value="${escapeHtml(lot.descripcion ?? '')}" placeholder="${t('tenders.lot.description')}" aria-label="${t('tenders.lot.description')}">
        <select data-lf="estado" aria-label="${t('tenders.lot.stateLabel')}">${states}</select>
        <button type="button" class="x" data-lq aria-label="${t('tenders.lot.remove')}">✕</button></div>
      <div class="conlimp"><label><span>${t('tenders.lot.tenderAmount')}</span><input type="number" min="0" step="0.01" data-lf="importe_licitacion" value="${amount(lot.importe_licitacion)}"></label>
        <label><span>${t('tenders.lot.awardedAmount')}</span><input type="number" min="0" step="0.01" data-lf="importe_adjudicado" value="${amount(lot.importe_adjudicado)}"></label>
        <label class="${lot.estado === LOT_STATES.lost ? '' : 'hide'}" data-ladj><span>${t('tenders.lot.winner')}</span><input data-lf="adjudicatario" value="${escapeHtml(lot.adjudicatario ?? '')}" placeholder="${t('tenders.lot.winnerPlaceholder')}"></label></div>
      <div class="conprecios">${(lot.concurso_precios ?? []).map(price => priceHtml(price, products)).join('')}
        ${addProductHtml(lot, products)}</div></div>`;
}

function lotValue(input: HTMLInputElement | HTMLSelectElement): string | number | null {
  if (input.dataset.lf === 'estado') return input.value;
  if (input.type === 'number') return input.value === '' ? null : Math.max(0, Number(input.value));
  return input.value.trim() || null;
}

async function removeLot(lotId: string, context: LotContext): Promise<void> {
  if (!await notices.confirm(t('tenders.lot.removeText'), { titulo: t('tenders.lot.removeTitle'), ok: t('tenders.lot.removeOk'), peligro: true })) return;
  const { error } = await legacyDb().from('concurso_lotes').delete().eq('id', lotId);
  if (error) { context.fail(error as { message?: string }); return; }
  context.reopen();
}

async function addProduct(lotId: string, productId: string, context: LotContext): Promise<void> {
  if (!productId) return;
  const product = context.products.find(item => item.id === productId);
  const { error } = await legacyDb().from('concurso_precios').insert({ lote_id: lotId, producto_id: productId, precio: isPresent(product?.precio) ? Number(product.precio) : 0 });
  if (error) { context.fail(error as { message?: string }); return; }
  context.reopen();
}

async function savePrice(row: HTMLElement, input: HTMLInputElement, context: LotContext): Promise<void> {
  const key = input.dataset.cpf ?? '';
  const value = input.value === '' ? null : Math.max(0, key === 'unidades' ? Math.floor(Number(input.value)) : Number(input.value));
  if (key === 'precio' && value === null) { notices.toast(t('tenders.lot.writePrice'), true); return; }
  const { error } = await legacyDb().from('concurso_precios').update({ [key]: value }).eq('id', row.dataset.cp);
  if (error) context.fail(error as { message?: string });
}

async function removePrice(row: HTMLElement, context: LotContext): Promise<void> {
  const { error } = await legacyDb().from('concurso_precios').delete().eq('id', row.dataset.cp);
  if (error) { context.fail(error as { message?: string }); return; }
  context.reopen();
}

function bindPrices(box: HTMLElement, context: LotContext): void {
  box.querySelectorAll<HTMLElement>('[data-cp]').forEach(row => {
    row.querySelectorAll<HTMLInputElement>('[data-cpf]').forEach(input => { input.onchange = (): void => { void savePrice(row, input, context); }; });
    const remove = row.querySelector<HTMLElement>('[data-cpq]'); if (remove) remove.onclick = (): void => { void removePrice(row, context); };
  });
}

async function saveLotField(lotId: string, input: HTMLInputElement | HTMLSelectElement, context: LotContext): Promise<void> {
  const key = input.dataset.lf ?? '';
  const { error } = await legacyDb().from('concurso_lotes').update({ [key]: lotValue(input) }).eq('id', lotId);
  if (error) { context.fail(error as { message?: string }); return; }
  if (key === 'estado') context.reopen();
}

/** Saves each change of the lots in `list` (the box with the lots of the window). */
export function bindLots(list: HTMLElement, context: LotContext): void {
  list.querySelectorAll<HTMLElement>('[data-lote]').forEach(box => {
    const lotId = box.dataset.lote ?? '';
    box.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-lf]').forEach(input => { input.onchange = (): void => { void saveLotField(lotId, input, context); }; });
    const remove = box.querySelector<HTMLElement>('[data-lq]'); if (remove) remove.onclick = (): void => { void removeLot(lotId, context); };
    const add = box.querySelector<HTMLSelectElement>('[data-cpnuevo]'); if (add) add.onchange = (): void => { void addProduct(lotId, add.value, context); };
    bindPrices(box, context);
  });
}
