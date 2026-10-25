/* ============================================================
   v2.45.5 · Iconos de línea de un solo color (Lucide) en toda la
   plataforma, textos genéricos para el acceso al servidor de correo,
   sin «Cambiar contraseña» en el menú ni en el perfil
   ============================================================ */

const RE_ICO = new RegExp(Object.keys(ICON_EMOJI).sort((a, b) => b.length - a.length).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + '|\ufe0f', 'g');

window.delcos.legacyB.watchIcons();
// En el perfil no se cambia la contraseña (se hace con «He olvidado la contraseña» en el acceso)
