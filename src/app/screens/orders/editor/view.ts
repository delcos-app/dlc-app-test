/**
 * The order editor window: date and channel, origin and who serves it, customer and account, the lines, free delivery, payment
 * (method, general discount, reference, transfer and card links, receipts), service, totals and note. The ids, classes and data-
 * attributes are the ones of the legacy editorPedidoBase (v2.417.0).
 */
import { term } from '../../../legacy/bridge';
import { orderEditorLegacy } from '../../../legacy/orders2-bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { euros, isBankTransfer, round2, STATES, type Order } from '../model';
import { isTpvPayment, tpvActive } from '../tpv/model';
import { distributorHtml } from './distributor';
import { CHANNELS, type EditorLine, type EditorState } from './state';

const isConfirmed = (order: Order | null): boolean => order?.estado === STATES.confirmed;
const withVat = (line: EditorLine): string => (line.importe !== null ? String(round2(line.importe * (1 + (Number(line.iva) || 0) / 100))) : '');

function headerHtml(order: Order | null): string {
  const title = order ? t(isConfirmed(order) ? 'ordersMore.editor.editOrder' : 'ordersMore.editor.editDraft') : t('ordersMore.editor.newOrder');
  return `
      <div class="fh"><div><h2>${title}</h2>
        <div class="sm">${t('ordersMore.editor.subtitle')}</div></div>
        <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>`;
}

function dateChannelOriginHtml(state: EditorState): string {
  const form = state.form;
  return `
      <div class="g2">
        <div><label for="pfecha">${t('ordersMore.editor.date')}</label><input id="pfecha" type="date" value="${escapeHtml(form.fecha)}"></div>
        <div><label for="pcan">${t('ordersMore.editor.channel')}</label><select id="pcan">
          <option value="${CHANNELS.patient}" ${form.canal !== CHANNELS.centre ? 'selected' : ''}>${t('ordersMore.editor.toPatient', { toPatient: term('paciente', { article: 'al' }) })}</option>
          <option value="${CHANNELS.centre}" ${form.canal === CHANNELS.centre ? 'selected' : ''}>${t('ordersMore.editor.toCentre')}</option></select></div>
      </div>
      <div class="g2"><div><label for="porig">${t('ordersMore.editor.origin')}</label><select id="porig">
          <option value="manual">${t('ordersMore.editor.manual')}</option>
          <option value="web" ${form.origen === 'web' ? 'selected' : ''}>${t('ordersMore.editor.web')}</option>${form.origen === 'portal' ? `<option value="portal" selected>${t('ordersMore.editor.portal')}</option>` : ''}</select></div><div></div></div>
      ${distributorHtml(state.distributor)}`;
}

function customerZoneHtml(state: EditorState): string {
  const toProfessional = escapeHtml(term('medico', { article: 'al' }));
  return `
      <div id="zonapac" class="${state.form.canal === CHANNELS.centre ? 'escentro' : ''}">
        <label class="solopac">${term('paciente', { capital: 'C' })}</label><div id="pselpac" class="solopac"></div>
        <label><span class="solopac">${t('ordersMore.editor.reference', { Professional: term('medico', { capital: 'C' }) })}</span><span class="solocen">${t('ordersMore.editor.buyingCentre')}</span></label><div id="pselmed"></div>
        <div class="sm u-mt-4"><span class="solopac">${t('ordersMore.editor.leaveName')}</span><span class="solocen">${t('ordersMore.editor.pickCentre')}</span></div>
        <label class="opt solopac prepbox"><input type="checkbox" id="prepprof" ${state.form.reportar ? 'checked' : ''}> ${t('ordersMore.editor.report', { toProfessional })}</label>
      </div>`;
}

function lineHtml(line: EditorLine, index: number, count: number): string {
  return `<div class="lin" data-li="${index}">
        <div class="lrow">
          <div><label>${t('ordersMore.editor.product')}</label><select data-f="producto_id">${orderEditorLegacy.productOptions(line.producto_id, line.producto)}</select></div>
          <div><label>${t('ordersMore.editor.units')}</label><input data-f="unidades" type="number" min="1" value="${line.unidades ?? ''}"></div>
          <div><label>${t('ordersMore.editor.amountWithVat')}</label><input data-f="importeiva" type="number" step="0.01" min="0" value="${withVat(line)}"></div>
          <div><label>${t('ordersMore.editor.discount')}</label><input data-f="descuento" type="number" step="1" min="0" max="100" value="${line.descuento ?? 0}"></div>
          <div>${count > 1 ? `<button type="button" class="btn sec" data-lx="${index}" aria-label="${t('ordersMore.editor.removeLine')}">✕</button>` : ''}</div>
        </div>
        <div class="ldes" data-des="${index}"></div></div>`;
}

function linesHtml(state: EditorState): string {
  return `
      <label>${t('ordersMore.editor.lines')}</label>
      <div id="plineas">${state.lines.map((line, index) => lineHtml(line, index, state.lines.length)).join('')}</div>
      <div class="acts u-mt-0"><button type="button" class="btn sec" id="plmas">${t('ordersMore.editor.addLine')}</button></div>
      <div class="pscbox"><label class="opt"><input type="checkbox" id="psincargo" ${state.form.sin_cargo ? 'checked' : ''}> ${t('ordersMore.editor.free')}</label>
        <span class="sm">${t('ordersMore.editor.freeHint')}</span></div>`;
}

