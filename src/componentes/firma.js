// componentes/firma.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

// Firma con el dedo o el ratón
function padFirma(canvas) {
  const ctx = canvas.getContext('2d'); let dib = false, hay = false, ult = null;
  const ajustar = () => { const r = canvas.getBoundingClientRect(), k = window.devicePixelRatio || 1; canvas.width = r.width * k; canvas.height = r.height * k; ctx.scale(k, k); ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#0B2540'; hay = false; };
  const pt = e => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  canvas.addEventListener('pointerdown', e => { e.preventDefault(); canvas.setPointerCapture(e.pointerId); dib = true; ult = pt(e); });
  canvas.addEventListener('pointermove', e => { if (!dib) return; const p = pt(e); ctx.beginPath(); ctx.moveTo(ult.x, ult.y); ctx.lineTo(p.x, p.y); ctx.stroke(); ult = p; hay = true; });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => canvas.addEventListener(t, () => { dib = false; }));
  requestAnimationFrame(ajustar);
  return { borrar: ajustar, vacia: () => !hay, imagen: () => (hay ? canvas.toDataURL('image/png').split(',')[1] : null), marcar: () => { hay = true; } };
}
