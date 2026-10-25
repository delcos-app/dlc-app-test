/**
 * The email with the payment details of an order (bank transfer): its subject and text from the company's template, and sending
 * it (directly or, without direct sending, with the device's mail). Migrated from the legacy asuntoEmailPago, textoEmailPago and
 * enviarDatosPago (v2.414.0); enviarDatosPago stays as an adapter (the order editor and the tests call it).
 */
import { callRpc, legacyDb, notices, term } from '../../legacy/bridge';
import { orderMailLegacy, type EmailVariables } from '../../legacy/orders-bridge';
import { t } from '../../i18n';
import type { Order, OrderDetail } from './model';

const values = (order: Order, total: number, customer: string | null | undefined): EmailVariables =>
  ({ documento: 'pedido', numero: order.numero ?? null, importe: total, nombre: customer ?? null });

export const paymentSubject = (order: Order, total: number, customer: string | null | undefined): string => orderMailLegacy.template('pago', 'asunto', values(order, total, customer));

export const paymentText = (order: Order, total: number, customer: string | null | undefined): string => orderMailLegacy.template('pago', 'texto', values(order, total, customer));

/** «mailto:» with the subject and text already written. */
export const mailtoLink = (to: string, subject: string, text: string): string => `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;

/** Marks the payment email as sent after asking (when it was written with the device's mail). */
export async function askPaymentEmailSent(id: string): Promise<boolean> {
  if (!await notices.confirm(t('orders.paymentEmail.sentQuestion'), { titulo: t('orders.paymentEmail.title'), ok: t('orders.paymentEmail.markSent') })) return false;
  await legacyDb().rpc('marcar_operativa', { p_pedido: id, p_campo: 'email_pago', p_hecho: true });
  return true;
}

async function send(id: string): Promise<boolean> {
  if (!orderMailLegacy.companyIban()) { notices.toast(t('orders.paymentEmail.noIban'), true); return false; }
  const { data } = await callRpc<OrderDetail>('pedido_detalle', { p_id: id });
  const order = data?.pedido; if (!order) { notices.toast(t('orders.paymentEmail.notFound'), true); return false; }
  const customer = data.contacto, total = Number(data.totales?.total) || 0;
  if (!customer?.email) { notices.toast(t('orders.paymentEmail.noEmail', { customer: term('paciente', { capital: 'C' }) }), true); return false; }
  const subject = paymentSubject(order, total, customer.nombre), text = paymentText(order, total, customer.nombre);
  const { data: answer, error: failure } = await orderMailLegacy.invoke('enviar_email', { para: customer.email, asunto: subject, texto: text, pedido_id: id, marca: 'email_pago' });
  if (!failure && (answer as { ok?: boolean } | null)?.ok) { notices.toast(t('orders.paymentEmail.sent')); return true; }
  // Without direct sending: the device's mail
  location.href = mailtoLink(customer.email, subject, text);
  await askPaymentEmailSent(id);
  return true;
}

/** Sends the payment details of an order (choosing the template first if there are several). */
export async function sendPaymentDetails(id: string): Promise<boolean> {
  if (!await orderMailLegacy.chooseTemplate('pago')) return false;
  try { return await send(id); } finally { orderMailLegacy.forgetChosenTemplate('pago'); }
}
