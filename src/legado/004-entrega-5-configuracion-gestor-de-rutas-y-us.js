// @ts-check
/* ============================================================
   DLC OS 2.0 · Entrega 5: configuración, gestor de rutas y usuarios
   v2.424.0: la página antigua de Administración y los botones de sección están en src/app/screens/settings/admin-page.ts.
   cargarAdminBase se queda: legado 080 la envuelve como cargarAdmin.
   ============================================================ */

 // v2.440.0: CFG_SEC, ADM_SEC, USUARIOS, CATS → estado de src/app (plan 6.6), accesible en window
const AREAS = window.delcos.content.areas();

window.delcos.legacyA.listenToSectionButtons();

const punto = k => (PERFIL.preferencias || {})[k] || null;

function cargarAdminBase() { return window.delcos.legacyA.loadAdmin(); }
