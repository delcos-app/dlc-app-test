/** The HTML of the purchase order window: header, supplier and dates, product lines, shipping, received batches and buttons. */
import { purchasesLegacy } from '../../legacy/bridge';
import { t } from '../../i18n';
import { todayIso } from '../../services/dates';
import { formatShortDate } from '../../services/date-format';
import { escapeHtml, formatNumber } from '../../services/format';
import { nonZeroOr, orFallback, sum } from '../../services/values';
import { CLOSED_STATES, DEFAULT_LEAD_DAYS, euros, OPEN_STATES, purchasePill, STATES, type Purchase, type PurchaseDetail, type PurchaseLine } from './model';

/** Everything the window shows: the order, its lines (edited in place) and whether it can be changed. */
export interface PurchaseEditor { id: string | null; purchase: Purchase; lines: PurchaseLine[]; detail: PurchaseDetail | null; editable: boolean }

const disabled = (editor: PurchaseEditor): string => (editor.editable ? '' : 'disabled');

function headerHtml(editor: PurchaseEditor): string {
  const { id, purchase } = editor;
  const title = id ? t('purchases.editor.title', { number: escapeHtml(purchase.numero) }) : t('purchases.editor.newTitle');
  return `<div class="fh"><div><h2>${title} ${id ? purchasePill(purchase.estado) : ''}</h2>
        <div class="sm">${id ? t('purchases.editor.createdOn', { date: formatShortDate(purchase.fecha) }) : t('purchases.editor.numberedOnSave')}</div></div>
        <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>`;
}

function supplierHtml(editor: PurchaseEditor): string {
  const { purchase } = editor, off = disabled(editor);
  const suppliers = purchasesLegacy.suppliers().filter(supplier => supplier.activo === true || supplier.id === purchase.proveedor_id)
    .map(supplier => `<option value="${supplier.id ?? ''}" data-plazo="${nonZeroOr(supplier.plazo_dias, DEFAULT_LEAD_DAYS)}" ${supplier.id === purchase.proveedor_id ? 'selected' : ''}>${escapeHtml(supplier.nombre)}</option>`).join('');
  return `<div class="g2">
        <div><label for="cpprov">${t('purchases.editor.supplier')}</label><select id="cpprov" ${off}>
          ${suppliers}</select></div>
        <div class="g2 u-m-0">
          <div><label for="cpfecha">${t('purchases.editor.date')}</label><input id="cpfecha" type="date" value="${escapeHtml(orFallback(purchase.fecha, todayIso()))}" ${off}></div>
          <div><label for="cpprev">${t('purchases.editor.expected')}</label><input id="cpprev" type="date" value="${escapeHtml(purchase.fecha_prevista ?? '')}" ${off}></div></div>
      </div>`;
}

function lineHtml(editor: PurchaseEditor, line: PurchaseLine, index: number): string {
  const off = disabled(editor);
  const products = purchasesLegacy.products().map(product => `<option value="${product.id}" ${product.id === line.producto_id ? 'selected' : ''}>${escapeHtml(product.nombre)}</option>`).join('');
  const received = editor.id ? `<label>${t('purchases.editor.received')}</label><div class="cprec">${t('purchases.editor.receivedOf', { received: formatNumber(line.recibidas ?? 0), units: formatNumber(line.unidades) })}</div>` : '';
  const remove = editor.editable && editor.lines.length > 1 ? `<button type="button" class="btn sec" data-clx="${index}" aria-label="${t('purchases.editor.remove')}">✕</button>` : '';
  return `<div class="lin"><div class="lrow cprow">
        <div><label>${t('purchases.editor.product')}</label><select data-cl="${index}|producto_id" ${off}>${products}</select></div>
        <div><label>${t('purchases.editor.units')}</label><input type="number" min="1" data-cl="${index}|unidades" value="${line.unidades}" ${off}></div>
        <div><label>${t('purchases.editor.unitCost')}</label><input type="number" step="0.0001" min="0" data-cl="${index}|coste_unitario" value="${line.coste_unitario ?? ''}" ${off}></div>
        <div>${received}</div>
        <div>${remove}</div></div></div>`;
}

