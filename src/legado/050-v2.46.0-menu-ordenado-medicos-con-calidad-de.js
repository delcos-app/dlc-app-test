/* ============================================================
   v2.46.0 · Menú ordenado, «Médicos» con Calidad del dato dentro,
   Configuración por bloques con subapartados, Plan en el menú de
   usuario, avisos arriba a la izquierda, aviso de versión solo
   cuando de verdad hay una nueva y notificaciones mejor explicadas
   ============================================================ */

Object.assign(ICON_NOM, {"euro": "<path d=\"M4 10h12\" /> <path d=\"M4 14h9\" /> <path d=\"M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2\" />", "lock-keyhole": "<circle cx=\"12\" cy=\"16\" r=\"1\" /> <rect x=\"3\" y=\"10\" width=\"18\" height=\"12\" rx=\"2\" /> <path d=\"M7 10V7a5 5 0 0 1 10 0v3\" />", "palette": "<circle cx=\"13.5\" cy=\"6.5\" r=\".5\" fill=\"currentColor\" /> <circle cx=\"17.5\" cy=\"10.5\" r=\".5\" fill=\"currentColor\" /> <circle cx=\"8.5\" cy=\"7.5\" r=\".5\" fill=\"currentColor\" /> <circle cx=\"6.5\" cy=\"12.5\" r=\".5\" fill=\"currentColor\" /> <path d=\"M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z\" />", "mail": "<rect width=\"20\" height=\"16\" x=\"2\" y=\"4\" rx=\"2\" /> <path d=\"m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7\" />", "save": "<path d=\"M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z\" /> <path d=\"M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7\" /> <path d=\"M7 3v4a1 1 0 0 0 1 1h7\" />", "warehouse": "<path d=\"M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z\" /> <path d=\"M6 18h12\" /> <path d=\"M6 14h12\" /> <rect width=\"12\" height=\"12\" x=\"6\" y=\"10\" />", "tag": "<path d=\"M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z\" /> <circle cx=\"7.5\" cy=\"7.5\" r=\".5\" fill=\"currentColor\" />", "compass": "<path d=\"m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z\" /> <circle cx=\"12\" cy=\"12\" r=\"10\" />", "users": "<path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\" /> <circle cx=\"9\" cy=\"7\" r=\"4\" /> <path d=\"M22 21v-2a4 4 0 0 0-3-3.87\" /> <path d=\"M16 3.13a4 4 0 0 1 0 7.75\" />", "house": "<path d=\"M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8\" /> <path d=\"M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z\" />", "route": "<circle cx=\"6\" cy=\"19\" r=\"3\" /> <path d=\"M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15\" /> <circle cx=\"18\" cy=\"5\" r=\"3\" />", "bell": "<path d=\"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9\" /> <path d=\"M10.3 21a1.94 1.94 0 0 0 3.4 0\" />", "user": "<path d=\"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2\" /> <circle cx=\"12\" cy=\"7\" r=\"4\" />", "receipt": "<path d=\"M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z\" /> <path d=\"M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8\" /> <path d=\"M12 17.5v-11\" />", "credit-card": "<rect width=\"20\" height=\"14\" x=\"2\" y=\"5\" rx=\"2\" /> <line x1=\"2\" x2=\"22\" y1=\"10\" y2=\"10\" />", "book-open": "<path d=\"M12 7v14\" /> <path d=\"M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z\" />", "circle-user": "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <circle cx=\"12\" cy=\"10\" r=\"3\" /> <path d=\"M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662\" />", "shield-check": "<path d=\"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z\" /> <path d=\"m9 12 2 2 4-4\" />", "contact": "<path d=\"M16 2v2\" /> <path d=\"M7 22v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2\" /> <path d=\"M8 2v2\" /> <circle cx=\"12\" cy=\"11\" r=\"3\" /> <rect x=\"3\" y=\"4\" width=\"18\" height=\"18\" rx=\"2\" />", "settings": "<path d=\"M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z\" /> <circle cx=\"12\" cy=\"12\" r=\"3\" />", "lock": "<rect width=\"18\" height=\"11\" x=\"3\" y=\"11\" rx=\"2\" ry=\"2\" /> <path d=\"M7 11V7a5 5 0 0 1 10 0v4\" />"});

