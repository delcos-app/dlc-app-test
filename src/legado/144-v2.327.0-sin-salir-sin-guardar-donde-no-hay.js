/* ============================================================
   v2.327.0 · Sin «¿Salir sin guardar?» donde no hay nada que guardar (aviso de Eric, 16/10/2026). Los checks de
   «Operativa» del pedido se guardan al momento (data-nosucio) y, además, una ventana solo pregunta al cerrar si tiene
   a la vista un botón que guarde (Guardar, Validar, Crear, Añadir, Enviar, Aplicar, Aceptar…): si no lo hay, no se
   ha podido dejar nada a medias.
   ============================================================ */
function hayBotonGuardar(d) {
  return [...d.querySelectorAll('button, .btn')].some(b => b.offsetParent && !b.disabled && !b.classList.contains('sec')
    && /^(guardar|validar|crear|añadir|enviar|aplicar|aceptar|confirmar|registrar|emitir|dar de alta)/i.test((b.textContent || '').trim()));
}

