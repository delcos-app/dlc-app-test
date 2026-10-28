/**
 * «Rectificar» an invoice: the whole invoice or some units, optionally cancelling its order too. It issues a negative invoice and
 * leaves the original as it is. Migrated from the legacy rectificarFactura (v2.413.0).
 */
import { legacyDb, notices } from '../../legacy/bridge';
import { billingLegacy } from '../../legacy/billing-bridge';
import { t } from '../../i18n';
import { escapeHtml, formatNumber } from '../../services/format';
import { orFallback } from '../../services/values';
import { refreshInvoices } from './list';
import { errorMessage, type Invoice } from './model';

interface RectifyResult { ok?: boolean; error?: string; id?: string; numero?: string }

const failure = (error: unknown, result: RectifyResult | null): string => orFallback(errorMessage(error), result?.error ?? '');

const partial = (body: HTMLElement): boolean => body.querySelector<HTMLInputElement>('[name=rft]:checked')?.value === 'parcial';

function formHtml(invoice: Invoice): string {
  const lines = invoice.lineas.map((line, index) => `<div class="g2 u-items-center"><div>${escapeHtml(line.descripcion)} <span class="sm">${t('billing.rectify.units', { units: formatNumber(line.unidades) })}</span></div>
      <div><input type="number" min="0" max="${line.unidades}" data-rfi="${index}" value="0" aria-label="${t('billing.rectify.unitsLabel')}"></div></div>`).join('');
  return `
    <div class="fh"><div><h2>${t('billing.rectify.title', { number: escapeHtml(invoice.numero) })}</h2><div class="sm">${t('billing.rectify.subtitle')}</div></div>
      <button class="x" data-cerrar2 aria-label="${t('common.close')}">✕</button></div>
    <label for="rfm">${t('billing.rectify.reason')}</label><input id="rfm" placeholder="${t('billing.rectify.reasonPlaceholder')}">
    <label>${t('billing.rectify.what')}</label>
    <div class="opciones" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr)"><label class="opt"><input type="radio" name="rft" value="total" checked> ${t('billing.rectify.whole')}</label>
      <label class="opt"><input type="radio" name="rft" value="parcial"> ${t('billing.rectify.someUnits')}</label></div>
    <div id="rflin" class="hide">${lines}</div>
    ${invoice.pedido_id ? `<label class="opt u-mt-10"><input type="checkbox" id="rfan"> ${t('billing.rectify.cancelOrder')}</label>` : ''}
    <div class="acts u-end"><button class="btn sec" data-cerrar2>${t('common.cancel')}</button><button class="btn dang" id="rfok">${t('billing.rectify.issue')}</button></div>`;
}

const reasonOf = (): string => (document.getElementById('rfm') as HTMLInputElement | null)?.value.trim() ?? '';

function chosenLines(body: HTMLElement): { indice: number; unidades: number }[] {
  return [...body.querySelectorAll<HTMLInputElement>('[data-rfi]')].map(input => ({ indice: Number(input.dataset.rfi), unidades: Number(input.value) || 0 })).filter(line => line.unidades > 0);
}

async function issue(invoice: Invoice, body: HTMLElement, button: HTMLButtonElement): Promise<void> {
  const reason = reasonOf();
  if (!reason) { notices.toast(t('billing.rectify.writeReason'), true); return; }
  const lines = partial(body) ? chosenLines(body) : null;
  if (lines?.length === 0) { notices.toast(t('billing.rectify.writeUnits'), true); return; }
  button.disabled = true;
  const { data: result, error } = await legacyDb().rpc<RectifyResult>('rectificar_factura', { p_factura: invoice.id, p_motivo: reason, p_lineas: lines });
  if (error || !result || result.ok === false) { button.disabled = false; notices.toast(t('billing.rectify.failed', { error: failure(error, result) }), true); return; }
  await afterIssue(invoice, result, reason);
}

/** The order is cancelled too if asked; then the new invoice opens. */
async function afterIssue(invoice: Invoice, result: RectifyResult, reason: string): Promise<void> {
  const number = result.numero ?? '';
  if ((document.getElementById('rfan') as HTMLInputElement | null)?.checked) await legacyDb().rpc('anular_pedido', { p_id: invoice.pedido_id, p_motivo: t('billing.rectify.cancelReason', { number, reason }) });
  (document.getElementById('dlg2') as HTMLDialogElement | null)?.close();
  notices.toast(t('billing.rectify.issued', { number })); billingLegacy.openInvoice(result.id ?? ''); refreshInvoices();
}

export function rectifyInvoice(invoice: Invoice): void {
  const body = document.getElementById('dlg2body'), box = document.getElementById('dlg2') as HTMLDialogElement | null;
  if (!body || !box) return;
  body.innerHTML = formHtml(invoice);
  box.showModal();
  body.querySelectorAll<HTMLInputElement>('[name=rft]').forEach(radio => {
    radio.onchange = (): void => {
      const some = partial(body), cancel = document.getElementById('rfan') as HTMLInputElement | null;
      document.getElementById('rflin')?.classList.toggle('hide', !some);
      if (cancel) { cancel.disabled = some; if (some) cancel.checked = false; }
    };
  });
  const ok = document.getElementById('rfok') as HTMLButtonElement | null; if (ok) ok.onclick = (): void => { void issue(invoice, body, ok); };
}