/* ---------------- aviso de versión: solo si hay una más nueva que la abierta ---------------- */

(function () {
  const actual = ((document.querySelector('script[src*="app.js"]') || {}).src || '').split('v=')[1] || '';
  const aviso = $('nuevaver'); if (!aviso) return;
  new MutationObserver(async () => {
    if (aviso.classList.contains('hide') || aviso.dataset.comprobado) return;
    aviso.classList.add('hide'); aviso.dataset.comprobado = '1';
    try {
      const t = await (await fetch('./sw.js', { cache: 'no-store' })).text();
      const nueva = (t.match(/dlc-os-([\d.]+)/) || [])[1];
      // Al recargar, la página ya se ha descargado en su última versión: no hay nada que avisar
      if (nueva && nueva !== actual) aviso.classList.remove('hide');
    } catch (e) {}
    setTimeout(() => { delete aviso.dataset.comprobado; }, 2000);
  }).observe(aviso, { attributes: true, attributeFilter: ['class'] });
})();

/* ---------------- menú principal: orden y «Médicos» ---------------- */

ordenarMenu();

/* ---------------- menú de usuario: Mi perfil y Plan ---------------- */

(function () {
  const cfg = document.querySelector('[data-u="cfg"]'); if (!cfg) return;
  if (!document.querySelector('[data-u="perfil"]')) cfg.insertAdjacentHTML('beforebegin', `<button data-u="perfil">${svgIco(ICON_NOM.user)} Mi perfil</button>`);
  cfg.insertAdjacentHTML('afterend', `<button data-u="plan" class="hide">${svgIco(ICON_NOM['credit-card'])} Plan y suscripción</button>`);
  cfg.insertAdjacentHTML('afterbegin', svgIco(ICON_NOM.settings) + ' ');
  const sal = document.querySelector('[data-u="salir"]'); if (sal) sal.insertAdjacentHTML('afterbegin', svgIco(ICON_NOM['log-out'] || ICON_NOM.lock) + ' ');
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-u="perfil"], [data-u="plan"]'); if (!b) return;
    CFG_SEC = b.dataset.u; window.__CFG_DIRECTO = true; ir('config');
  });
})();

/* ---------------- Configuración por bloques con subapartados ---------------- */

