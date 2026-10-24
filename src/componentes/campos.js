// @ts-check
// componentes/campos.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

function ojoClave(inp) {
  if (!inp || inp.dataset.ojo || inp.closest('.pwdw')) return;
  inp.dataset.ojo = '1';
  const w = document.createElement('span'); w.className = 'pwdw';
  inp.parentNode.insertBefore(w, inp); w.appendChild(inp);
  const b = document.createElement('button'); b.type = 'button'; b.className = 'pwdojo'; b.innerHTML = OJO_SVG.ver;
  b.setAttribute('aria-label', 'Ver la contraseña'); b.title = 'Ver la contraseña';
  b.onclick = () => {
    const ver = inp.type === 'password'; inp.type = ver ? 'text' : 'password';
    b.innerHTML = ver ? OJO_SVG.ocultar : OJO_SVG.ver; const t = ver ? 'Ocultar la contraseña' : 'Ver la contraseña'; b.setAttribute('aria-label', t); b.title = t;
    inp.focus({ preventScroll: true });
  };
  w.appendChild(b);
}

/* v2.72.0 · Un clasificador de ficha, cliente o producto sin papel es un campo personalizado: tipo y dónde se ve */
function cajaCampo(c, completo) {
  if (c.papel || !CAMPO_TABLA[c.ambito]) return '';
  const t = c.tipo_campo || 'lista', chk = (k, txt) => `<label class="chk"><input type="checkbox" id="cfc_${k}" ${c[k] ? 'checked' : ''} ${completo ? '' : 'disabled'}> ${txt}</label>`;
  return `<div class="cfcampo"><h3>Campo personalizado</h3>
    <div class="g2"><div><label for="cfctipo">Tipo</label><select id="cfctipo" ${completo ? '' : 'disabled'}>${TIPOS_CAMPO.map(([k, n]) => `<option value="${k}" ${k === t ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
      <div class="cfchks">${chk('obligatorio', 'Obligatorio')}${chk('solo_lectura', 'Solo lectura')}${chk('en_ficha', 'En la ficha')}${chk('en_tabla', 'Columna en la tabla')}${chk('en_filtro', 'Filtro (listas y sí/no)')}</div></div>
    ${completo ? '<div class="acts" style="justify-content:flex-end"><button class="btn sec" id="cfcok">Guardar campo</button></div>' : ''}</div>`;
}

function validarDoc(v, tipo) {
  v = (v || '').toUpperCase().replace(/[\s-]/g, '');
  if (!v) return { ok: true, v };
  if (tipo === 'Empresa') {
    const m = v.match(/^([ABCDEFGHJKLMNPQRSUVW])(\d{7})([0-9A-J])$/);
    if (!m) return { ok: false, v, msg: 'El CIF son una letra, 7 números y un dígito o letra de control (p. ej. B24920548).' };
    let a = 0, b = 0;
    m[2].split('').forEach((d, i) => { if (i % 2) a += +d; else { const x = 2 * d; b += Math.floor(x / 10) + x % 10; } });
    const c = (10 - (a + b) % 10) % 10, letra = 'JABCDEFGHI'[c];
    return (m[3] === String(c) || m[3] === letra) ? { ok: true, v } : { ok: false, v, msg: 'El dígito de control del CIF no es correcto.' };
  }
  let n = v;
  if (/^[XYZ]\d{7}[A-Z]$/.test(n)) n = 'XYZ'.indexOf(n[0]) + n.slice(1);
  if (!/^\d{8}[A-Z]$/.test(n)) return { ok: false, v, msg: 'El DNI son 8 números y una letra; el NIE, X, Y o Z seguida de 7 números y una letra.' };
  return LETRAS_DNI[+n.slice(0, 8) % 23] === n[8] ? { ok: true, v } : { ok: false, v, msg: 'La letra no corresponde a ese número.' };
}

function campoDato(v, k, valor) {
  const lab = esc(v.dato_etiqueta || (v.dato_tipo === 'numero' ? 'Cantidad' : 'Detalle'));
  if (v.dato_tipo === 'numero') return `<label class="datol">${lab}<input type="number" min="0" step="1" data-dato="${k}" value="${esc(valor || '')}" placeholder="0"></label>`;
  if (v.dato_tipo === 'lista') return `<label class="datol">${lab}<select data-dato="${k}"><option value=""></option>${(v.dato_opciones || [])
    .map(o => `<option ${o === valor ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></label>`;
  return `<label class="datol">${lab}<input data-dato="${k}" value="${esc(valor || '')}" placeholder="Opcional"></label>`;
}

// Email comprobado mientras se escribe: ✓ verde si es válido, ✗ rojo si no
function validarEmailEnVivo(inp) {
  if (!inp || inp.dataset.vemail) return; inp.dataset.vemail = '1';
  const w = document.createElement('span'); w.className = 'emailw'; inp.parentNode.insertBefore(w, inp); w.appendChild(inp);
  w.insertAdjacentHTML('beforeend', '<span class="emailico" aria-hidden="true"></span>');
  const act = () => {
    const v = inp.value.trim(), ok = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v);
    w.classList.toggle('ok', !!v && ok); w.classList.toggle('mal', !!v && !ok);
    w.querySelector('.emailico').textContent = !v ? '' : ok ? '✓' : '✗';
    const err = w.nextElementSibling && w.nextElementSibling.classList.contains('campoerr') ? w.nextElementSibling : null;
    if (err && ok) { err.remove(); inp.classList.remove('conerr'); }
  };
  inp.addEventListener('input', act); act();
}

function campoInput(c, v) {
  const a = `data-cpk="${esc(c.clave)}" ${c.solo_lectura ? 'disabled' : ''}`;
  const val = v == null ? '' : v;
  if (c.tipo === 'lista') return `<select ${a}><option value=""></option>${(c.valores || []).concat(val && !(c.valores || []).includes(val) ? [val] : [])
    .map(x => `<option ${x === val ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select>`;
  if (c.tipo === 'si_no') return `<select ${a}><option value=""></option><option value="true" ${val === true ? 'selected' : ''}>Sí</option><option value="false" ${val === false ? 'selected' : ''}>No</option></select>`;
  if (c.tipo === 'fecha') return `<input type="date" ${a} value="${esc(String(val))}">`;
  if (c.tipo === 'numero') return `<input type="text" inputmode="decimal" ${a} value="${esc(String(val).replace('.', ','))}">`;
  return `<input ${a} value="${esc(String(val))}" maxlength="500" placeholder="${esc(c.descripcion || '')}">`;
}

function notaAmplia(i) {
  if (!i || i.dataset.nota || i.type !== 'text') return;
  const txt = (i.id + ' ' + (i.placeholder || '') + ' ' + (((i.id && document.querySelector(`label[for="${i.id}"]`)) || {}).textContent || '')).toLowerCase();
  if (!/\bnota|observac|comentario/.test(txt) || /buscar/.test(txt)) return;
  const t = document.createElement('textarea'); [...i.attributes].forEach(a => { if (a.name !== 'type' && a.name !== 'value') t.setAttribute(a.name, a.value); });
  t.value = i.value; t.rows = 3; t.dataset.nota = '1'; t.classList.add('notaamplia'); i.replaceWith(t);
  const campo = t.closest('.g2 > div, .g3 > div'); if (campo) campo.classList.add('ocupatodo');
}

/* v2.109.0 · Las ventanas no muestran lo escrito en otras ocasiones. El navegador sugería, por ejemplo, la nota del pedido
   anterior al crear uno nuevo: los campos de las ventanas y de las pantallas no guardan historial (salvo los que lo piden). */
function sinHistorial(raiz) {
  (raiz || document).querySelectorAll('input:not([autocomplete]):not([type=checkbox]):not([type=radio]):not([type=file]):not([type=hidden]), textarea:not([autocomplete])')
    .forEach(i => i.setAttribute('autocomplete', 'off'));
}

const LETRAS_DNI = 'TRWAGMYFPDXBNJZSQVHLCKE';

// Una pasada por fotograma como mucho, aunque la pantalla cambie muchas veces seguidas
let sinHistorialPend = false;

const sinHistorialLuego = () => { if (sinHistorialPend) return; sinHistorialPend = true; requestAnimationFrame(() => { sinHistorialPend = false; sinHistorial(document.body); }); };

const campoTxt = k => CAMPO_TXT[k] || (k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, ' '));

// Ver la contraseña mientras se escribe, en cualquier campo de contraseña
const OJO_SVG = {
  ver: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  ocultar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.9 4.2A10.6 10.6 0 0 1 12 4c6.4 0 10 8 10 8a17.6 17.6 0 0 1-2.2 3.2M6.6 6.6C3.7 8.6 2 12 2 12s3.6 8 10 8a9.7 9.7 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/><path d="M2 2l20 20"/></svg>'
};
