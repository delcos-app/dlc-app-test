/**
 * What a customer (contacto) is, the card it shows when chosen and the parameters of the list. Migrated from the legacy
 * tarjetaPaciente and pacParams (v2.411.0). The list filters stay in the legacy PAC (the list bar, the custom field filters and
 * the account card fill it too).
 */
import { accountListLegacy, term } from '../../legacy/bridge';
import { customersLegacy } from '../../legacy/customers-bridge';
import { customerDataHtml } from '../../components/customer-data';
import { t } from '../../i18n';
import { escapeHtml } from '../../services/format';
import { orFallback } from '../../services/values';

/** Values stored in the database. */
export const TYPES = { person: 'Persona', company: 'Empresa' } as const;

export interface Customer {
  id: string; nombre: string; tipo?: string | null; nif?: string | null; email?: string | null; telefono?: string | null; movil?: string | null;
  direccion?: string | null; cp?: string | null; municipio?: string | null; provincia?: string | null; nota?: string | null;
  medico?: string | null; medico_codigo?: string | null; cuenta_id?: string | null;
}

/** The company words the texts of this screen use. */
export const words = (): Record<string, string> => ({
  patient: term('paciente'), patients: term('paciente', { number: 'p' }), Patient: term('paciente', { capital: 'C' }),
  Patients: term('paciente', { number: 'p', capital: 'C' }), professional: term('medico'), Professional: term('medico', { capital: 'C' }),
});

/** A filter value for the database: empty means no filter. */
export const textOrNull = (value: string | null | undefined): string | null => orFallback(value, '') || null;

/** The chosen customer: its name and the customer data block (D-046), the same as everywhere else, with «✕» to remove it. */
export function customerCard(customer: Customer): string {
  return `<div class="selcard"><span class="ic">🧑</span>
  <span class="tx"><b>${escapeHtml(customer.nombre)}</b>
    ${customerDataHtml(customer, 'bloque')}</span>
  <button type="button" class="sx" aria-label="${t('customers.card.remove')}">✕</button></div>`;
}

/** The parameters of clientes_lista for the current filters and page. */
export function listParams(): Record<string, unknown> {
  const filters = customersLegacy.filters(), size = accountListLegacy.pageSize(), fields = filters.campos ?? {};
  return {
    q: textOrNull(filters.q), p_medico: filters.medico, lim: size, desplaz: filters.pagina * size, p_tipo: textOrNull(filters.tipo),
    p_pedidos: textOrNull(filters.pedidos), p_municipio: textOrNull(filters.municipio), ...(Object.keys(fields).length ? { f_campos: fields } : {}),
  };
}
