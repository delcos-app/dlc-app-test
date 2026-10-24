/* ============================================================
   v2.306.0 · Textos de los correos a los clientes (revisión de Eric con un correo real: al cliente le llegó «IBAN: (añade el
   IBAN…)», la despedida repetía lo que ya dice la firma y el concepto no era su nombre). Cada empresa escribe sus textos en
   Configuración → Correo y firma → «Textos de los correos», con huecos como [nombre] o [iban] que se rellenan al enviar.
   Se guardan en el ajuste plantillas_correo. Sin IBAN no se envían los datos de pago. La despedida y los teléfonos van solo en la firma.
   ============================================================ */
const PLANT_CORREO = {
  pago: { titulo: 'Datos de pago por transferencia', asunto: '[Documento] [numero] de [empresa] para [nombre]',
    texto: 'Hola [nombre_pila]:\n\nGracias por tu pedido [numero], por un importe de [importe].\n\nPara completarlo, haz una transferencia bancaria con estos datos:\n\nBeneficiario: [beneficiario]\nIBAN: [iban]\nImporte: [importe]\nConcepto: [nombre]\n\nIndica el concepto tal como aparece arriba: así identificamos el pago enseguida y no se retrasa la preparación del pedido.\n\nEn cuanto recibamos el pago preparamos el envío.' },
  factura: { titulo: 'Envío de la factura', asunto: '[Documento] [numero] de [empresa] para [nombre]',
    texto: 'Hola [nombre_pila]:\n\nTe adjuntamos la [documento] [numero] de tu pedido, por un importe de [importe].\n\nGracias por tu confianza. Si tienes cualquier duda, estaremos encantados de ayudarte.' }
};
const VARS_CORREO = [['nombre', 'Nombre completo del cliente'], ['nombre_pila', 'Solo el nombre de pila'], ['empresa', 'Vuestra razón social'], ['documento', 'pedido o factura'],
  ['Documento', 'Pedido o Factura'], ['numero', 'Número del pedido o la factura'], ['importe', 'Importe total'], ['beneficiario', 'Titular de la cuenta (razón social)'], ['iban', 'IBAN de los datos fiscales']];

// Aparece en cuanto la página «Correo y firma» está pintada (su botón Guardar, #cook, existe)
new MutationObserver(() => { if (TAB === 'config' && $('cook') && !$('plcorreo')) pintarPlantillasCorreo(); }).observe(document.querySelector('main') || document.body, { childList: true, subtree: true });


