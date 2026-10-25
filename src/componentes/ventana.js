// componentes/ventana.js · las ventanitas (aviso, confirmación, pregunta, elección, campo), «¿Salir sin guardar?» y el horario de
// consulta están en src/app/components (dialogs.ts y consultation-hours.ts, v2.416.0). Sus nombres se quedan como adaptadores:
// toda la app los usa. Aquí sigue lo que va con la pila de ventanas y con el encaje en el panel de Configuración.

// Las pantallas que se abrían en ventana se pintan dentro del panel
function panelDeVentana(fn) {
  salirPanel();
  const r = $('dbody'); r.id = 'dbody-modal';
  $('cfgcuerpo').innerHTML = '<div id="dbody" data-panel="1" class="cfgpanel card"></div>';
  PANEL_ACTIVO = { tipo: 'dbody', refrescar: () => panelDeVentana(fn) };
  fn();
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

// Pequeña (confirmaciones y citas), normal (fichas y formularios) y amplia (pedidos, compras y facturas)
const VENT_AMPLIA = ['editorPedido', 'verPedido', 'editorCompra', 'verFactura'];

// Ventanas integradas: en escritorio, dentro de Configuración y de las páginas propias, una ventana ocupa el área de contenido
// (sin fondo oscuro ni ventana flotante); al cerrarla vuelve el apartado. En el móvil las ventanas ya ocupan la pantalla.
const ENCAJE_MIN = 900;

const cerrarEncajadas = () => ['dlg2', 'dlg'].forEach(id => { const d = $(id); if (d && d.open && d.classList.contains('encajada')) d.close(); });

let DATOS_CAMBIADOS = false;

let ULT_ACCION = 0;

function areaEncajeBase() {
  if (innerWidth < ENCAJE_MIN) return null;
  if (TAB === 'config') return $('cfgcuerpo-hub') || $('cfgcuerpo');
  if (PAGINAS[TAB]) return document.querySelector(`#v-${TAB} .pagcuerpo`) || $('cfgcuerpo');
  return null;
}

// Mientras se abre una ficha, no se encaja en la página
function areaEncaje(...a) { return FX_FICHA ? null : areaEncajeBase.apply(this, a); }

async function ventanaCargando(fn) { const d = $('dlg'); d.classList.add('cargando'); try { return await fn(); } finally { d.classList.remove('cargando'); } }

// Adaptadores (src/app/components/dialogs.ts y consultation-hours.ts)
function appVentana(o) { return window.delcos.components.showDialog(o || {}); }
function preguntar(msg, o) { return window.delcos.components.confirmAction(msg, o || {}); }
function pedirTexto(msg, valor, o) { return window.delcos.components.askText(msg, valor, o || {}); }
function elegirOpcion(titulo, msg, botones) { return window.delcos.components.chooseOption(titulo, msg, botones); }
function pedirCampo(titulo, tipo, valor, etiqueta) { return window.delcos.components.askField(titulo, tipo, valor, etiqueta); }
function intentarCerrar(d) { return window.delcos.components.tryClose(d); }
function hayBotonGuardar(d) { return window.delcos.components.hasSaveButton(d); }
function esBotonGuardar(b) { return window.delcos.components.isSaveButton(b); }
function ventanasDe(dias, fecha) { return window.delcos.components.attendanceWindows(dias, fecha); }
