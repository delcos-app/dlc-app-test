/* ============================================================
   v2.45.2 · Contraseñas con indicador de seguridad y formularios
   de acceso sin avisos nativos del navegador
   ============================================================ */


// Pantalla de contraseña nueva: indicador y botón activo solo cuando es válida
function pantallaRecuperacion() {
  pantallaRecuperacionBase();
  const f = $('rform'); if (!f) return;
  f.noValidate = true;
  medidorClave($('rp1'), $('rp2'), $('rok'));
}
// Si la pantalla ya se abrió al cargar (antes de este punto), se completa ahora
if ($('rform')) { $('rform').noValidate = true; medidorClave($('rp1'), $('rp2'), $('rok')); }
// Mi perfil → contraseña

// Acceso: «Entrar» se activa al rellenar correo y contraseña; avisos con el diseño de la plataforma
(function () {
  const f = $('lform'), u = $('lu'), p = $('lp'), b = $('lbtn'); if (!f) return;
  f.noValidate = true;
  let autorelleno = false;
  const act = () => { b.disabled = !((u.value.trim() && p.value) || autorelleno); };
  [u, p].forEach(i => { i.addEventListener('input', () => { autorelleno = false; act(); }); i.addEventListener('change', act);
    // El navegador puede rellenar los datos guardados sin avisar: se detecta y se activa el botón
    i.addEventListener('animationstart', e => { if (e.animationName === 'autorelleno') { autorelleno = true; act(); } }); });
  act(); setTimeout(act, 400); setTimeout(act, 1500);
  f.addEventListener('submit', e => {
    const m = $('lmsg');
    const error = !u.value.trim() ? 'Escribe tu correo.' : !/\S+@\S+\.\S+/.test(u.value.trim()) ? 'Ese correo no parece válido.' : !p.value ? 'Escribe tu contraseña.' : '';
    if (error) { e.preventDefault(); e.stopImmediatePropagation(); if (m) { m.style.color = 'var(--dang)'; m.textContent = error; } (u.value.trim() ? p : u).focus(); }
  }, true);
})();


