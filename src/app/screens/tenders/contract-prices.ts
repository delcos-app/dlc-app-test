/**
 * The contract prices of an account (lots won in a tender, while the contract is in force): an order of that account uses them.
 * Migrated from the legacy cargarPreciosContrato of pantallas/concursos.js (v2.427.0); the name stays as an adapter (the order
 * editor bridge calls it). The prices stay in the legacy PED_PRECIOS, which the order lines and the tests read.
 */
import { legacyDb } from '../../legacy/bridge';
import { leftoversLegacy } from '../../legacy/leftovers-bridge';

/** Loads the prices of `account` (none without one); true if they changed. */
export async function loadContractPrices(account: string | null | undefined): Promise<boolean> {
  const id = account ?? null, current = leftoversLegacy.contractPrices();
  if (id === current.cuenta) return false;
  const before = JSON.stringify(current.precios);
  let prices: Record<string, unknown> = {};
  if (id) { try { const { data } = await legacyDb().rpc<Record<string, unknown>>('precios_contrato', { p_cuenta: id }); prices = data ?? {}; } catch { /* no prices */ } }
  leftoversLegacy.setContractPrices({ cuenta: id, precios: prices });
  return JSON.stringify(prices) !== before;
}
