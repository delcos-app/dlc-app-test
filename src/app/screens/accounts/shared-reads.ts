/**
 * Reads of Cuentas that other screens share: which accounts have access to the professional portal, the recent visits or
 * appointments of some accounts around a date (the «visited recently» notice), and the sales team with the salesperson filter of
 * the list. Migrated from the legacy cargarAccesoMedicos and recientesDe of pantallas/cuentas.js and cargarComerciales of
 * pantallas/comisiones.js (v2.427.0); the names stay as adapters (bridges and other screens call them). The results stay in the
 * legacy MED_ACCESO and COMS, which many files read.
 */
import { callRpc, legacyDb } from '../../legacy/bridge';
import { leftoversLegacy } from '../../legacy/leftovers-bridge';
import { t } from '../../i18n';
import { escapeHtml } from '../../services/format';

/** Which accounts have portal access (only for who can see or give it; else nobody). */
export async function loadAccountAccess(): Promise<void> {
  if (!leftoversLegacy.hasProfile() || !(leftoversLegacy.can('administrar') || leftoversLegacy.seesEverything() || leftoversLegacy.can('dar_acceso_cuentas'))) {
    leftoversLegacy.setAccountAccess({}); return;
  }
  const { data } = await callRpc<{ cuenta_id: string }[]>('cuentas_con_acceso', {});
  const access: Record<string, { cuenta_id: string }> = {};
  (data ?? []).forEach(item => { access[item.cuenta_id] = item; });
  leftoversLegacy.setAccountAccess(access);
}

/** Visits or appointments of these accounts near the date (not that same day), by account. */
export async function recentContacts(ids: readonly string[], isoDate: string): Promise<Record<string, { fecha: string; cuenta_id: string }[]>> {
  const notice = leftoversLegacy.revisitNotice();
  if (!notice.on || !ids.length) return {};
  const { data } = await legacyDb().rpc<{ fecha: string; cuenta_id: string }[]>('actividades_recientes', {
    p_ids: ids, p_desde: leftoversLegacy.addDays(isoDate, -(notice.dias - 1)), p_hasta: leftoversLegacy.addDays(isoDate, notice.dias - 1),
  });
  const byAccount: Record<string, { fecha: string; cuenta_id: string }[]> = {};
  (data ?? []).filter(item => item.fecha !== isoDate).forEach(item => { (byAccount[item.cuenta_id] ??= []).push(item); });
  return byAccount;
}

interface Person { id: string; nombre: string; rol: string; activo?: boolean | null }

/** The sales team (who carries a portfolio or a sales agenda), and the salesperson filter of the list. */
export async function loadSalesTeam(): Promise<void> {
  const { data } = await leftoversLegacy.people();
  const team = (data ?? []).filter((person: Person) => person.activo && leftoversLegacy.roleCan(person.rol, 'equipo_comercial'));
  leftoversLegacy.setSalesTeam(team);
  const select = document.getElementById('fcom');
  if (!select) throw new TypeError('#fcom');
  const chosen = leftoversLegacy.salespersonFilter();
  select.innerHTML = `<option value="">${t('leftovers.accounts.all')}</option><option value="ninguno">${t('leftovers.accounts.noSalesperson')}</option>${
    team.map(person => `<option value="${person.id}" ${chosen === person.id ? 'selected' : ''}>${escapeHtml(person.nombre)}</option>`).join('')}`;
}
