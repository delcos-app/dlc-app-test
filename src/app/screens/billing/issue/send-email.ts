/**
 * «Enviar por email» of an invoice: recipient, subject and text from the mail template, the template and the PDF design to choose
 * (when there are several), and the PDF attached. Without direct sending, it offers to share or download the PDF and mark it as
 * sent. Migrated from the legacy enviarFacturaEmailBase and enviarFacturaEmail (v2.427.0); enviarFacturaEmail stays as an adapter.
 */
import { legacyDb, notices } from '../../../legacy/bridge';
import { billing2Legacy } from '../../../legacy/billing2-bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { invoicePdf, pdfFileName, templateList } from '../../../services/pdf';
import type { PdfDocument } from '../../../services/pdf/document';
import type { PdfInvoice } from '../../../services/pdf/invoice-header';

type MailInvoice = PdfInvoice & { id?: string; pedido_id?: string | null };
interface SendResult { ok?: boolean; error?: string }
interface FunctionError { message?: string; context?: { json?: () => Promise<SendResult> } }

const byId = (id: string): HTMLElement | null => document.getElementById(id);
const valueOf = (id: string): string => (byId(id) as HTMLInputElement | null)?.value ?? '';
const dialog = (): HTMLDialogElement | null => byId('dlg2') as HTMLDialogElement | null;

const mailValues = (invoice: MailInvoice): Record<string, unknown> =>
  billing2Legacy.mailValues({ documento: 'factura', numero: invoice.numero, importe: invoice.total, nombre: invoice.cliente?.nombre });

function formHtml(invoice: MailInvoice): string {
  const values = mailValues(invoice);
  return `
    <div class="fh"><div><h2>${t('billingMore.email.title', { number: escapeHtml(invoice.numero ?? '') })}</h2><div class="sm">${t('billingMore.email.subtitle')}</div></div>
      <button class="x" data-cerrar2 aria-label="${t('common.close')}">✕</button></div>
    <label for="efp">${t('billingMore.email.to')}</label><input id="efp" type="email" value="${escapeHtml(invoice.cliente?.email ?? '')}" placeholder="${t('billingMore.email.toPlaceholder')}">
    ${choicesHtml()}
    <label for="efa">${t('billingMore.email.subject')}</label><input id="efa" value="${escapeHtml(billing2Legacy.mailTemplate('factura', 'asunto', values))}">
    <label for="eft">${t('billingMore.email.message')}</label><textarea id="eft" rows="12">${escapeHtml(billing2Legacy.mailTemplate('factura', 'texto', values))}</textarea>
    <div class="adjunto">📎 ${escapeHtml(pdfFileName(invoice))}</div>
    <div class="acts u-end u-wrap"><button class="btn sec" data-cerrar2>${t('billingMore.email.cancel')}</button>
      <button class="btn" id="efok">${t('billingMore.email.send')}</button></div>`;
}

/** The mail template and the PDF design, when there is more than one of either. */
function choicesHtml(): string {
  const mails = billing2Legacy.mailTemplates('factura'), { lista, defecto } = templateList(), choices: string[] = [];
  if (mails.length > 1) choices.push(`<div><label for="efplant">${t('billingMore.email.mailTemplate')}</label><select id="efplant">${mails.map(item => `<option value="${item.id}" ${item.defecto ? 'selected' : ''}>${escapeHtml(item.nombre)}</option>`).join('')}</select></div>`);
  if (lista.length > 1) choices.push(`<div><label for="efdis">${t('billingMore.email.pdfDesign')}</label><select id="efdis">${lista.map(item => `<option value="${item.id}" ${item.id === defecto ? 'selected' : ''}>${escapeHtml(item.nombre)}</option>`).join('')}</select></div>`);
  return choices.length ? `<div class="g2 efplants">${choices.join('')}</div>` : '';
}

function bindChoices(invoice: MailInvoice): void {
  const mail = byId('efplant') as HTMLSelectElement | null, design = byId('efdis') as HTMLSelectElement | null;
  if (mail) mail.onchange = (): void => {
    billing2Legacy.setInvoiceMailChosen(mail.value);
    const values = mailValues(invoice), subject = byId('efa') as HTMLInputElement | null, text = byId('eft') as HTMLTextAreaElement | null;
    if (subject) subject.value = billing2Legacy.mailTemplate('factura', 'asunto', values);
    if (text) text.value = billing2Legacy.mailTemplate('factura', 'texto', values);
  };
  if (design) design.onchange = (): void => { billing2Legacy.setPdfChosen(design.value); };
  if (mail || design) dialog()?.addEventListener('close', () => { billing2Legacy.setInvoiceMailChosen(null); billing2Legacy.setPdfChosen(null); }, { once: true });
}

interface Fallback { invoice: MailInvoice; doc: PdfDocument; to: string; failure: string | null }

