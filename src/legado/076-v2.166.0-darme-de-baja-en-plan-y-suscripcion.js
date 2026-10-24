/* v2.166.0 · «Darme de baja» en Plan y suscripción (petición de Eric): abre directamente la pantalla de cancelar de Stripe y, al confirmar,
   vuelve sola a delcos (?pago=baja) con el aviso de hasta cuándo se puede usar. Con la baja pedida, «Seguir con la suscripción» la deshace. */
const PAGO_VUELTA_BAJA = new URLSearchParams(location.search).get('pago') === 'baja';   // se lee antes de que el arranque limpie la dirección
if (PAGO_VUELTA_BAJA) {
  let n = 0;
  const t = setInterval(() => {
    if (typeof PERFIL !== 'undefined' && PERFIL && !document.body.classList.contains('sin-sesion')) { clearInterval(t); pagoEsperarBaja(); }
    else if (++n > 90) clearInterval(t);
  }, 1500);
}
pintarPaginaPlan = (orig => async function (...a) {
  const r = await orig.apply(this, a);
  const c = $('cfgcuerpo'), pl = PLAN_ACTUAL || {}; if (!c || !puedeOrganizacion() || !pl.stripe_suscripcion) return r;
  const acts = c.querySelector('#planact .acts');
  if (acts && pl.estado === 'activo' && !pl.baja_al_final && !$('pgdarbaja'))
    acts.insertAdjacentHTML('beforeend', '<button type="button" class="btn sec" id="pgdarbaja">Darme de baja</button>');
  const bf = $('pgbajafin');
  if (bf) {
    bf.innerHTML = `Has pedido la baja: puedes usar la plataforma hasta el <b>${fechaCorta(pl.periodo_fin)}</b>.
      <button type="button" class="btn sec" id="pgseguir">Seguir con la suscripción</button>`;
  }
  if ($('pgdarbaja')) $('pgdarbaja').onclick = async ev => { const d = await pagoLlamar({ accion: 'baja' }, ev.target); if (d && d.url) location.href = d.url; };
  if ($('pgseguir')) $('pgseguir').onclick = async ev => {
    const d = await pagoLlamar({ accion: 'reanudar' }, ev.target); if (!d) return;
    toast('Seguimos: tu suscripción continúa'); await pagoCargarEstado(); ir(TAB);
  };
  return r;
})(pintarPaginaPlan);

/* v2.167.0 · Al volver de Stripe (pago, baja o el portal) se abre «Plan y suscripción», no Inicio (petición de Eric). Stripe vuelve a
   …/?pago=…#plan o a …/#plan: la primera pantalla tras entrar es la del plan. */
let PAGO_IR_PLAN = location.hash === '#plan' || new URLSearchParams(location.search).has('pago');
ir = (orig => function (t, ...a) {
  if (PAGO_IR_PLAN && PERFIL) { pagoAlPlan(); if (!ES_MEDICO() && puedeOrganizacion()) t = 'plan'; }
  return orig.call(this, t, ...a);
})(ir);
// Si la app ya había entrado antes de llegar aquí, se va ahora
if (PAGO_IR_PLAN && typeof PERFIL !== 'undefined' && PERFIL) setTimeout(() => { if (PAGO_IR_PLAN) ir('plan'); }, 0);
setTimeout(() => { PAGO_IR_PLAN = false; }, 30000);

// «Plan y suscripción»: botones al formulario (en lugar de correos) y la última solicitud con su estado
pintarPaginaPlan = (orig => async function (...a) {
  const r = await orig.apply(this, a);
  const c = $('cfgcuerpo'); if (!c || !c.querySelector('#planact')) return r;
  const pl = PLAN_ACTUAL || {};
  c.querySelectorAll('a[href^="mailto"]').forEach(x => {
    const b = document.createElement('button'); b.type = 'button'; b.className = x.className;
    b.textContent = x.closest('.plan[data-plan="medida"]') ? 'Pedir presupuesto' : 'Hablar con delcos';
    b.dataset.presu = x.closest('.plan[data-plan="medida"]') && pl.plan !== 'medida' ? 'presupuesto' : 'contrato';
    x.replaceWith(b);
  });
  const comp = $('pgcomp');
  if (pl.plan === 'medida' && !c.querySelector('[data-presu]') && !puede('gestionar_plataforma')) {
    const acts = c.querySelector('#planact .acts');
    if (acts) acts.insertAdjacentHTML('beforeend', '<button type="button" class="btn sec" data-presu="contrato">Hablar con delcos</button>');
  }
  if (comp) comp.textContent = comp.textContent.replace(' Para cambiarlo, habla con delcos.', '');
  c.querySelectorAll('[data-presu]').forEach(b => b.onclick = () => pedirPresupuesto(b.dataset.presu));
  try {
    const { data } = await db.from('solicitudes_plan').select('creado_en,estado,tipo').order('creado_en', { ascending: false }).limit(1);
    const s = (data || [])[0], h = c.querySelector('#planact h2');
    if (s && h && !$('presuest') && (s.estado !== 'Cerrada' || Date.now() - new Date(s.creado_en) < 30 * 864e5))
      h.insertAdjacentHTML('afterend', `<div class="banda-info" id="presuest">Tu solicitud ${s.tipo === 'contrato' ? 'sobre el contrato' : 'de presupuesto'} del
        ${fechaCorta(s.creado_en.slice(0, 10))}: <b>${esc(PRESU_ESTADO[s.estado] || s.estado)}</b>.${s.estado === 'Nueva' ? ' Te contestamos en un día laborable.' : ''}</div>`);
  } catch (e) {}
  return r;
})(pintarPaginaPlan);

