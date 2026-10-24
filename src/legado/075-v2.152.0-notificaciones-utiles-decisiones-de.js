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
let NOTIF_LISTA = [], NOTIF_FILTRO = '';



// v2.242.0: aquí iba la primera versión de notifPintar (se redefine entera más abajo)
panelNotificaciones = function (l) {
  NOTIF_LISTA = l || [];
  notifPintar();
  if (!$('dlg').open) $('dlg').showModal();
};

pintarNotif = function () {
  const tipos = tiposDeMiRol(), s = (PERFIL.preferencias || {}).notif_silencio || {};
  const filas = NOTIF_AREAS.map(([a, t, ks]) => [t, tipos.filter(x => ks.includes(x[0]))]).filter(([, l]) => l.length);
  const sueltos = tipos.filter(x => !NOTIF_AREAS.some(a => a[2].includes(x[0])));
  if (sueltos.length) filas.push(['Otros', sueltos]);
  $('cfgcuerpo').innerHTML = `<div class="card cfgpanel notcfg2"><h2 style="padding:0 0 4px">Notificaciones</h2>
    <p class="sm">Te llegan a la campana de arriba. Elige para cada aviso si lo quieres al momento o en el resumen de cada mañana; sin marcar ninguna, no lo recibes.</p>
    ${tipos.length ? `<div class="notsil"><label class="chk"><input type="checkbox" id="nsil" ${s.activo ? 'checked' : ''}> Silenciar de</label>
        <input type="time" id="nsild" value="${esc(s.desde || '20:00')}" aria-label="Desde"> a <input type="time" id="nsilh" value="${esc(s.hasta || '08:00')}" aria-label="Hasta">
        <label class="chk"><input type="checkbox" id="nsilf" ${s.finde !== false ? 'checked' : ''}> y los fines de semana</label>
        <span class="sm">Lo que llegue en ese tiempo lo verás al terminar el silencio.</span></div>
      <div class="dgrid-wrap"><table class="nottab"><thead><tr><th>Aviso</th><th>Al momento</th><th>En el resumen del día</th></tr></thead>
      <tbody>${filas.map(([t, l]) => `<tr class="notarea"><th colspan="3">${esc(t)}</th></tr>${l.map(([k, ic, tt, d]) => {
        const m = notifModo(k), diario = NOTIF_DIARIOS.includes(k);
        return `<tr><td><b>${ic} ${esc(tt)}</b><span class="sm">${esc(d)}</span></td>
          <td>${diario ? '<span class="sm" title="Se prepara al empezar el día">—</span>' : `<input type="checkbox" data-ntm="${k}" ${m === 'm' ? 'checked' : ''} aria-label="${esc(tt)}: al momento">`}</td>
          <td><input type="checkbox" data-ntr="${k}" ${m === 'r' ? 'checked' : ''} aria-label="${esc(tt)}: en el resumen del día"></td></tr>`; }).join('')}`).join('')}</tbody></table></div>`
      : '<div class="vacio">Tu perfil no tiene notificaciones disponibles todavía.</div>'}</div>`;
  const guardarTipo = async k => {
    const m = $('cfgcuerpo').querySelector(`[data-ntm="${k}"]`), r = $('cfgcuerpo').querySelector(`[data-ntr="${k}"]`);
    const notif = Object.assign({}, (PERFIL.preferencias || {}).notif || {});
    const diario = NOTIF_DIARIOS.includes(k), om = m ? m.checked : false, or = r.checked;
    if (diario ? or : (om && !or)) delete notif[k];          // lo de siempre: no hace falta guardarlo
    else notif[k] = { m: om, r: or };
    await notifGuardarPrefs({ notif }, om || or ? 'Guardado' : 'No lo recibirás');
  };
  $('cfgcuerpo').querySelectorAll('[data-ntm]').forEach(c => c.onchange = () => {
    if (c.checked) { const r = $('cfgcuerpo').querySelector(`[data-ntr="${c.dataset.ntm}"]`); if (r) r.checked = false; }
    guardarTipo(c.dataset.ntm);
  });
  $('cfgcuerpo').querySelectorAll('[data-ntr]').forEach(c => c.onchange = () => {
    if (c.checked) { const m = $('cfgcuerpo').querySelector(`[data-ntm="${c.dataset.ntr}"]`); if (m) m.checked = false; }
    guardarTipo(c.dataset.ntr);
  });
  const guardarSil = () => notifGuardarPrefs({ notif_silencio: { activo: $('nsil').checked, desde: $('nsild').value || '20:00', hasta: $('nsilh').value || '08:00', finde: $('nsilf').checked } },
    $('nsil').checked ? 'Silencio guardado' : 'Sin silencio');
  ['nsil', 'nsild', 'nsilh', 'nsilf'].forEach(id => { if ($(id)) $(id).onchange = guardarSil; });
};

