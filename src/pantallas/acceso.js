// pantallas/acceso.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

function claveAlerta(titulo, x) {
  const id = x.dataset.inificha || x.dataset.iniped || x.dataset.inistock || x.dataset.inicomp;
  return normAl(titulo) + ':' + (id || normAl((x.querySelector('.tx b') || x).textContent));
}

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

// En el acceso: aviso y botón «Enviarme un enlace nuevo» con el correo escrito
function accesoSinActivar(texto) {
  const msg = $('lmsg'); if (!msg) return;
  msg.innerHTML = `<span>${esc(texto)}</span> <button type="button" class="btn sec chico" id="lreenv">Enviarme un enlace nuevo</button>`;
  $('lreenv').onclick = async () => {
    const b = $('lreenv'); b.disabled = true;
    await reenviarActivacion($('lu').value, { ok: t => { msg.textContent = t; }, err: t => { msg.querySelector('span').textContent = t; b.disabled = false; } });
  };
}

async function restablecerPassword(u) {
  if (!u.email) { toast('Ese usuario no tiene correo', true); return; }
  if (!await preguntar(`Se enviará a ${u.email} un correo para que cree una contraseña nueva.`,
    { titulo: '¿Restablecer la contraseña?', ok: 'Enviar correo' })) return;
  const { error } = await db.auth.resetPasswordForEmail(u.email, { redirectTo: location.origin + location.pathname });
  if (error) { toast('No se ha podido enviar: ' + error.message, true); return; }
  toast('Correo enviado a ' + u.email);
}

async function bienvenidaAlta() {
  try { await pagoCargarEstado(); } catch (e) {}
  const pl = PLAN_ACTUAL || {};
  const pasos = [
    ['importar', 'Trae tus datos', `Sube tu Excel de ${TT('medico', 'p', '', 'l', 'l')}, centros o clientes y los ordenamos por ti.`],
    ['equipo', 'Invita a tu equipo', 'Da acceso a las personas que van a usar delcos, cada una con su rol.'],
    ['marca', 'Pon tu marca', 'Tu logotipo y tu nombre en la plataforma y en los documentos.']];
  $('dbody').innerHTML = `<div class="fh"><div><h2>Te damos la bienvenida a delcos</h2>
      <div class="sm">${esc(nombreApp())} ya está en marcha${pl.en_prueba && pl.periodo_fin ? ` · prueba gratis hasta el ${fechaCorta(pl.periodo_fin)}` : ''}</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <p>Tres pasos para empezar con buen pie (los puedes hacer cuando quieras):</p>
    <div class="bienpasos">${pasos.map(([k, t, d], i) => `<button type="button" class="bienpaso" data-bien="${k}"><span class="bienn">${i + 1}</span>
      <span><b>${esc(t)}</b><span class="sm">${esc(d)}</span></span></button>`).join('')}</div>
    ${pl.en_prueba ? `<p class="sm">Durante la prueba no se cobra nada. Si decides no seguir, date de baja en Organización → Plan y suscripción antes del ${fechaCorta(pl.periodo_fin)}.</p>` : ''}
    <div class="acts" style="justify-content:flex-end"><button class="btn" data-cerrar>Empezar</button></div>`;
  $('dbody').querySelectorAll('[data-bien]').forEach(b => b.onclick = () => {
    $('dlg').close();
    const k = b.dataset.bien;
    if (k === 'importar') { CFG_SEC = 'importar'; ir('config'); }
    else if (k === 'equipo') ir('usuarios');
    else ir('organizacion');
  });
  $('dlg').showModal();
}

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
