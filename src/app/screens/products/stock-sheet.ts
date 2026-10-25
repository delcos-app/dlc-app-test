/**
 * The stock sheet of a product: its batches with expiry and store, traceability of each batch, adjust and transfer, a new entry,
 * and its minimum stock and usual supplier. Migrated from the legacy fichaStock and trazabilidad (v2.413.0); fichaStock stays as
 * an adapter (legado 089 and «‹ Volver» open it by that name).
 */
import { callRpc, legacyDb, notices, purchasesLegacy, term } from '../../legacy/bridge';
import { t, type MessageKey } from '../../i18n';
import { formatShortDate } from '../../services/date-format';
import { escapeHtml, formatNumber } from '../../services/format';
import { isPresent, orFallback } from '../../services/values';
import { expiryClass, stockState, type StockBatch, type StockLine } from './model';
import { stockMovement } from './movement';
import { paintStock } from './stock';

interface TraceMovement { fecha: string; tipo: string; unidades: number; pedido?: string | null; cliente?: string | null; telefono?: string | null; medico?: string | null; almacen: string }
interface Trace { lote?: { numero_lote?: string; producto?: string; caducidad?: string | null; proveedor?: string | null; compra?: string | null }; movimientos?: TraceMovement[] }

const MOVEMENTS = new Map<string, MessageKey>([
  ['inicial', 'products.trace.initial'], ['entrada_compra', 'products.trace.purchaseEntry'], ['salida_venta', 'products.trace.sale'],
  ['anulacion_venta', 'products.trace.saleCancelled'], ['salida_muestra', 'products.trace.sample'], ['ajuste', 'products.trace.adjustment'],
  ['traspaso_salida', 'products.trace.transferOut'], ['traspaso_entrada', 'products.trace.transferIn'], ['devolucion', 'products.trace.returned'],
  ['consumo_deposito', 'products.trace.depositUse'], ['consumo_cirugia', 'products.trace.surgeryUse'],
]);

const movementName = (type: string): string => { const key = MOVEMENTS.get(type); return key ? t(key, { visit: term('visita') }) : type; };

function traceRow(item: TraceMovement): string {
  return `<div class="dr u-cursor-default"><span>${formatShortDate(String(item.fecha).slice(0, 10))}</span><span>${escapeHtml(movementName(item.tipo))}${item.pedido ? `<span class="sm">${t('products.trace.order', { number: escapeHtml(item.pedido) })}</span>` : ''}</span>
        <span class="num" style="color:${item.unidades < 0 ? 'var(--danger)' : 'var(--ok)'}"><b>${item.unidades > 0 ? '+' : ''}${formatNumber(item.unidades)}</b></span>
        <span>${escapeHtml(orFallback(item.cliente, '—'))}${item.telefono ? `<span class="sm">${escapeHtml(item.telefono)}</span>` : ''}</span><span class="sm">${escapeHtml(orFallback(item.medico, '—'))}</span><span class="sm">${escapeHtml(item.almacen)}</span></div>`;
}

function batchDetails(batch: NonNullable<Trace['lote']>): string {
  return `${escapeHtml(batch.producto ?? '')}${batch.caducidad ? t('products.trace.expires', { date: formatShortDate(batch.caducidad) }) : ''}${batch.proveedor ? ` · ${escapeHtml(batch.proveedor)}` : ''}${batch.compra ? t('products.trace.purchase', { number: escapeHtml(batch.compra) }) : ''}`;
}

/** Every entry and exit of a batch (and the clients it reached), in the second window. */
export async function traceability(batchId: string): Promise<void> {
  const { data } = await callRpc<Trace>('trazabilidad_lote', { p_lote: batchId });
  const batch = data?.lote ?? {}, movements = data?.movimientos ?? [];
  const body = document.getElementById('dlg2body'), box = document.getElementById('dlg2') as HTMLDialogElement | null;
  if (!body || !box) return;
  const details = batchDetails(batch);
  const head = [t('products.trace.date'), t('products.trace.movement'), t('products.trace.units'), t('products.trace.client'), term('medico', { capital: 'C' }), t('products.trace.store')];
  body.innerHTML = `
    <div class="fh"><div><h2>${t('products.trace.title', { number: escapeHtml(batch.numero_lote ?? '') })}</h2>
      <div class="sm">${details}</div></div>
      <button class="x" data-cerrar2 aria-label="${t('common.close')}">✕</button></div>
    <p class="sm">${t('products.trace.intro')}</p>
    <div class="dgrid-wrap"><div class="dgrid traz">
      <div class="dh">${head.map((title, index) => `<span${index === 2 ? ' class="num"' : ''}>${title}</span>`).join('')}</div>
      ${movements.map(traceRow).join('') || `<div class="vacio">${t('products.trace.none')}</div>`}</div></div>
    <div class="acts u-end"><button class="btn sec" data-cerrar2>${t('common.close')}</button></div>`;
  box.showModal();
}

function summaryText(line: StockLine): string {
  const use = Number(line.consumo_diario) ? t('products.sheet.dailyUse', { value: String(line.consumo_diario).replace('.', ',') }) : t('products.sheet.noUse');
  return `${t('products.sheet.units', { units: formatNumber(line.stock) })} · ${use}${isPresent(line.dias_cobertura) ? t('products.sheet.covers', { days: formatNumber(line.dias_cobertura) }) : ''}`;
}