// Enlaces nuevos de los avisos
irEnlace = (orig => function (e) {
  const [t, id] = String(e || '').split(':');
  if (t === 'cliente' && id) return nuevaVenta({ contacto_id: id });
  if (t === 'cita') { AG_MODO = 'dia'; AG_FECHA = hoyISO(); return ir('agenda'); }
  return orig(e);
})(irEnlace);

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
pintarPaginaPlan = (orig => async function (...a) {
  const r = await orig.apply(this, a);
  const t = document.querySelector('#cfgcuerpo .planmat'); if (!t) return r;
  const act = planDe((PLAN_ACTUAL || {}).plan);
  const celda = (p, v) => `<td class="${p.id === act.id ? 'act' : ''}">${v === true ? `<span class="si" role="img" aria-label="Incluido">${svgIco(ICON_NOM.check)}</span>`
    : v === false ? '<span class="no" role="img" aria-label="No incluido">—</span>' : v}</td>`;
  const filas = PLAN_FILAS().map(([n, d, pl]) => pl === null || pl === undefined && d === null
    ? `<tr class="plangrupo"><td colspan="${PLANES.length + 1}">${esc(n)}</td></tr>`
    : `<tr><td><b>${esc(n)}</b>${d ? `<span class="sm">${esc(d)}</span>` : ''}</td>${PLANES.map(p => celda(p, pl.includes(p.id))).join('')}</tr>`).join('');
  const extra = [...t.querySelectorAll('tbody tr')].filter(tr => /Espacio|Ver la plataforma|Precio por usuario/.test(tr.textContent)).map(tr => tr.outerHTML).join('');
  t.querySelector('tbody').innerHTML = filas + extra;
  return r;
})(pintarPaginaPlan);


