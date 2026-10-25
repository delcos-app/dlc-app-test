// pantallas/inicio.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.







/** Primer minuto en que se puede empezar la visita llegando a «llegada», o null si no hay hueco. */
function inicioPosible(it, llegada, dura) {
  if (it.fija != null) return llegada <= it.fija + 10 ? Math.max(llegada, it.fija) : null;
  if (!it.ventanas) return llegada;
  for (const [a, b] of it.ventanas) { const s = Math.max(llegada, a); if (s + dura <= b) return s; }
  return null;
}








let ALERTAS_OCULTAS = null;


const normAl = t => String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').slice(0, 60);

const SALUDOS = { en: ['Good morning', 'Good afternoon', 'Good evening'], de: ['Guten Morgen', 'Guten Tag', 'Guten Abend'], fr: ['Bonjour', 'Bon après-midi', 'Bonsoir'], it: ['Buongiorno', 'Buon pomeriggio', 'Buonasera'] };







// Inicio está migrado a src/app/screens/home (v2.385.0). Estos dos nombres se quedan como adaptadores porque los llama mucho código
// antiguo; desaparecerán cuando la navegación pase al router.
function cargarInicio() { return window.delcos.screens.home.load(); }
function inicioEsqueleto() { window.delcos.screens.home.renderSkeleton(); inicioCabecera(); }

// El Inicio del portal del profesional y las alertas ocultas están en src/app/screens/home/portal-home (v2.417.0). Estos nombres se
// quedan: legado 040 (filtrarAlertasInicio) y 112 (inicioCabecera, al cargar, quizá antes de window.delcos) los usan.
function filtrarAlertasInicio() { return window.delcos.screens.portalHome.filterHiddenAlerts(); }
function inicioCabecera() { if (window.delcos && window.delcos.screens) window.delcos.screens.portalHome.placeHeader(); }
