/**
 * «Pago» of an order: web origin, payment reference and the receipts (read only: they change with «Editar»), then the card or Bizum
 * payment (tpv/block.ts). Migrated from the legacy pedidoPagoBase, pedidoPago and verJustificante (v2.414.0).
 */
import { legacyDb, notices } from '../../../legacy/bridge';
import { t } from '../../../i18n';
import { formatShortDate } from '../../../services/date-format';
import { escapeHtml, formatNumber } from '../../../services/format';
import type { OrderDetail } from '../model';
import { tpvBlock } from '../tpv/block';

const KILOBYTE = 1024, REVOKE_AFTER_MS = 60000;

interface Receipt { id: string; nombre: string; tamano: number; creado_en: string }

/** Opens a receipt (or downloads it if the browser blocks the new tab). */
async function openReceipt(id: string): Promise<void> {
  const { data, error } = await legacyDb().from<{ nombre: string; tipo: string; datos: string }>('pedidos_justificantes').select('nombre,tipo,datos').eq('id', id).single();
  if (error || !data) { notices.toast(t('orders.payment.couldNotOpen'), true); return; }
  const binary = atob(data.datos), bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: data.tipo }));
  const opened = window.open(url, '_blank');
  if (!opened) { const link = document.createElement('a'); link.href = url; link.download = data.nombre; link.click(); }
  setTimeout(() => { URL.revokeObjectURL(url); }, REVOKE_AFTER_MS);
}

const receiptRow = (receipt: Receipt): string => `<div class="item"><span class="tx"><b>${escapeHtml(receipt.nombre)}</b><span class="sm">${formatShortDate(String(receipt.creado_en).slice(0, 10))} · ${formatNumber(Math.round(receipt.tamano / KILOBYTE))} KB</span></span>
      <button type="button" class="btn sec chico" data-jver="${receipt.id}">${t('orders.payment.see')}</button></div>`;

function blockHtml(detail: OrderDetail, receipts: readonly Receipt[]): string {
  const order = detail.pedido;
  return `<div class="blk" id="pdpago"><h3>${t('orders.payment.title')}</h3>
    ${order.origen === 'web' ? `<p class="sm"><span class="pill p-est">${t('orders.payment.byWeb')}</span></p>` : ''}
    <div class="pdpagof"><span class="sm">${t('orders.payment.reference')}</span><b>${order.pago_referencia ? escapeHtml(order.pago_referencia) : '—'}</b></div>
    ${receipts.length ? `<div class="lista" id="pdjus">${receipts.map(receiptRow).join('')}</div>` : ''}</div>`;
}

async function paintBlock(detail: OrderDetail): Promise<void> {
  const isOpen = (): boolean => Boolean((document.getElementById('dlg') as HTMLDialogElement | null)?.open) && !document.getElementById('pdpago');
  if (!isOpen()) return;
  const { data: receipts } = await legacyDb().from<Receipt[]>('pedidos_justificantes').select('id,nombre,tamano,creado_en').eq('pedido_id', detail.pedido.id).order('creado_en');
  if (!isOpen() || detail.pedido.sin_cargo) return;
  const actions = document.getElementById('dbody')?.querySelector('.acts:last-of-type'); if (!actions) return;
  (document.getElementById('pdops') ?? actions).insertAdjacentHTML('beforebegin', blockHtml(detail, receipts ?? []));
  document.getElementById('pdpago')?.querySelectorAll<HTMLElement>('[data-jver]').forEach(button => { button.onclick = (): void => { void openReceipt(button.dataset.jver ?? ''); }; });
}

export async function paintPayment(detail: OrderDetail): Promise<void> {
  await paintBlock(detail);
  await tpvBlock(detail.pedido.id);
}