hayExtra = function (k) {
  const p = (typeof PLAN_ACTUAL !== 'undefined' && PLAN_ACTUAL) || {};
  return (p.extras || []).includes(k) || (PLAN_EXTRAS[k] || []).includes(p.plan);
};
hayOportunidades = function () { return hayExtra('oportunidades'); };
(() => {
  const portal = `Portal ${TT('medico', 's', 'del', 'l', 'l')} y del centro`;
  const pl = id => PLANES.find(p => p.id === id) || { ventajas: [] };
  pl('comercial').ventajas.push('Oportunidades: cada venta, se cierre o no');
  const emp = pl('empresa').ventajas, med = pl('medida').ventajas;
  const iE = emp.findIndex(v => /^Espacio /.test(v)); if (iE >= 0) emp[iE] = portal + ' (hasta 50)'; else emp.push(portal + ' (hasta 50)');
  const iM = med.findIndex(v => /^Espacio /.test(v)); if (iM >= 0) med[iM] = portal + ', sin límite'; else med.push(portal + ', sin límite');
})();
// Comparativa de «Plan y suscripción»: la fila del espacio del profesional pasa a ser la del portal (Oportunidades va en PLAN_FILAS)
pintarPaginaPlan = (orig => async function (...a) {
  const r = await orig.apply(this, a);
  const fp = [...document.querySelectorAll('.planmat tbody tr')].find(tr => /Su informe y sus avisos/.test(tr.textContent));
  if (fp) fp.querySelector('td').innerHTML = `<b>Portal ${TT('medico', 's', 'del', 'l', 'l')} y del centro</b><span class="sm">Informe, constancia, material, mensajes y pedidos del centro</span>`;
  return r;
})(pintarPaginaPlan);
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
// Producción (3/10/2026): en el iPhone, sin cobertura, Safari da «Load failed» o «Fetch is aborted». Eso no es un fallo de la plataforma:
// no se apunta en el registro de errores, y la visita (registrar_actividad, que no se duplica gracias a su op_id) se guarda en la cola
// del dispositivo y se envía al recuperar la conexión, en lugar de pedir que se repita.
function esErrorRed(e) { return /failed to fetch|load failed|networkerror|network request failed|aborterror|fetch is aborted|internet connection|err_internet|err_network/i.test(String((e && (e.message || e)) || '')); }
registrarError = (orig => function (tipo, mensaje, detalle) {
  if (tipo === 'api' && esErrorRed(mensaje)) return;
  return orig.call(this, tipo, mensaje, detalle);
})(registrarError);
async function escribirRpc(fn, payload) {
  const r = navigator.onLine ? await db.rpc(fn, payload) : { error: { message: 'Failed to fetch' } };
  if (r && r.error && esErrorRed(r.error)) {
    colaPoner({ fn, payload: marcarSinConexion(fn, payload), etiqueta: TT('visita', 's', '', 'l', 'C'), t: Date.now() });
    pintarConexion();
    setTimeout(() => toast('Sin conexión: queda guardado en este dispositivo y se enviará al recuperarla'), 1500);
    return { data: { encolada: true }, error: null };
  }
  return r;
}

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





// «Plan y suscripción»: los botones reales en lugar de correos
pintarPaginaPlan = (orig => async function (...a) {
  const r = await orig.apply(this, a);
  const c = $('cfgcuerpo'); if (!c) return r;
  const pl = PLAN_ACTUAL || {}, conSus = !!pl.stripe_suscripcion, puedePagar = puedeOrganizacion();
  c.querySelectorAll('.plan[data-plan]').forEach(card => {
    const k = card.dataset.plan, a2 = card.querySelector('a.btn[href^="mailto"]');
    if (!a2 || !PAGO_PLANES.includes(k)) return;
    if (!puedePagar) { a2.remove(); return; }
    const b = document.createElement('button'); b.type = 'button'; b.className = a2.className; b.dataset.pgplan = k;
    b.textContent = conSus ? 'Cambiar a ' + planDe(k).nombre : 'Contratar ' + planDe(k).nombre;
    a2.replaceWith(b); b.onclick = () => elegirPago(k);
  });
  const acts = c.querySelector('#planact .acts');
  if (acts) {
    const usu = acts.querySelector('a.btn[href^="mailto"]'); if (usu) usu.remove();
    if (puedePagar && pl.plan !== 'medida') acts.insertAdjacentHTML('beforeend', conSus
      ? '<button type="button" class="btn sec" id="pgusu2">Añadir o quitar usuarios</button><button type="button" class="btn sec" id="pgportal">Gestionar el pago</button>'
      : '<button type="button" class="btn" id="pgelegir">Elegir plan y pagar</button>');
    if ($('pgusu2')) $('pgusu2').onclick = () => elegirPago(pl.plan);
    if ($('pgportal')) $('pgportal').onclick = ev => pagoPortal(ev.target);
    if ($('pgelegir')) $('pgelegir').onclick = () => elegirPago();
  }
  const act = c.querySelector('#planact h2');
  if (act && pl.estado === 'impago') act.insertAdjacentHTML('afterend', `<div class="banda-peligro">No hemos podido cobrar el último recibo${pl.impago_desde ? ' (desde el ' + fechaCorta(pl.impago_desde) + ')' : ''}.
    Actualiza el método de pago con «Gestionar el pago»; si en 14 días no se puede cobrar, la cuenta queda en solo lectura.</div>`);
  if (act && pl.estado === 'cancelada') act.insertAdjacentHTML('afterend', `<div class="banda-aviso">Suscripción cancelada: puedes usar la plataforma hasta el
    <b>${fechaCorta(pl.periodo_fin)}</b> y descargar tus datos. Para seguir, vuelve a contratar.</div>`);
  if (act && conSus && pl.periodo_fin && pl.estado === 'activo') act.insertAdjacentHTML('afterend', `<p class="sm">Próximo recibo el ${fechaCorta(pl.periodo_fin)}.</p>`);
  return r;
})(pintarPaginaPlan);

