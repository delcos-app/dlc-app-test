/**
 * Spanish texts of Pedidos the core uses (part of es.ts). The ones only the chunk orders uses are in chunks/orders/orders.ts and
 * arrive with it (plan 7.3, cut F).
 */
export const orders = {
  totals: {
    shipping: 'Envío',
    units: 'Unidades',
    linesSum: 'Suma de líneas',
    generalDiscount: 'Descuento general',
    productsWithoutVat: 'Productos sin IVA',
    serviceWithoutVat: '{name} sin IVA',
    taxBase: 'Base imponible',
    vatRate: 'IVA {rate}%',
    includesService: 'Incluye {name} de {amount} con IVA',
    total: 'Total con IVA',
  },
  steps: {
    voided: 'Anulado',
    awaitingPayment: 'Esperando pago',
    draft: 'Borrador',
    completed: 'Completado',
    toCollect: 'Por cobrar',
    toPack: 'Por preparar',
    toInvoice: 'Por facturar',
    done: 'Hecho: {steps}',
    doneConfirmed: 'Confirmado',
    donePacked: 'Preparado',
    donePaid: 'Cobrado',
    doneInvoiced: 'Facturado',
  },
  operations: {
    paid: 'Cobrado',
    packed: 'Paquete preparado',
    invoiceEmail: 'Email con la factura enviado',
    paymentEmail: 'Email con los datos de pago enviado',
  },
  paymentEmail: {
    title: 'Email de pago',
    sentQuestion: '¿Has enviado el email con los datos de pago?',
    markSent: 'Sí, marcar como enviado',
    noIban: 'Falta el IBAN: ponlo en Configuración → Facturación → Datos fiscales antes de enviar los datos de pago',
    notFound: 'No se ha encontrado el pedido',
    noEmail: '{customer} no tiene email en su ficha',
    sent: 'Datos de pago enviados · el pedido espera al pago en borrador',
  },
  transfer: {
    notSent: 'Sin enviar',
  },
};
