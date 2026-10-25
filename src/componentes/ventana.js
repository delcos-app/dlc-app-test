// componentes/ventana.js · las ventanitas (aviso, confirmación, pregunta, elección, campo), «¿Salir sin guardar?» y el horario de
// consulta están en src/app/components (dialogs.ts y consultation-hours.ts, v2.416.0). Sus nombres se quedan como adaptadores:
// toda la app los usa. Aquí sigue lo que va con la pila de ventanas y con el encaje en el panel de Configuración.



// v2.122.0: la ventana va EN la página, en el sitio del apartado (antes flotaba encima con posición absoluta y su propio desplazamiento).
// Se devuelve a <body> antes de cerrarse, para que los repintados del apartado no se la lleven por delante.


// Pequeña (confirmaciones y citas), normal (fichas y formularios) y amplia (pedidos, compras y facturas)

// Ventanas integradas: en escritorio, dentro de Configuración y de las páginas propias, una ventana ocupa el área de contenido
// (sin fondo oscuro ni ventana flotante); al cerrarla vuelve el apartado. En el móvil las ventanas ya ocupan la pantalla.


let DATOS_CAMBIADOS = false;

let ULT_ACCION = 0;




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

// La ventana dentro del panel, el encaje en la página, la pila y «cargando» están en src/app/components/embedded-window (v2.422.0).
// Estos nombres se quedan: Configuración, los parches de las ventanas (legado 058 y 072), Facturación y los puentes los usan.
const VENT_AMPLIA = window.delcos.components.embeddedWindow.WIDE_WINDOWS;
const ENCAJE_MIN = window.delcos.components.embeddedWindow.EMBED_MIN_WIDTH;
function panelDeVentana(fn) { return window.delcos.components.embeddedWindow.showWindowInPanel(fn); }
function abrirApilada(fn, volverTexto) { return window.delcos.components.embeddedWindow.openStacked(fn, volverTexto); }
function colocarEncajada() { return window.delcos.components.embeddedWindow.placeEmbedded(); }
function devolverEncajada(d) { return window.delcos.components.embeddedWindow.returnEmbedded(d); }
function areaEncaje() { return window.delcos.components.embeddedWindow.embedArea(); }
function cerrarEncajadas() { return window.delcos.components.embeddedWindow.closeEmbedded(); }
