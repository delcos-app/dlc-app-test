/**
 * Pedidos → «Proveedores»: the list of suppliers and the window to create or change one. Migrated from the legacy
 * pintarProveedores and editorProveedor (v2.409.0); both names stay as adapters (Pedidos calls them).
 */
import { currentScreen, legacyDb, notices, purchasesLegacy } from '../../legacy/bridge';
import { t, type MessageKey } from '../../i18n';
import { formatShortDate } from '../../services/date-format';
import { escapeHtml, formatNumber } from '../../services/format';
import { orFallback } from '../../services/values';
import { loadingHtml } from './list';
import { DEFAULT_LEAD_DAYS, type Supplier } from './model';

const joined = (values: readonly (string | null | undefined)[]): string => values.filter(Boolean).join(' · ');

function rowHtml(supplier: Supplier): string {
  return `<button class="dr" data-prov="${supplier.id ?? ''}" style="${supplier.activo ? '' : 'opacity:.55'}">
      <span><b>${escapeHtml(supplier.nombre)}</b><span class="sm">${escapeHtml(joined([supplier.municipio, supplier.pais]))}</span></span>
      <span>${escapeHtml(orFallback(supplier.nif, '—'))}</span><span class="sm">${escapeHtml(orFallback(joined([supplier.contacto, supplier.email, supplier.telefono]), '—'))}</span>
      <span class="num">${t('purchases.suppliers.days', { count: formatNumber(supplier.plazo_dias ?? 0) })}</span><span class="num">${formatNumber(supplier.compras)}</span>
      <span>${supplier.ultima_compra ? formatShortDate(supplier.ultima_compra) : '—'}</span>
      <span><span class="pill ${supplier.activo ? 'p-est' : 'p-anu'}">${t(supplier.activo ? 'purchases.suppliers.active' : 'purchases.suppliers.inactive')}</span></span></button>`;
}

function listHtml(suppliers: readonly Supplier[]): string {
  if (!suppliers.length) return `<div class="vacio">${t('purchases.suppliers.none')}</div>`;
  const head = [['', 'supplier'], ['', 'taxId'], ['', 'contact'], ['num', 'leadTime'], ['num', 'purchases'], ['', 'lastPurchase'], ['', 'state']] as const;
  return `<div class="dgrid-wrap"><div class="dgrid provs">
    <div class="dh">${head.map(([kind, key]) => `<span${kind ? ` class="${kind}"` : ''}>${t(`purchases.suppliers.${key}`)}</span>`).join('')}</div>
    ${suppliers.map(rowHtml).join('')}
  </div></div>`;
}

export async function paintSuppliers(): Promise<void> {
  const loading = document.getElementById('vcuerpo');
  if (loading) loading.innerHTML = loadingHtml(t('purchases.suppliers.loading'));
  await purchasesLegacy.loadSuppliers();
  const box = document.getElementById('vcuerpo'); if (!box) return;
  const suppliers = purchasesLegacy.suppliers();
  box.innerHTML = `<div class="panel">${listHtml(suppliers)}</div>`;
  box.querySelectorAll<HTMLElement>('[data-prov]').forEach(button => {
    button.onclick = (): void => { editSupplier(suppliers.find(supplier => supplier.id === button.dataset.prov) ?? null); };
  });
}

/** The fields of the window, in pairs: [database field, label key, extra attributes]. */
const FIELDS: readonly (readonly [string, MessageKey, string?])[] = [
  ['nombre', 'purchases.supplierEditor.name'], ['nif', 'purchases.supplierEditor.taxId'],
  ['contacto', 'purchases.supplierEditor.contact'], ['email', 'purchases.supplierEditor.email', 'type="email"'],
  ['telefono', 'purchases.supplierEditor.phone'], ['direccion', 'purchases.supplierEditor.address'],
  ['cp', 'purchases.supplierEditor.postcode'], ['municipio', 'purchases.supplierEditor.town'],
  ['provincia', 'purchases.supplierEditor.province'], ['pais', 'purchases.supplierEditor.country'],
  ['plazo_dias', 'purchases.supplierEditor.leadTime', 'type="number" min="0"'], ['forma_pago', 'purchases.supplierEditor.payment'],
  ['condiciones', 'purchases.supplierEditor.conditions'], ['cuenta_contable', 'purchases.supplierEditor.account', 'placeholder="400xxxxx"'],
];
const SAVED_FIELDS = [...FIELDS.map(([name]) => name), 'nota'];

