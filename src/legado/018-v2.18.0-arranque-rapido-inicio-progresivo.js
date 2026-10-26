// @ts-check
/* ============================================================
   DLC OS 2.0 · v2.18.0 · Arranque rápido, Inicio progresivo,
   pedidos con IVA y borrador, productos, pacientes y agenda
   v2.424.0: la entrada en la plataforma está en src/app/core/legacy-a/show-app.ts y sus ayudas, en help-texts.ts.
   mostrarAppBase se queda: legado 072 la envuelve como mostrarApp.
   ============================================================ */

window.delcos.legacyA.cacheMoreRequests();
const T0 = performance.now();
const PKEY = 'dlc-perfil';

function mostrarAppBase(perfil) { window.delcos.legacyA.showApp(perfil); }
