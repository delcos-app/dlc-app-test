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
