/* ============================================================
   DLC OS 2.0 · v2.17.0 · Velocidad, ventanas, paginación,
   duplicados, auditoría y ayudas
   v2.424.0: la caché de peticiones (core/legacy-a/request-cache.ts), los cierres al pulsar fuera, la paginación y las ayudas
   de cualquier lista (outside-clicks.ts) y los textos de ayuda (help-texts.ts, i18n/es/legacy-a-help.ts: ya en su estado
   final tras legado 018–024) están en src/app. RPC_ORIG, FROM_ORIG, RC y RC_VUELO se quedan: api.js y otros los leen.
   ============================================================ */

const RPC_ORIG = db.rpc.bind(db);
const FROM_ORIG = db.from.bind(db);
const RC = new Map(), RC_VUELO = new Map();
window.delcos.legacyA.installRequestCache();

let DUP_RES = null;
window.delcos.legacyA.listenToOutsideClicks();
window.delcos.legacyA.watchListsAndHelp();

const AYUDA_KPI = window.delcos.content.indicatorHelp();
const AYUDA = window.delcos.content.screenHelp();
window.delcos.legacyA.listenToHelpButtons();