if (PAGINAS.delcos && !PAGINAS.delcos.tabs.some(t => t[0] === 'solicitudes')) PAGINAS.delcos.tabs.splice(1, 0, ['solicitudes', 'Solicitudes', () => pintarSolicitudesPlan()]);

/* v2.168.0 · Alta de empresas desde la web (decisiones de Eric: prueba de 30 días con tarjeta, formulario en delcos.app). Quien vuelve de
   Stripe (?alta=ok) ve en el acceso que le llega un correo; el enlace de ese correo (invitación) le pide crear su contraseña y entra directo
   (?bienvenida=1) con una bienvenida y los primeros pasos. «Plan y suscripción» dice hasta cuándo dura la prueba y qué se cobrará después. */
(function altaAvisos() {
  const q = new URLSearchParams(location.search);
  if (q.get('alta') === 'ok') {
    history.replaceState(null, '', location.pathname + location.hash);
    setTimeout(() => {
      const m = $('lmsg');
      if (m && !(typeof PERFIL !== 'undefined' && PERFIL)) {
        m.style.color = 'var(--ok)';
        m.textContent = '¡Listo! Estamos creando tu empresa. En unos minutos te llegará un correo para crear tu contraseña y entrar (mira también en correo no deseado).';
      } else toast('Alta recibida: tu empresa estará lista en unos minutos');
    }, 400);
  }
  if (q.get('bienvenida') === '1') {
    history.replaceState(null, '', location.pathname);
    let n = 0;
    const t = setInterval(() => {
      if (typeof PERFIL !== 'undefined' && PERFIL && !document.body.classList.contains('sin-sesion') && typeof RPC_ORIG === 'function') { clearInterval(t); setTimeout(bienvenidaAlta, 900); }
      else if (++n > 60) clearInterval(t);
    }, 1000);
  }
})();
// «Plan y suscripción»: periodo de prueba de Stripe
pintarPaginaPlan = (orig => async function (...a) {
  const r = await orig.apply(this, a);
  const c = $('cfgcuerpo'), pl = PLAN_ACTUAL || {}, h = c && c.querySelector('#planact h2');
  if (h && pl.en_prueba && pl.periodo_fin && !$('pgprueba') && !pl.baja_al_final)
    h.insertAdjacentHTML('afterend', `<div class="banda-info" id="pgprueba">Estás en el periodo de prueba hasta el <b>${fechaCorta(pl.periodo_fin)}</b>:
      hasta entonces no se cobra nada. Ese día se pasará el primer recibo, salvo que te des de baja antes.</div>`);
  return r;
})(pintarPaginaPlan);