/** Without direct sending: share the PDF, download it or open the device's mail, and mark it as sent. */
function paintFallback({ invoice, doc, to, failure }: Fallback): void {
  const body = byId('dlg2body'); if (!body) return;
  const subject = valueOf('efa') || String(invoice.numero), file = new File([doc.output('blob')], pdfFileName(invoice), { type: 'application/pdf' });
  const canShare = 'canShare' in navigator && navigator.canShare({ files: [file] }), mailto = `mailto:${escapeHtml(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(t('billingMore.email.mailBody', { number: invoice.numero ?? '' }))}`;
  body.innerHTML = `<div class="fh"><div><h2>${t(failure === null ? 'billingMore.email.noSmtpTitle' : 'billingMore.email.failedTitle')}</h2>
      <div class="sm">${failure === null ? t('billingMore.email.noSmtpText') : escapeHtml(failure)}</div></div>
      <button class="x" data-cerrar2 aria-label="${t('common.close')}">✕</button></div>
      <p>${t('billingMore.email.fromYourMail')}</p>
      <div class="acts u-wrap">${canShare ? `<button class="btn" id="efsh">${t('billingMore.email.share')}</button>` : ''}
        <button class="btn ${canShare ? 'sec' : ''}" id="efdl">${t('billingMore.email.download')}</button>
        <a class="btn sec" href="${mailto}">${t('billingMore.email.openMail')}</a></div>
      <label class="opt u-mt-12"><input type="checkbox" id="efmarca"> ${t('billingMore.email.alreadySent')}</label>
      <div class="acts u-end"><button class="btn sec" data-cerrar2>${t('billingMore.email.close')}</button></div>`;
  const share = byId('efsh'); if (share) share.onclick = (): void => { navigator.share({ files: [file], title: invoice.numero ?? '', text: t('billingMore.email.shareText', { number: invoice.numero ?? '' }) }).catch(() => undefined); };
  const download = byId('efdl'); if (download) download.onclick = (): void => { doc.save(pdfFileName(invoice)); };
  const mark = byId('efmarca') as HTMLInputElement | null;
  if (mark) mark.onchange = async (): Promise<void> => {
    if (!mark.checked || !invoice.pedido_id) return;
    await legacyDb().rpc('marcar_operativa', { p_pedido: invoice.pedido_id, p_campo: 'email_factura', p_hecho: true });
    notices.toast(t('billingMore.email.markedSent'));
  };
}

/** enviar_email with the PDF attached; when it fails, its reason comes in the body of the answer. */
async function deliver(invoice: MailInvoice, to: string, doc: PdfDocument): Promise<{ data: SendResult | null; error: FunctionError | null }> {
  const attachment = doc.output('datauristring').split(',')[1] ?? '';
  const response = await legacyDb().functions.invoke<SendResult>('enviar_email', { body: { para: to, asunto: valueOf('efa').trim(), texto: valueOf('eft'),
    adjuntos: [{ nombre: pdfFileName(invoice), base64: attachment, tipo: 'application/pdf' }], factura_id: invoice.id, pedido_id: invoice.pedido_id, marca: 'email_factura' } });
  const error = response.error as FunctionError | null;
  let data = response.data;
  if (error?.context?.json) { try { data = await error.context.json(); } catch { /* no body */ } }
  return { data, error };
}

async function send(invoice: MailInvoice, rectifies: string | null | undefined, button: HTMLButtonElement): Promise<void> {
  const to = valueOf('efp').trim();
  if (!/\S+@\S+\.\S+/.test(to)) { notices.toast(t('billingMore.email.invalid'), true); return; }
  button.disabled = true; button.textContent = t('billingMore.email.preparing');
  const doc = await invoicePdf(invoice, rectifies);
  button.textContent = t('billingMore.email.sending');
  const { data, error } = await deliver(invoice, to, doc);
  button.disabled = false; button.textContent = t('billingMore.email.send');
  if (!error && data?.ok) { dialog()?.close(); notices.toast(t('billingMore.email.sent', { to })); return; }
  paintFallback({ invoice, doc, to, failure: data?.error === 'sin_smtp' ? null : (error?.message ?? data?.error ?? '') });
}

export async function sendInvoiceByEmail(invoice: MailInvoice, rectifies?: string | null): Promise<void> {
  billing2Legacy.setInvoiceMailChosen(null); billing2Legacy.setPdfChosen(null);
  await billing2Legacy.loadSettings();
  const body = byId('dlg2body'); if (!body) return;
  body.innerHTML = formHtml(invoice);
  dialog()?.showModal();
  bindChoices(invoice);
  const ok = byId('efok') as HTMLButtonElement | null; if (ok) ok.onclick = (): void => { void send(invoice, rectifies, ok); };
}
