// componentes/ventana.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

async function intentarCerrar(d) {
  if (d.dataset.sucio && hayBotonGuardar(d) && !await preguntar('Si sales ahora perderás los cambios que has hecho.',
    { titulo: '¿Salir sin guardar?', ok: 'Salir sin guardar', peligro: true })) return;
  d.close();
}

/** Ventana con varias opciones; devuelve la clave elegida o null. */
function elegirOpcion(titulo, msg, botones) {
  return new Promise(res => {
    const d = $('mini');
    d.innerHTML = `<div class="fbox"><div class="fh"><h2>${esc(titulo)}</h2></div>
      <p style="margin:0 0 10px;white-space:pre-line">${esc(msg)}</p>
      <div class="acts" style="justify-content:flex-end;flex-wrap:wrap">${botones.map(b =>
        `<button class="btn ${b.cls || ''}" data-op="${b.k}">${esc(b.t)}</button>`).join('')}</div></div>`;
    const fin = v => { d.close(); res(v); };
    d.querySelectorAll('[data-op]').forEach(b => b.onclick = () => fin(b.dataset.op === 'no' ? null : b.dataset.op));
    d.oncancel = e => { e.preventDefault(); fin(null); };
    d.onclick = e => { if (e.target === d) fin(null); };
    d.showModal();
  });
}

/**
 * Franjas de consulta de un médico en una fecha, en minutos.
 * null → no sabemos su horario (sin restricción) · [] → ese día no atiende · [[ini, fin], …]
 */
function ventanasDe(dias, fecha) {
  const d = dias || {};
  if (!Object.keys(d).some(k => d[k])) return null;
  const t = d[LETRA_DIA(fecha)];
  if (!t) return [];
  const out = [];
  String(t).split(/[;,/]| y /i).forEach(parte => {
    const r = /(\d{1,2})(?:[:.h](\d{2}))?\s*[-–a]\s*(\d{1,2})(?:[:.h](\d{2}))?/.exec(parte);
    if (r) out.push([+r[1] * 60 + (+r[2] || 0), +r[3] * 60 + (+r[4] || 0)]);
    else if (/mañana/i.test(parte)) out.push([9 * 60, 14 * 60]);
    else if (/tarde/i.test(parte)) out.push([15 * 60, 20 * 60]);
  });
  return out.length ? out.sort((a, b) => a[0] - b[0]) : [[0, 24 * 60]];
}

// Las pantallas que se abrían en ventana se pintan dentro del panel
function panelDeVentana(fn) {
  salirPanel();
  const r = $('dbody'); r.id = 'dbody-modal';
  $('cfgcuerpo').innerHTML = '<div id="dbody" data-panel="1" class="cfgpanel card"></div>';
  PANEL_ACTIVO = { tipo: 'dbody', refrescar: () => panelDeVentana(fn) };
  fn();
}

async function pedirCampo(titulo, tipo, valor, etiqueta) {
  return new Promise(res => {
    const d = $('mini');
    d.innerHTML = `<div class="fbox"><div class="fh"><h2>${esc(titulo)}</h2></div><label for="rnpc">${esc(etiqueta)}</label><input id="rnpc" type="${tipo}" value="${esc(valor || '')}" min="${hoyISO()}">
      <div class="acts" style="justify-content:flex-end"><button class="btn sec" data-op="no">Cancelar</button><button class="btn" data-op="si">Aceptar</button></div></div>`;
    const fin = v => { d.close(); res(v); };
    d.querySelectorAll('[data-op]').forEach(b => b.onclick = () => fin(b.dataset.op === 'si' ? $('rnpc').value : null));
    d.oncancel = e => { e.preventDefault(); fin(null); };
    if (typeof mejorarCampos === 'function') mejorarCampos(d);
    d.showModal();
  });
}
