/* v2.152.0 · Notificaciones útiles (decisiones de Eric, 3/10/2026: bandeja con acciones, avisos nuevos y tabla compacta).
   Bandeja: agrupada por Hoy / Ayer / Esta semana / Antes, filtro por área y en cada aviso su acción directa (Llamar, Nueva venta,
   Ver ficha, Citar, Registrar, Ver pedido…) más «Posponer a mañana». Ajustes: una fila por aviso con «Al momento» y «En el resumen
   del día» (excluyentes; ninguna = no recibirlo) y «Silenciar» con horario y fines de semana. Todo lo guarda notificar_datos (SQL 97). */
TIPOS_NOTIF.push(
  ['reponer', '🔄', 'Toca reponer', 'Un cliente que compra con regularidad ha pasado su intervalo habitual'],
  ['caida_ventas', '↘️', 'Caída de ventas', `${TT('medico', 's', 'un', 'l', 'C')} de tu cartera baja más de un 40 % sus ventas este mes`],
  ['visita_sin_registrar', '📝', 'Citas sin registrar', `Citas de los últimos 3 días sin ${TT('visita', 's', '', 'l', 'l')} registrada`],
  ['pedido_portal', '🏥', 'Pedidos del portal', 'Cuando un centro pide desde el portal']
);






// v2.154.0 · Iconos del menú «Más» del móvil (y de «Tus módulos» en Mi perfil): las secciones añadidas después (Oportunidades, Compras,
// Proveedores, Usuarios y roles, Panel delcos) no llegaban a ICO_MOD y salían con un punto
Object.keys(ICO_NAV).forEach(k => { if (ICON_NOM[ICO_NAV[k]]) ICO_MOD[k] = svgIco(ICON_NOM[ICO_NAV[k]]); });

/* v2.157.0 · Plan y suscripción al día con la oferta publicada en delcos.app: frase de cada plan, comparativa con todos los módulos
   actuales (los nuevos: Nueva venta, Pedidos web y pagos, Notificaciones, Historial, Indicadores por áreas…). Solo cambia lo que se enseña: qué abre cada plan sigue en PLANES.modulos. */
(() => {
  const para = { campo: 'Para equipos que visitan y quieren ordenar su cartera', comercial: 'Para equipos que venden y quieren medir resultados',
    empresa: 'Para empresas que facturan y llevan su almacén', medida: 'Para redes de más de 50 personas o con necesidades propias' };
  PLANES.forEach(p => { if (para[p.id]) p.para = para[p.id]; });
})();


function hayExtra(k) {
  const p = (typeof PLAN_ACTUAL !== 'undefined' && PLAN_ACTUAL) || {};
  return (p.extras || []).includes(k) || (PLAN_EXTRAS[k] || []).includes(p.plan);
}
(() => {
  const portal = `Portal ${TT('medico', 's', 'del', 'l', 'l')} y del centro`;
  const pl = id => PLANES.find(p => p.id === id) || { ventajas: [] };
  pl('comercial').ventajas.push('Oportunidades: cada venta, se cierre o no');
  const emp = pl('empresa').ventajas, med = pl('medida').ventajas;
  const iE = emp.findIndex(v => /^Espacio /.test(v)); if (iE >= 0) emp[iE] = portal + ' (hasta 50)'; else emp.push(portal + ' (hasta 50)');
  const iM = med.findIndex(v => /^Espacio /.test(v)); if (iM >= 0) med[iM] = portal + ', sin límite'; else med.push(portal + ', sin límite');
})();
// Organizaciones → Extras: ahora son excepciones a lo que incluye el plan
document.addEventListener('click', e => {
  if (!e.target.closest('[data-orgext]')) return;
  setTimeout(() => {
    const s = $('dbody') && $('dbody').querySelector('.fh .sm');
    if (s && /aparte de su plan/.test(s.textContent)) s.textContent = 'Además de lo que incluye su plan (Oportunidades desde Comercial; el portal desde Empresa)';
  }, 0);
}, true);


/* v2.159.0 · Correcciones del registro de errores (pruebas, 3/10/2026) y un sitio para revisarlo.
   - «showModal: The dialog is already open as a non-modal dialog» (Pedidos): una ventana encajada en una página propia seguía
     abierta al ir a otra pantalla y abrir otra ventana; ahora se cierra antes de abrirla como ventana normal.
   - «Cannot read properties of null (reading 'classList')» (Analítica): un filtro que cambiaba cuando la tabla de Explorar ya no
     estaba en pantalla (los filtros viven en el panel lateral); ahora no hace nada fuera de Analítica.
   - Duplicados (Inicio y pantalla Duplicados) sin esperas: lo resuelve el SQL 100 (parejas guardadas).
   - Panel delcos → «Errores»: los errores agrupados (cuántas veces, a cuántas personas, en qué versiones), con su estado por grupo;
     al darlos por resueltos, si vuelven en una versión igual o posterior se reabren solos (SQL 100). */