function arbolConfig() {
  const admin = puede('administrar');
  return [
    ['Tu cuenta', [
      { k: 'perfil', ic: 'user', t: 'Mi perfil', d: 'Tus datos, idioma y qué abrir al entrar', r: pintarPerfil },
      { k: 'notif', ic: 'bell', t: 'Notificaciones', d: 'Qué avisos quieres recibir', r: pintarNotif },
      { k: 'rutas', ic: 'route', t: 'Rutas', d: `Punto de salida y llegada, y tiempos de ${TT('visita', 's', '', 'l', 'l')}`, sub: [['salida', 'Salida y llegada', () => pintarPrefsParte('rutas')], ['horario', `Tiempos de ${TT('visita', 's', '', 'l', 'l')}`, () => panelDeVentana(abrirHorarioPlan)]] },
      { k: 'inicio', ic: 'house', t: 'Inicio', d: 'Indicadores de Inicio', sub: [['kpis', 'Indicadores', () => panelDeVentana(abrirKpis)]] }]],
    ['Equipo', admin ? [
      { k: 'equipo', ic: 'users', t: 'Usuarios y roles', d: 'Personas, permisos y roles', sub: [['usuarios', 'Usuarios', pintarUsuarios2], ['roles', 'Roles y permisos', pintarRoles]] },
      { k: 'cartera', ic: 'compass', t: `Cartera y ${TT('visita', 'p', '', 'l', 'l')}`, d: `Reglas de cartera y frecuencia de ${TT('visita', 's', '', 'l', 'l')}`, sub: [['reglas', 'Reglas de cartera', () => panelDeVentana(editorReglasCartera)], ['frec', `Frecuencia de ${TT('visita', 's', '', 'l', 'l')}`, () => panelDeVentana(editorFrecuencia)], ['ciclo', 'Ciclo A/B/C', () => panelDeVentana(editorCiclo)]] },
      { k: 'comis', ic: 'euro', t: 'Comisiones', d: 'Esquemas y quién cobra con cada uno', mod: 'ventas', r: () => panelDeModulo('comisiones') },
      { k: 'seguridad', ic: 'lock-keyhole', t: 'Seguridad y registro', d: 'Accesos y cambios registrados', sub: [['accesos', 'Accesos', () => panelDeModulo('accesos')], ['auditoria', 'Auditoría', () => panelDeModulo('auditoria')]] }] : []],
    ['Datos', [
      ...(puedeCatalogos() ? [{ k: 'cat', ic: 'tag', t: 'Clasificadores', d: 'Listas de valores: estados, motivos…', r: () => { $('cfgcuerpo').innerHTML = ''; pintarCatalogos(); } }] : []),
      ...(admin || nivelDe2('P') >= 3 ? [{ k: 'stock', ic: 'warehouse', t: 'Stock y material', d: `Almacenes y material de ${TT('visita', 's', '', 'l', 'l')}`, mod: 'productos', sub: [['alm', 'Almacenes', pintarAlmacenes2], ['mues', `Material de ${TT('visita', 's', '', 'l', 'l')}`, pintarMaterial]] }] : [])]],
    ['Facturación', admin ? [
      { k: 'fact', ic: 'receipt', t: 'Facturación', d: 'Datos fiscales, series y VeriFactu', mod: 'facturacion', sub: [['fiscal', 'Datos fiscales', fac(pintarEmpresa)], ['series', 'Series', fac(pintarSeries)], ['vf', 'VeriFactu', fac(pintarVerifactu)], ['pdf', 'Diseño del PDF', () => disenoPDF()]] }] : []],
    ['Empresa', admin ? [
      { k: 'marca', ic: 'palette', t: 'Marca y logo', d: 'Nombre de la plataforma y logo', r: pintarMarca },
      { k: 'correo', ic: 'mail', t: 'Correo y firma', d: 'Cuenta de envío y firma', r: pintarCorreo },
      { k: 'copias', ic: 'save', t: 'Copias de seguridad', d: 'Descarga todos los datos', r: pintarCopias }] : []],
    ['Plataforma', puede('gestionar_plataforma') ? [
      { k: 'orgs', ic: 'building', t: 'Organizaciones', d: 'Empresas de la plataforma y alta de nuevas', r: pintarOrganizaciones }] : []]
  ].filter(g => g[1].length);
}
async function cargarConfig() {
  salirPanel();
  if (CFG_ANTES[CFG_SEC]) { const [k, s] = CFG_ANTES[CFG_SEC]; CFG_SEC = k; if (s) CFG_SUB = s; }
  const grupos = arbolConfig(), todos = grupos.flatMap(g => g[1]);
  const plan = { k: 'plan', r: pintarPlan2 };
  if (CFG_SEC !== 'plan' && !todos.some(x => x.k === CFG_SEC)) CFG_SEC = 'perfil';
  $('v-config').innerHTML = `
    <div class="saludo"><div><h1>Configuración</h1><div class="fecha">Todos los ajustes de tu cuenta y de la plataforma, en un solo sitio</div></div></div>
    <div class="cfghub">
      <nav class="cfgnav">${grupos.map(([g, l]) => `<div class="cfgg"><h3>${esc(g)}</h3>${l.map(x => {
        const bloq = x.mod && !planIncluye(x.mod);
        return `<button data-cfg="${x.k}"><span class="ci">${svgIco(ICON_NOM[x.ic] || '')}</span><span><b>${esc(x.t)}${bloq ? ` <span class="pill p-plan">${esc(planMinimo(x.mod) ? planMinimo(x.mod).nombre : 'Premium')}</span>` : ''}</b><em>${esc(x.d)}</em></span></button>`;
      }).join('')}</div>`).join('')}</nav>
      <div class="cfgcuerpo" id="cfgcuerpo-hub"><div class="cfgsubs hide" id="cfgsubs"></div><div id="cfgcuerpo"></div></div></div>`;
  const abrir = (k, sub, desplazar) => {
    salirPanel();
    const it = k === 'plan' ? plan : todos.find(x => x.k === k); if (!it) return;
    CFG_SEC = k; document.querySelectorAll('.cfgnav [data-cfg]').forEach(b => b.classList.toggle('on', b.dataset.cfg === k));
    const subs = $('cfgsubs');
    if (it.sub) {
      CFG_SUB = it.sub.some(s => s[0] === sub) ? sub : it.sub[0][0];
      subs.classList.remove('hide');
      subs.innerHTML = it.sub.map(([s, t]) => `<button data-csub="${s}" class="${s === CFG_SUB ? 'on' : ''}">${esc(t)}</button>`).join('');
      subs.querySelectorAll('[data-csub]').forEach(b => b.onclick = () => abrir(k, b.dataset.csub, false));
    } else { subs.classList.add('hide'); subs.innerHTML = ''; CFG_SUB = null; }
    $('cfgcuerpo').innerHTML = '';
    // Apartado de un módulo que no incluye el plan: se explica en lugar de mostrarlo
    if (it.mod && !planIncluye(it.mod)) {
      const p = planMinimo(it.mod);
      $('cfgcuerpo').innerHTML = `<div class="card cfgpanel planup"><div class="planupico">${svgIco(ICON_NOM.lock)}</div><h2>${esc(it.t)} está en el plan ${esc(p ? p.nombre : 'A medida')}</h2>
        <p class="sm">Tu plan ${esc(planDe(PLAN_ACTUAL.plan).nombre)} no lo incluye. ${p ? `Con ${esc(p.nombre)} (${precioPlan(p)}) tienes:` : ''}</p>
        ${p ? `<ul class="manlist">${p.ventajas.map(v => `<li><span>✓</span><span>${esc(v)}</span></li>`).join('')}</ul>` : ''}
        ${puede('administrar') ? '<div class="acts"><button class="btn" id="planver">Ver planes</button></div>' : ''}</div>`;
      if ($('planver')) $('planver').onclick = () => abrir('plan', null, true);
    } else {
      const r = it.sub ? it.sub.find(s => s[0] === CFG_SUB)[2] : it.r;
      Promise.resolve().then(r);
    }
    if (ES_MOVIL()) { const hub = document.querySelector('.cfghub'); hub.classList.add('detalle'); cfgMovil(); }
    if (desplazar) {
      // Con margen bajo la cabecera, para que el primer bloque se vea entero
      const cab = Math.max(0, ...['header', 'nav.main'].map(s => { const e = document.querySelector(s); return e ? e.getBoundingClientRect().bottom : 0; }));
      const y = document.getElementById('cfgcuerpo-hub').getBoundingClientRect().top + scrollY - cab - 24;
      if (Math.abs(scrollY - y) > 20) scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }
  };
  document.querySelectorAll('.cfgnav [data-cfg]').forEach(b => b.onclick = () => abrir(b.dataset.cfg, null, true));
  abrir(CFG_SEC, CFG_SUB, false);
  cfgMovil();
  if (ES_MOVIL() && !window.__CFG_DIRECTO) document.querySelector('.cfghub').classList.remove('detalle');
  window.__CFG_DIRECTO = false;
};
;

