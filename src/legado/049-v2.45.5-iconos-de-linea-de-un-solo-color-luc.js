/* ============================================================
   v2.45.5 · Iconos de línea de un solo color (Lucide) en toda la
   plataforma, textos genéricos para el acceso al servidor de correo,
   sin «Cambiar contraseña» en el menú ni en el perfil
   ============================================================ */

const RE_ICO = new RegExp(Object.keys(ICON_EMOJI).sort((a, b) => b.length - a.length).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + '|\ufe0f', 'g');

let ICO_PEND = new Set(), ICO_RAF = 0;
new MutationObserver(ms => {
  ms.forEach(m => m.addedNodes.forEach(n => ICO_PEND.add(n.nodeType === 1 ? n : n.parentElement)));
  if (ICO_RAF) return;
  ICO_RAF = 1; queueMicrotask(() => { ICO_RAF = 0; const l = [...ICO_PEND]; ICO_PEND.clear(); l.forEach(n => n && n.isConnected && iconizar(n)); });
}).observe(document.body, { childList: true, subtree: true });
iconizar(document.body);

// El menú «Más» del móvil usa exactamente los mismos iconos
Object.keys(ICO_NAV).forEach(k => { ICO_MOD[k] = svgIco(ICON_NOM[ICO_NAV[k]]); });
iconosMenu();
new MutationObserver(() => { if (document.querySelector('nav.main [data-t]:not(:has(.navico))')) iconosMenu(); })
  .observe(document.querySelector('nav.main') || document.body, { childList: true, subtree: true });

/* ---------------- menú de usuario y perfil ---------------- */

document.querySelectorAll('[data-u="pass"]').forEach(b => b.remove());
new MutationObserver(() => document.querySelectorAll('[data-u="pass"]').forEach(b => b.remove())).observe(document.body, { childList: true, subtree: true });
// En el perfil no se cambia la contraseña (se hace con «He olvidado la contraseña» en el acceso)