pintarPaginaPlan = (orig => async function (...a) {
  const r = await orig.apply(this, a);
  const c = $('cfgcuerpo'), pl = PLAN_ACTUAL || {};
  if (!c || !c.querySelector('#planact') || !pl.stripe_cliente || !puedeOrganizacion() || $('pgdatos')) return r;
  c.querySelector('#planact').insertAdjacentHTML('afterend', `<div class="card cfgpanel" id="pgdatos"><h2 style="padding:0 0 4px">Datos de facturación</h2>
    <p class="sm">Con estos datos se hacen tus recibos y facturas. ${pl.en_prueba ? `Revísalos antes del ${fechaCorta(pl.periodo_fin)}, cuando se pasa el primer recibo.` : ''}</p>
    <div class="pgdlista"><div class="skel"></div></div>
    <div class="acts"><button type="button" class="btn sec" id="pgdcorr">Corregir datos</button></div></div>`);
  $('pgdcorr').onclick = ev => pagoPortal(ev.target);
  // Sin avisos si falla (se ve «Falta» y se puede corregir igual)
  const d = await db.functions.invoke('pagos', { body: { accion: 'datos' } }).then(x => x.data, () => null).catch(() => null);
  const l = c.querySelector('#pgdatos .pgdlista'); if (!l) return r;
  if (!d || !d.ok) { l.innerHTML = '<p class="sm">No se han podido leer ahora. Puedes verlos y cambiarlos con «Corregir datos».</p>'; return r; }
  const x = d.datos || {};
  const filas = [['Razón social', x.nombre], ['NIF o CIF', x.nif], ['Correo para los recibos', x.email], ['Dirección fiscal', x.direccion]];
  const faltan = filas.filter(f => !f[1]).length;
  l.innerHTML = filas.map(([k, v]) => `<div class="pgdfila${v ? '' : ' falta'}"><span>${esc(k)}</span><b>${v ? esc(v) : 'Falta'}</b></div>`).join('')
    + (faltan ? `<div class="banda-aviso" style="margin-top:8px">Faltan datos para poder facturarte: complétalos con «Corregir datos».</div>` : '');
  return r;
})(pintarPaginaPlan);

// Pestañas propias del panel en modo plataforma: el equipo (los usuarios de la de plataforma) y la plantilla de las empresas nuevas
(() => {
  const base = PAGINAS.delcos.tabs;
  Object.defineProperty(PAGINAS.delcos, 'tabs', { configurable: true, get() {
    return MODO_PLATAFORMA ? [...base, ['equipo', 'Equipo delcos', () => pintarUsuarios2()], ['plantilla', 'Plantilla', () => pintarPlantillaDelcos()]] : base;
  } });
})();
// Menú: en modo plataforma, solo las secciones del panel (como botones del menú de siempre, ocultos fuera de él)
(() => {
  const nav = $('nav'); if (!nav) return;
  PANEL_SECCIONES.forEach(([t, , txt, ico]) => {
    if (!nav.querySelector(`[data-t="${t}"]`)) nav.insertAdjacentHTML('beforeend', `<button data-t="${t}" aria-selected="false" class="hide pdsec">${esc(txt)}</button>`);
    ICO_NAV[t] = ico;
  });
  MENU_GRUPOS.push({ id: 'panel', t: 'Panel delcos', items: PANEL_SECCIONES.map(s => s[0]) });
})();
ir = (orig => function (t, ...a) {
  const s = PANEL_SECCIONES.find(x => x[0] === t);
  if (s) { PAG_TAB.delcos = s[1]; const r = orig.call(this, 'delcos', ...a); marcarPanel(); return r; }
  // En modo plataforma no hay módulos de empresa: todo lleva al panel (salvo Configuración y el perfil)
  if (MODO_PLATAFORMA && !['delcos', 'config', 'perfil', 'manual'].includes(t)) { const r = orig.call(this, 'delcos', ...a); marcarPanel(); return r; }
  const r = orig.call(this, t, ...a); if (t === 'delcos') marcarPanel(); return r;
})(ir);
function aplicarModoPlataforma() {
  document.body.classList.toggle('modo-plataforma', MODO_PLATAFORMA);
  document.querySelectorAll('#nav [data-t]').forEach(b => {
    const pd = b.classList.contains('pdsec');
    if (MODO_PLATAFORMA) b.classList.toggle('hide', !pd);
    else if (pd) b.classList.add('hide');
  });
  if (MODO_PLATAFORMA) document.querySelectorAll('[data-u="organizacion"], [data-u="plan"], [data-u="empresa"]').forEach(b => b.classList.add('hide'));
  try { MENU_FIRMA = ''; montarMenuLateral(); } catch (e) {}
}
aplicarPermisosMenu = (orig => function (...a) { const r = orig.apply(this, a); try { aplicarModoPlataforma(); } catch (e) {} return r; })(aplicarPermisosMenu);

/* v2.172.0 · «Tu día»: subir o bajar una cita la mueve al momento, sin recargar la agenda (aviso de Eric: antes se recargaban métricas,
   semana, mes y sugerencias). La lista se repinta con el orden nuevo a partir de lo que ya hay (agenda_rango no se vuelve a pedir) y el orden
   se guarda por detrás; si no se puede guardar, vuelve a lo guardado. El foco se queda en la flecha de la cita movida. */
