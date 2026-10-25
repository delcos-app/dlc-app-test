/**
 * After saving an order paid by card or Bizum: send the link and show the order, or warn that a link already sent no longer matches
 * the amount (an old paid link validates nothing). Migrated from the legacy tpvTrasGuardar and tpvAvisoImporte (v2.417.0).
 */
import { appLegacy, callRpc, currentScreen, legacyDb, notices } from '../../../legacy/bridge';
import { ordersLegacy } from '../../../legacy/orders-bridge';
import { t } from '../../../i18n';
import { euros } from '../model';
import { sendTpvLink, TPV_STATES } from './model';

const CENT = 0.005, SALES_SCREEN = 'ventas';

/** Sends the payment link of the order just saved and opens it. */
export async function sendLinkAndShow(id: string): Promise<void> {
  await sendTpvLink(id);
  appLegacy.openOrder(id);
  if (currentScreen() === SALES_SCREEN) ordersLegacy.reload();
}

/** A draft changed after its link was sent: if the amount differs, a new link is needed. */
export async function warnIfAmountChanged(id: string): Promise<void> {
  const [{ data: sent }, { data: detail }] = await Promise.all([
    legacyDb().from<{ importe: number } | null>('pagos_tpv').select('importe').eq('pedido_id', id).eq('estado', TPV_STATES.sent).order('creado_en', { ascending: false }).limit(1).maybeSingle(),
    callRpc<{ totales?: { total?: number | null } | null }>('pedido_detalle', { p_id: id })]);
  const total = detail?.totales ? Number(detail.totales.total) : null;
  if (sent && total !== null && Math.abs(Number(sent.importe) - total) > CENT)
    notices.toast(t('ordersMore.tpv.amountChanged', { sent: euros(Number(sent.importe)), now: euros(total) }), true);
}
