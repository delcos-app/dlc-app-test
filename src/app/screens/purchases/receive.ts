/**
 * «Recibir mercancía» of a purchase order: each pending product with one or more batches (units, batch number, expiry,
 * manufacture date and store). Migrated from the legacy recibirCompra (v2.409.0).
 */
import { legacyDb, notices, purchasesLegacy } from '../../legacy/bridge';
import { t } from '../../i18n';
import { escapeHtml, formatNumber } from '../../services/format';
import { errorText, type PurchaseDetail, type PurchaseLine } from './model';

interface ReceivedRow { linea_id: string; unidades: number; numero_lote: string; caducidad: string; fecha_fabricacion: string; almacen_id: string }

const field = (row: Element, name: string): string => row.querySelector<HTMLInputElement>(`[data-r=${name}]`)?.value ?? '';

function lineHtml(line: PurchaseLine, storeId: string | undefined): string {
  const pending = line.unidades - (line.recibidas ?? 0);
  return `<div class="lin" data-rl="${line.id ?? ''}">
      <b>${escapeHtml(line.producto)}</b> <span class="sm">${t('purchases.receive.pending', { pending: formatNumber(pending), units: formatNumber(line.unidades) })}</span>
      <div class="rclotes">${purchasesLegacy.batchFields(line, pending, storeId)}</div>
      <button type="button" class="kcfg" data-rlmas="${line.id ?? ''}">${t('purchases.receive.otherBatch')}</button></div>`;
}

function readRows(box: HTMLElement): ReceivedRow[] {
  return [...box.querySelectorAll('.rcl')].map(row => ({
    linea_id: row.closest<HTMLElement>('[data-rl]')?.dataset.rl ?? '', unidades: Number(field(row, 'u')) || 0,
    numero_lote: field(row, 'lote').trim(), caducidad: field(row, 'cad'), fecha_fabricacion: field(row, 'fab'), almacen_id: field(row, 'alm'),
  })).filter(row => row.unidades > 0);
}

/** Checks the rows; without an expiry date it asks before going on. */
async function checked(rows: readonly ReceivedRow[]): Promise<boolean> {
  if (!rows.length) { notices.toast(t('purchases.receive.writeUnits'), true); return false; }
  if (rows.some(row => !row.numero_lote)) { notices.toast(t('purchases.receive.needsBatch'), true); return false; }
  if (!rows.some(row => !row.caducidad)) return true;
  return notices.confirm(t('purchases.receive.noExpiryText'), { titulo: t('purchases.receive.noExpiryTitle'), ok: t('purchases.receive.noExpiryOk') });
}

async function record(id: string, box: HTMLElement, button: HTMLButtonElement): Promise<void> {
  const rows = readRows(box);
  if (!await checked(rows)) return;
  button.disabled = true;
  const { data: result, error } = await legacyDb().rpc<{ ok?: boolean; error?: string; pendientes?: number }>('recibir_compra', { p_compra: id, p_lineas: rows });
  if (error || !result || result.ok === false) {
    button.disabled = false;
    notices.toast(t('purchases.receive.couldNot', { error: errorText(error, result) }), true); return;
  }
  (document.getElementById('dlg') as HTMLDialogElement | null)?.close();
  notices.toast(result.pendientes ? t('purchases.receive.stillToCome', { units: formatNumber(result.pendientes) }) : t('purchases.receive.complete'));
  purchasesLegacy.reloadSales();
}

export function receivePurchase(id: string, detail: PurchaseDetail): void {
  const pending = detail.lineas.filter(line => line.unidades > (line.recibidas ?? 0));
  const stores = purchasesLegacy.stores(), storeId = (stores.find(store => store.tipo === 'central') ?? stores[0])?.id;
  const body = document.getElementById('dbody'); if (!body) return;
  body.innerHTML = `
    <div class="fh"><div><h2>${t('purchases.receive.title', { number: escapeHtml(detail.compra.numero) })}</h2>
      <div class="sm">${t('purchases.receive.subtitle')}</div></div>
      <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
    <div id="rclin">${pending.map(line => lineHtml(line, storeId)).join('')}</div>
    <div class="acts u-end"><button class="btn sec" data-cerrar>${t('purchases.receive.cancel')}</button><button class="btn" id="rcok">${t('purchases.receive.record')}</button></div>`;
  const box = document.getElementById('rclin'); if (!box) return;
  box.querySelectorAll<HTMLElement>('[data-rlmas]').forEach(button => {
    button.onclick = (): void => {
      const line = pending.find(item => item.id === button.dataset.rlmas);
      if (line) button.previousElementSibling?.insertAdjacentHTML('beforeend', purchasesLegacy.batchFields(line, '', storeId));
    };
  });
  const ok = document.getElementById('rcok') as HTMLButtonElement | null;
  if (ok) ok.onclick = (): void => { void record(id, box, ok); };
}
