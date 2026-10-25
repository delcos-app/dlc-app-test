/* ============================================================
   DLC OS 2.0 · Entrega 5: configuración, gestor de rutas y usuarios
   v2.424.0: la página antigua de Administración y los botones de sección están en src/app/screens/settings/admin-page.ts.
   cargarAdminBase se queda: legado 080 la envuelve como cargarAdmin.
   ============================================================ */

let CFG_SEC = 'prefs', ADM_SEC = 'usuarios', USUARIOS = [], CATS = [];
const AREAS = window.delcos.content.areas();

window.delcos.legacyA.listenToSectionButtons();

const punto = k => (PERFIL.preferencias || {})[k] || null;

function cargarAdminBase() { return window.delcos.legacyA.loadAdmin(); }
