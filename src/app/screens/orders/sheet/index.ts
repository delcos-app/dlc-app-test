/**
 * The order window, all at once (v2.350.0): while its parts are painted (invoices, operations, payment, distributor, equipment…)
 * the window shows the loader, so the buttons do not arrive in batches. The order is read once and every part uses it (before,
 * each of the six legacy layers read it again). Migrated from the legacy verPedido and verPedidoBase2–6 (v2.414.0); verPedido
 * stays as an adapter (legado 058 and 089 wrap it, and many screens, «‹ Volver» and the tests call it by name).
 */
import { orderSheetLegacy } from '../../../legacy/orders-bridge';
import type { OrderDetail } from '../model';
import { paintBankTransfer } from './bank-transfer';
import { paintBase } from './base';
import { paintDistributor } from './distributor';
import { paintEquipment } from './equipment';
import { paintOperations } from './operations';
import { paintPayment } from './payment';

const CUSTOM_FIELDS_DELAY_MS = 150, STEADY_MAX_MS = 2500;

/** Each extra part is optional: if one fails, the order is still shown. */
const optional = (part: Promise<void>): Promise<void> => part.catch(() => undefined);

async function paintOrder(id: string): Promise<void> {
  const detail = await orderSheetLegacy.whileLoading(async (): Promise<OrderDetail | null> => {
    const loaded = await paintBase(id);
    if (!loaded) return null;
    await orderSheetLegacy.invoices(id);
    await paintOperations(loaded);
    await paintPayment(loaded);
    return loaded;
  });
  // v2.74.0: the order's custom fields
  setTimeout(() => { void orderSheetLegacy.customFields(id, document.getElementById('dbody')); }, CUSTOM_FIELDS_DELAY_MS);
  if (!detail) return;
  await optional(paintDistributor(detail));
  await optional(paintEquipment(id));
  try { paintBankTransfer(detail); } catch { /* optional, like the others */ }
}

export async function showOrder(id: string): Promise<void> {
  const dialog = document.getElementById('dlg');
  dialog?.classList.add('pdprep');
  try { await paintOrder(id); } finally {
    try { await orderSheetLegacy.whenSteady(document.getElementById('dbody'), STEADY_MAX_MS); } catch { /* it only waits */ }
    dialog?.classList.remove('pdprep');
  }
}
