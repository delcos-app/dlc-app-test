/**
 * The forms of a deposit: «Reponer» (from the user's case or the central store), «Apuntar lo usado» (with a reference, without
 * patient data) and «Recuento» (what is missing counts as used). What is used leaves a draft order of the centre and offers to
 * replenish it. Migrated from the legacy formDeposito (v2.413.0).
 */
import { appLegacy, legacyDb, notices, purchasesLegacy } from '../../legacy/bridge';
import { productsLegacy } from '../../legacy/products-bridge';
import { t } from '../../i18n';
import { escapeHtml, formatNumber } from '../../services/format';
import { orFallback } from '../../services/values';

export type DepositAction = 'reponer' | 'consumo' | 'recuento';
export interface DepositLine { producto_id: string; lote_id?: string | null; nombre: string; numero_lote?: string | null; caducidad?: string | null; unidades: number }
export interface DepositState { lineas?: DepositLine[] }
export interface OpenDeposit { accountId: string; name: string; lines: readonly DepositLine[] }

interface MoveResult { ok?: boolean; error?: string; usado?: { producto_id: string; nombre: string; unidades: number }[]; pedido_id?: string | null }

const whole = (input: HTMLInputElement): number => Math.max(0, Math.floor(Number(input.value) || 0));
const batchOf = (line: DepositLine): string => escapeHtml(orFallback(line.numero_lote, t('products.deposit.noBatchLower')));
const actsHtml = (ok: string): string => `<div class="acts u-end"><button type="button" class="btn sec" id="depcanc">${t('common.cancel')}</button><button type="button" class="btn" id="depok">${ok}</button></div>`;

function replenishHtml(): string {
  const products = (purchasesLegacy.products() as readonly (CatalogProduct & { activo?: boolean })[]).filter(item => item.activo !== false && orFallback(item.estado, 'Activo') !== 'Descatalogado');
  return `<div class="depbox"><b>${t('products.deposit.replenishTitle')}</b>
      <div class="segs" id="depori" role="group" aria-label="${t('products.deposit.from')}"><button type="button" data-o="maletin" class="on" aria-pressed="true">${t('products.deposit.fromCase')}</button><button type="button" data-o="central" aria-pressed="false">${t('products.deposit.fromCentral')}</button></div>
      <div class="depitems">${products.map(item => `<label><span>${escapeHtml(item.nombre)}</span><input type="number" min="0" step="1" data-dprod="${item.id}" placeholder="0" aria-label="${t('products.deposit.unitsOfProduct', { name: escapeHtml(item.nombre) })}"></label>`).join('')}</div>
      ${actsHtml(t('products.deposit.replenish'))}</div>`;
}

function useHtml(lines: readonly DepositLine[]): string {
  return `<div class="depbox"><b>${t('products.deposit.useTitle')}</b>
      <div class="depitems">${lines.map((line, index) => `<label><span>${escapeHtml(line.nombre)} <span class="sm">· ${batchOf(line)} · ${t('products.deposit.left', { units: formatNumber(line.unidades) })}</span></span>
        <input type="number" min="0" max="${line.unidades}" step="1" data-dlin="${index}" placeholder="0" aria-label="${t('products.deposit.usedOf', { name: escapeHtml(line.nombre) })}"></label>`).join('')}</div>
      <label for="depref">${t('products.deposit.reference')}</label><input id="depref" maxlength="120" placeholder="${t('products.deposit.referencePlaceholder')}">
      ${actsHtml(t('products.deposit.record'))}</div>`;
}

function countHtml(lines: readonly DepositLine[]): string {
  return `<div class="depbox"><b>${t('products.deposit.countTitle')}</b><span class="sm">${t('products.deposit.countHint')}</span>
      <div class="depitems">${lines.map((line, index) => `<label><span>${escapeHtml(line.nombre)} <span class="sm">· ${batchOf(line)} · ${t('products.deposit.had', { units: formatNumber(line.unidades) })}</span></span>
        <input type="number" min="0" step="1" data-dcnt="${index}" value="${line.unidades}" aria-label="${t('products.deposit.countedOf', { name: escapeHtml(line.nombre) })}"></label>`).join('')}</div>
      ${actsHtml(t('products.deposit.saveCount'))}</div>`;
}

