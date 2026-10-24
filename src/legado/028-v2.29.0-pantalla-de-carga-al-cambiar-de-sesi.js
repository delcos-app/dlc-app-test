/* ============================================================
   DLC OS 2.0 · v2.29.0 · Pantalla de carga al cambiar de sesión,
   agenda sin parpadeos, más indicadores en Inicio y Analítica visual
   ============================================================ */

/* ---------------- pantalla de carga a pantalla completa ---------------- */




volverAMiSesion = (orig => async function () {
  const s = suplantando();
  pantallaCarga('Volviendo a tu sesión' + (s ? ', ' + nombrePila(s.nombre) : '') + '…');
  await orig();
})(volverAMiSesion);

/* ---------------- agenda: una sola transición al cambiar de vista ---------------- */



// Desde Rutas: «Planificar la semana» abre el planificador cuando la semana ya está pintada
document.addEventListener('click', e => {
  const b = e.target.closest('#rrsem, [data-inisem="plan"]');
  if (!b) return;
  e.stopImmediatePropagation();
  ABRIR_PLAN_SEMANA = true; AG_MODO = 'semana'; AG_FECHA = hoyISO(); ir('agenda');
}, true);

/* ---------------- Inicio: más indicadores ---------------- */

KPI_CAT.push(
  { id: 'uds_mes', t: 'unidades vendidas este mes', v: k => k.uds_mes, cls: k => k.uds_mes >= k.uds_mes_ant ? 'ok' : 'warn', h: 'x-analitica' },
  { id: 'importe_mes', t: 'ventas del mes sin IVA', v: k => eurI(k.importe_mes || 0).replace(',00', ''), h: 'x-analitica' },
  { id: 'prescriptores', t: `${TT('medico', 'p', '', 'l', 'l')} que han vendido este mes`, v: k => k.prescriptores_mes, h: 'x-analitica' },
  { id: 'nuevos_presc', t: `${TT('medico', 'p', '', 'l', 'l')} con su primera venta este mes`, v: k => k.nuevos_prescriptores, cls: k => k.nuevos_prescriptores ? 'ok' : '' },
  { id: 'activos_90', t: `${TT('medico', 'p', '', 'l', 'l')} con ventas en 90 días`, v: k => k.activos_90 },
  { id: 'conversion', get t() { return `del embudo ya en «${estadoPapel('positivo') || 'positivo'}»`; }, v: k => pct(k.prescriben, k.en_embudo) + '%' },
  { id: 'visitas_7d', t: `${TT('visita', 'p', '', 'l', 'l')} en los últimos 7 días`, v: k => k.visitas_7d },
  { id: 'citas_7d', t: 'citas tuyas en los próximos 7 días', v: k => k.citas_7d, h: 'x-semana' },
  { id: 'muestras_mes', t: 'muestras entregadas este mes', v: k => k.muestras_mes },
  { id: 'material_mes', t: 'entregas de material este mes', v: k => k.material_mes },
  { id: 'sin_visita_60', t: `${TT('medico', 'p', '', 'l', 'l')} sin ${TT('visita', 's', '', 'l', 'l')} en 60 días`, v: k => k.sin_visita_60, cls: k => k.sin_visita_60 ? 'warn' : 'ok' },
  { id: 'sin_horario', t: 'fichas sin horario de atención', v: k => k.sin_horario, cls: k => k.sin_horario ? 'warn' : 'ok' },
  { id: 'borradores', t: 'pedidos en borrador', v: k => k.borradores, cls: k => k.borradores ? 'warn' : '', h: 'x-ventas' }
);
Object.assign(AYUDA_KPI, {
  uds_mes: 'Unidades de los pedidos completados desde el día 1 de este mes. En verde si va por delante de los mismos días del mes anterior. Pulsa para ir a Analítica.',
  importe_mes: 'Importe sin IVA de los pedidos completados este mes (con el descuento de cada línea).',
  prescriptores: `${TT('medico', 'p', '', 'l', 'C', 'distinto')} a los que se ha atribuido alguna venta este mes.`,
  nuevos_presc: `${TT('medico', 'p', '', 'l', 'C')} cuya primera venta atribuida ha sido este mes: el mejor indicador de captación.`,
  activos_90: `${TT('medico', 'p', '', 'l', 'C')} con alguna venta atribuida en los últimos 90 días: tu base activa.`,
  conversion: `${TT('medico', 'p', 'del', 'C', 'l')} que ya han avanzado en el embudo, qué parte ha llegado al estado final positivo. Mide cómo avanza el embudo.`,
  visitas_7d: `${TT('visita', 'p', '', 'l', 'C', 'registrado')} en los últimos siete días, contando hoy.`,
  citas_7d: 'Tus citas abiertas de hoy a los próximos seis días. Pulsa para ver tu semana.',
  muestras_mes: `Muestras entregadas en ${TT('visita', 'p', 'el', 'l', 'l')} de este mes.`,
  material_mes: 'Veces que se ha entregado material comercial (dípticos, catálogos…) este mes.',
  sin_visita_60: `${TT('medico', 'p', '', 'l', 'C')} que puedes ver y que no se visitan desde hace más de 60 días (o nunca).`,
  sin_horario: `${TT('medico', 'p', '', 'l', 'C')} sin días ni horas de atención en su ficha. Sin ese dato, las rutas y el planificador no pueden ajustarse a su horario.`,
  borradores: 'Pedidos guardados como borrador que todavía no cuentan en métricas ni comisiones. Pulsa para verlos.'
});
['uds_mes', 'prescriptores', 'citas_7d', 'sin_visita_60'].forEach(k => { if (!KPI_DEF.includes(k)) KPI_DEF.push(k); });