function batchesHtml(editor: PurchaseEditor): string {
  const batches = editor.detail?.lotes ?? [];
  if (!batches.length) return '';
  return `<div class="blk"><h3>${t('purchases.editor.batchesReceived')}</h3>${batches.map(batch => `<div class="sm">${t('purchases.editor.batchLine', { product: escapeHtml(batch.producto), batch: escapeHtml(batch.numero_lote), units: formatNumber(batch.unidades) })}${batch.caducidad ? t('purchases.editor.expires', { date: formatShortDate(batch.caducidad) }) : ''}</div>`).join('')}</div>`;
}

/** The buttons that move the order on (send, in transit, receive), for who can buy. */
function stepButtons(editor: PurchaseEditor): string[] {
  const state = editor.purchase.estado;
  if (!purchasesLegacy.canBuy()) return [];
  return [
    state === STATES.draft ? `<button class="btn sec" id="cpenviar">${t('purchases.editor.markSent')}</button>` : '',
    state === STATES.sent ? `<button class="btn sec" id="cptransito">${t('purchases.editor.inTransit')}</button>` : '',
    editor.id && OPEN_STATES.includes(state) ? `<button class="btn" id="cprecibir">${t('purchases.editor.receive')}</button>` : '',
  ];
}

function buttonsHtml(editor: PurchaseEditor): string {
  const { id, purchase, editable } = editor, state = purchase.estado;
  const buttons = [
    purchasesLegacy.canBuy() && id && !CLOSED_STATES.includes(state) ? `<button class="btn sec dang" id="cpcancel">${t('purchases.editor.cancelOrder')}</button>` : '',
    editable ? `<button class="btn sec" id="cpguardar">${t(state === STATES.draft ? 'purchases.editor.saveDraft' : 'purchases.editor.saveChanges')}</button>` : '',
    ...stepButtons(editor),
  ];
  return `<div class="acts u-end u-wrap">
        <button class="btn sec" data-cerrar>${t('purchases.editor.close')}</button>
        ${buttons.join('\n        ')}
      </div>`;
}

export function editorHtml(editor: PurchaseEditor): string {
  const { purchase } = editor, off = disabled(editor);
  return `
      ${headerHtml(editor)}
      ${supplierHtml(editor)}
      <label>${t('purchases.editor.products')}</label>
      <div id="cplin">${editor.lines.map((line, index) => lineHtml(editor, line, index)).join('')}</div>
      ${editor.editable ? `<div class="acts u-mt-0"><button type="button" class="btn sec" id="cpmas">${t('purchases.editor.addProduct')}</button></div>` : ''}
      <div class="g2">
        <div><label for="cpport">${t('purchases.editor.shipping')}</label><input id="cpport" type="number" step="0.01" min="0" value="${purchase.portes ? String(purchase.portes) : 0}" ${off}></div>
        <div><label for="cpnota">${t('purchases.editor.note')}</label><input id="cpnota" value="${escapeHtml(purchase.nota ?? '')}" ${off}></div></div>
      <div class="totbox" id="cptot"></div>
      ${batchesHtml(editor)}
      ${buttonsHtml(editor)}`;
}

/** The units and the amount without VAT (shipping included). */
export function totalsHtml(lines: readonly PurchaseLine[], shipping: number): string {
  const amount = sum(lines.map(line => (Number(line.unidades) || 0) * (Number(line.coste_unitario) || 0))) + shipping;
  return `<div><span>${t('purchases.editor.totalUnits')}</span><b>${formatNumber(sum(lines.map(line => Number(line.unidades) || 0)))}</b></div>
        <div class="tot"><span>${t('purchases.editor.totalAmount')}</span><b>${euros(amount)}</b></div>`;
}
