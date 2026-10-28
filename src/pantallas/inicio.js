// @ts-check
// pantallas/inicio.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.


 // v2.440.0: ALERTAS_OCULTAS → estado de src/app (plan 6.6), accesible en window

const SALUDOS = { en: ['Good morning', 'Good afternoon', 'Good evening'], de: ['Guten Morgen', 'Guten Tag', 'Guten Abend'], fr: ['Bonjour', 'Bon après-midi', 'Bonsoir'], it: ['Buongiorno', 'Buon pomeriggio', 'Buonasera'] };

// Inicio está migrado a src/app/screens/home (v2.385.0). Estos dos nombres se quedan como adaptadores porque los llama mucho código
// antiguo; desaparecerán cuando la navegación pase al router.

// El Inicio del portal del profesional y las alertas ocultas están en src/app/screens/home/portal-home (v2.417.0). Estos nombres se
// quedan: legado 040 (filtrarAlertasInicio) y 112 (inicioCabecera, al cargar, quizá antes de window.delcos) los usan.
function inicioCabecera() { if (window.delcos && window.delcos.screens) window.delcos.screens.portalHome.placeHeader(); }
