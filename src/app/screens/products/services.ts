/**
 * Productos → «Servicios»: the services an order can carry (shipping, urgent delivery…) and their editor, with the price without
 * and with VAT kept in step. Migrated from the legacy pintarServicios and editorServicio (v2.413.0).
 */
import { callRpc, cardSectionsLegacy, currentScreen, legacyDb, notices, purchasesLegacy } from '../../legacy/bridge';
import { productsLegacy } from '../../legacy/products-bridge';
import { t } from '../../i18n';
import { escapeHtml, formatNumber } from '../../services/format';
import { isPresent } from '../../services/values';
import { euros, round2 } from './model';

interface Service { id?: string; nombre?: string; tipo?: string | null; activo?: boolean; precio?: number | null; iva?: number | null; pvp?: number | null; por_defecto?: boolean }

const DEFAULT_VAT = 21, PRICE_DECIMALS = 4;
const money = (value: number | null | undefined): string => (isPresent(value) ? euros(value) : '—');
const field = (id: string): HTMLInputElement | null => document.getElementById(id) as HTMLInputElement | null;

function rowHtml(service: Service): string {
  const byDefault = service.por_defecto ? `<span class="pill p-est">${t('products.services.byDefault')}</span>` : '<span class="vac">—</span>';
  return `<button class="dr" data-serv="${service.id ?? ''}" style="${service.activo ? '' : 'opacity:.55'}">
        <span><b>${escapeHtml(service.nombre ?? '')}</b></span><span class="num">${money(service.precio)}</span>
        <span class="num">${formatNumber(service.iva ?? 0)}%</span><span class="num"><b>${money(service.pvp)}</b></span>
        <span>${byDefault}</span>
        <span><span class="pill ${service.activo ? 'p-est' : 'p-anu'}">${t(service.activo ? 'products.catalog.activeState' : 'products.catalog.inactiveState')}</span></span></button>`;
}

export async function paintServices(): Promise<void> {
  const admin = cardSectionsLegacy.can('administrar');
  productsLegacy.showLoading(document.getElementById('vcuerpo'), t('products.services.loading'));
  const { data } = await callRpc<Service[]>('productos_lista', { p_todos: admin });
  const body = document.getElementById('vcuerpo'); if (!body) return;
  const list = (data ?? []).filter(item => item.tipo === 'servicio');
  const head = [['', 'products.services.service'], ['num', 'products.catalog.withoutVat'], ['num', 'products.catalog.vat'], ['num', 'products.catalog.withVat'], ['', 'products.services.inNewOrders'], ['', 'products.catalog.state']] as const;
  body.innerHTML = `<div class="panel">
    <div class="cuenta"><b>${formatNumber(list.filter(item => item.activo).length)}</b>${t('products.services.activeCount')}</div>
    <div class="dgrid-wrap"><div class="dgrid servs">
      <div class="dh">${head.map(([kind, key]) => `<span${kind ? ` class="${kind}"` : ''}>${t(key)}</span>`).join('')}</div>
      ${list.map(rowHtml).join('') || `<div class="vacio">${t('products.services.none')}</div>`}
    </div></div></div>`;
  body.querySelectorAll<HTMLElement>('[data-serv]').forEach(button => { button.onclick = (): void => { editService(list.find(item => item.id === button.dataset.serv) ?? null); }; });
}

/** The price without VAT (up to 4 decimals) and with VAT of a service, as the editor shows them. */
function prices(service: Service): readonly [string, string] {
  if (!isPresent(service.precio)) return ['', ''];
  return [String(Number(Number(service.precio).toFixed(PRICE_DECIMALS))), String(round2(service.precio * (1 + (service.iva ?? 0) / 100)))];
}

const checkbox = (id: string, on: boolean | undefined, locked: string): string => `<input type="checkbox" id="${id}" ${on ? 'checked' : ''} ${locked}>`;

