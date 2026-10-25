// pantallas/inicio.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

function inicioPosible(it, llegada, dura) { return window.delcos.leftovers.earliestStart(it, llegada, dura); }

let ALERTAS_OCULTAS = null;

const SALUDOS = { en: ['Good morning', 'Good afternoon', 'Good evening'], de: ['Guten Morgen', 'Guten Tag', 'Guten Abend'], fr: ['Bonjour', 'Bon après-midi', 'Bonsoir'], it: ['Buongiorno', 'Buon pomeriggio', 'Buonasera'] };

// Inicio está migrado a src/app/screens/home (v2.385.0). Estos dos nombres se quedan como adaptadores porque los llama mucho código
// antiguo; desaparecerán cuando la navegación pase al router.
function cargarInicio() { return window.delcos.screens.home.load(); }

// El Inicio del portal del profesional y las alertas ocultas están en src/app/screens/home/portal-home (v2.417.0). Estos nombres se
// quedan: legado 040 (filtrarAlertasInicio) y 112 (inicioCabecera, al cargar, quizá antes de window.delcos) los usan.
function filtrarAlertasInicio() { return window.delcos.screens.portalHome.filterHiddenAlerts(); }
function inicioCabecera() { if (window.delcos && window.delcos.screens) window.delcos.screens.portalHome.placeHeader(); }
