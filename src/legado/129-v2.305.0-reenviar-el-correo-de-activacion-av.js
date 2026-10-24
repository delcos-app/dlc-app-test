if (ENLACE_ERROR && /otp_expired|access_denied|expired/i.test(ENLACE_ERROR)) {
  accesoSinActivar('El enlace de activación ha caducado o ya se usó. Escribe tu correo y te enviamos uno nuevo.');
  try { history.replaceState(null, '', location.pathname); } catch (e) {}
}