function settingsHtml(line: StockLine): string {
  const suppliers = purchasesLegacy.suppliers().map(supplier => `<option value="${supplier.id ?? ''}" ${supplier.nombre === line.proveedor ? 'selected' : ''}>${t('products.sheet.supplierOption', { name: escapeHtml(supplier.nombre ?? ''), days: formatNumber(supplier.plazo_dias) })}</option>`).join('');
  return `<div class="g2">
      <div><label for="stmin">${t('products.sheet.minimum')}</label><input id="stmin" type="number" min="0" value="${line.stock_minimo ?? ''}" placeholder="${t('products.sheet.noMinimum')}"></div>
      <div><label for="stprov">${t('products.sheet.supplier')}</label><select id="stprov"><option value="">—</option>${suppliers}</select></div></div>`;
}

function batchHtml(batch: StockBatch, canBuy: boolean): string {
  const expiry = expiryClass(batch.caducidad), manyStores = purchasesLegacy.stores().filter(store => store.activo).length > 1;
  const tools = canBuy ? `<button class="btn sec" data-aju="${batch.id}|${batch.almacen_id}">${t('products.sheet.adjust')}</button>${manyStores ? `<button class="btn sec" data-tras="${batch.id}|${batch.almacen_id}">${t('products.sheet.transfer')}</button>` : ''}` : '';
  return `<div class="item u-cursor-default">
        <span class="ic ${expiry === 'cad-pasada' ? 'w' : ''}">📦</span>
        <span class="tx"><b>${t('products.sheet.batch', { number: escapeHtml(batch.numero_lote), units: formatNumber(batch.unidades) })}</b>
          <span class="sm"><span class="${expiry}">${batch.caducidad ? t('products.sheet.expiresOn', { date: formatShortDate(batch.caducidad) }) : t('products.sheet.noExpiry')}</span>${batch.fecha_fabricacion ? t('products.sheet.madeOn', { date: formatShortDate(batch.fecha_fabricacion) }) : ''} · ${escapeHtml(batch.almacen)}${batch.proveedor ? ` · ${escapeHtml(batch.proveedor)}` : ''}</span></span>
        <span class="acts u-m-0"><button class="btn sec" data-traz="${batch.id}">${t('products.sheet.traceability')}</button>
          ${tools}</span></div>`;
}

function sheetHtml(line: StockLine, canBuy: boolean): string {
  const [label, kind] = stockState(line), batches = line.lotes ?? [];
  return `
    <div class="fh"><div><h2>${escapeHtml(line.nombre)} <span class="pill ${kind}">${label}</span></h2>
      <div class="sm">${summaryText(line)}</div></div>
      <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
    ${canBuy ? settingsHtml(line) : ''}
    <div class="blk"><h3>${t('products.sheet.batches')}</h3>
      ${batches.length ? `<div class="lista">${batches.map(batch => batchHtml(batch, canBuy)).join('')}</div>` : `<div class="sm">${t('products.sheet.noBatches')}</div>`}</div>
    <div class="acts u-end">
      <button class="btn sec" data-cerrar>${t('common.close')}</button>
      ${canBuy ? `<button class="btn sec" id="stent">${t('products.sheet.entry')}</button><button class="btn" id="stgu">${t('products.sheet.saveMinimum')}</button>` : ''}</div>`;
}

async function saveSettings(line: StockLine): Promise<void> {
  const minimum = (document.getElementById('stmin') as HTMLInputElement | null)?.value ?? '', supplier = (document.getElementById('stprov') as HTMLSelectElement | null)?.value ?? '';
  const { error } = await legacyDb().from('productos').update({ stock_minimo: minimum === '' ? null : Number(minimum), proveedor_id: supplier || null }).eq('id', line.id);
  if (error) { notices.toast(t('products.sheet.couldNotSave'), true); return; }
  (document.getElementById('dlg') as HTMLDialogElement | null)?.close(); notices.toast(t('products.sheet.saved')); void paintStock();
}

function bind(body: HTMLElement, line: StockLine): void {
  body.querySelectorAll<HTMLElement>('[data-traz]').forEach(button => { button.onclick = (): void => { void traceability(button.dataset.traz ?? ''); }; });
  for (const [attribute, kind] of [['aju', 'ajuste'], ['tras', 'traspaso']] as const) {
    body.querySelectorAll<HTMLElement>(`[data-${attribute}]`).forEach(button => {
      const [batchId = '', storeId = ''] = (button.dataset[attribute] ?? '').split('|');
      button.onclick = (): void => { void stockMovement(line, kind, { batchId, storeId }); };
    });
  }
  const entry = document.getElementById('stent'); if (entry) entry.onclick = (): void => { void stockMovement(line, 'inicial'); };
  const save = document.getElementById('stgu'); if (save) save.onclick = (): void => { void saveSettings(line); };
}

export async function showStock(line: StockLine): Promise<void> {
  await purchasesLegacy.loadSuppliers();
  const body = document.getElementById('dbody'), box = document.getElementById('dlg') as HTMLDialogElement | null;
  if (!body || !box) return;
  body.innerHTML = sheetHtml(line, purchasesLegacy.canBuy());
  if (!box.open) box.showModal();
  bind(body, line);
}