async function pagoCargarEstado() {
  const { data } = await RPC_ORIG('plan_uso', {});
  if (!data) return;
  PAGO_ESTADO = data; if (data.plan && data.plan.plan) PLAN_ACTUAL = data.plan;
  pagoAviso();
}
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
// En solo lectura, los fallos al guardar se explican (toast, en componentes/aviso.js) y no cuentan como errores de la plataforma
registrarError = (orig => function (tipo, mensaje, detalle) {
  if (PAGO_ESTADO && PAGO_ESTADO.solo_lectura && /row-level security|violates row-level/i.test(String(mensaje))) return;
  return orig.call(this, tipo, mensaje, detalle);
})(registrarError);

aplicarPermisosMenu = (orig => function (...a) { const r = orig.apply(this, a); try { candadoSecciones(); } catch (e) {} return r; })(aplicarPermisosMenu);
ir = (orig => function (t, ...a) {
  if (t in PLAN_SECCIONES && PERFIL && !ES_MEDICO() && !planIncluyeSeccion(t)) { avisoPlan(t); return; }
  return orig.call(this, t, ...a);
})(ir);
abrirMasMovil = (orig => function (...a) {
  const r = orig.apply(this, a);
  document.querySelectorAll('.bmasgrid [data-bm]').forEach(b => { const t = b.dataset.bm; if (!planIncluyeSeccion(t)) {
    b.classList.add('bloq'); b.onclick = () => { const s = $('bmas'); if (s) s.classList.add('hide'); document.body.classList.remove('masabierto'); avisoPlan(t); }; } });
  return r;
})(abrirMasMovil);
// A medida (como la empresa principal): sin botones de contratar ni de cambiar en línea, salvo que ya pague con Stripe
pintarPaginaPlan = (orig => async function (...a) {
  const r = await orig.apply(this, a);
  const c = $('cfgcuerpo'), pl = PLAN_ACTUAL || {};
  if (c && pl.plan === 'medida' && !pl.stripe_suscripcion) c.querySelectorAll('[data-pgplan], #pgelegir, #pgusu2').forEach(b => b.remove());
  return r;
})(pintarPaginaPlan);
setTimeout(() => { try { candadoSecciones(); } catch (e) {} }, 0);

montarMenuLateral = (orig => function (...a) {
  const r = orig.apply(this, a);
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
})(montarMenuLateral);
abrirMasMovil = (orig => function (...a) {
  const r = orig.apply(this, a);
  document.querySelectorAll('.bmasgrid [data-bm].bloq').forEach(b => b.remove());
  return r;
})(abrirMasMovil);
menuPersonalizar = (orig => function (...a) {
  const r = orig.apply(this, a);
  const caja = $('mlpanel');
  if (caja && !caja.__candados) {
    caja.__candados = true; personalizarCandados();
    new MutationObserver(() => personalizarCandados()).observe(caja, { childList: true });
    caja.addEventListener('change', () => personalizarCandados());
  }
  return r;
})(menuPersonalizar);

