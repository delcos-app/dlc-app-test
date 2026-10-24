/* ============================================================
   v2.284.0 · Pago por adelantado en el portal del centro (SQL 152).
   - Configuración → Portal: «Pago por adelantado» (ajuste portal.pago_anticipado). Con él, un pedido del portal validado y sin
     cobrar sale al centro «Pendiente de pago», con su factura proforma (datos de la empresa e IBAN, líneas, IVA; diseño del PDF de
     la empresa). Al marcarlo cobrado se prepara como siempre. El centro recibe un aviso al validar, cobrar, preparar o anular.
   ============================================================ */
NOMBRE_ESTADO_CENTRO['Pendiente de pago'] = 'p-warn';
window.PC_ANT = false;

document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-pcpro]'); if (b) pcProforma(b.dataset.pcpro, b); });