let TD_ULTIMO = null, TD_PRESET = null;
rpcCache = (orig => async function (fn, params, clave) {
  if (fn === 'agenda_rango' && TD_PRESET && params && params.p_desde === TD_PRESET.fecha && params.p_hasta === TD_PRESET.fecha) {
    const d = TD_PRESET.data; TD_PRESET = null; return { data: d, cache: false };
  }
  const r = await orig.call(this, fn, params, clave);
  if (fn === 'agenda_rango' && params && params.p_desde === params.p_hasta && r && r.data) TD_ULTIMO = { fecha: params.p_desde, data: r.data };
  return r;
})(rpcCache);

/* v2.173.0 · Panel delcos completo (SQL 108): Cobros y suscripciones, Altas desde la web y Estado de la plataforma, en el menú del panel.
   Con el menú lateral, el panel ya no repite sus apartados como pestañas (aviso de Eric): el título dice dónde estás. Al entrar en una
   empresa o salir de ella la app se recarga tapada («Abriendo …») hasta tener el menú, la marca y la pantalla de esa organización, para
   que no se vea ni un instante lo de la otra. En «Tu día», la cita que se sube o se baja se desliza a su sitio y queda marcada un momento. */
PANEL_SECCIONES.splice(1, 0, ['pd-cobros', 'cobros', 'Cobros y suscripciones', 'credit-card'], ['pd-altas', 'altas', 'Altas desde la web', 'rocket']);
PANEL_SECCIONES.splice(5, 0, ['pd-estado', 'estado', 'Estado de la plataforma', 'shield-check']);
(() => {
  const nav = $('nav'); if (!nav) return;
  PANEL_SECCIONES.forEach(([t, , txt, ico]) => {
    if (!nav.querySelector(`[data-t="${t}"]`)) nav.insertAdjacentHTML('beforeend', `<button data-t="${t}" aria-selected="false" class="hide pdsec">${esc(txt)}</button>`);
    ICO_NAV[t] = ico;
  });
  const g = MENU_GRUPOS.find(x => x.id === 'panel'); if (g) g.items = PANEL_SECCIONES.map(s => s[0]);
  // Las pestañas del panel siguen el mismo orden que el menú (en el móvil son su navegación)
  const desc = Object.getOwnPropertyDescriptor(PAGINAS.delcos, 'tabs');
  Object.defineProperty(PAGINAS.delcos, 'tabs', { configurable: true, get() {
    const base = desc.get ? desc.get.call(this) : desc.value;
    if (!MODO_PLATAFORMA) return base;
    const extra = { cobros: () => pintarCobrosDelcos(), altas: () => pintarAltasDelcos(), estado: () => pintarEstadoDelcos() };
    return PANEL_SECCIONES.map(([, k, n]) => { const b = base.find(x => x[0] === k); return b ? [k, n, b[2]] : extra[k] ? [k, n, extra[k]] : null; }).filter(Boolean);
  } });
})();





entrarEnOrganizacion = async function (o) {
  if (!await preguntar(`Vas a ver la plataforma como ${o.nombre}: sus datos, su configuración y su plan. Lo que cambies se guarda en su empresa y queda registrado. Para volver, «Salir» en la franja de arriba.`, { titulo: 'Entrar en ' + o.nombre, ok: 'Entrar' })) return;
  const { data: r } = await db.rpc('entrar_organizacion', { p_org: o.id });
  if (!r || !r.ok) { toast(r && r.motivo === 'permiso' ? 'Solo el Administrador de delcos puede entrar' : 'No se ha podido entrar', true); return; }
  prepararCambioOrg(o.nombre);
  location.reload();
};
document.addEventListener('click', ev => { if (ev.target.closest('#orgvistasal')) prepararCambioOrg('Panel delcos'); }, true);
(function terminarCambioOrg() {
  let destino = null; try { destino = sessionStorage.getItem('dlc-cambio-org'); } catch (e) {}
  const html = document.documentElement;
  if (destino === null && !html.classList.contains('cambiando-org')) return;
  const fin = () => { html.classList.remove('cambiando-org'); try { sessionStorage.removeItem('dlc-cambio-org'); } catch (e) {} };
  const tope = setTimeout(fin, 9000);
  let n = 0;
  const t = setInterval(async () => {
    if (++n > 80) { clearInterval(t); return; }
    if (!(typeof PERFIL !== 'undefined' && PERFIL && !document.body.classList.contains('sin-sesion') && typeof RPC_ORIG === 'function')) {
      if (!$('login').classList.contains('hide')) { clearInterval(t); clearTimeout(tope); fin(); }
      return;
    }
    clearInterval(t);
    try { await pagoCargarEstado(); } catch (e) {}
    try { await franjaVista(); } catch (e) {}
    try { aplicarModoPlataforma(); } catch (e) {}
    if (MODO_PLATAFORMA && TAB !== 'delcos') ir('pd-orgs');
    // Se espera a que la pantalla haya revelado sus datos (como mucho 3 s)
    for (let i = 0; i < 30; i++) { await new Promise(r => setTimeout(r, 100)); if (!document.querySelector('main > section.preparando, main > section.cargando')) break; }
    clearTimeout(tope); fin();
  }, 60);
})();
try { const m = () => { try { localStorage.setItem('dlc-modo', MODO_PLATAFORMA ? 'plataforma' : 'empresa'); } catch (e) {} };
  aplicarModoPlataforma = (orig => function (...a) { const r = orig.apply(this, a); m(); return r; })(aplicarModoPlataforma); } catch (e) {}

