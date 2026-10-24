/* ============================================================
   v2.305.0 · Reenviar el correo de activación (aviso de Eric: un profesional abrió el enlace del correo de alta cuando ya
   había caducado y no tenía forma de pedir otro). Supabase reenvía el correo de confirmación con auth.resend (no hace falta
   SQL): desde la ficha del usuario (administración) y desde la pantalla de acceso, que avisa si el enlace ha caducado o si
   la cuenta aún no está activada.
   ============================================================ */
async function reenviarActivacion(email, o = {}) {
  email = String(email || '').trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { (o.err || (t => toast(t, true)))('Escribe tu correo para enviarte un enlace nuevo.'); return false; }
  const { error } = await db.auth.resend({ type: 'signup', email, options: { emailRedirectTo: location.origin + location.pathname } });
  if (error) {
    const t = /rate|seconds|429|security purposes/i.test(error.message + (error.status || '')) ? 'Se acaba de enviar uno: espera un minuto antes de pedir otro.'
      : /already|confirmed/i.test(error.message) ? 'Esa cuenta ya está activada: puede entrar con su correo y contraseña (o usar «Enviar cambio de contraseña»).'
      : 'No se ha podido enviar: ' + error.message;
    (o.err || (x => toast(x, true)))(t); return false;
  }
  (o.ok || toast)('Correo de activación enviado a ' + email + '. El enlace nuevo sustituye al anterior.');
  return true;
}
if (ENLACE_ERROR && /otp_expired|access_denied|expired/i.test(ENLACE_ERROR)) {
  accesoSinActivar('El enlace de activación ha caducado o ya se usó. Escribe tu correo y te enviamos uno nuevo.');
  try { history.replaceState(null, '', location.pathname); } catch (e) {}
}


