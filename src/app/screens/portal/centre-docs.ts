/**
 * Documents of the centre portal: the batches and invoices of each order, the proforma invoice to pay in advance and the material
 * to download. Migrated from the legacy pcExtraPed, pcDebeHtml, pcProforma, pcFactura, pcMaterialBajar, pcDescargas and the click
 * listeners of legado 123 and 124 (v2.413.0).
 */
import { callRpc, notices } from '../../legacy/bridge';
import { portalPageLegacy, type InvoiceData } from '../../legacy/portal-bridge';
import { t } from '../../i18n';
import { formatShortDate } from '../../services/date-format';
import { escapeHtml, formatNumber } from '../../services/format';
import { failureText, helpButton } from './model';

export interface CentreOrder {
  id: string; numero?: string | null; fecha: string; estado: string; total?: number | null; proforma?: boolean;
  lineas?: { producto: string; unidades: number; regalo?: boolean }[]; lotes?: { producto: string; lote: string; caducidad?: string | null }[];
  facturas?: { id: string; numero?: string | null; rectificativa?: boolean }[];
}

const MEGABYTE = 1048576, KILOBYTE = 1024, URL_LIFE_MS = 30000;

/** The batches (with expiry) and the invoices of an order. */
export function orderExtras(order: CentreOrder): string {
  const batches = order.lotes ?? [], invoices = order.facturas ?? [];
  const batchText = batches.map(batch => `${escapeHtml(batch.producto)} ${escapeHtml(batch.lote)}${batch.caducidad ? t('portal.docs.expires', { date: formatShortDate(String(batch.caducidad).slice(0, 10)) }) : ''}`).join(' · ');
  return (batches.length ? `<span class="sm pclotes">${t(batches.length > 1 ? 'portal.docs.batches' : 'portal.docs.batch')}: ${batchText}</span>` : '')
    + (invoices.length ? `<span class="pcfacs">${invoices.map(invoice => `<button type="button" class="lnk" data-pcfac="${invoice.id}">${t(invoice.rectificativa ? 'portal.docs.correction' : 'portal.docs.invoice')} ${escapeHtml(invoice.numero ?? '')}</button>`).join('')}</span>` : '');
}

/** The notice of orders waiting to be paid in advance. */
export function owesHtml(orders: readonly CentreOrder[]): string {
  const count = orders.filter(order => order.proforma).length;
  if (!count) return '';
  return `<div class="pmaviso pcdebe"><div><b>${count === 1 ? t('portal.docs.oneToPay') : t('portal.docs.toPay', { count: formatNumber(count) })}</b><span class="sm">${t('portal.docs.toPayText')}</span></div></div>`;
}

async function withButton(button: HTMLButtonElement | null, work: () => Promise<void>, failure: (error: unknown) => void): Promise<void> {
  if (button) button.disabled = true;
  try { await work(); } catch (error) { failure(error); } finally { if (button) button.disabled = false; }
}

async function proforma(id: string, button: HTMLButtonElement | null): Promise<void> {
  await withButton(button, async () => {
    const { data } = await callRpc<InvoiceData>('portal_proforma', { p_id: id });
    if (!data?.ok) { notices.toast(data?.motivo === 'no_encontrado' ? t('portal.docs.notPending') : failureText(data), true); return; }
    await portalPageLegacy.saveInvoice(data, '', { titulo: t('portal.docs.proformaTitle'), formaPago: true, iban: true, vencimiento: false }, `${data.numero ?? ''}.pdf`);
    notices.toast(t('portal.docs.proformaSaved', { concept: data.concepto ?? '' }));
  }, error => { notices.toast(t('portal.docs.proformaFailed'), true); portalPageLegacy.reportError('Proforma del portal', error); });
}

async function invoice(id: string, button: HTMLButtonElement | null): Promise<void> {
  await withButton(button, async () => {
    const { data } = await callRpc<InvoiceData>('portal_factura', { p_id: id });
    if (!data?.ok) { notices.toast(failureText(data), true); return; }
    await portalPageLegacy.saveInvoice(data, data.rectifica_num ?? '', {}, null);
  }, error => { notices.toast(t('portal.docs.invoiceFailed'), true); portalPageLegacy.reportError('Factura del portal', error); });
}

interface MaterialFile { ok?: boolean; motivo?: string; datos?: string; tipo?: string; nombre?: string }

async function download(id: string, button: HTMLButtonElement | null): Promise<void> {
  await withButton(button, async () => {
    const { data } = await callRpc<MaterialFile>('portal_material_archivo', { p_id: id });
    if (!data?.ok) { notices.toast(failureText(data), true); return; }
    const binary = atob(data.datos ?? ''), bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type: data.tipo ?? 'application/octet-stream' }));
    const link = document.createElement('a'); link.href = url; link.download = data.nombre ?? 'material'; document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => { URL.revokeObjectURL(url); }, URL_LIFE_MS);
  }, () => { notices.toast(t('portal.docs.downloadFailed'), true); });
}

interface Downloadable { id: string; nombre: string; producto: string; tipo?: string; tamano?: number | null }

const sizeText = (bytes: number | null | undefined): string => {
  if (!bytes) return '';
  return bytes > MEGABYTE ? `${(bytes / MEGABYTE).toLocaleString(t('dates.locale'), { maximumFractionDigits: 1 })} MB` : `${Math.max(1, Math.round(bytes / KILOBYTE))} KB`;
};

const downloadRow = (item: Downloadable): string => `<div class="item"><span class="tx"><b>${escapeHtml(item.nombre)}</b>
      <span class="sm">${escapeHtml(item.producto)} · ${t(item.tipo === 'application/pdf' ? 'portal.docs.pdf' : 'portal.docs.image')}${item.tamano ? ` · ${sizeText(item.tamano)}` : ''}</span></span>
      <button type="button" class="btn sec chico" data-pcmat="${item.id}">${t('portal.docs.download')}</button></div>`;

/** «Material para descargar» at the top of «Material y dudas». */
export async function paintDownloads(): Promise<void> {
  const place = document.getElementById('pmmat'); if (!place || document.getElementById('pcdesc')) return;
  const title = t('portal.docs.downloadsTitle');
  place.insertAdjacentHTML('afterbegin', `<div class="card ancard" id="pcdesc"><h2>${title} ${helpButton(title, t('portal.docs.downloadsHelp'))}</h2><div id="pcdescl">${portalPageLegacy.skeletonCard(t('common.loading'))}</div></div>`);
  const { data } = await callRpc<Downloadable[]>('portal_materiales', {});
  const box = document.getElementById('pcdescl'); if (!box) return;
  const list = Array.isArray(data) ? data : [];
  box.innerHTML = list.length ? `<div class="lista">${list.map(downloadRow).join('')}</div>` : `<p class="sm">${t('portal.docs.noDownloads')}</p>`;
}

/** Proforma, invoice and material buttons wherever they are painted. */
export function listenToCentreDocs(): void {
  document.addEventListener('click', event => {
    const button = (event.target as Element | null)?.closest<HTMLButtonElement>('[data-pcpro], [data-pcfac], [data-pcmat]');
    if (!button) return;
    const data = button.dataset;
    if (data.pcpro) void proforma(data.pcpro, button);
    else if (data.pcfac) void invoice(data.pcfac, button);
    else if (data.pcmat) void download(data.pcmat, button);
  });
}
