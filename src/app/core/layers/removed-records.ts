/**
 * Deregistering and deleting accounts (v2.311.0) and customers (v2.313.0), with the «dadas de baja» windows reached from the list's
 * «⋯», and the deleted products with «Recuperar» (v2.323.0). Moved from legado 135, 137 and 141 (v2.424.0).
 */
import { term } from '../../legacy/bridge';
import { removedLegacy } from '../../legacy/legado-d-bridge';
import { t } from '../../i18n';
import { escapeHtml } from '../../services/format';

const REMOVE_ITEM_MS = 400, SHOWN = 300;
interface RemovedRow { id: string; nombre: string; tipo?: string | null; referencia?: string | null; archivado_en?: string | null; eliminado_en?: string | null }
interface DeleteResult { ok?: boolean; error?: string; detalle?: Record<string, number> }

const closeCard = (): void => { const card = removedLegacy.dialog('ficha'); if (card?.open) card.close(); };
const failure = (error: { message?: string } | null, result: DeleteResult | null): string => t('legacyD.removed.couldNotDelete', { error: error?.message ?? result?.error ?? '' });

/** A hidden «⋯» entry: a button the list bar clicks, which opens a window with the removed records. */
function hiddenEntry(id: string, open: () => Promise<void>): void {
  document.body.insertAdjacentHTML('beforeend', `<button type="button" id="${id}" class="plmasoc" tabindex="-1" aria-hidden="true"></button>`);
  const button = document.getElementById(id); if (button) button.onclick = (): void => { void open(); };
}

interface RemovedWindow { title: string; hint: string; listId: string; load: () => PromiseLike<RemovedRow[]>; rowHtml: (row: RemovedRow) => string; empty: string }

async function removedWindow({ title, hint, listId, load, rowHtml, empty }: RemovedWindow): Promise<void> {
  const body = document.getElementById('dbody'); if (!body) return;
  body.innerHTML = `<div class="fh"><div><h2>${title}</h2><div class="sm">${hint}</div></div>
    <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div><div id="${listId}"><div class="skel"></div><div class="skel"></div></div>`;
  removedLegacy.dialog('dlg')?.showModal();
  const rows = await load(), list = document.getElementById(listId); if (!list) return;
  list.innerHTML = rows.length ? `<div class="lista">${rows.map(rowHtml).join('')}</div>` : `<div class="vacio">${empty}</div>`;
}

/** After «Dar de alta» in one of those windows, its row goes. */
function removeRowOnClick(selector: string): void {
  document.addEventListener('click', event => {
    const button = (event.target as Element).closest(selector);
    if (button) setTimeout(() => { button.closest('.bajaf')?.remove(); }, REMOVE_ITEM_MS);
  });
}

const since = (date: string | null | undefined): string => removedLegacy.shortDate(String(date).slice(0, 10));

async function deleteAccount(id: string): Promise<void> {
  if (!await removedLegacy.confirm(t('legacyD.removed.deleteAccountText'), { titulo: t('legacyD.removed.deleteAccountTitle'), ok: t('legacyD.removed.delete'), peligro: true })) return;
  const { data: result, error } = await removedLegacy.rpc<DeleteResult>('eliminar_cuenta', { p_id: id });
  if (!error && result?.ok) {
    try { removedLegacy.forgetCache(); } catch { /* nothing cached */ }
    removedLegacy.toast(t('legacyD.removed.accountDeleted')); closeCard();
    if (removedLegacy.currentScreen() === 'directorio') removedLegacy.searchAccounts();
    return;
  }
  if (result?.error === 'historial') {
    const has = Object.entries(result.detalle ?? {}).map(([key, count]) => `${removedLegacy.number(count)} ${removedLegacy.whatAccountHas(key)}`).join(', ');
    if (await removedLegacy.confirm(t('legacyD.removed.accountHistoryText', { has }), { titulo: t('legacyD.removed.accountHistoryTitle'), ok: t('legacyD.removed.deregister') })) {
      if (await removedLegacy.deregisterAccount(id, true)) closeCard();
    }
    return;
  }
  removedLegacy.toast(failure(error as { message?: string } | null, result), true);
}

