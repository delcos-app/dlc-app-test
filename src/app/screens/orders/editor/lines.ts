/**
 * The lines of the order editor: what each one costs (base, VAT, total, unit price and «Precio de concurso») and the totals of the
 * order with discount and service, recomputed on every change. Migrated from the legacy editorPedidoBase (v2.417.0).
 */
import { orderEditorLegacy } from '../../../legacy/orders2-bridge';
import { t } from '../../../i18n';
import { escapeHtml, formatNumber } from '../../../services/format';
import { euros, lineBreakdown, orderTotals, round2, totalsHtml, type OrderLine } from '../model';
import { autoAmount, productOf, type EditorLine, type EditorState } from './state';

const FULL_DISCOUNT = 100;

const input = (id: string): HTMLInputElement | null => document.getElementById(id) as HTMLInputElement | null;
const number = (id: string): number => Number(input(id)?.value) || 0;

function breakdownHtml(line: EditorLine): string {
  const parts = lineBreakdown(line as OrderLine), product = productOf(line.producto_id);
  const unit = product.precio !== null && product.precio !== undefined
    ? `<span>${t('ordersMore.editor.unitPrice', { price: euros(product.precio * (1 + (Number(product.iva) || 0) / 100)) })}</span>` : '';
  const tender = product.contrato ? `<span class="pill p-est" title="${escapeHtml(product.contrato)}">${t('ordersMore.editor.tenderPrice')}</span>` : '';
  return `<span>${t('ordersMore.editor.base', { amount: euros(parts.base) })}</span><span>${t('ordersMore.editor.vat', { rate: formatNumber(line.iva ?? 0), amount: euros(parts.iva) })}</span><span>${t('ordersMore.editor.total', { amount: euros(parts.total) })}</span>
          ${unit}${tender}`;
}

/** Paints each line's breakdown and the totals (a free delivery puts 100 % discount on every line). */
export function paintBreakdown(state: EditorState): void {
  if (input('psincargo')?.checked) state.lines.forEach(line => { line.descuento = FULL_DISCOUNT; });
  const lines = document.getElementById('plineas');
  state.lines.forEach((line, index) => { const box = lines?.querySelector(`[data-des="${index}"]`); if (box) box.innerHTML = breakdownHtml(line); });
  const shipping = Boolean(input('penv')?.checked);
  document.getElementById('penvd')?.classList.toggle('hide', !shipping);
  const service = orderEditorLegacy.services().find(item => item.id === (document.getElementById('pserv') as HTMLSelectElement | null)?.value);
  const totals = orderTotals(state.lines as OrderLine[], number('pdto'), (document.getElementById('pdtot') as HTMLSelectElement | null)?.value ?? '',
    { on: shipping, con: number('penvi'), iva: number('penvv'), nombre: service?.nombre ?? t('ordersMore.editor.serviceDefault') });
  const box = document.getElementById('ptot'); if (box) box.innerHTML = totalsHtml(totals);
}

const amountWithVat = (line: EditorLine): string => (line.importe !== null ? String(round2(line.importe * (1 + (Number(line.iva) || 0) / 100))) : '');

/** Sets the field of the line that was typed; true when its amount follows the product again. */
function setField(line: EditorLine, field: string, raw: string): boolean {
  const value = raw === '' ? null : Number(raw);
  if (field === 'importeiva') { line.importe = value === null ? null : value / (1 + (Number(line.iva) || 0) / 100); line.manual = true; return false; }
  if (field === 'producto_id') { line.producto_id = raw; line.manual = false; line.iva = productOf(raw).iva ?? 0; return true; }
  if (field === 'unidades') { line.unidades = value; return true; }
  if (field === 'descuento') line.descuento = value;
  return false;
}

function changeLine(line: EditorLine, field: string, target: HTMLInputElement, box: Element): void {
  if (!setField(line, field, target.value)) return;
  autoAmount(line);
  const amount = box.querySelector<HTMLInputElement>('[data-f="importeiva"]');
  if (amount) amount.value = amountWithVat(line);
}

/** Typing in a line changes it and the totals. */
export function bindLineInputs(state: EditorState): void {
  const lines = document.getElementById('plineas'); if (!lines) return;
  const onChange = (event: Event): void => {
    const target = event.target as HTMLInputElement, box = target.closest('[data-li]'), field = target.dataset.f;
    const line = box ? state.lines[Number((box as HTMLElement).dataset.li)] : undefined;
    if (!box || !field || !line) return;
    changeLine(line, field, target, box);
    paintBreakdown(state);
  };
  lines.oninput = onChange; lines.onchange = onChange;
}