// ---- «Tu día»: la cita movida se desliza a su sitio (FLIP) y queda resaltada un momento

db.functions.invoke = (orig => async function (fn, op, ...a) {
  const r = await orig.call(this, fn, op, ...a);
  try { if (fn === 'pagos' && op && op.body && op.body.accion === 'datos' && r && r.data && r.data.ok) { PAGO_PROXIMO = r.data.proximo || null; pintarProximoRecibo(); } } catch (e) {}
  return r;
})(db.functions.invoke.bind(db.functions));
// (v2.183.0: aquí iba la primera versión de pintarProximoRecibo; se redefine entera más abajo)
pintarPaginaPlan = (orig => async function (...a) { const r = await orig.apply(this, a); try { pintarProximoRecibo(); } catch (e) {} return r; })(pintarPaginaPlan);

pintarProximoRecibo = function () {
  const c = $('cfgcuerpo'), pl = PLAN_ACTUAL || {}, h = c && c.querySelector('#planact h2');
  if (!h) return;
  // La cuota del plan, también con IVA
  c.querySelectorAll('#planact .kpi').forEach(k => {
    const sp = k.querySelector(':scope > span'), b = k.querySelector(':scope > b');
    if (!sp || !b || sp.textContent.trim() !== 'Al mes, sin IVA' || k.querySelector('.kpiiva')) return;
    const v = parseFloat(b.textContent.replace(/[^\d,]/g, '').replace(',', '.'));
    if (v > 0) k.insertAdjacentHTML('beforeend', `<span class="sm kpiiva">${eurW(v + ivaDe(v))} con IVA</span>`);
  });
  if (!pl.stripe_suscripcion || pl.plan === 'medida' || pl.baja_al_final || pl.estado === 'cancelada') return;
  const k = reciboCalculado(pl), s = PAGO_PROXIMO;
  const fecha = (s && s.fecha) || pl.periodo_fin, total = s && s.total != null ? s.total : k.primero;
  const cada = k.anual ? 'al año' : 'al mes';
  const txt = pl.en_prueba
    ? `Hoy no pagas nada. El <b>${fechaDiaMes(fecha)}</b> llega el primer recibo: <b>${eurW(total)} con IVA</b>${k.puesta ? `, que incluye la puesta en marcha (${eurW(k.puesta)} + IVA, una sola vez)` : k.anual ? ' (la puesta en marcha va incluida)' : ''}.
       Después, ${eurW(k.despues)} ${cada} con IVA. Si te das de baja antes, no pagas nada.`
    : `Próximo recibo: <b>${eurW(total)} con IVA</b>${fecha ? `, el <b>${fechaDiaMes(fecha)}</b>` : ''}.`;
  let el = $('pgrecibo');
  if (!el) {
    const prueba = $('pgprueba');
    if (prueba) { prueba.id = 'pgrecibo'; el = prueba; } else { h.insertAdjacentHTML('afterend', '<div class="banda-info" id="pgrecibo"></div>'); el = $('pgrecibo'); }
  }
  el.innerHTML = txt;
  el.dataset.origen = s && s.total != null ? 'stripe' : 'calculo';
  // La fecha ya la dice el aviso: fuera la línea suelta «Próximo recibo el …»
  c.querySelectorAll('#planact > p.sm').forEach(p => { if (/^Próximo recibo el /.test(p.textContent.trim())) p.remove(); });
};