/** The request to deposito_mover, or a message when something is missing. */
function request(form: HTMLElement, deposit: OpenDeposit, action: DepositAction): Record<string, unknown> | string {
  const base = { cuenta_id: deposit.accountId, accion: action, op_id: `d${Date.now()}` };
  if (action === 'reponer') {
    const items = [...form.querySelectorAll<HTMLInputElement>('[data-dprod]')].map(input => ({ producto_id: input.dataset.dprod, unidades: whole(input) })).filter(item => item.unidades > 0);
    return items.length ? { ...base, origen: form.querySelector<HTMLElement>('#depori .on')?.dataset.o, items } : t('products.deposit.writeReplenish');
  }
  const lineAt = (input: HTMLInputElement, key: string): DepositLine | undefined => deposit.lines[Number(input.dataset[key])];
  if (action === 'consumo') {
    const items = [...form.querySelectorAll<HTMLInputElement>('[data-dlin]')].map(input => { const line = lineAt(input, 'dlin'); return { producto_id: line?.producto_id, lote_id: line?.lote_id, unidades: whole(input), max: line?.unidades ?? 0 }; }).filter(item => item.unidades > 0);
    if (!items.length) return t('products.deposit.writeUsed');
    if (items.some(item => item.unidades > item.max)) return t('products.deposit.tooMany');
    return { ...base, items, referencia: (document.getElementById('depref') as HTMLInputElement | null)?.value.trim() ?? '' };
  }
  return { ...base, items: [...form.querySelectorAll<HTMLInputElement>('[data-dcnt]')].map(input => { const line = lineAt(input, 'dcnt'); return { producto_id: line?.producto_id, lote_id: line?.lote_id, contadas: whole(input) }; }) };
}

function failureText(result: MoveResult | null): string {
  if (result?.error === 'sin_origen') return t('products.deposit.noSource');
  return t(result?.error === 'permiso' ? 'products.deposit.noMovePermission' : 'products.deposit.couldNotSave');
}

async function replenishUsed(deposit: OpenDeposit, used: NonNullable<MoveResult['usado']>, button: HTMLButtonElement): Promise<void> {
  button.disabled = true;
  const { data: result } = await legacyDb().rpc<MoveResult>('deposito_mover', { p: { cuenta_id: deposit.accountId, accion: 'reponer', items: used.map(item => ({ producto_id: item.producto_id, unidades: item.unidades })), op_id: `r${Date.now()}` } });
  if (!result || result.ok === false) { button.disabled = false; notices.toast(result?.error === 'sin_origen' ? t('products.deposit.noSource') : t('products.deposit.couldNotReplenish'), true); return; }
  notices.toast(t('products.deposit.usedReplenished')); void productsLegacy.openDeposit(deposit.accountId, deposit.name);
}

/** After saving: the toast, and for what was used, the notice with «Ver el pedido» and «Reponer lo usado». */
async function afterSave(deposit: OpenDeposit, action: DepositAction, result: MoveResult): Promise<void> {
  const used = result.usado ?? [];
  let notice = '';
  if (action === 'reponer') notices.toast(t('products.deposit.replenished'));
  else if (!used.length) notices.toast(t('products.deposit.nothingMissing'));
  else {
    notices.toast(t('products.deposit.usedRecorded'));
    notice = `<div class="banda-ok depaviso">${t('products.deposit.usedNotice', { list: used.map(item => `${escapeHtml(item.nombre)} ${formatNumber(item.unidades)}`).join(' · ') })}
        <span class="depav"><button type="button" class="btn sec" id="depverped">${t('products.deposit.seeOrder')}</button><button type="button" class="btn" id="depreponer">${t('products.deposit.replenishUsed')}</button></span></div>`;
  }
  await productsLegacy.openDeposit(deposit.accountId, deposit.name, notice);
  const order = document.getElementById('depverped'), again = document.getElementById('depreponer') as HTMLButtonElement | null;
  if (order && result.pedido_id) order.onclick = (): void => { appLegacy.openOrder(result.pedido_id ?? ''); };
  if (again) again.onclick = (): void => { void replenishUsed(deposit, used, again); };
}

async function save(form: HTMLElement, deposit: OpenDeposit, action: DepositAction, button: HTMLButtonElement): Promise<void> {
  const payload = request(form, deposit, action);
  if (typeof payload === 'string') { notices.toast(payload, true); return; }
  button.disabled = true;
  const { data: result, error } = await legacyDb().rpc<MoveResult>('deposito_mover', { p: payload });
  button.disabled = false;
  if (error || !result || result.ok === false) { notices.toast(failureText(result), true); return; }
  await afterSave(deposit, action, result);
}

export function openDepositForm(deposit: OpenDeposit, action: DepositAction): void {
  const form = document.getElementById('depform'); if (!form) return;
  form.innerHTML = action === 'reponer' ? replenishHtml() : action === 'consumo' ? useHtml(deposit.lines) : countHtml(deposit.lines);
  const origins = form.querySelectorAll<HTMLElement>('[data-o]');
  origins.forEach(button => { button.onclick = (): void => { origins.forEach(other => { other.classList.toggle('on', other === button); other.setAttribute('aria-pressed', String(other === button)); }); }; });
  const cancel = document.getElementById('depcanc'); if (cancel) cancel.onclick = (): void => { form.innerHTML = ''; };
  const ok = document.getElementById('depok') as HTMLButtonElement | null; if (ok) ok.onclick = (): void => { void save(form, deposit, action, ok); };
}
