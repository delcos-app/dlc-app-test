// @ts-check
// pantallas/analitica.js · la página de Analítica está en src/app/screens/analytics (v2.412.0 y v2.419.0).
// Aquí queda el estado que leen las pruebas (ANSEC), legado 074 (ANSEC) y 109 (AN_MED), y los nombres que llaman otras partes.

 // v2.440.0: AN_MED → estado de src/app (plan 6.6), accesible en window

 // v2.440.0: ANSEC → estado de src/app (plan 6.6), accesible en window

// La página y su Resumen están en src/app/screens/analytics/page (v2.419.0). Estos nombres se quedan: el mapa de páginas (legado
// 001), la caché de pantallas (legado 057) y el cambio de sesión (legado 028) los llaman.
function cargarAnalitica() { return window.delcos.screens.analytics.loadAnalytics(); }

// «Pedidos tras la visita» y «Explorar datos» están en src/app/screens/analytics (v2.412.0). Estos nombres se quedan: la página
// (src/app/screens/analytics/page), legado 109 y las pruebas los llaman.