/* ---------------- manual: qué incluye tu plan ---------------- */


/* ---------------- notificaciones mejor explicadas ---------------- */

const EXPLICA_NOTIF = {
  pauta: [`Cada vez que se registra, se corrige o se anula una ${TT('pauta', 's', '', 'l', 'l')}.`, 'Consulta tu portal para ver las cifras.'],
  venta_cartera: [`Cuando se confirma un pedido de ${TT('medico', 's', 'un', 'l', 'l')} que llevas, con las unidades y el producto.`, `Buen momento para agradecérselo en la ${TT('visita', 's', 'proximo', 'l', 'l')}.`],
  cartera: [`Cuando te asignan ${TT('medico', 'p', '', 'l', 'l', 'nuevo')}, a mano o por tu zona.`, `Revisa su ficha y planifica la ${TT('visita', 's', 'primer', 'l', 'l')}.`],
  cruce: [`Cuando otra persona del equipo ${TT('visita', 's', '', 'l', 'l')} a ${TT('medico', 's', 'un', 'l', 'l')} de tu cartera.`, `Coordinaos para no repetir ${TT('visita', 'p', '', 'l', 'l')}.`],
  pedido_validado: ['Cada pedido que confirma otra persona del equipo.', 'Prepara el envío, anota el cobro o emite la factura.'],
  citas_hoy: ['Al empezar el día, cuántas citas tienes.', 'Abre «Tu día» para empezar la jornada.'],
  sin_visitar: [`Cada lunes, ${TT('medico', 'p', 'el', 'l', 'l')} de tu cartera que llevan más de 60 días sin ${TT('visita', 's', '', 'l', 'l')}.`, 'Tenlos en cuenta al planificar la semana.'],
  cliente_nuevo: [`Cuando se da de alta ${TT('paciente', 's', 'un', 'l', 'l')} que viene de ${TT('medico', 's', 'un', 'l', 'l')} de tu cartera.`, `Señal de que su cartera se mueve.`],
  pago_recibido: ['Cuando se confirma el pago de un pedido que creaste.', 'Ya se puede preparar el envío.'],
  borrador_nuevo: ['Cuando alguien deja un pedido pendiente de confirmar.', 'Revísalo y valídalo para que salga el pedido.'],
  seguimientos_hoy: ['Al empezar el día, las llamadas de seguimiento que tocan o están atrasadas.', 'Están en Pedidos → Oportunidades.'],
  pagos_pendientes: ['Al empezar el día, pedidos con el pago pendiente hace más de una semana.', 'Reclama el pago o envía los datos de transferencia.'],
  facturas_vencidas: ['Al empezar el día, facturas vencidas sin cobrar.', 'Revisa los cobros en Facturación.'],
  stock_minimo: ['Cuando un producto baja de su stock mínimo.', 'Prepara un pedido de compra al proveedor.'],
  lotes_caducan: ['Al empezar el día, lotes que caducan en los próximos 30 días.', 'Dales salida primero.'],
  compra_recibida: ['Cuando se registra la llegada de mercancía de una compra.', 'El stock ya está disponible.'],
  rectificativa: ['Cada factura rectificativa que se emite.', 'Comprueba el motivo y el importe.'],
  duplicado: ['Cuando una ficha se marca como posible duplicado.', 'Revísala en Calidad del dato.'],
  usuario_nuevo: ['Cuando se da de alta una persona en la plataforma.', 'Revisa su rol y sus permisos.'],
  esquema: ['Cuando te asignan un esquema de comisión.', 'Consulta desde cuándo se aplica.']
};
TIPOS_NOTIF.forEach(t => { if (EXPLICA_NOTIF[t[0]]) t[3] = EXPLICA_NOTIF[t[0]][0]; });


