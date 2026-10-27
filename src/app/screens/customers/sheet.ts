/**
 * The customer card: orders, units and amount, the professional who treats them (assign, change or remove), contact data, the
 * orders, the custom fields and, at the foot, deactivate or delete. Migrated from the legacy fichaPacienteBase, fichaPacienteBase2
 * and fichaPaciente (v2.411.0); fichaPaciente stays as an adapter (Pedidos, the account card and the tests open it by that name).
 */
import { agendaActions, appLegacy, callRpc, currentScreen, editorLegacy, legacyDb, notices, permissions, portalLegacy, term } from '../../legacy/bridge';
import { customersLegacy } from '../../legacy/customers-bridge';
import { t } from '../../i18n';
import { formatShortDate } from '../../services/date-format';
import { escapeHtml, formatNumber } from '../../services/format';
import { orFallback, sum } from '../../services/values';
import { addPrivacySection } from '../privacy/person-data';
import { words, type Customer } from './model';

/** Order states that do not count (database values). */
const NOT_COUNTED = ['Anulado', 'Borrador'];
const FULL_SALES_LEVEL = 3;

interface Professional { id: string; nombre: string; codigo?: string | null; especialidad?: string | null; comercial?: string | null }
interface CustomerOrder { id: string; fecha: string; estado: string; productos?: string | null; unidades: number; total: number | string; medico?: string | null }
interface Detail { contacto?: Customer; medico?: Professional | null; pedidos?: CustomerOrder[]; total_unidades: number }

const sheetBody = (): HTMLElement | null => document.getElementById('fbody');
const sheetBox = (): HTMLDialogElement | null => document.getElementById('ficha') as HTMLDialogElement | null;

function professionalHtml(professional: Professional | null | undefined, canSell: boolean): string {
  const shown = professional ? `<div><button class="kcfg" data-fpmed="${professional.id}" style="font-size:15px">${escapeHtml(professional.nombre)}</button>
          <span class="sm">${t('customers.sheet.code', { code: escapeHtml(professional.codigo ?? '') })}${professional.especialidad ? ` · ${escapeHtml(professional.especialidad)}` : ''}</span></div>
        <div class="sm">${professional.comercial ? t('customers.sheet.salesRep', { name: escapeHtml(professional.comercial) }) : t('customers.sheet.noSalesRep')}</div>`
    : `<div class="sm">${t('customers.sheet.unassigned', { professionalAssigned: term('medico', { adjective: 'asignado' }), thisPatient: term('paciente', { article: 'este' }) })}</div>`;
  const change = canSell ? `<label>${t(professional ? 'customers.sheet.change' : 'customers.sheet.assign', words())}</label><div id="fpsel"></div>
        ${professional ? `<div class="acts"><button class="btn sec" id="fpmedquitar">${t('customers.sheet.removeProfessional', words())}</button></div>` : ''}` : '';
  return `<div class="blk"><h3>${t('customers.sheet.treatedBy', words())}</h3>
      ${shown}
      ${change}
    </div>`;
}

function contactHtml(customer: Customer): string {
  const lines: [string, string | null | undefined][] = [[t('customers.sheet.phone'), customer.telefono], [t('customers.sheet.mobile'), customer.movil], [t('customers.sheet.email'), customer.email],
    [t('customers.sheet.address'), [customer.direccion, customer.cp, customer.municipio, customer.provincia].filter(Boolean).join(', ')], [t('customers.sheet.note'), customer.nota]];
  return `<div class="blk"><h3>${t('customers.sheet.contact')}</h3>
      ${lines.filter(line => line[1]).map(([label, value]) => `<div class="sm"><b style="color:var(--ink)">${label}:</b> ${escapeHtml(value)}</div>`).join('')
        || `<div class="sm">${t('customers.sheet.noContact')}</div>`}</div>`;
}

const orderHtml = (order: CustomerOrder): string => `<button class="item" data-fpped="${order.id}" style="padding:8px 4px">
        <span class="tx"><b>${formatShortDate(order.fecha)} · ${escapeHtml(orFallback(order.productos, t('customers.sheet.noProducts')))}</b>
          <span class="sm">${t('customers.sheet.orderLine', { units: formatNumber(order.unidades), total: portalLegacy.euros(Number(order.total)) })}${order.medico ? ` · ${escapeHtml(order.medico)}` : ''}</span></span>
        ${customersLegacy.orderPill(order.estado)}</button>`;

function sheetHtml(detail: Detail, customer: Customer, canSell: boolean): string {
  const orders = detail.pedidos ?? [], counted = orders.filter(order => !NOT_COUNTED.includes(order.estado));
  return `
    <div class="fh"><div><h2>${escapeHtml(customer.nombre)}</h2><div class="sm">${words().Patient}${customer.nif ? t('customers.sheet.taxId', { taxId: escapeHtml(customer.nif) }) : ''}</div></div>
      <button class="x" id="fpx" aria-label="${t('common.close')}">✕</button></div>
    ${canSell ? `<div class="acts"><button class="btn" id="fpnped">${t('customers.sheet.newOrder')}</button>
      <button class="btn sec" id="fpedit">${t('customers.sheet.editData')}</button></div>` : ''}
    <div class="kpis" style="margin:10px 0 0;grid-template-columns:repeat(3,minmax(0,1fr))">
      <div class="kpi"><b>${formatNumber(counted.length)}</b><span>${t('customers.sheet.orders')}</span></div>
      <div class="kpi"><b>${formatNumber(detail.total_unidades)}</b><span>${t('customers.sheet.units')}</span></div>
      <div class="kpi"><b>${portalLegacy.euros(sum(counted.map(order => Number(order.total) || 0)))}</b><span>${t('customers.sheet.withVat')}</span></div></div>
    ${professionalHtml(detail.medico, canSell)}
    ${contactHtml(customer)}
    <div class="blk"><h3>${t('customers.sheet.ordersTitle')}</h3>
      ${orders.map(orderHtml).join('') || `<div class="sm">${t('customers.sheet.noOrders')}</div>`}</div>`;
}

