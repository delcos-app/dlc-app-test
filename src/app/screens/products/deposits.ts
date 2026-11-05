/**
 * Depósitos (v2.471.0, menu entry decided by Eric): every consignment store at a customer centre in one list, with its units and
 * value in consignment, what is pending replenishment (used since the last replenishment) and the batches about to expire. Each
 * row opens the centre's deposit (deposit.ts). A block page: its cards become the table of the list bar (components/list-bar).
 * Each deposit is read with deposito_estado, which checks the company and the portfolio: a centre the user cannot see is left out.
 */
import { currentScreen, isMobile, legacyDb, permissions, purchasesLegacy, relatedLegacy } from '../../legacy/bridge';
import { t } from '../../i18n';
import { escapeHtml, formatNumber } from '../../services/format';
import { orFallback, sum } from '../../services/values';
import type { DepositLine } from './deposit-form';
import { euros } from './model';

const SCREEN = 'deposito';

interface DepositStore { id: string; nombre: string; cuenta_id?: string | null; activo?: boolean; cuentas?: { nombre?: string | null } | null }
interface DepositMovement { tipo: string; unidades: number }
interface DepositDetail { ok?: boolean; lineas?: DepositLine[]; movimientos?: DepositMovement[] }

/** One centre's deposit, as the list shows it. */
export interface DepositSummary { accountId: string; name: string; units: number; products: number; value: number; pending: number; expiring: number }

/** Units used since the last replenishment (the movements come newest first). */
export function pendingUnits(movements: readonly DepositMovement[]): number {
  const lastIn = movements.findIndex(item => item.tipo === 'traspaso_entrada');
  const sinceThen = lastIn < 0 ? movements : movements.slice(0, lastIn);
  return sum(sinceThen.filter(item => item.tipo === 'consumo_deposito').map(item => -item.unidades));
}

function summaryOf(store: DepositStore, detail: DepositDetail): DepositSummary {
  const lines = (detail.lineas ?? []).filter(line => line.unidades > 0);
  const prices = new Map((purchasesLegacy.products() as readonly CatalogProduct[]).map(item => [item.id, Number(item.precio) || 0]));
  return {
    accountId: store.cuenta_id ?? '', name: orFallback(store.cuentas?.nombre, store.nombre),
    units: sum(lines.map(line => line.unidades)), products: new Set(lines.map(line => line.producto_id)).size,
    value: sum(lines.map(line => line.unidades * (prices.get(line.producto_id) ?? 0))),
    pending: pendingUnits(detail.movimientos ?? []), expiring: lines.filter(line => relatedLegacy.expiresSoon(line.caducidad)).length,
  };
}

/** The deposits the user can see, by centre name. */
export async function loadDeposits(): Promise<DepositSummary[] | null> {
  const { data, error } = await legacyDb().from<DepositStore[]>('almacenes').select('id,nombre,cuenta_id,activo,cuentas(nombre)').eq('tipo', 'deposito');
  if (error) return null;
  if (!purchasesLegacy.products().length) await purchasesLegacy.loadProducts();
  const stores = (data ?? []).filter(store => store.cuenta_id && store.activo !== false);
  const details = await Promise.all(stores.map(store => legacyDb().rpc<DepositDetail>('deposito_estado', { p_cuenta: store.cuenta_id })));
  return stores.flatMap((store, index) => {
    const detail = details[index]?.data;
    return detail && detail.ok !== false ? [summaryOf(store, detail)] : [];
  }).sort((first, second) => first.name.localeCompare(second.name, 'es'));
}

function materialText(item: DepositSummary): string {
  if (!item.units) return t('products.deposits.empty');
  return t('products.deposits.material', { units: formatNumber(item.units), products: item.products === 1 ? t('products.deposit.oneProduct') : t('products.deposit.products', { count: item.products }) });
}

function statePill(item: DepositSummary): string {
  if (item.pending) return `<span class="pill p-bor">${t('products.deposits.toReplenish')}</span>`;
  if (item.expiring) return `<span class="pill p-bor">${t('products.deposits.expiring')}</span>`;
  return item.units ? `<span class="pill p-est">${t('products.deposits.upToDate')}</span>` : `<span class="pill p-anu">${t('products.deposits.emptyState')}</span>`;
}

/** A row: the block table reads its cells from the data attributes (components/list-bar/configs/blocks.ts). */
function rowHtml(item: DepositSummary): string {
  const value = permissions.canSeeAmounts() ? euros(item.value) : '—', pending = item.pending ? formatNumber(item.pending) : '—';
  return `<button type="button" class="item conrow" data-dcen="${escapeHtml(item.accountId)}" data-dcen-material="${escapeHtml(materialText(item))}" data-dcen-value="${escapeHtml(value)}" data-dcen-pending="${escapeHtml(pending)}">
      <span class="tx"><b>${escapeHtml(item.name)}</b><span class="sm">${escapeHtml(materialText(item))} · ${escapeHtml(value)}</span></span>
      <span class="cirest">${statePill(item)}</span></button>`;
}

const block = (title: string, list: readonly DepositSummary[]): string =>
  `<section class="card cirbloque"><h2>${title}</h2><div class="lista">${list.map(rowHtml).join('')}</div></section>`;

function pageHtml(list: readonly DepositSummary[]): string {
  // Creating a deposit is done on the computer (docs/movil_alcance.md): on a phone the page only lists and opens them
  const create = isMobile() ? '' : `<div class="evcab"><button type="button" class="btn" id="depnuevo">${t('products.deposits.create')}</button></div>`;
  const pending = list.filter(item => item.pending > 0);
  if (!list.length) return `<div class="cirpag">${create}<section class="card cirbloque"><div class="vacio vlinea">${t('products.deposits.none')}</div></section></div>`;
  return `<div class="cirpag">${create}
    ${pending.length ? block(t('products.deposits.pendingBlock'), pending) : ''}
    ${block(t('products.deposits.all', { count: formatNumber(list.length) }), list)}</div>`;
}

/** Depósitos → «Centros»: the page tab. `openDeposit` opens a centre's deposit and `create` the window that leaves the first material. */
export async function paintDeposits(openDeposit: (accountId: string, name: string) => unknown, create: () => unknown): Promise<void> {
  if (!document.getElementById('cfgcuerpo')) return;
  const list = await loadDeposits();
  // Looked up after the answer: the page may have been painted again meanwhile
  const box = document.getElementById('cfgcuerpo');
  if (!box || currentScreen() !== SCREEN) return;
  if (!list) { box.innerHTML = `<div class="vacio">${t('products.deposits.couldNotLoad')}</div>`; return; }
  box.innerHTML = pageHtml(list);
  const add = document.getElementById('depnuevo'); if (add) add.onclick = (): void => { void create(); };
  box.querySelectorAll<HTMLElement>('[data-dcen]').forEach(button => {
    button.onclick = (): void => { const item = list.find(entry => entry.accountId === button.dataset.dcen); if (item) void openDeposit(item.accountId, item.name); };
  });
}
