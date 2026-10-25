/**
 * «Distribuidor» of an order a distributor serves: who and how it is invoiced, the email to the distributor and, v2.265.0, the
 * transfer state (Enviado, Aceptado, Servido or Incidencia with its note) and «Descargar transfer». Migrated from the legacy
 * verPedidoBase4 and trfPoner (v2.414.0).
 */
import { legacyDb, notices } from '../../../legacy/bridge';
import { orderSheetLegacy, type Distributor } from '../../../legacy/orders-bridge';
import { t } from '../../../i18n';
import { todayIso } from '../../../services/dates';
import { formatShortDate } from '../../../services/date-format';
import { escapeHtml } from '../../../services/format';
import { orFallback } from '../../../services/values';
import { STATES, TRANSFER_ISSUE, TRANSFER_STATES, type Order, type OrderDetail } from '../model';
import { mailtoLink } from '../payment-email';
import { downloadTransfer } from './transfer-pdf';
import { loadDistributors } from '../editor/distributor';

const SENT = 'Enviado';

async function distributorOf(id: string): Promise<Distributor> {
  const found = (await loadDistributors()).find(item => item.id === id) ?? (await loadDistributors(true)).find(item => item.id === id);
  return found ?? { id, nombre: t('orders.distributor.fallbackName') };
}

/** The email to the distributor: customer, address, lines and who invoices. */
function emailOf(detail: OrderDetail): { subject: string; text: string } {
  const order = detail.pedido, customer = detail.contacto, name = orFallback(customer?.nombre, orFallback(order.cuenta_texto, '')), app = orderSheetLegacy.appName();
  const address = customer?.direccion ? t('orders.distributor.mailAddress', { address: [customer.direccion, customer.cp, customer.municipio].filter(Boolean).join(', ') }) : '';
  const text = [t('orders.distributor.mailOrder', { number: order.numero ?? '', app }), '', t('orders.distributor.mailCustomer', { name, code: order.distribuidor_codigo ? t('orders.distributor.mailCode', { code: order.distribuidor_codigo }) : '' }),
    address, '', ...(detail.lineas ?? []).map(line => `- ${line.unidades} × ${orFallback(line.producto, line.nombre ?? '')}`), '',
    order.factura_distribuidor ? t('orders.distributor.invoicedByThem') : t('orders.distributor.invoicedBy', { app }),
    order.nota ? `\n${t('orders.distributor.mailNote', { note: order.nota })}` : ''].join('\n');
  return { subject: t('orders.distributor.mailSubject', { number: order.numero ?? '', name }), text };
}

function blockHtml(detail: OrderDetail, distributor: Distributor): string {
  const order = detail.pedido, mail = emailOf(detail);
  const who = t('orders.distributor.servedBy', { name: escapeHtml(distributor.nombre) }) + (order.distribuidor_codigo ? t('orders.distributor.customerCode', { code: escapeHtml(order.distribuidor_codigo) }) : '')
    + ` · ${t(order.factura_distribuidor ? 'orders.distributor.theyInvoice' : 'orders.distributor.weInvoice')}`;
  const sent = order.transfer_enviado_en ? t('orders.distributor.mailPreparedOn', { date: formatShortDate(String(order.transfer_enviado_en).slice(0, 10)) }) : t('orders.distributor.mailNotPrepared');
  const actions = order.estado === STATES.confirmed
    ? `<div class="acts u-start u-mt-6">${distributor.email ? `<a class="btn sec" id="pdmaild" href="${mailtoLink(escapeHtml(distributor.email), mail.subject, mail.text)}">${t('orders.distributor.prepareMail')}</a>` : `<span class="sm">${t('orders.distributor.noEmail')}</span>`}
        <span class="sm" id="pdmailest">${sent}</span></div>`
    : `<p class="sm">${t('orders.distributor.afterConfirm')}</p>`;
  return `<div class="blk" id="pddist"><h3>${t('orders.distributor.title')}</h3>
      <p>${who}</p>
      ${actions}</div>`;
}

const pressOnly = (buttons: NodeListOf<HTMLElement>, chosen: Element | null): void => {
  buttons.forEach(button => { button.classList.toggle('on', button === chosen); button.setAttribute('aria-pressed', String(button === chosen)); });
};

/** An issue asks what happened (undefined if the user cancels); the other states carry no note. */
async function noteFor(order: Order, state: string): Promise<string | null | undefined> {
  if (state !== TRANSFER_ISSUE) return null;
  const note = await orderSheetLegacy.askText(t('orders.transfer.issueQuestion'), order.transfer_nota ?? '', { titulo: t('orders.transfer.issueTitle'), ok: t('common.save') });
  return note ?? undefined;
}

