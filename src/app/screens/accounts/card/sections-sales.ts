/**
 * Sales sections of the account card: the assigned sales rep (administration), the last patients/clients with their orders
 * and the associated clients. Migrated from the legacy fichaComercialYPacientes / fichaClientes (v2.403.0).
 */
import { agendaActions, callRpc, cardSectionsLegacy, legacyDb, notices, term } from '../../../legacy/bridge';
import { t } from '../../../i18n';
import { formatShortDate } from '../../../services/date-format';
import { escapeHtml, formatNumber } from '../../../services/format';
import { stillShown } from './card-tools';

const SHOWN_PATIENTS = 5;

interface TeamUser { id: string; nombre: string; rol: string; activo: boolean }

async function fillSalesReps(id: string): Promise<void> {
  const [{ data: users }, { data: current }] = await Promise.all([legacyDb().rpc<TeamUser[]>('usuarios_lista'), callRpc<{ id: string }>('responsable_de_cuenta', { p_medico: id })]);
  const select = document.getElementById('fcomsel') as HTMLSelectElement | null;
  if (!stillShown(id) || !select) return;
  const options = (users ?? []).filter(user => user.activo && (cardSectionsLegacy.roleCan(user.rol, 'cartera') || current?.id === user.id))
    .map(user => `<option value="${user.id}" ${current?.id === user.id ? 'selected' : ''}>${escapeHtml(user.nombre)} · ${escapeHtml(user.rol)}</option>`).join('');
  select.innerHTML = `<option value="">${t('accounts.sales.noRep')}</option>${options}`;
  const save = document.getElementById('fcomok') as HTMLButtonElement | null;
  if (save) save.onclick = async (): Promise<void> => {
    save.disabled = true;
    const { data: result, error } = await legacyDb().rpc<{ ok?: boolean }>('asignar_responsable_cuenta', { p_medico: id, p_usuario: select.value || null });
    save.disabled = false;
    if (error || result?.ok === false) { notices.toast(t('accounts.sales.couldNotAssign'), true); return; }
    notices.toast(t('accounts.sales.assigned')); agendaActions.openAccount(id);   // through the global name, so «‹ Volver» sees it
  };
}

interface PatientsPage { total: number; filas: { id: string; nombre: string; unidades: number; pedidos: number; ultimo_pedido?: string | null }[] }

async function patients(id: string): Promise<void> {
  const { data } = await legacyDb().rpc<PatientsPage>('clientes_lista', { q: null, p_medico: id, lim: SHOWN_PATIENTS, desplaz: 0 });
  if (!stillShown(id) || !data?.total) return;
  const plural = term('paciente', { number: 'p' });
  const rows = data.filas.map(row => `<button class="item" data-fmpac="${row.id}"><span class="tx"><b>${escapeHtml(row.nombre)}</b>
        <span class="sm">${t('accounts.sales.patientLine', { units: formatNumber(row.unidades), orders: formatNumber(row.pedidos) })}${row.ultimo_pedido ? t('accounts.sales.lastOrder', { date: formatShortDate(row.ultimo_pedido) }) : ''}</span></span></button>`).join('');
  (document.getElementById('fventasc') ?? document.getElementById('fbody'))?.insertAdjacentHTML('beforeend', `<div class="blk"><h3>${term('paciente', { number: 'p', capital: 'C' })}<span class="n" style="margin-left:6px">${formatNumber(data.total)}</span></h3>
      ${rows}
      ${data.total > SHOWN_PATIENTS ? `<button class="verlo" id="fmpactodos" style="border-radius:8px;margin-top:6px">${t('accounts.sales.seeAll', { count: formatNumber(data.total), patients: plural })}</button>` : ''}</div>`);
  document.querySelectorAll<HTMLElement>('#fbody [data-fmpac]').forEach(button => { button.onclick = (): void => { cardSectionsLegacy.openPatient(button.dataset.fmpac ?? ''); }; });
  const all = document.getElementById('fmpactodos');
  if (all) all.onclick = (): void => {
    const urgent = t('accounts.base.urgent'), title = document.querySelector('#fbody .fh h2')?.textContent ?? '';
    const name = title.startsWith(urgent) ? title.slice(urgent.length).trimStart() : title;
    (document.getElementById('ficha') as HTMLDialogElement | null)?.close();
    cardSectionsLegacy.patientsOf(id, name);
  };
}

/** The assigned sales rep (administration) and the last patients with their orders (whoever sees sales). */
export async function salesRepAndPatients(id: string): Promise<void> {
  const body = document.getElementById('fbody');
  if (!stillShown(id) || !body?.querySelector('.fh')) return;
  const admin = cardSectionsLegacy.can('administrar');
  if (admin) {
    body.insertAdjacentHTML('beforeend', `<div class="blk" id="fcomblk"><h3>${t('accounts.sales.repTitle')}</h3>
      <div class="u-flex u-gap-8"><select id="fcomsel" class="u-flex-1"><option>${t('accounts.sales.loading')}</option></select>
        <button class="btn sec" id="fcomok">${t('accounts.sales.save')}</button></div>
      <div class="sm u-mt-6">${t('accounts.sales.repNote')}</div></div>`);
    await fillSalesReps(id);
    if (!stillShown(id) || !document.getElementById('fcomsel')) return;
  }
  if (admin || cardSectionsLegacy.salesArea() >= 1) await patients(id);
}

interface Associated { ok?: boolean; total: number; con_pedido: number; sin_pedido: number }

/** How many clients are associated, with and without orders (after the units, inside the sales section). */
export async function associatedClients(id: string): Promise<void> {
  if (!stillShown(id) || !document.getElementById('fventasc') || document.getElementById('fclientes')) return;
  const { data } = await callRpc<Associated>('clientes_de_cuenta', { p_cuenta: id });
  const sales = document.getElementById('fventasc');
  if (!data?.ok || !stillShown(id) || !sales || document.getElementById('fclientes')) return;
  const figures: [string, number][] = [[t('accounts.sales.associated'), data.total], [t('accounts.sales.withOrders'), data.con_pedido], [t('accounts.sales.withoutOrders'), data.sin_pedido]];
  const block = `<div class="blk" id="fclientes"><h3>${t('accounts.sales.associatedTitle', { patients: term('paciente', { number: 'p', capital: 'C' }) })}</h3>
    <div class="uper">${figures.map(([label, value]) => `<div><b>${formatNumber(value)}</b><span>${label}</span></div>`).join('')}</div>
    ${data.total ? '' : `<div class="sm">${t('accounts.sales.noneAssociated', { patients: term('paciente', { number: 'p' }) })}</div>`}</div>`;
  const units = document.getElementById('fundades');
  if (units) units.insertAdjacentHTML('afterend', block); else sales.insertAdjacentHTML('afterbegin', block);
}