function methodDiscountHtml(state: EditorState): string {
  const form = state.form, methods = orderEditorLegacy.paymentMethods().map(item => `<option ${form.forma_pago === item.valor ? 'selected' : ''}>${escapeHtml(item.valor)}</option>`).join('');
  return `
      <div class="g2 pscg2">
        <div><label for="ppago">${t('ordersMore.editor.paymentMethod')}</label><select id="ppago" ${form.sin_cargo ? 'disabled' : ''}><option value=""></option>
          ${methods}</select></div>
        <div><label for="pdto">${t('ordersMore.editor.generalDiscount')}</label>
          <div style="display:flex;gap:6px"><input id="pdto" type="number" min="0" step="0.01" value="${escapeHtml(String(form.descuento))}">
            <select id="pdtot" style="max-width:110px"><option value="porcentaje">%</option>
              <option value="importe" ${form.descuento_tipo === 'importe' ? 'selected' : ''}>€</option></select></div></div>
      </div>`;
}

/** Whether «Enviar los datos de pago» and «Enviar enlace de pago» show for this payment method. */
export const showsTransfer = (state: EditorState, method: string): boolean => isBankTransfer(method) && !isConfirmed(state.order);
export const showsCardLink = (state: EditorState, method: string): boolean => tpvActive() && isTpvPayment(method) && !isConfirmed(state.order);

export const receiptsHtml = (state: EditorState): string => state.receipts.map((receipt, index) =>
  `<span class="jusp">📎 ${escapeHtml(receipt.nombre)} <button type="button" class="lnk" data-jx="${index}" aria-label="${t('ordersMore.editor.removeReceipt', { name: escapeHtml(receipt.nombre) })}">${t('ordersMore.editor.remove')}</button></span>`).join(' ');

function paymentHtml(state: EditorState): string {
  const form = state.form;
  return `
      <div id="ppagox" class="pagofila ${form.forma_pago ? '' : 'hide'}">
        <div class="pagoref"><label for="pref">${t('ordersMore.editor.paymentReference')}</label><input id="pref" value="${escapeHtml(form.pago_referencia)}" placeholder="${t('ordersMore.editor.paymentReferencePlaceholder')}"></div>
        <span id="ptrfbox" class="pagoacc ${showsTransfer(state, form.forma_pago) ? '' : 'hide'}"><button type="button" class="btn sec" id="ptrfmail">${t('ordersMore.editor.sendPaymentDetails')}</button>
          ${orderEditorLegacy.help(t('ordersMore.editor.transferHelpTitle'), t('ordersMore.editor.transferHelp'))}</span>
        <span id="ptpvbox" class="pagoacc ${showsCardLink(state, form.forma_pago) ? '' : 'hide'}"><button type="button" class="btn sec" id="ptpvenv">${t('ordersMore.editor.sendPaymentLink')}</button>
          ${orderEditorLegacy.help(t('ordersMore.editor.cardHelpTitle'), t('ordersMore.editor.cardHelp'))}</span>
        <div><label>${t('ordersMore.editor.receipt')}</label><label class="btn sec u-inline-flex">${t('ordersMore.editor.attach')}<input id="pjus" type="file" accept="image/*,application/pdf" data-fp="1" hidden></label>
          <div class="sm" id="pjusl">${receiptsHtml(state)}</div></div>
      </div>`;
}

function serviceHtml(state: EditorState): string {
  const form = state.form;
  const options = orderEditorLegacy.services().filter(service => Boolean(service.activo) || service.id === form.servicio_id)
    .map(service => `<option value="${service.id}" ${form.servicio_id === service.id ? 'selected' : ''}>${t('ordersMore.editor.serviceOption', { name: escapeHtml(service.nombre), price: euros(service.pvp ?? 0) })}</option>`).join('');
  return `
      <div class="envbox">
        <label for="pserv" class="u-mt-0">${t('ordersMore.editor.service')}</label>
        <select id="pserv" ${form.sin_cargo ? 'disabled' : ''}><option value="">${t('ordersMore.editor.noService')}</option>${options}</select>
        <input type="checkbox" id="penv" class="hide" ${form.envio ? 'checked' : ''}>
        <div class="g2 ${form.envio ? '' : 'hide'}" id="penvd">
          <div><label for="penvi">${t('ordersMore.editor.serviceAmount')}</label><input id="penvi" type="number" step="0.01" min="0" value="${escapeHtml(String(form.envio_con))}"></div>
          <div><label for="penvv">${t('ordersMore.editor.serviceVat')}</label><input id="penvv" type="number" step="1" min="0" max="21" value="${escapeHtml(String(form.envio_iva))}"></div></div>
      </div>`;
}

function footerHtml(state: EditorState): string {
  const confirmed = isConfirmed(state.order);
  return `
      <div class="totbox" id="ptot"></div>
      <label for="pnota">${t('ordersMore.editor.note')}</label><input id="pnota" value="${escapeHtml(state.form.nota)}">
      <div class="acts u-end">
        <button class="btn sec" data-cerrar>${t('ordersMore.editor.cancel')}</button>
        <button class="btn sec ${confirmed ? 'hide' : ''}" id="pborr">${t('ordersMore.editor.saveDraft')}</button>
        <button class="btn" id="pvalid">${t(confirmed ? 'ordersMore.editor.saveChanges' : 'ordersMore.editor.saveAndConfirm')}</button></div>`;
}

export function editorHtml(state: EditorState): string {
  return headerHtml(state.order) + dateChannelOriginHtml(state) + customerZoneHtml(state) + linesHtml(state)
    + methodDiscountHtml(state) + paymentHtml(state) + serviceHtml(state) + footerHtml(state);
}