async function saveTransfer(order: Order, state: string, note: string | null): Promise<boolean> {
  const { data: result, error } = await legacyDb().rpc<{ ok?: boolean; error?: string }>('estado_transfer', { p_id: order.id, p_estado: state, p_nota: note });
  if (!error && result?.ok) return true;
  notices.toast(result?.error === 'permiso' ? t('orders.transfer.noPermission') : t('orders.transfer.couldNotChange', { error: error ? `: ${(error as { message?: string }).message ?? ''}` : '' }), true);
  return false;
}

async function changeTransfer(order: Order, box: HTMLElement, button: HTMLElement): Promise<void> {
  const state = button.dataset.trf ?? '', note = await noteFor(order, state);
  if (note === undefined || !await saveTransfer(order, state, note)) return;
  order.transfer_estado = state; if (note !== null) order.transfer_nota = note || null;
  pressOnly(box.querySelectorAll<HTMLElement>('[data-trf]'), button);
  const noteText = document.getElementById('pdtrfnota'); if (noteText) noteText.textContent = order.transfer_nota ? t('orders.transfer.note', { note: order.transfer_nota }) : '';
  const mailState = document.getElementById('pdmailest');
  if (!order.transfer_enviado_en && mailState) { order.transfer_enviado_en = new Date().toISOString(); mailState.textContent = t('orders.transfer.sentOn', { date: formatShortDate(todayIso()) }); }
  notices.toast(t('orders.transfer.changed', { state: state.toLowerCase() }));
}

/** The transfer state, under the distributor block (only with the email to the distributor). */
function paintTransfer(detail: OrderDetail, distributor: Distributor): void {
  const box = document.getElementById('pddist'), order = detail.pedido;
  if (!box || document.getElementById('pdtrf') || !document.getElementById('pdmailest')) return;
  box.insertAdjacentHTML('beforeend', `<div class="pdtrf" id="pdtrf"><span class="sm">${t('orders.transfer.state')}</span>
      <div class="segs" role="group" aria-label="${t('orders.transfer.state')}">${TRANSFER_STATES.map(state => `<button type="button" data-trf="${state}" class="${order.transfer_estado === state ? 'on' : ''}" aria-pressed="${String(order.transfer_estado === state)}">${state}</button>`).join('')}</div>
      <button type="button" class="btn sec" id="pdtrfpdf">${t('orders.transfer.download')}</button>
      <p class="sm" id="pdtrfnota">${order.transfer_nota ? t('orders.transfer.note', { note: escapeHtml(order.transfer_nota) }) : ''}</p></div>`);
  box.querySelectorAll<HTMLElement>('[data-trf]').forEach(button => { button.onclick = (): void => { void changeTransfer(order, box, button); }; });
  const pdf = document.getElementById('pdtrfpdf');
  if (pdf) pdf.onclick = (): void => { downloadTransfer(detail, distributor).catch((error: unknown) => { notices.toast(t('orders.transfer.pdfFailed', { error: (error as { message?: string }).message ?? String(error) }), true); }); };
  // Preparing the email leaves the transfer «Enviado» if it had no state
  document.getElementById('pdmaild')?.addEventListener('click', () => {
    if (order.transfer_estado) return;
    order.transfer_estado = SENT;
    const sent = box.querySelector(`[data-trf="${SENT}"]`); if (sent) { sent.classList.add('on'); sent.setAttribute('aria-pressed', 'true'); }
  });
}

export async function paintDistributor(detail: OrderDetail): Promise<void> {
  const order = detail.pedido, isOpen = (): boolean => Boolean((document.getElementById('dlg') as HTMLDialogElement | null)?.open) && !document.getElementById('pddist');
  if (!isOpen() || !order.distribuidor_id) return;
  const distributor = await distributorOf(order.distribuidor_id);
  if (!isOpen()) return;
  if (order.factura_distribuidor) document.getElementById('pvemitir')?.remove();
  const place = document.getElementById('pdpago') ?? document.getElementById('dbody')?.querySelector('.acts:last-of-type'); if (!place) return;
  place.insertAdjacentHTML('beforebegin', blockHtml(detail, distributor));
  paintTransfer(detail, distributor);
  document.getElementById('pdmaild')?.addEventListener('click', () => {
    void legacyDb().rpc<{ ok?: boolean }>('marcar_transfer_enviado', { p_id: order.id }).then(({ data }) => {
      const mailState = document.getElementById('pdmailest');
      if (data?.ok && mailState) mailState.textContent = t('orders.distributor.mailPreparedOn', { date: formatShortDate(todayIso()) });
    });
  });
}
