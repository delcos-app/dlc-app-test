// nucleo/version.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

async function versionPublicada() {
  try {
    const r = await fetch('./index.html?v=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) return null;
    const m = /app\.js\?v=([0-9.]+)/.exec(await r.text());
    return m ? m[1] : null;
  } catch (e) { return null; }
}

function hayAlgoAMedias() {
  if (document.querySelector('dialog[open]')) return true;
  const a = document.activeElement;
  return !!(a && a.matches && a.matches('input:not([type=search]), textarea, select, [contenteditable="true"]'));
}

async function comprobarVersion() {
  if (Date.now() - VERSION_VISTA < 60 * 1000 || !VERSION_APP || document.hidden) return;
  VERSION_VISTA = Date.now();
  const v = await versionPublicada();
  if (!v || v === VERSION_APP) return;
  if (!hayAlgoAMedias()) { try { sessionStorage.setItem('dlc-recarga-version', v); } catch (e) {} location.reload(); return; }
  const aviso = $('nuevaver'); if (aviso) aviso.classList.remove('hide');
}
