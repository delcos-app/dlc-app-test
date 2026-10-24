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
