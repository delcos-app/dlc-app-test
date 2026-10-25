/**
 * Deactivating a customer (it stops showing in the list and the searches, keeping orders and invoices) or reactivating it, and the
 * quick search of customers. Migrated from the legacy bajaCliente and buscarClientes (v2.411.0); both names stay as adapters
 * (legado 137 and Oportunidades use them).
 */
import { appLegacy, currentScreen, legacyDb, notices } from '../../legacy/bridge';
import { customersLegacy } from '../../legacy/customers-bridge';
import { t } from '../../i18n';
import { words } from './model';

const MIN_LETTERS = 2, SHOWN = 8;

/** Deactivates (`off` true) or reactivates a customer; true when it worked. */
export async function setCustomerOff(id: string, off: boolean): Promise<boolean> {
  const { data: result, error } = await legacyDb().rpc<{ ok?: boolean; error?: string }>('baja_cliente', { p_id: id, p_baja: off });
  if (error || !result?.ok) {
    const reason = (error as { message?: string } | null)?.message ?? result?.error ?? '';
    notices.toast(t('customers.status.couldNot', { error: reason }), true); return false;
  }
  try { appLegacy.forgetCache(); customersLegacy.forgetPreloads(); } catch { /* nothing cached */ }
  notices.toast(t(off ? 'customers.status.deactivated' : 'customers.status.reactivated', words()));
  if (currentScreen() === 'pacientes') customersLegacy.repaintList();
  return true;
}

export interface FoundCustomer { id: string; nombre: string; telefono?: string | null; movil?: string | null; email?: string | null; nif?: string | null; cuenta_id?: string | null }

/** Customers whose name, phone, mobile or tax id contains `text` (at most 8). */
export async function searchCustomers(text: string): Promise<FoundCustomer[]> {
  const clean = text.trim().replace(/[,()]/g, ' ');
  if (clean.length < MIN_LETTERS) return [];
  const { data } = await legacyDb().from<FoundCustomer[]>('contactos').select('id,nombre,telefono,movil,email,nif,cuenta_id')
    .or(`nombre.ilike.%${clean}%,telefono.ilike.%${clean}%,movil.ilike.%${clean}%,nif.ilike.%${clean}%`).limit(SHOWN);
  return data ?? [];
}