['dlg', 'dlg2'].forEach(id => {
  const d = $(id); if (!d) return;
  const prev = d.showModal;
  d.showModal = function (...a) {
    try { if (this.open && !this.matches(':modal') && !(typeof areaEncaje === 'function' && areaEncaje())) this.close(); } catch (e) {}
    return prev.apply(this, a);
  };
});

if (PAGINAS.delcos && !PAGINAS.delcos.tabs.some(t => t[0] === 'errores')) PAGINAS.delcos.tabs.push(['errores', 'Errores', () => pintarErroresDelcos()]);

/* v2.161.0 · Los errores corregidos se dan por resueltos solos (petición de Eric, 3/10/2026). Al abrirse, la app avisa una vez de su
   versión (version_en_uso, SQL 101): así se sabe desde cuándo se usa cada versión en cada empresa, y los errores que no han vuelto a
   salir con una versión más nueva en 2 días quedan resueltos solos (si vuelven en esa versión o en otra posterior, se reabren). */
(function avisarVersionEnUso() {
  let intentos = 0;
  const t = setInterval(() => {
    if (typeof PERFIL !== 'undefined' && PERFIL && !document.body.classList.contains('sin-sesion') && typeof RPC_ORIG === 'function') {
      clearInterval(t);
      Promise.resolve(RPC_ORIG('version_en_uso', { p_version: VERSION_APP })).then(() => {}, () => {});
    } else if (++intentos > 90) clearInterval(t);
  }, 2000);
})();






(function pagoArranque() {
  let n = 0;
  const t = setInterval(() => {
    if (typeof PERFIL !== 'undefined' && PERFIL && !document.body.classList.contains('sin-sesion') && typeof RPC_ORIG === 'function') {
      clearInterval(t);
      const q = new URLSearchParams(location.search), res = q.get('pago');
      if (res) { history.replaceState(null, '', location.pathname + location.hash); }
      if (res === 'ok') { toast('Pago recibido: activando tu suscripción…'); pagoEsperarActivo(); }
      else if (res === 'cancelado') toast('Has salido del pago sin completarlo');
      pagoCargarEstado();
    } else if (++n > 90) clearInterval(t);
  }, 1500);
})();

function aplicarPermisosMenuBase5(...a) { const r = aplicarPermisosMenuBase4.apply(this, a); try { candadoSecciones(); } catch (e) {} return r; }
setTimeout(() => { try { candadoSecciones(); } catch (e) {} }, 0);

function montarMenuLateral(...a) {
  const r = montarMenuLateralBase2.apply(this, a);
  if (!document.body.classList.contains('menulat')) return r;
  const inn = $('nav'); if (!inn) return r;
  // (solo se toca la clase si cambia: el observador del menú vuelve a llamar aquí con cada cambio de clase)
  const ocultos = menuPrefs().ocultos || [];
  inn.querySelectorAll('button[data-t]').forEach(b => {
    if (fueraDePlan(b)) { if (!b.classList.contains('mlplan')) b.classList.add('mlplan'); if (!b.classList.contains('mloculto')) b.classList.add('mloculto'); }
    else if (b.classList.contains('mlplan')) { b.classList.remove('mlplan'); if (!ocultos.includes(b.dataset.t)) b.classList.remove('mloculto'); }
  });
  inn.querySelectorAll('.mlgrupo').forEach(g => g.classList.toggle('vacio', ![...g.querySelectorAll('button[data-t]')]
    .some(b => !b.classList.contains('hide') && !b.classList.contains('mloculto') && b.dataset.t !== 'seguimiento' && getComputedStyle(b).display !== 'none')));
  return r;
}

(() => {
  const d = Object.getOwnPropertyDescriptor(PAGINAS.organizacion, 'tabs'); if (!d || !d.get) return;
  Object.defineProperty(PAGINAS.organizacion, 'tabs', { configurable: true, get() {
    const t = d.get.call(this);
    return facConsulta() ? t.filter(x => !['fiscal', 'series', 'vf', 'pdf'].includes(x[0])) : t;
  } });
})();