// Quien ya tenía indicadores guardados recibe los nuevos principales una vez (luego puede ocultarlos)

document.addEventListener('click', e => {
  const k = e.target.closest('#kpis [data-k^="x-"]');
  if (!k || e.target.closest('.ai')) return;
  e.stopImmediatePropagation();
  const a = k.dataset.k;
  if (a === 'x-analitica') ir('analitica');
  if (a === 'x-semana') { AG_MODO = 'semana'; AG_FECHA = hoyISO(); ir('agenda'); }
  if (a === 'x-ventas') ir('ventas');
}, true);

/* ---------------- Analítica: resumen visual ---------------- */






// (v2.183.0: aquí iba la primera versión de pintarResumenAnalitica; se redefine entera más abajo)

cargarAnalitica = (orig => async function () {
  await orig();
  const v = $('v-analitica'), panel = v.querySelector('.panel');
  if (!panel) return;
  v.querySelector('.saludo').insertAdjacentHTML('afterend', `<div class="subnav" id="ansub">
    <button data-ansec="resumen" aria-pressed="${ANSEC === 'resumen'}">Resumen</button>
    <button data-ansec="explorar" aria-pressed="${ANSEC === 'explorar'}">Explorar datos</button></div>
    <div id="anres" class="${ANSEC === 'resumen' ? '' : 'hide'}"></div>`);
  panel.classList.toggle('hide', ANSEC === 'resumen');
  v.querySelectorAll('[data-ansec]').forEach(b => b.onclick = () => {
    ANSEC = b.dataset.ansec;
    v.querySelectorAll('[data-ansec]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    $('anres').classList.toggle('hide', ANSEC !== 'resumen'); panel.classList.toggle('hide', ANSEC === 'resumen');
    if (ANSEC === 'resumen' && !$('ankpis')) pintarResumenAnalitica();
  });
  if (ANSEC === 'resumen') pintarResumenAnalitica();
})(cargarAnalitica);

AYUDA.analitica[2].unshift(`<b>Resumen</b>: indicadores con la comparación frente al periodo anterior y gráficos explicados (evolución, productos, ${TT('medico', 'p', '', 'l', 'l')}, embudo y actividad). <b>Explorar datos</b>: ranking y tablas con filtros por ${TT('medico', 's', '', 'l', 'l')}, comercial y producto.`);