pagoCargarEstado = (orig => async function (...a) { const r = await orig.apply(this, a); marcarFacPlan(); return r; })(pagoCargarEstado);
// En solo consulta, la pantalla lo dice arriba y Organización no enseña lo de emitir (datos fiscales, series, VeriFactu, PDF)
cargarFacturacion = (orig => async function (...a) {
  const r = await orig.apply(this, a);
  const v = $('v-facturacion');
  if (v && facConsulta() && !v.querySelector('#facconsulta')) {
    const sub = v.querySelector('.subnav');
    if (sub) sub.insertAdjacentHTML('afterend', `<div id="facconsulta" class="banda-info">Tu plan ${esc(planDe(PLAN_ACTUAL.plan).nombre)} no incluye Facturación:
      puedes consultar y descargar las facturas que ya emitiste y registrar sus cobros, pero no emitir nuevas.</div>`);
  }
  return r;
})(cargarFacturacion);
(() => {
  const d = Object.getOwnPropertyDescriptor(PAGINAS.organizacion, 'tabs'); if (!d || !d.get) return;
  Object.defineProperty(PAGINAS.organizacion, 'tabs', { configurable: true, get() {
    const t = d.get.call(this);
    return facConsulta() ? t.filter(x => !['fiscal', 'series', 'vf', 'pdf'].includes(x[0])) : t;
  } });
})();


