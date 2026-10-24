/* ============================================================
   DLC OS 2.0 · v2.21.0 · Periodos de fechas, ventas y analítica
   con totales, indicadores en tarjetas, ruta en curso reordenable
   ============================================================ */


/* ---------------- periodos de fechas ---------------- */



/** Selector de periodo. el.__rango() devuelve { desde, hasta } (null = sin límite). */
function montarPeriodoBase(el, o) {
  const clave = 'dlc-per-' + (o.id || el.id) + '-' + (PERFIL ? PERFIL.id : '');
  let v = localStorage.getItem(clave) || o.valor || 'mes';
  el.innerHTML = `<label>Periodo</label>
    <select data-per>${PERIODOS.map(([k, t]) => `<option value="${k}" ${k === v ? 'selected' : ''}>${t}</option>`).join('')}</select>
    <div class="perpers ${v === 'pers' ? '' : 'hide'}"><input type="date" data-pd aria-label="Desde"><span class="sm">a</span><input type="date" data-ph aria-label="Hasta"></div>
    <div class="sm perrango"></div>`;
  const s = el.querySelector('[data-per]'), d = el.querySelector('[data-pd]'), hh = el.querySelector('[data-ph]');
  const texto = () => {
    const r = el.__rango();
    el.querySelector('.perrango').textContent = v === 'pers' || v === 'todo' ? '' :
      (r.desde === r.hasta ? fechaCorta(r.desde) : `${fechaCorta(r.desde)} – ${fechaCorta(r.hasta)}`);
  };
  el.__rango = () => { if (v === 'pers') return { desde: d.value || null, hasta: hh.value || null }; const [a, b] = rangoPeriodo(v); return { desde: a, hasta: b }; };
  s.onchange = () => {
    v = s.value; localStorage.setItem(clave, v);
    el.querySelector('.perpers').classList.toggle('hide', v !== 'pers');
    if (v === 'pers' && !d.value) { const [a, b] = rangoPeriodo('mes'); d.value = a; hh.value = b; }
    texto(); o.alCambiar && o.alCambiar(el.__rango());
  };
  d.onchange = hh.onchange = () => { texto(); o.alCambiar && o.alCambiar(el.__rango()); };
  texto();
  return el.__rango;
}

/* ---------------- ventas: tabla con totales ---------------- */

var PEDSEC_CARGA = null;






/* ---------------- analítica con totales y filtros ---------------- */




/* ---------------- auditoría con periodo ---------------- */


/* ---------------- indicadores: configurador en tarjetas ---------------- */


/* ---------------- ruta en curso: ficha al pulsar, acciones y orden ---------------- */



/* ---------------- ayudas ---------------- */

Object.assign(AYUDA, {
  analitica: ['Analítica', 'Unidades e importes de los pedidos completados.', [
    `Elige el <b>periodo</b> y la dimensión: ${TT('medico', 's', '', 'l', 'l')}, comercial, producto, municipio, mes o canal.`,
    `Filtra por un <b>${TT('medico', 's', '', 'l', 'l')}</b>, un <b>comercial</b> o un <b>producto</b> para ver sus totales y su reparto por producto.`,
    'El importe es sin IVA y con el descuento de cada línea.',
    'Los datos no se pueden descargar: se consultan solo dentro de la plataforma.']]
});
AYUDA.inicio[2].splice(1, 1, 'El icono ⚙ junto al saludo abre los indicadores: el ojo los muestra u oculta y las flechas cambian el orden.');
AYUDA.ventas[2].push('Arriba tienes los totales del periodo (solo pedidos completados: confirmados, cobrados, preparados y facturados) y al final de la tabla, la suma.');


