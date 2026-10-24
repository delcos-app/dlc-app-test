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

async function abrirApilada(fn, volverTexto) {
  const d = $('dlg'), b = $('dbody');
  PILA_VENT.push({ nodos: [...b.childNodes], clases: d.className, titulo: volverTexto });
  APILANDO = true;
  const frag = document.createDocumentFragment(); [...b.childNodes].forEach(n => frag.appendChild(n));
  if (d.open) d.close();
  try { await fn(); } finally { APILANDO = false; }
  if (!d.open) d.showModal();
  const fh = b.querySelector('.fh');
  if (fh && !b.querySelector('.pilavolver')) fh.insertAdjacentHTML('beforebegin', `<button class="pilavolver" type="button">${svgIco(ICON_NOM['arrow-left'])} ${esc(volverTexto || 'Volver')}</button>`);
  const v = b.querySelector('.pilavolver'); if (v) v.onclick = () => d.close();
}

// v2.122.0: la ventana va EN la página, en el sitio del apartado (antes flotaba encima con posición absoluta y su propio desplazamiento).
// Se devuelve a <body> antes de cerrarse, para que los repintados del apartado no se la lleven por delante.
function colocarEncajada(d, area) {
  // v2.134.0: con el menú lateral, nav.main ocupa toda la altura y no es cabecera (daba el alto de la pantalla)
  const cab = Math.max(0, ...['header', '.top', document.body.classList.contains('menulat') ? '' : 'nav.main'].filter(Boolean).map(q => { const e = document.querySelector(q); return e && getComputedStyle(e).position.match(/fixed|sticky/) ? e.getBoundingClientRect().bottom : 0; }));
  document.documentElement.style.setProperty('--alto-cab', cab + 'px');
}

function devolverEncajada(d) {
  if (d.__casa && d.parentNode !== d.__casa) d.__casa.appendChild(d);
}

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

const preguntar = (msg, o = {}) => appVentana({ msg, titulo: o.titulo, ok: o.ok, peligro: o.peligro });

const pedirTexto = (msg, valor, o = {}) => appVentana({ msg, titulo: o.titulo, ok: o.ok || 'Guardar', campo: { valor, placeholder: o.placeholder, tipo: o.tipo }, opciones: o.opciones });

// Pequeña (confirmaciones y citas), normal (fichas y formularios) y amplia (pedidos, compras y facturas)
const VENT_AMPLIA = ['editorPedido', 'verPedido', 'editorCompra', 'verFactura'];

// Ventanas integradas: en escritorio, dentro de Configuración y de las páginas propias, una ventana ocupa el área de contenido
// (sin fondo oscuro ni ventana flotante); al cerrarla vuelve el apartado. En el móvil las ventanas ya ocupan la pantalla.
const ENCAJE_MIN = 900;

const cerrarEncajadas = () => ['dlg2', 'dlg'].forEach(id => { const d = $(id); if (d && d.open && d.classList.contains('encajada')) d.close(); });

let DATOS_CAMBIADOS = false;

const GUARDA_TXT = /^(\+\s*)?(guardar|crear|añadir|enviar|validar|aplicar|confirmar|emitir|cobrar|registrar|marcar|asignar|unificar|cambiar|borrar|eliminar|quitar|anular|rectificar|liquidar|pedir|actualizar)\b/i;

const esBotonGuardar = b => {
  if (!b || b.matches('.sec, .x, .kmv, .plic, [data-cerrar], [data-cerrar2], .vueltabtn, .guardando')) return false;
  if (!b.closest('dialog[open], #v-config')) return false;
  const t = (b.textContent || '').trim();
  return /ok$|guardar|enviar/i.test(b.id || '') || GUARDA_TXT.test(t);
};

let ULT_ACCION = 0;

/**
 * Ventana propia (aviso, confirmación o pregunta con un campo).
 * @param {{ titulo?: string, msg?: string, ok?: string, cancel?: string, campo?: any, opciones?: any, peligro?: boolean }} o
 */
function appVentanaBase({ titulo, msg, ok, cancel, campo, opciones, peligro }) {
  return new Promise(res => {
    const d = $('mini');
    d.innerHTML = `<div class="fbox">
      <div class="fh"><h2>${esc(titulo || 'Confirmar')}</h2></div>
      ${msg ? `<p style="margin:0 0 10px;white-space:pre-line">${esc(msg)}</p>` : ''}
      ${campo ? `<input id="mcampo" type="${campo.tipo || 'text'}" value="${esc(campo.valor || '')}"
                   placeholder="${esc(campo.placeholder || '')}" ${campo.min ? `min="${campo.min}"` : ''}>` : ''}
      ${opciones && opciones.length ? `<div class="chips" style="padding:10px 0 0">${
        opciones.map(o => `<button type="button" class="chip" data-mop="${esc(o)}">${esc(o)}</button>`).join('')}</div>` : ''}
      <div class="acts" style="justify-content:flex-end">
        ${cancel === false ? '' : `<button class="btn sec" id="mno">${esc(cancel || 'Cancelar')}</button>`}
        <button class="btn ${peligro ? 'dang' : ''}" id="mok">${esc(ok || 'Aceptar')}</button></div></div>`;

    const fin = v => { d.close(); res(v); };
    $('mok').onclick = () => fin(campo ? ($('mcampo').value || '') : true);
    if ($('mno')) $('mno').onclick = () => fin(campo ? null : false);
    d.querySelectorAll('[data-mop]').forEach(b => b.onclick = () => { $('mcampo').value = b.dataset.mop; });
    d.onclick = e => { if (e.target === d) fin(campo ? null : false); };
    d.oncancel = e => { e.preventDefault(); fin(campo ? null : false); };
    d.showModal();
    setTimeout(() => { const i = $('mcampo'); if (i) { i.focus(); i.onkeydown = ev => { if (ev.key === 'Enter') fin(i.value); }; } else $('mok').focus(); }, 30);
  });
}

// Ventana de texto: «area» para notas (varias líneas y más espacio)
function appVentana(o) {
  const p = appVentanaBase(o);
  if (o && o.campo && o.campo.tipo === 'area') setTimeout(() => {
    const i = $('mcampo'); if (!i) return;
    const t = document.createElement('textarea'); t.id = 'mcampo'; t.rows = 6; t.value = i.value; t.placeholder = i.placeholder; i.replaceWith(t);
    $('mini').classList.add('ancha'); t.focus();
  }, 0);
  return p;
}

function areaEncajeBase() {
  if (innerWidth < ENCAJE_MIN) return null;
  if (TAB === 'config') return $('cfgcuerpo-hub') || $('cfgcuerpo');
  if (PAGINAS[TAB]) return document.querySelector(`#v-${TAB} .pagcuerpo`) || $('cfgcuerpo');
  return null;
}

// Mientras se abre una ficha, no se encaja en la página
function areaEncaje(...a) { return FX_FICHA ? null : areaEncajeBase.apply(this, a); }