function editorHtml(service: Service, admin: boolean): string {
  const locked = admin ? '' : 'disabled', vat = service.iva ?? DEFAULT_VAT, [price, withVat] = prices(service);
  return `
    <div class="fh"><div><h2>${service.id ? escapeHtml(service.nombre ?? '') : t('products.services.newTitle')}</h2>
      <div class="sm">${t('products.services.hint')}</div></div>
      <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
    <label for="svn">${t('products.services.name')}</label><input id="svn" value="${escapeHtml(service.nombre ?? '')}" placeholder="${t('products.services.namePlaceholder')}" ${locked}>
    <div class="pvp">
      <div><label for="svs">${t('products.services.withoutVat')}</label><input id="svs" type="number" step="0.01" min="0" value="${price}" ${locked}></div>
      <div><label for="svi">${t('products.services.vat')}</label><input id="svi" type="number" step="1" min="0" max="21" value="${vat}" ${locked}></div>
      <div><label for="svc">${t('products.services.withVat')}</label><input id="svc" type="number" step="0.01" min="0" value="${withVat}" ${locked}></div></div>
    <label class="opt u-mt-12">${checkbox('svdef', service.por_defecto, locked)} ${t('products.services.proposeByDefault')}</label>
    ${service.id ? `<label class="opt u-mt-8">${checkbox('svact', service.activo, locked)} ${t('products.services.active')}</label>` : ''}
    <div class="acts u-end"><button class="btn sec" data-cerrar>${t(admin ? 'common.cancel' : 'common.close')}</button>
      ${admin ? `<button class="btn" id="svok">${t(service.id ? 'common.save' : 'products.services.create')}</button>` : ''}</div>`;
}

/** The price without VAT and with VAT follow each other. */
function bindPrices(): void {
  const without = field('svs'), vat = field('svi'), withVat = field('svc');
  if (!without || !vat || !withVat) return;
  const rate = (): number => (Number(vat.value) || 0) / 100;
  without.oninput = (): void => { withVat.value = without.value === '' ? '' : String(round2(Number(without.value) * (1 + rate()))); };
  withVat.oninput = (): void => { without.value = withVat.value === '' ? '' : String(Number((Number(withVat.value) / (1 + rate())).toFixed(PRICE_DECIMALS))); };
  vat.oninput = (): void => { if (without.value !== '') withVat.value = String(round2(Number(without.value) * (1 + rate()))); };
}

function payload(service: Service, name: string): Record<string, unknown> {
  const active = field('svact');
  return {
    id: service.id ?? null, tipo: 'servicio', nombre: name, precio: field('svs')?.value, iva: field('svi')?.value, por_defecto: Boolean(field('svdef')?.checked),
    ...(active ? { activo: active.checked } : {}),
  };
}

async function save(service: Service): Promise<void> {
  const name = field('svn')?.value.trim() ?? '';
  if (!name) { notices.toast(t('products.services.writeName'), true); return; }
  const { data: result, error } = await legacyDb().rpc<{ ok?: boolean }>('guardar_producto', { p: payload(service, name) });
  if (error || result?.ok === false) { notices.toast(t('products.services.couldNotSave'), true); return; }
  (document.getElementById('dlg') as HTMLDialogElement | null)?.close(); notices.toast(t(service.id ? 'products.services.saved' : 'products.services.created'));
  await purchasesLegacy.loadProducts(); if (currentScreen() === 'productos') void paintServices();
}

export function editService(existing: Service | null): void {
  const admin = cardSectionsLegacy.can('administrar'), service = existing ?? { iva: DEFAULT_VAT, activo: true };
  const body = document.getElementById('dbody'), box = document.getElementById('dlg') as HTMLDialogElement | null;
  if (!body || !box) return;
  body.innerHTML = editorHtml(service, admin);
  box.showModal();
  if (!admin) return;
  bindPrices();
  const ok = document.getElementById('svok'); if (ok) ok.onclick = (): void => { void save(service); };
}