// Ventana de contratar o cambiar (la de la v2.162.0, con la bajada al final del periodo y lo que se pierde)
elegirPago = function (planIni) {
  const pl = PLAN_ACTUAL || {}, conSus = !!pl.stripe_suscripcion, usados = +((PAGO_ESTADO || {}).usuarios || 0);
  if (pl.plan === 'medida') { toast('Con el plan A medida, los cambios se hacen con delcos'); return; }
  const est = { plan: PAGO_PLANES.includes(planIni) ? planIni : (PAGO_PLANES.includes(pl.plan) ? pl.plan : 'comercial'),
    pago: pl.pago === 'anual' ? 'anual' : 'mensual', usuarios: Math.max(3, usados, +pl.usuarios || 0) };
  const actual = { plan: pl.plan, pago: pl.pago === 'anual' ? 'anual' : 'mensual', usuarios: +pl.usuarios || 0 };
  const pinta = () => {
    const p = planDe(est.plan), anual = est.pago === 'anual';
    const base = anual ? p.precio * 10 * est.usuarios : p.precio * est.usuarios;
    const puesta = !anual && !conSus ? PUESTA_EN_MARCHA : 0;
    const iva = Math.round((base + puesta) * 21) / 100;
    const baja = conSus && esBajada(actual, est), fin = pl.periodo_fin ? fechaCorta(pl.periodo_fin) : 'el final del periodo pagado';
    const pierde = conSus ? perdidasPlan(pl.plan, est.plan, Object.assign({}, PAGO_ESTADO || {}, { extras: pl.extras })) : [];
    $('dbody').innerHTML = `<div class="fh"><div><h2>${conSus ? 'Cambiar la suscripción' : 'Contratar delcos'}</h2>
        <div class="sm">Precios por usuario, IVA no incluido. ${!conSus ? 'El pago se hace en la página segura de Stripe.' : baja ? '' : 'El cambio se aplica ya y se prorratea en el próximo recibo.'}</div></div>
        <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
      <label>Plan</label><div class="segs pgplan" role="group">${PAGO_PLANES.map(k => `<button type="button" data-pgp="${k}" class="${est.plan === k ? 'on' : ''}" aria-pressed="${est.plan === k}">${esc(planDe(k).nombre)} · ${eurI(planDe(k).precio)}</button>`).join('')}</div>
      <label style="margin-top:12px">Pago</label><div class="segs" role="group">
        <button type="button" data-pga="mensual" class="${anual ? '' : 'on'}" aria-pressed="${!anual}">Mensual</button>
        <button type="button" data-pga="anual" class="${anual ? 'on' : ''}" aria-pressed="${anual}">Anual · pagas 10 meses de 12</button></div>
      <label for="pgusu" style="margin-top:12px">Usuarios</label><input id="pgusu" type="number" min="${Math.max(3, usados)}" value="${est.usuarios}" class="numw">
      <span class="sm">${usados ? `Ahora usáis ${num(usados)}. ` : ''}Mínimo ${Math.max(3, usados)}.</span>
      ${baja ? `<div class="banda-aviso" id="pgbaja">El cambio se aplicará el <b>${esc(fin)}</b>, al acabar lo que ya has pagado. Hasta entonces sigues con
        ${esc(planDe(pl.plan).nombre)}${pierde.length ? ` y después dejarás de tener:<ul id="pgpierde">${pierde.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '.'}</div>` : ''}
      <div class="pgres">
        <div><span>${num(est.usuarios)} × ${eurI(anual ? p.precio * 10 : p.precio)} ${anual ? 'al año' : 'al mes'}</span><b>${eurI(base)}</b></div>
        ${puesta ? `<div><span>Puesta en marcha (una vez; incluida con pago anual)</span><b>${eurI(puesta)}</b></div>` : ''}
        <div><span>IVA 21 %</span><b>${eurI(iva)}</b></div>
        <div class="pgtot"><span>${!conSus ? 'Primer cobro' : baja ? 'Importe desde el ' + esc(fin) : 'Nuevo importe'}</span><b>${eurI(base + puesta + iva)}</b></div></div>
      <div class="acts" style="justify-content:flex-end"><button class="btn sec" data-cerrar>Cancelar</button>
        <button class="btn" id="pgok">${!conSus ? 'Ir al pago seguro' : baja ? 'Programar el cambio' : 'Confirmar el cambio'}</button></div>`;
    $('dbody').querySelectorAll('[data-pgp]').forEach(b => b.onclick = () => { est.plan = b.dataset.pgp; pinta(); });
    $('dbody').querySelectorAll('[data-pga]').forEach(b => b.onclick = () => { est.pago = b.dataset.pga; pinta(); });
    $('pgusu').onchange = () => { est.usuarios = Math.max(3, usados, Math.floor(+$('pgusu').value || 0)); pinta(); };
    $('pgok').onclick = async ev => {
      const d = await pagoLlamar({ accion: conSus ? 'cambiar' : 'checkout', plan: est.plan, pago: est.pago, usuarios: est.usuarios }, ev.target);
      if (!d) return;
      if (d.url) { location.href = d.url; return; }
      $('dlg').close();
      if (d.previsto) { toast(`Cambio programado para el ${fechaCorta(d.previsto)}`); await pagoCargarEstado(); if (TAB === 'plan' || TAB === 'organizacion' || TAB === 'config') ir(TAB); return; }
      toast('Cambio hecho: en unos segundos verás el plan nuevo'); pagoEsperarActivo();
    };
  };
  pinta(); $('dlg').showModal();
};

// «Plan y suscripción»: cambio previsto (con «Anular el cambio»), baja pedida y compromiso de A medida
pintarPaginaPlan = (orig => async function (...a) {
  const r = await orig.apply(this, a);
  const c = $('cfgcuerpo'), pl = PLAN_ACTUAL || {}, h = c && c.querySelector('#planact h2'); if (!h) return r;
  const cp = pl.cambio_previsto;
  if (cp && cp.plan) h.insertAdjacentHTML('afterend', `<div class="banda-info" id="pgprevisto">El <b>${fechaCorta(cp.desde)}</b> pasarás al plan
    <b>${esc(planDe(cp.plan).nombre)}</b> con ${num(cp.usuarios)} usuarios y pago ${cp.pago === 'anual' ? 'anual' : 'mensual'}.
    ${puedeOrganizacion() ? '<button type="button" class="btn sec" id="pganular">Anular el cambio</button>' : ''}</div>`);
  if (pl.baja_al_final && pl.estado === 'activo') h.insertAdjacentHTML('afterend', `<div class="banda-aviso" id="pgbajafin">Has pedido la baja: puedes usar la plataforma
    hasta el <b>${fechaCorta(pl.periodo_fin)}</b>. Si quieres seguir, entra en «Gestionar el pago» y renueva la suscripción.</div>`);
  if (pl.plan === 'medida' && pl.compromiso_hasta) h.insertAdjacentHTML('afterend', `<p class="sm" id="pgcomp">Contrato A medida hasta el ${fechaCorta(pl.compromiso_hasta)}. Para cambiarlo, habla con delcos.</p>`);
  if ($('pganular')) $('pganular').onclick = async ev => {
    const d = await pagoLlamar({ accion: 'anular_cambio' }, ev.target); if (!d) return;
    toast('Cambio anulado: sigues con tu plan'); await pagoCargarEstado(); ir(TAB);
  };
  return r;
})(pintarPaginaPlan);

// Panel delcos → Organizaciones → Plan: fecha de compromiso (A medida), lo que pierde al bajar y aviso si paga con Stripe
orgAcciones = (orig => function (c, l) {
  const r = orig.apply(this, arguments);
  c.querySelectorAll('[data-orgplan]').forEach(b => {
    const f = b.onclick; if (!f || b.__p2165) return; b.__p2165 = true;
    b.onclick = (...x) => {
      f.apply(b, x);
      const o = l.find(y => y.id === b.dataset.orgplan); if (!o || !$('opplan')) return;
      const pd = o.plan_datos || {}, de = pd.plan || o.plan;
      $('opest').closest('.g2').insertAdjacentHTML('beforeend', `<div id="opcompw"><label for="opcomp">Compromiso hasta (A medida)</label>
        <input id="opcomp" type="date" value="${esc(pd.compromiso_hasta || '')}"><span class="sm">Antes de esa fecha no se puede bajar de A medida.</span></div>`);
      $('opest').closest('.g2').insertAdjacentHTML('afterend', `${pd.stripe_suscripcion ? '<div class="banda-aviso" id="opstripe">Esta empresa paga con Stripe: este cambio no se pasa a Stripe. Para que cuadre el cobro, cámbialo también allí.</div>' : ''}<div id="opperd"></div>`);
      const pinta = () => {
        $('opcompw').classList.toggle('hide', $('opplan').value !== 'medida');
        const p = perdidasPlan(de, $('opplan').value, { extras: pd.extras || [], facturas: +o.facturas > 0 });
        const bloq = de === 'medida' && $('opplan').value !== 'medida' && pd.compromiso_hasta && pd.compromiso_hasta > hoyISO();
        $('opperd').innerHTML = bloq ? `<div class="banda-peligro">Tiene compromiso A medida hasta el ${fechaCorta(pd.compromiso_hasta)}: no se puede bajar antes.</div>`
          : rangoPlan($('opplan').value) < rangoPlan(de) && p.length ? `<div class="banda-aviso">Al pasar a ${esc(planDe($('opplan').value).nombre)} dejará de tener:<ul>${p.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : '';
      };
      $('opplan').addEventListener('change', pinta); pinta();
      $('opok').onclick = async ev => {
        ev.target.disabled = true;
        const p = { plan: $('opplan').value, usuarios: $('opusu').value === '' ? null : +$('opusu').value, pago: $('oppago').value, estado: $('opest').value,
          prueba_hasta: $('opest').value === 'prueba' ? $('opfin').value : null };
        if (p.plan === 'medida') p.compromiso_hasta = $('opcomp').value || null;
        const { data: res, error } = await db.rpc('guardar_plan_organizacion', { p_org: o.id, p });
        ev.target.disabled = false;
        if (error || !res || !res.ok) {
          toast(({ permiso: 'No tienes permiso', minimo: 'Mínimo 3 usuarios (salvo A medida)', prueba_hasta: 'Falta la fecha de fin de la prueba', plan: 'Plan no válido',
            compromiso: `Tiene compromiso A medida hasta el ${fechaCorta(res && res.hasta)}` })[(res && res.error) || ''] || 'No se ha podido guardar', true);
          return;
        }
        $('dlg').close(); toast('Plan guardado'); pintarOrganizaciones();
      };
    };
  });
  return r;
})(orgAcciones);