function fieldHtml(supplier: Supplier, [name, label, extra = '']: readonly [string, MessageKey, string?], readOnly: string): string {
  const current = supplier[name];
  return `<div><label for="pv_${name}">${t(label)}</label><input id="pv_${name}" value="${escapeHtml(current ?? '')}" ${extra} ${readOnly}></div>`;
}

function editorHtml(supplier: Supplier, canBuy: boolean): string {
  const readOnly = canBuy ? '' : 'disabled', pairs: string[] = [];
  for (let i = 0; i < FIELDS.length; i += 2) pairs.push(`<div class="g2">${FIELDS.slice(i, i + 2).map(item => fieldHtml(supplier, item, readOnly)).join('')}</div>`);
  return `
    <div class="fh"><div><h2>${supplier.id ? escapeHtml(supplier.nombre) : t('purchases.supplierEditor.newTitle')}</h2><div class="sm">${t('purchases.supplierEditor.subtitle')}</div></div>
      <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
    ${pairs.join('\n    ')}
    <label for="pv_nota">${t('purchases.supplierEditor.note')}</label><input id="pv_nota" value="${escapeHtml(supplier.nota ?? '')}" ${readOnly}>
    ${supplier.id ? `<label class="opt u-mt-10"><input type="checkbox" id="pv_activo" ${supplier.activo ? 'checked' : ''} ${readOnly}> ${t('purchases.supplierEditor.active')}</label>` : ''}
    <div class="acts u-end"><button class="btn sec" data-cerrar>${t('purchases.supplierEditor.close')}</button>${canBuy ? `<button class="btn" id="pvok">${t(supplier.id ? 'purchases.supplierEditor.save' : 'purchases.supplierEditor.create')}</button>` : ''}</div>`;
}

function readValues(supplier: Supplier): Record<string, unknown> {
  const values: Record<string, unknown> = { id: supplier.id ?? null };
  for (const name of SAVED_FIELDS) values[name] = ((document.getElementById(`pv_${name}`) as HTMLInputElement | null)?.value ?? '').trim();
  const active = document.getElementById('pv_activo') as HTMLInputElement | null;
  if (active) values.activo = active.checked;
  return values;
}

async function save(supplier: Supplier): Promise<void> {
  const values = readValues(supplier);
  if (!values.nombre) { notices.toast(t('purchases.supplierEditor.writeName'), true); return; }
  const { data: result, error } = await legacyDb().rpc<{ ok?: boolean }>('guardar_proveedor', { p: values });
  if (error || result?.ok === false) { notices.toast(t('purchases.supplierEditor.couldNotSave'), true); return; }
  (document.getElementById('dlg') as HTMLDialogElement | null)?.close();
  notices.toast(t(supplier.id ? 'purchases.supplierEditor.saved' : 'purchases.supplierEditor.created'));
  await purchasesLegacy.loadSuppliers();
  if (currentScreen() === 'ventas' && purchasesLegacy.section() === 'proveedores') void paintSuppliers();
}

/** Opens the window of `existing`, or of a new supplier (active, 90 days, Spain). */
export function editSupplier(existing: Supplier | null): void {
  const supplier: Supplier = existing ?? { activo: true, plazo_dias: DEFAULT_LEAD_DAYS, pais: t('purchases.supplierEditor.defaultCountry') };
  const body = document.getElementById('dbody'), box = document.getElementById('dlg') as HTMLDialogElement | null;
  if (!body || !box) return;
  body.innerHTML = editorHtml(supplier, purchasesLegacy.canBuy());
  box.showModal();
  const ok = document.getElementById('pvok'); if (ok) ok.onclick = (): void => { void save(supplier); };
}
