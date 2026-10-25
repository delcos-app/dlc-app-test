/**
 * The material in deposit at a centre: what is there by batch and expiry, what was used in 90 days and the last movements, with
 * «Reponer», «Apuntar uso» and «Recuento» (see deposit-form.ts). Migrated from the legacy verDeposito (v2.413.0); verDeposito stays
 * as an adapter (the account card, legado 089 and «‹ Volver» open it by that name).
 */
import { legacyDb, notices, purchasesLegacy, relatedLegacy } from '../../legacy/bridge';
import { t, type MessageKey } from '../../i18n';
import { formatShortDate } from '../../services/date-format';
import { escapeHtml, formatNumber } from '../../services/format';
import { orFallback, sum } from '../../services/values';
import { openDepositForm, type DepositAction, type DepositLine, type DepositState } from './deposit-form';

interface DepositMovement { fecha: string; tipo: string; nombre: string; numero_lote?: string | null; unidades: number; nota?: string | null }
type DepositDetail = DepositState & { ok?: boolean; error?: string; usado_90?: { nombre: string; unidades: number }[]; movimientos?: DepositMovement[] };

const MOVEMENTS = new Map<string, MessageKey>([
  ['traspaso_entrada', 'products.deposit.moveIn'], ['traspaso_salida', 'products.deposit.moveOut'],
  ['consumo_deposito', 'products.deposit.moveUsed'], ['ajuste', 'products.deposit.moveAdjust'],
]);

function summary(lines: readonly DepositLine[]): string {
  const total = sum(lines.map(line => line.unidades));
  if (!total) return t('products.deposit.empty');
  const count = new Set(lines.map(line => line.producto_id)).size;
  return t('products.deposit.unitsOf', { units: formatNumber(total), products: count === 1 ? t('products.deposit.oneProduct') : t('products.deposit.products', { count }) });
}

function tableHtml(lines: readonly DepositLine[]): string {
  if (!lines.length) return `<div class="vacio vlinea">${t('products.deposit.emptyDeposit')}</div>`;
  const rows = lines.map(line => `<div class="depf"><span>${escapeHtml(line.nombre)}</span>
      <span>${escapeHtml(orFallback(line.numero_lote, t('products.deposit.noBatch')))}</span><span class="${relatedLegacy.expiresSoon(line.caducidad) ? 'depcad' : ''}">${line.caducidad ? formatShortDate(line.caducidad) : '—'}</span><b>${formatNumber(line.unidades)}</b></div>`).join('');
  return `<div class="deptab"><div class="deph"><span>${t('products.deposit.product')}</span><span>${t('products.deposit.batch')}</span><span>${t('products.deposit.expires')}</span><span>${t('products.deposit.units')}</span></div>${rows}</div>`;
}

function movementRow(item: DepositMovement): string {
  const key = MOVEMENTS.get(item.tipo);
  return `<div class="depmf"><span>${formatShortDate(String(item.fecha).slice(0, 10))}</span>
      <span>${key ? t(key) : escapeHtml(item.tipo)}</span><span>${escapeHtml(item.nombre)}${item.numero_lote ? ` · ${escapeHtml(item.numero_lote)}` : ''}</span><b>${item.unidades > 0 ? '+' : ''}${formatNumber(item.unidades)}</b>
      <span class="sm">${escapeHtml(String(item.nota ?? '').replace(/\s*\[[^\]]*\]$/, ''))}</span></div>`;
}

function historyHtml(detail: DepositDetail): string {
  const used = detail.usado_90 ?? [], movements = detail.movimientos ?? [];
  const usedText = used.length ? `<p class="sm">${t('products.deposit.used90', { list: used.map(item => `${escapeHtml(item.nombre)} ${formatNumber(item.unidades)}`).join(' · ') })}</p>` : '';
  return usedText + (movements.length ? `<details class="depmov"><summary>${t('products.deposit.lastMovements')}</summary>${movements.map(movementRow).join('')}</details>` : '');
}

function sheetHtml(detail: DepositDetail, name: string, notice: string, lines: readonly DepositLine[]): string {
  const none = lines.length ? '' : 'disabled';
  return `<div class="fh"><div><h2>${t('products.deposit.title', { name: escapeHtml(name) })}</h2><div class="sm">${summary(lines)}${t('products.deposit.stillYours')}</div></div>
      <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
    ${notice}
    <div class="depacts"><button type="button" class="btn" data-dep="reponer">${t('products.deposit.replenish')}</button><button type="button" class="btn sec" data-dep="consumo" ${none}>${t('products.deposit.recordUse')}</button>
      <button type="button" class="btn sec" data-dep="recuento" ${none}>${t('products.deposit.count')}</button></div>
    <div id="depform"></div>
    ${tableHtml(lines)}
    ${historyHtml(detail)}
    <div class="acts u-end"><button type="button" class="btn sec" data-cerrar>${t('common.close')}</button></div>`;
}

export async function showDeposit(accountId: string, name: string, notice = ''): Promise<void> {
  const { data: detail, error } = await legacyDb().rpc<DepositDetail>('deposito_estado', { p_cuenta: accountId });
  if (error || !detail || detail.ok === false) { notices.toast(t(detail?.error === 'permiso' ? 'products.deposit.noPermission' : 'products.deposit.couldNotOpen'), true); return; }
  if (!purchasesLegacy.products().length) await purchasesLegacy.loadProducts();
  const lines = (detail.lineas ?? []).filter(line => line.unidades > 0);
  const body = document.getElementById('dbody'), box = document.getElementById('dlg') as HTMLDialogElement | null;
  if (!body || !box) return;
  body.innerHTML = sheetHtml(detail, name, notice, lines);
  if (!box.open) box.showModal();
  const deposit = { accountId, name, lines };
  body.querySelectorAll<HTMLElement>('[data-dep]').forEach(button => { button.onclick = (): void => { openDepositForm(deposit, (button.dataset.dep ?? 'reponer') as DepositAction); }; });
}