function listenToAccounts(): void {
  document.addEventListener('click', event => {
    const button = (event.target as Element).closest<HTMLElement>('[data-fbaja], [data-falta], [data-felim]'); if (!button) return;
    void (async (): Promise<void> => {
      const { falta: back, fbaja: away, felim: remove } = button.dataset;
      if (back) { if (await removedLegacy.deregisterAccount(back, false)) closeCard(); return; }
      if (away) {
        if (!await removedLegacy.confirm(t('legacyD.removed.deregisterAccountText'), { titulo: t('legacyD.removed.deregisterAccountTitle'), ok: t('legacyD.removed.deregister') })) return;
        if (await removedLegacy.deregisterAccount(away, true)) closeCard();
        return;
      }
      if (remove) await deleteAccount(remove);
    })();
  });
}

/** Legado 135: accounts. */
export function installRemovedAccounts(): void {
  listenToAccounts();
  hiddenEntry('dirbajas', () => removedWindow({ title: t('legacyD.removed.accountsTitle'), hint: t('legacyD.removed.accountsHint'), listId: 'bajasl',
    load: () => removedLegacy.archived('cuentas', 'id, nombre, tipo, archivado_en', SHOWN),
    rowHtml: row => `<div class="item bajaf"><span class="tx"><b>${escapeHtml(row.nombre)}</b><span class="sm">${row.tipo === 'Centro' ? t('legacyD.removed.centre') : escapeHtml(term('medico', { capital: 'C' }))} · ${t('legacyD.removed.since', { date: since(row.archivado_en) })}</span></span>
      <button type="button" class="btn sec chico" data-falta="${row.id}">${t('legacyD.removed.register')}</button></div>`, empty: t('legacyD.removed.accountsNone') }));
  removeRowOnClick('#bajasl [data-falta]');
  removedLegacy.addListMenuEntry('directorio', ['dirbajas', t('legacyD.removed.accountsTitle')]);
}

async function deleteCustomer(id: string): Promise<void> {
  if (!await removedLegacy.confirm(t('legacyD.removed.deleteCustomerText'), { titulo: t('legacyD.removed.deleteCustomerTitle', { theCustomer: term('paciente', { article: 'el' }) }), ok: t('legacyD.removed.delete'), peligro: true })) return;
  const { data: result, error } = await removedLegacy.rpc<DeleteResult>('eliminar_cliente', { p_id: id });
  if (!error && result?.ok) {
    try { removedLegacy.forgetCache(); removedLegacy.forgetPreloaded(); } catch { /* nothing cached */ }
    removedLegacy.toast(t('legacyD.removed.customerDeleted')); closeCard();
    if (removedLegacy.currentScreen() === 'pacientes') removedLegacy.listCustomers();
    return;
  }
  if (result?.error === 'historial') { await offerCustomerDeregister(id, result.detalle ?? {}); return; }
  removedLegacy.toast(failure(error as { message?: string } | null, result), true);
}

/** A customer with orders or invoices cannot be deleted: deregistering is offered instead. */
async function offerCustomerDeregister(id: string, detail: Record<string, number>): Promise<void> {
  const has = [detail.pedidos ? t('legacyD.removed.orders', { count: removedLegacy.number(detail.pedidos) }) : '', detail.facturas ? t('legacyD.removed.invoices', { count: removedLegacy.number(detail.facturas) }) : ''].filter(Boolean).join(t('legacyD.removed.and'));
  if (await removedLegacy.confirm(t('legacyD.removed.customerHistoryText', { has }), { titulo: t('legacyD.removed.customerHistoryTitle'), ok: t('legacyD.removed.deregister') })) {
    if (await removedLegacy.deregisterCustomer(id, true)) closeCard();
  }
}