async function assign(id: string, professionalId: string | null): Promise<void> {
  const { data: result, error } = await legacyDb().rpc<{ ok?: boolean }>('asignar_cuenta_cliente', { p_contacto: id, p_medico: professionalId });
  if (error || result?.ok === false) { notices.toast(t('customers.sheet.couldNotSave'), true); return; }
  notices.toast(term('medico', { capital: 'C', adjective: professionalId ? 'asignado' : 'quitado' })); void showCustomer(id);
  if (currentScreen() === 'pacientes') customersLegacy.repaintList();
}

function bind(id: string, customer: Customer, professional: Professional | null | undefined): void {
  const body = sheetBody(), on = (elementId: string, action: () => void): void => { const button = document.getElementById(elementId); if (button) button.onclick = action; };
  on('fpx', () => { customersLegacy.setShownCustomer(null); sheetBox()?.close(); });
  body?.querySelectorAll<HTMLElement>('[data-fpped]').forEach(button => { button.onclick = (): void => { appLegacy.openOrder(button.dataset.fpped ?? ''); }; });
  const shownProfessional = body?.querySelector<HTMLElement>('[data-fpmed]');
  if (shownProfessional) shownProfessional.onclick = (): void => { customersLegacy.setShownCustomer(null); agendaActions.openAccount(shownProfessional.dataset.fpmed ?? ''); };
  on('fpnped', () => {
    customersLegacy.newSale({
      contacto: { ...customer, ...(professional ? { medico: professional.nombre, medico_codigo: professional.codigo } : {}) },
      medico: professional ? { id: professional.id, nombre: professional.nombre } : null,
    });
  });
  on('fpedit', () => { customersLegacy.editCustomer(customer, () => { void showCustomer(id); }); });
  on('fpmedquitar', () => { void assign(id, null); });
  const picker = document.getElementById('fpsel');
  if (picker) editorLegacy.pickAccount(picker, null, picked => { void assign(id, picked.id); }, t('customers.sheet.pickPlaceholder', { theProfessional: term('medico', { article: 'el' }) }));
}

async function paintSheet(id: string): Promise<void> {
  customersLegacy.setShownCustomer(id); customersLegacy.forgetShownAccount();
  const body = sheetBody(), box = sheetBox(); if (!body || !box) return;
  body.innerHTML = '<div class="skel" style="width:50%"></div><div class="skel"></div><div class="skel" style="width:80%"></div>';
  if (!box.open) box.showModal();
  const { data } = await callRpc<Detail>('contacto_detalle', { p_id: id });
  if (customersLegacy.shownCustomer() !== id) return;
  if (!data?.contacto) { body.innerHTML = `<div class="vacio">${t('customers.sheet.notFound', { thePatient: term('paciente', { article: 'el' }) })}</div>`; return; }
  const canSell = customersLegacy.canSell();
  body.innerHTML = sheetHtml(data, data.contacto, canSell);
  bind(id, data.contacto, data.medico);
}

/** «Dar de baja» or «Volver a dar de alta», and «Eliminar» for full sales level (legado 137 listens to their buttons). */
async function addStatusButtons(id: string): Promise<void> {
  const body = sheetBody();
  if (!body || customersLegacy.shownCustomer() !== id || document.getElementById('cbajablk') || !customersLegacy.canSell()) return;
  const { data: customer } = await legacyDb().from<{ archivado_en?: string | null }>('contactos').select('archivado_en').eq('id', id).maybeSingle();
  if (!customer || customersLegacy.shownCustomer() !== id) return;
  const toggle = customer.archivado_en ? `<button type="button" class="btn sec chico" data-calta="${id}">${t('customers.sheet.reactivate')}</button>`
    : `<button type="button" class="btn sec chico" data-cbaja="${id}">${t('customers.sheet.deactivate')}</button>`;
  body.insertAdjacentHTML('beforeend', `<div class="blk fbajablk" id="cbajablk"><div class="acts">
      ${toggle}
      ${permissions.salesLevel() >= FULL_SALES_LEVEL ? `<button type="button" class="btn sec dang chico" data-celim="${id}">${t('customers.sheet.delete', { thePatient: escapeHtml(term('paciente', { article: 'el' })) })}</button>` : ''}</div></div>`);
}

/** Opens the card of a customer. */
export async function showCustomer(id: string): Promise<void> {
  await paintSheet(id);
  const box = sheetBox();
  void customersLegacy.customFields(id, box ? box.querySelector('.fbody, #fbody') ?? box.firstElementChild : null);
  try { await addStatusButtons(id); } catch { /* the foot buttons are optional */ }
  // v2.446.0: «Protección de datos» (RGPD), for whoever configures the company
  addPrivacySection('contacto', id, () => customersLegacy.shownCustomer() === id, () => { void showCustomer(id); });
}
