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

// v2.426.0: 6 s (was 2.5): under load the parts took longer and the window was shown half painted
const STEADY_MAX_MS = 6000;

/** Each extra part is optional: if one fails, the order is still shown. */
const optional = (part: Promise<void>): Promise<void> => part.catch(() => undefined);

async function paintOrder(id: string): Promise<void> {
  const detail = await orderSheetLegacy.whileLoading(async (): Promise<OrderDetail | null> => {
    const loaded = await paintBase(id);
    if (!loaded) return null;
    await orderSheetLegacy.invoices(id);
    await paintOperations(loaded);
    await paintPayment(loaded);
    // v2.74.0: the order's custom fields, inside the loader (v2.416.0: added late they moved the buttons once shown)
    await optional(orderSheetLegacy.customFields(id, document.getElementById('dbody')));
    return loaded;
  });
  if (!detail) return;
  await optional(paintDistributor(detail));
  await optional(paintEquipment(id));
  try { paintBankTransfer(detail); } catch { /* optional, like the others */ }
}

const REVEAL_CHECK_MS = 30;

/**
 * Every window that opens is also revealed whole (its content carries «preparando» until it stops changing): the order waits for
 * that too, or it was shown a moment before and its own scrollbar then moved the buttons (v2.429.0).
 */
async function revealed(body: Element | null, maxMs: number): Promise<void> {
  const start = performance.now();
  while (body?.classList.contains('preparando') && performance.now() - start < maxMs) await new Promise(resolve => { setTimeout(resolve, REVEAL_CHECK_MS); });
}

export async function showOrder(id: string): Promise<void> {
  const dialog = document.getElementById('dlg');
  dialog?.classList.add('pdprep');
  try { await paintOrder(id); } finally {
    const body = document.getElementById('dbody');
    try { await orderSheetLegacy.whenSteady(body, STEADY_MAX_MS); await revealed(body, STEADY_MAX_MS); } catch { /* it only waits */ }
    dialog?.classList.remove('pdprep');
  }
}