function listenToCustomers(): void {
  document.addEventListener('click', event => {
    const button = (event.target as Element).closest<HTMLElement>('[data-cbaja], [data-calta], [data-celim]'); if (!button) return;
    void (async (): Promise<void> => {
      const { calta: back, cbaja: away, celim: remove } = button.dataset;
      if (back) { if (await removedLegacy.deregisterCustomer(back, false) && button.closest('#ficha')) closeCard(); return; }
      if (away) {
        if (!await removedLegacy.confirm(t('legacyD.removed.deregisterCustomerText', { aCustomer: term('paciente', { article: 'un' }), customers: term('paciente', { number: 'p', capital: 'C' }) }), { titulo: t('legacyD.removed.deregisterCustomerTitle'), ok: t('legacyD.removed.deregister') })) return;
        if (await removedLegacy.deregisterCustomer(away, true)) closeCard();
        return;
      }
      if (remove) await deleteCustomer(remove);
    })();
  });
}

/** Legado 137: customers. */
export function installRemovedCustomers(): void {
  listenToCustomers();
  const title = t('legacyD.removed.customersTitle', { customers: term('paciente', { number: 'p', capital: 'C' }) });
  hiddenEntry('clibajas', () => removedWindow({ title: escapeHtml(title), hint: t('legacyD.removed.customersHint'), listId: 'clibajasl',
    load: () => removedLegacy.archived('contactos', 'id, nombre, archivado_en', SHOWN),
    rowHtml: row => `<div class="item bajaf"><span class="tx"><b>${escapeHtml(row.nombre)}</b><span class="sm">${t('legacyD.removed.sinceCapital', { date: since(row.archivado_en) })}</span></span>
      <button type="button" class="btn sec chico" data-calta="${row.id}">${t('legacyD.removed.register')}</button></div>`,
    empty: t('legacyD.removed.customersNone', { customers: escapeHtml(term('paciente', { number: 'p' })) }) }));
  removeRowOnClick('#clibajasl [data-calta]');
  removedLegacy.addListMenuEntry('pacientes', ['clibajas', title]);
}

/** Legado 141: deleted products, with «Recuperar» for who may delete them. */
export function installRemovedProducts(): void {
  hiddenEntry('prodelim', () => removedWindow({ title: t('legacyD.removed.productsTitle'), hint: t('legacyD.removed.productsHint'), listId: 'prodeliml',
    load: () => removedLegacy.deleted('productos', 'id, nombre, referencia, eliminado_en', SHOWN),
    rowHtml: row => `<div class="item bajaf"><span class="tx"><b>${escapeHtml(row.nombre)}</b><span class="sm">${row.referencia ? `${escapeHtml(row.referencia)} · ` : ''}${t('legacyD.removed.deletedOn', { date: since(row.eliminado_en) })}</span></span>
      ${removedLegacy.canDeleteProducts() ? `<button type="button" class="btn sec chico" data-prrec="${row.id}">${t('legacyD.removed.recover')}</button>` : ''}</div>`, empty: t('legacyD.removed.productsNone') }));
  document.addEventListener('click', event => {
    const button = (event.target as Element).closest<HTMLButtonElement>('#prodeliml [data-prrec]'); if (!button) return;
    void (async (): Promise<void> => {
      button.disabled = true;
      const { data: result, error } = await removedLegacy.rpc<{ ok?: boolean }>('recuperar_producto', { p_id: button.dataset.prrec });
      if (error || !result?.ok) { button.disabled = false; removedLegacy.toast(t('legacyD.removed.couldNotRecover'), true); return; }
      removedLegacy.toast(t('legacyD.removed.recovered'));
      button.closest('.bajaf')?.remove();
      removedLegacy.refreshProducts();
    })();
  });
  removedLegacy.addProductsMenuEntry(() => (removedLegacy.canDeleteProducts() ? [['prodelim', t('legacyD.removed.productsTitle')]] : []));
}
