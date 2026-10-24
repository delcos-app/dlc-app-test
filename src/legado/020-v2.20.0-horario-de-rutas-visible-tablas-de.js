/* ============================================================
   DLC OS 2.0 · v2.20.0 · Horario de rutas visible, tablas de
   pacientes y productos, envío en los pedidos
   ============================================================ */

/* ---------------- ajustes generales (envío) ---------------- */

let AJUSTES = {};
// v2.242.0: aquí iba envioCfg (nadie la usaba)
async function cargarAjustes() {
  const { data } = await db.rpc('ajustes_lista');
  AJUSTES = data || {};
}

/* ---------------- totales con envío ---------------- */

function totalesPedido(lineas, d, dt, env) {
  const ls = lineas.map(l => ({ b: (+l.importe || 0) * (1 - (+l.descuento || 0) / 100), iva: +l.iva || 0, u: +l.unidades || 0 }));
  const sb = ls.reduce((n, l) => n + l.b, 0);
  const k = !+d || !sb ? 1 : dt === 'importe' ? Math.max(0, 1 - d / sb) : Math.max(0, 1 - d / 100);
  const porIva = {};
  ls.forEach(l => { porIva[l.iva] = (porIva[l.iva] || 0) + l.b * k * l.iva / 100; });
  const t = { unidades: ls.reduce((n, l) => n + l.u, 0), bruto: sb, descuento: sb * (1 - k), baseProd: sb * k, porIva };
  // El envío se escribe con IVA; aquí se separa su base y su IVA
  t.envio = env && env.on ? { con: r2(env.con), iva: +env.iva || 0, base: (+env.con || 0) / (1 + (+env.iva || 0) / 100), nombre: env.nombre || 'Envío' } : null;
  if (t.envio) { t.envio.ivaImp = t.envio.con - t.envio.base; porIva[t.envio.iva] = (porIva[t.envio.iva] || 0) + t.envio.ivaImp; }
  t.base = t.baseProd + (t.envio ? t.envio.base : 0);
  t.iva = Object.values(porIva).reduce((n, x) => n + x, 0);
  t.total = t.base + t.iva;
  return t;
}

function bloqueTotales(t) {
  const tipos = Object.keys(t.porIva).sort((a, b) => a - b);
  return `<div><span>Unidades</span><b>${num(t.unidades)}</b></div>
    ${t.descuento > 0.004 ? `<div><span>Suma de líneas</span><b>${eurI(t.bruto)}</b></div>
      <div><span>Descuento general</span><b>−${eurI(t.descuento)}</b></div>` : ''}
    ${t.envio ? `<div><span>Productos sin IVA</span><b>${eurI(t.baseProd)}</b></div>
      <div><span>${esc(t.envio.nombre)} sin IVA</span><b>${eurI(t.envio.base)}</b></div>` : ''}
    <div><span>Base imponible</span><b>${eurI(t.base)}</b></div>
    ${tipos.filter(k => t.porIva[k] > 0.004 || tipos.length === 1).map(k => `<div><span>IVA ${k}%</span><b>${eurI(t.porIva[k])}</b></div>`).join('')}
    ${t.envio ? `<div class="sm" style="justify-content:flex-end"><span>Incluye ${esc(t.envio.nombre.toLowerCase())} de ${eurI(t.envio.con)} con IVA</span></div>` : ''}
    <div class="tot"><span>Total con IVA</span><b>${eurI(t.total)}</b></div>`;
}

/* ---------------- configuración del envío ---------------- */


/* ---------------- productos: tabla alineada ---------------- */



/* ---------------- pacientes: tabla con todos los datos ---------------- */


/* ---------------- rutas: horario siempre a mano ---------------- */

let ULTIMO_PLAN = null;
const siguienteLaborable = () => {
  const d = new Date(); do { d.setDate(d.getDate() + 1); } while (d.getDay() === 0 || d.getDay() === 6);
  return isoLocal(d);
};



/* ---------------- ayudas ---------------- */

AYUDA.rutas[2].splice(1, 1,
  'El plan ordena las paradas por cercanía y calcula las horas con la salida y la vuelta de la ruta (se ponen al crearla o editarla). Si ya ha pasado la hora de salida, empieza a contar desde ahora; si ya ha pasado la de vuelta, te propone planificar para mañana.',
  `<b>⚙ Tiempos de ${TT('visita', 's', '', 'l', 'l')}</b> (arriba a la derecha) cambia los minutos por ${TT('medico', 's', '', 'l', 'l')} y por parada.`);
AYUDA.productos[2].push('<b>⚙ Envío</b> fija el importe del envío que se propone en los pedidos y si se marca por defecto.');
AYUDA.ventas[2].push('Si marcas <b>Incluir envío</b>, el importe (con IVA) se suma al total con su propio IVA. No lleva descuento ni cuenta como unidades.');


