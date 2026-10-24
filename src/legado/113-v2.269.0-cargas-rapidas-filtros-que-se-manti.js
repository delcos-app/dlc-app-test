/* ============================================================
   v2.269.0 · Cargas rápidas, filtros que se mantienen y notas en Pedidos (petición de Eric, 11/10/2026; necesita el SQL 144).
   - Las pantallas se enseñan antes: «estable» espera 50 ms sin cambios (antes 120), mira cada 15 ms (antes 30) y no espera a las
     cifras que cuentan (Analítica esperaba ~1 s oculta a que terminaran sus indicadores). Con el SQL 144
     las consultas lentas bajan a 20-60 ms.
   - Los indicadores de una lista solo se piden en su pantalla (los de Clientes se pedían también en Pedidos, Compras, Productos…).
   - Los filtros de las listas (los de la fila de filtros y los propios del panel «Filtros») se recuerdan: si la pantalla se vuelve a pintar (al guardar un pedido,
     al volver a ella…) salen con lo que tenías puesto, hasta que los quites tú.
   - Pedidos: columna «Notas».
   ============================================================ */
// Una cifra que se anima al contar (solo cambia su texto, y son números) no es «la pantalla sigue cargando»: antes, en Analítica,
// la pantalla esperaba oculta ~1 s a que terminaran de contar los indicadores
function cambioDeCifra(m) {
  if (m.type !== 'childList') return false;
  const ns = [...m.addedNodes, ...m.removedNodes];
  return ns.length > 0 && ns.every(n => n.nodeType === 3) && /^[\d.,\s%€+\-−]*$/.test(m.target.textContent || '');
}
plCargarKpis = (orig => function (tab, ...a) {
  if (tab !== TAB) return;   // en otra pantalla, no (se piden al llegar a la suya)
  return orig.call(this, tab, ...a);
})(plCargarKpis);

// ---- Memoria de filtros: lo que se elige en una fila de filtros se vuelve a poner cuando la pantalla se pinta de nuevo
const FMEM = {};
function filtroGuardar(e) {
  const el = e.target; if (!el || !el.id || !/^(SELECT|INPUT)$/.test(el.tagName) || !el.closest('main .filtros, main .htpropios')) return;   // la fila de filtros o, con el modelo de página, el panel
  if (el.type === 'checkbox' || el.type === 'radio') return;
  FMEM[el.id] = el.value;
}
document.addEventListener('change', filtroGuardar, true);
document.addEventListener('input', filtroGuardar, true);
function filtrosRestaurar(root) {
  (root || document).querySelectorAll('.filtros select[id], .filtros input[id], .htpropios select[id], .htpropios input[id]').forEach(el => {
    if (!(el.id in FMEM) || el.value === FMEM[el.id] || el.type === 'checkbox' || el.type === 'radio') return;
    if (el.tagName === 'SELECT' && ![...el.options].some(o => o.value === FMEM[el.id])) return;
    el.value = FMEM[el.id];
  });
}
// Las pantallas montan su periodo justo antes de pedir la lista: es el momento de devolver los filtros
montarPeriodo = (orig => function (el, ...a) {
  const r = orig.call(this, el, ...a);
  try { filtrosRestaurar(el && el.closest('main > section')); } catch (e) {}
  return r;
})(montarPeriodo);





