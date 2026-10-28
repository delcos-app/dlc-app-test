/**
 * Spanish texts of Configuración, third part (company email and its templates, notifications and menu names) the core uses (part
 * of es.ts). The ones only the chunks settings-email and settings-parts use are in chunks/<chunk>/settings-extra.ts and arrive
 * with them (plan 7.3, cut F).
 */
export const settingsExtra = {
  templates: {
    couldNotSave: 'No se han podido guardar las plantillas',
    whichTitle: '¿Con qué plantilla?',
    whichText: 'Hay {count} plantillas para «{use}». La de por defecto es «{name}».',
    cancel: 'Cancelar',
    uses: {
      pago: 'Datos de pago',
      factura: 'Envío de la factura',
    },
    defaults: {
      pagoTitle: 'Datos de pago por transferencia',
      pagoSubject: '[Documento] [numero] de [empresa] para [nombre]',
      pagoText: 'Hola [nombre_pila]:\n\nGracias por tu pedido [numero], por un importe de [importe].\n\nPara completarlo, haz una transferencia bancaria con estos datos:\n\nBeneficiario: [beneficiario]\nIBAN: [iban]\nImporte: [importe]\nConcepto: [nombre]\n\nIndica el concepto tal como aparece arriba: así identificamos el pago enseguida y no se retrasa la preparación del pedido.\n\nEn cuanto recibamos el pago preparamos el envío.',
      facturaTitle: 'Envío de la factura',
      facturaSubject: '[Documento] [numero] de [empresa] para [nombre]',
      facturaText: 'Hola [nombre_pila]:\n\nTe adjuntamos la [documento] [numero] de tu pedido, por un importe de [importe].\n\nGracias por tu confianza. Si tienes cualquier duda, estaremos encantados de ayudarte.',
    },
    variables: {
      nombre: 'Nombre completo del cliente',
      nombrePila: 'Solo el nombre de pila',
      empresa: 'Vuestra razón social',
      documento: 'pedido o factura',
      documentoCapital: 'Pedido o Factura',
      numero: 'Número del pedido o la factura',
      importe: 'Importe total',
      beneficiario: 'Titular de la cuenta (razón social)',
      iban: 'IBAN de los datos fiscales',
    },
    order: 'pedido',
  },
  notifications: {
    couldNotSave: 'No se ha podido guardar',
  },
  notificationSettings: {
    atOnce: '<b>{count}</b> al momento',
    inDigest: '<b>{count}</b> en el resumen de la mañana',
    off: '<b>{count}</b> desactivados',
    quietHours: 'Horas de silencio',
    quietOn: 'Activar las horas de silencio',
    quietHint: 'Lo que llegue en ese tiempo lo verás al terminar el silencio.',
    from: 'Desde',
    to: 'Hasta',
    toWord: 'a',
    weekends: 'Fines de semana',
    others: 'Otros',
    atOnceButton: 'Al momento',
    inDigestButton: 'En el resumen',
    no: 'No',
    none: 'Tu perfil no tiene notificaciones disponibles todavía.',
    willNot: 'No lo recibirás',
    willAtOnce: 'Te llegará al momento',
    willInDigest: 'Irá en el resumen de la mañana',
    quietSaved: 'Silencio guardado',
    quietOff: 'Sin silencio',
  },
};
