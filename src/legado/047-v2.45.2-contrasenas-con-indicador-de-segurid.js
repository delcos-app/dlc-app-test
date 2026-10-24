/* ============================================================
   v2.45.2 · Contraseñas con indicador de seguridad y formularios
   de acceso sin avisos nativos del navegador
   ============================================================ */

// Seguridad de una contraseña: 0 muy débil … 4 muy segura
function seguridadClave(p) {
  if (!p) return { n: -1, t: '' };
  let pts = 0;
  if (p.length >= 8) pts++; if (p.length >= 12) pts++; if (p.length >= 16) pts++;
  const tipos = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter(r => r.test(p)).length;
  pts += Math.max(0, tipos - 1);
  if (/^(.)\1+$/.test(p) || (/^(1234|abcd|qwer|contrase|password|dlc)/i.test(p) && p.length < 12)) pts = Math.min(pts, 1);
  const n = p.length < 8 ? 0 : Math.min(4, Math.max(1, pts - 1));
  return { n, t: ['Muy débil', 'Débil', 'Aceptable', 'Segura', 'Muy segura'][n] };
}
// Añade el indicador a un campo de contraseña (y la comprobación de la repetición, si la hay)
function medidorClave(inp, rep, boton) {
  if (!inp || inp.dataset.medidor) return;
  inp.dataset.medidor = '1';
  inp.insertAdjacentHTML('afterend', `<div class="clavemed"><div class="clavebar"><i></i><i></i><i></i><i></i></div><span class="clavetxt"></span>
    <ul class="clavereq"><li data-r="len">Al menos 8 caracteres</li><li data-r="may">Mayúsculas y minúsculas</li><li data-r="num">Algún número</li><li data-r="sim">Algún símbolo (opcional, la hace más segura)</li></ul></div>`);
  const med = inp.nextElementSibling;
  if (rep) rep.insertAdjacentHTML('afterend', '<div class="clavecoin sm"></div>');
  const act = () => {
    const p = inp.value, s = seguridadClave(p), col = ['#C24141', '#D9480F', '#D97706', '#12805C', '#0F6E4C'][Math.max(0, s.n)];
    med.querySelectorAll('.clavebar i').forEach((x, i) => { x.style.background = p && i < Math.max(1, s.n) ? col : ''; });
    med.querySelector('.clavetxt').textContent = p ? s.t : ''; med.querySelector('.clavetxt').style.color = col;
    const ok = { len: p.length >= 8, may: /[a-z]/.test(p) && /[A-Z]/.test(p), num: /\d/.test(p), sim: /[^A-Za-z0-9]/.test(p) };
    med.querySelectorAll('[data-r]').forEach(li => li.classList.toggle('ok', ok[li.dataset.r]));
    let valida = p.length >= 8;
    if (rep) {
      const c = rep.nextElementSibling, iguales = rep.value && rep.value === p;
      c.textContent = !rep.value ? '' : iguales ? '✓ Coinciden' : '✗ No coinciden';
      c.style.color = iguales ? 'var(--ok)' : 'var(--dang)';
      valida = valida && iguales;
    }
    if (boton) boton.disabled = !valida;
  };
  inp.addEventListener('input', act); if (rep) rep.addEventListener('input', act); act();
}

// Pantalla de contraseña nueva: indicador y botón activo solo cuando es válida
pantallaRecuperacion = (orig => function () {
  orig();
  const f = $('rform'); if (!f) return;
  f.noValidate = true;
  medidorClave($('rp1'), $('rp2'), $('rok'));
})(pantallaRecuperacion);
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


