/* ============================================================
   DLC OS 2.0 · v2.39.0 · Paradas del plan con ficha y nota,
   configuración completa en el panel (sin ventanas ni saltos),
   VeriFactu explicado, manual con explicación antes de ir,
   preferencias con contexto y limpieza para que no se acumule lentitud
   ============================================================ */

/* ---------------- rendimiento: memoria y mapas ---------------- */

// Caché del dispositivo con tope: se guardan las 60 consultas más recientes
(function limpiarCacheLocal() {
  try {
    const k = Object.keys(localStorage).filter(x => x.startsWith('dlc-rc-'));
    if (k.length > 60) {
      k.map(x => { let t = 0; try { t = JSON.parse(localStorage.getItem(x)).t || 0; } catch (e) {} return [x, t]; })
        .sort((a, b) => a[1] - b[1]).slice(0, k.length - 60).forEach(([x]) => localStorage.removeItem(x));
    }
  } catch (e) {}
  setTimeout(limpiarCacheLocal, 10 * 60 * 1000);
})();
// Cada mapa se libera cuando su pantalla desaparece (antes quedaban vivos en memoria)
if (window.L && L.map) {
  const MAPAS = new Set(), crear = L.map;
  L.map = function (el, o) {
    const c = typeof el === 'string' ? document.getElementById(el) : el;
    if (c && c.__mapa) { try { c.__mapa.remove(); } catch (e) {} MAPAS.delete(c.__mapa); }
    const m = crear.call(L, el, o); if (c) c.__mapa = m; MAPAS.add(m); return m;
  };
  setInterval(() => MAPAS.forEach(m => { const c = m.getContainer && m.getContainer(); if (!c || !c.isConnected) { try { m.remove(); } catch (e) {} MAPAS.delete(m); } }), 30000);
}

/* ---------------- plan: cada parada con la ficha y una nota ---------------- */


/* ---------------- Configuración: todo se muestra en el panel de la derecha ---------------- */
// La ventana dentro del panel está en src/app/components/embedded-window (v2.422.0); aquí, en su sitio de siempre, se protege la ventana
// (va antes que los parches de legado 072)
window.delcos.components.embeddedWindow.guardPanelDialog($('dlg'));



/* ---------------- Mi perfil: contexto de la persona ---------------- */


/* ---------------- VeriFactu: explicado y claro ---------------- */


/* ---------------- Manual: se explica antes de llevarte a ningún sitio ---------------- */

document.addEventListener('click', e => { const r = $('manres'); if (r && !e.target.closest('.manbusca')) r.classList.add('hide'); });


