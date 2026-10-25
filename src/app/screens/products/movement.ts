/**
 * A stock movement in the second window: a stock entry with its batch, an inventory adjustment of a batch, or a transfer of a
 * batch to another store (for example a salesperson's case). Migrated from the legacy movimientoStock (v2.413.0).
 */
import { currentScreen, legacyDb, notices, purchasesLegacy } from '../../legacy/bridge';
import { t } from '../../i18n';
import { escapeHtml } from '../../services/format';
import { orFallback } from '../../services/values';
import { errorMessage, type StockLine } from './model';
import { paintStock } from './stock';

export type MovementKind = 'inicial' | 'ajuste' | 'traspaso';
export interface BatchPlace { batchId: string; storeId: string }

const TEXTS = {
  inicial: ['products.movement.entryTitle', 'products.movement.entryHint'],
  ajuste: ['products.movement.adjustTitle', 'products.movement.adjustHint'],
  traspaso: ['products.movement.transferTitle', 'products.movement.transferHint'],
} as const;

const value = (id: string): string => (document.getElementById(id) as HTMLInputElement | null)?.value ?? '';
const options = (list: readonly { id?: string; nombre?: string }[], selected?: string): string =>
  list.map(item => `<option value="${item.id ?? ''}" ${selected && item.id === selected ? 'selected' : ''}>${escapeHtml(item.nombre ?? '')}</option>`).join('');

function entryHtml(line: StockLine | null): string {
  const stores = purchasesLegacy.stores().filter(store => store.activo);
  return `<div class="g2">
      <div><label for="mvp">${t('products.movement.product')}</label><select id="mvp">${options(purchasesLegacy.products(), line?.id)}</select></div>
      <div><label for="mva">${t('products.movement.store')}</label><select id="mva">${options(stores)}</select></div></div>
      <div class="g2"><div><label for="mvl">${t('products.movement.batch')}</label><input id="mvl" placeholder="${t('products.movement.batchPlaceholder')}"></div>
        <div><label for="mvpr">${t('products.movement.supplier')}</label><select id="mvpr"><option value="">—</option>${options(purchasesLegacy.suppliers())}</select></div></div>
      <div class="g2"><div><label for="mvc">${t('products.movement.expiry')}</label><input id="mvc" type="date"></div><div><label for="mvf">${t('products.movement.made')}</label><input id="mvf" type="date"></div></div>`;
}

function formHtml(line: StockLine | null, kind: MovementKind, place: BatchPlace | undefined): string {
  const [title, hint] = TEXTS[kind], adjust = kind === 'ajuste';
  const destinations = purchasesLegacy.stores().filter(store => store.activo && store.id !== place?.storeId);
  return `
    <div class="fh"><div><h2>${t(title)}</h2><div class="sm">${t(hint)}</div></div>
      <button class="x" data-cerrar2 aria-label="${t('common.close')}">✕</button></div>
    ${kind === 'inicial' ? entryHtml(line) : ''}
    ${kind === 'traspaso' ? `<label for="mvd">${t('products.movement.destination')}</label><select id="mvd">${options(destinations)}</select>` : ''}
    <div class="g2"><div><label for="mvu">${t(adjust ? 'products.movement.unitsSigned' : 'products.movement.units')}</label><input id="mvu" type="number" ${adjust ? '' : 'min="1"'}></div>
      <div><label for="mvn">${t('products.movement.note')}</label><input id="mvn" placeholder="${t(adjust ? 'products.movement.adjustPlaceholder' : 'products.movement.optional')}"></div></div>
    <div class="acts u-end"><button class="btn sec" data-cerrar2>${t('common.cancel')}</button><button class="btn" id="mvok">${t('products.movement.register')}</button></div>`;
}

function payload(line: StockLine | null, kind: MovementKind, place: BatchPlace | undefined, units: number): Record<string, unknown> {
  const note = value('mvn').trim();
  if (kind === 'inicial') {
    return { tipo: kind, producto_id: value('mvp'), almacen_id: value('mva'), numero_lote: value('mvl').trim(), caducidad: value('mvc'), fecha_fabricacion: value('mvf'),
      proveedor_id: value('mvpr'), unidades: units, nota: note };
  }
  return { tipo: kind, producto_id: line?.id, lote_id: place?.batchId, almacen_id: place?.storeId, destino_id: document.getElementById('mvd') ? value('mvd') : null, unidades: units, nota: note };
}

/** What is missing before registering, or ''. */
function missing(kind: MovementKind, units: number): string {
  if (!units) return t('products.movement.writeUnits');
  return kind === 'inicial' && !value('mvl').trim() ? t('products.movement.writeBatch') : '';
}

async function register(line: StockLine | null, kind: MovementKind, place: BatchPlace | undefined): Promise<void> {
  const units = Number(value('mvu')), problem = missing(kind, units);
  if (problem) { notices.toast(problem, true); return; }
  const { data: result, error } = await legacyDb().rpc<{ ok?: boolean; error?: string }>('movimiento_manual', { p: payload(line, kind, place, units) });
  if (error || result?.ok === false) { notices.toast(t('products.movement.failed', { error: orFallback(errorMessage(error), result?.error ?? '') }), true); return; }
  for (const id of ['dlg2', 'dlg']) (document.getElementById(id) as HTMLDialogElement | null)?.close();
  notices.toast(t('products.movement.registered'));
  if (currentScreen() === 'productos') void paintStock();
}

/** Opens the movement window; `place` is the batch and store of an adjustment or a transfer. */
export async function stockMovement(line: StockLine | null, kind: MovementKind, place?: BatchPlace): Promise<void> {
  await Promise.all([purchasesLegacy.loadProducts(), purchasesLegacy.loadStores(), purchasesLegacy.loadSuppliers()]);
  const body = document.getElementById('dlg2body'), box = document.getElementById('dlg2') as HTMLDialogElement | null;
  if (!body || !box) return;
  body.innerHTML = formHtml(line, kind, place);
  box.showModal();
  const ok = document.getElementById('mvok'); if (ok) ok.onclick = (): void => { void register(line, kind, place); };
}
