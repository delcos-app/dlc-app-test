/**
 * Notifications explained (v2.46.0: when each one arrives and what to do) and the useful ones added in v2.152.0 (reponer, caída de
 * ventas, citas sin registrar, pedidos del portal). Folded from legado 050 and 075 (v2.425.0); the texts are in i18n.
 */
import { term } from '../../legacy/bridge';
import { t, type MessageKey } from '../../i18n';

const words = (): Record<string, string> => ({
  aGuideline: term('pauta'), aProfessional: term('medico', { article: 'un' }), professionalsNew: term('medico', { number: 'p', adjective: 'nuevo' }),
  firstVisit: term('visita', { article: 'primer' }), nextVisit: term('visita', { article: 'proximo' }), visits: term('visita', { number: 'p' }),
  visitVerb: term('visita'), theProfessionals: term('medico', { number: 'p', article: 'el' }), visit: term('visita'), aPatient: term('paciente', { article: 'un' }),
  aProfessionalCapital: term('medico', { article: 'un', capital: 'C' }),
});

/** The notification ids explained, with their «when» and «what to do» keys. */
const EXPLAINED = ['pauta', 'venta_cartera', 'cartera', 'cruce', 'pedido_validado', 'citas_hoy', 'sin_visitar', 'cliente_nuevo', 'pago_recibido', 'borrador_nuevo',
  'seguimientos_hoy', 'pagos_pendientes', 'facturas_vencidas', 'stock_minimo', 'lotes_caducan', 'compra_recibida', 'rectificativa', 'duplicado', 'usuario_nuevo', 'esquema'] as const;

const keyOf = (id: string): string => id.split('_').map((part, index) => (index ? part.charAt(0).toUpperCase() + part.slice(1) : part)).join('');

/** { id: [when it arrives, what to do] } with the company vocabulary (the legacy EXPLICA_NOTIF). */
export function notificationExplanations(): Record<string, [string, string]> {
  const vocabulary = words();
  return Object.fromEntries(EXPLAINED.map(id => [id, [
    t(`legacyC.notifications.${keyOf(id)}.when` as MessageKey, vocabulary), t(`legacyC.notifications.${keyOf(id)}.todo` as MessageKey, vocabulary),
  ]]));
}
