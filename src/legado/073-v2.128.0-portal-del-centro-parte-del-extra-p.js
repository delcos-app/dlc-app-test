/* v2.128.0 · Portal del centro (parte del extra «Portal»). Un centro (ficha de tipo Centro) con acceso entra en «Mi centro»: pide la
   reposición de los productos que tiene dados de alta, al precio que le pone su comercial; el pedido llega como borrador para confirmar.
   Ve sus pedidos y lo comprado, pide material y escribe a su comercial (lo mismo que el médico). En la ficha del centro, «Productos
   del centro». */
async function cargarCentro() {
  // v2.282.0: página nueva (al final del archivo); al arrancar se espera a que esté leída
  if (!window.PM_LISTO || typeof cargarCentro2282 !== 'function') { const v0 = $('v-informe'); if (v0 && !v0.innerHTML.trim()) v0.innerHTML = '<div class="card">' + skelCard('Cargando…') + '</div>'; setTimeout(cargarCentro, 30); return; }
  if (window.PC_LISTO) return cargarCentro2282();
  const v = $('v-informe');
  v.innerHTML = `<div class="medhero"><div><div class="sm" style="color:rgba(255,255,255,.8)">Tu centro</div><h1 id="ctnom">…</h1>
      <div class="sm" style="color:rgba(255,255,255,.85)">Pide la reposición de tus productos y sigue tus pedidos</div></div></div>
    <div id="ctcuerpo" class="angrid"><div class="card">${skelCard('Cargando…')}</div></div>`;
  pintarCentro();
}
async function pintarCentro() {
  // Al arrancar, esto se pinta antes de leerse el final de este archivo: se espera a que esté
  try { void MOTIVO_PORTAL; void NOMBRE_ESTADO_CENTRO; } catch (e) { setTimeout(pintarCentro, 300); return; }
  if (!$('ctcuerpo')) return;
  const [{ data: prods }, { data: mp }] = await Promise.all([RPC_ORIG('productos_portal', {}), RPC_ORIG('mis_pedidos_portal', {})]);
  if (!$('ctcuerpo')) return;
  if (mp && mp.nombre) $('ctnom').textContent = mp.nombre;
  const lp = Array.isArray(prods) ? prods : [], peds = (mp && mp.pedidos) || [], pp = (mp && mp.por_producto) || [];
  const conIva = x => r2((+x.precio || 0) * (1 + (+x.iva || 0) / 100));
  $('ctcuerpo').innerHTML = `
    <div class="card ancard ancha" id="ctped"><h2>Pedir reposición</h2>
      ${lp.length ? `<div class="lista" id="ctprods">${lp.map(x => `<div class="item ctlin" style="cursor:default"><span class="tx"><b>${esc(x.nombre)}</b>
          <span class="sm">${eurI(conIva(x))} con IVA${x.propio ? ' · tu precio' : ''}</span></span>
          <input type="number" min="0" max="1000" step="1" value="0" data-ctp="${x.producto_id}" data-ctpr="${conIva(x)}" aria-label="Unidades de ${esc(x.nombre)}"></div>`).join('')}</div>
        <label for="ctnota">Nota</label><input id="ctnota" placeholder="Opcional: horario de entrega, persona de contacto…">
        <div class="nvtot"><span>Total <b id="cttot">${eurI(0)}</b> con IVA</span><button type="button" class="btn" id="ctok">Enviar pedido</button></div>
        <p class="leer">Tu comercial lo revisa y lo confirma; aquí verás cuándo está confirmado y preparado.</p>`
        : '<p class="sm" style="padding:0 16px">Todavía no tienes productos para pedir. Tu comercial te los dará de alta.</p>'}</div>
    <div class="card ancard" id="ctlista"><h2>Tus pedidos</h2>
      ${peds.length ? `<div class="lista">${peds.map(p => `<div class="item" style="cursor:default"><span class="tx">
          <b>${p.numero ? esc(p.numero) + ' · ' : ''}${fechaCorta(String(p.fecha).slice(0, 10))}</b>
          <span class="sm">${esc((p.lineas || []).map(l => `${l.producto} × ${num(l.unidades)}`).join(', '))}${p.total != null ? ' · ' + eurI(p.total) : ''}</span></span>
          <span class="pill ${NOMBRE_ESTADO_CENTRO[p.estado] || ''}">${esc(p.estado)}</span></div>`).join('')}</div>` : '<div class="sm" style="padding:0 16px">Todavía no hay pedidos.</div>'}</div>
    <div class="card ancard" id="ctcompra"><h2>Lo que has comprado</h2>
      ${pp.length ? barrasH(pp.map(x => ({ n: x.producto, v: x.unidades })), v => num(v) + ' uds.') : vacioGrafico('Aparecerá cuando tengas pedidos completados.')}
      <p class="leer">Unidades de los últimos 12 meses, por producto.</p></div>`;
  const total = () => [...$('ctcuerpo').querySelectorAll('[data-ctp]')].reduce((s, i) => s + (Math.max(0, +i.value || 0)) * (+i.dataset.ctpr || 0), 0);
  $('ctcuerpo').querySelectorAll('[data-ctp]').forEach(i => i.oninput = i.onchange = () => { $('cttot').textContent = eurI(total()); });
  if ($('ctok')) $('ctok').onclick = async ev => {
    const lineas = [...$('ctcuerpo').querySelectorAll('[data-ctp]')].map(i => ({ producto_id: i.dataset.ctp, unidades: Math.floor(+i.value || 0) })).filter(x => x.unidades > 0);
    if (!lineas.length) { toast('Pon las unidades de algún producto', true); return; }
    ev.target.disabled = true;
    const { data: r } = await db.rpc('pedido_portal', { p_lineas: lineas, p_nota: $('ctnota').value.trim() || null });
    ev.target.disabled = false;
    if (!r || !r.ok) { toast(r && r.motivo === 'vacio' ? 'Pon las unidades de algún producto' : motivoPortal(r), true); return; }
    toast('Pedido enviado: tu comercial lo confirmará'); pintarCentro();
  };
  portalMedico();
}
const NOMBRE_ESTADO_CENTRO = { 'Pendiente de confirmar': 'p-warn', Confirmado: 'p-est', 'Pendiente de validar': 'p-warn', Validado: 'p-est',   // v2.349.0 (SQL 176); los dos de antes, por si la base aún no lo tiene
  Preparado: 'p-per', Anulado: 'p-anu' };

// Ficha de un centro: qué productos puede pedir y a qué precio (sin IVA; vacío = tarifa)
async function fichaProductosCentro(id) {
  if (ES_MEDICO() || !hayExtra('portal') || FICHA_ID !== id || !$('fbody') || $('fprodc')) return;
  const rf = await rpcCache('ficha_cuenta', { p_id: id }, 'ficha-' + id);
  const m = (rf && rf.data && rf.data.medico) || {};
  if (m.tipo !== 'Centro' || FICHA_ID !== id || $('fprodc')) return;
  if (!PRODUCTOS.length) await cargarProductos();
  const { data: act } = await db.from('productos_cuenta').select('producto_id,precio').eq('cuenta_id', id);
  if (FICHA_ID !== id || $('fprodc')) return;
  const sel = {}; (act || []).forEach(x => sel[x.producto_id] = x);
  const lista = PRODUCTOS.filter(p => p.tipo !== 'servicio' && (p.estado || 'Activo') === 'Activo');
  const html = `<section class="blk" id="fprodc"><h3>Productos del centro <span class="n">${num((act || []).length)}</span></h3>
    <p class="sm">Lo que puede pedir desde su portal. Precio sin IVA; si lo dejas vacío, el de tarifa.</p>
    <div class="lista">${lista.map(p => `<label class="item" style="cursor:default"><input type="checkbox" data-fpcp="${p.id}" ${sel[p.id] ? 'checked' : ''}>
        <span class="tx"><b>${esc(p.nombre)}</b><span class="sm">Tarifa ${p.precio != null ? eurI(p.precio) : '—'} sin IVA</span></span>
        <input type="number" min="0" step="0.01" data-fpcx="${p.id}" value="${sel[p.id] && sel[p.id].precio != null ? +sel[p.id].precio : ''}" placeholder="Tarifa" style="max-width:120px" aria-label="Precio de ${esc(p.nombre)} para el centro"></label>`).join('')
      || '<div class="sm">No hay productos activos.</div>'}</div>
    <div class="acts" style="margin:8px 0 0;justify-content:flex-end"><button type="button" class="btn sec" id="fpcok">Guardar productos</button></div></section>`;
  const tras = $('fportal') || $('fbody').querySelector('section.fvis');
  if (tras) tras.insertAdjacentHTML('afterend', html); else $('fbody').insertAdjacentHTML('beforeend', html);
  $('fpcok').onclick = async ev => {
    const items = [...$('fprodc').querySelectorAll('[data-fpcp]')].filter(x => x.checked).map(x => {
      const v = $('fprodc').querySelector(`[data-fpcx="${x.dataset.fpcp}"]`).value;
      return { producto_id: x.dataset.fpcp, precio: v === '' ? null : Math.max(0, +v) };
    });
    ev.target.disabled = true;
    const { data: r } = await db.rpc('guardar_productos_cuenta', { p_cuenta: id, p_items: items });
    ev.target.disabled = false;
    if (!r || !r.ok) { toast(motivoPortal(r), true); return; }
    toast(`Productos del centro guardados (${num(r.productos)})`);
    const b = $('fprodc'); if (b) b.remove(); fichaProductosCentro(id);
  };
}
abrirFicha = (orig => async function (id, ...a) { const r = await orig.call(this, id, ...a); fichaProductosCentro(id); return r; })(abrirFicha);


/* v2.131.0 · Usuarios y roles con página propia; panel de delcos (solo quien gestiona la plataforma): organizaciones, accesos y
   auditoría, y «Entrar» en cualquier organización para verla tal cual (franja «Estás viendo X · Salir»). Configuración se queda con
   lo del día a día, con Inicio primero. */
PAGINAS.usuarios = { t: 'Usuarios y roles', d: 'Personas de tu equipo, sus roles y sus permisos', admin: true,
  tabs: [['usuarios', 'Usuarios', () => pintarUsuarios2()], ['roles', 'Roles y permisos', () => pintarRoles()]] };
PAGINAS.delcos = { t: 'Panel delcos', d: 'Clientes de la plataforma, accesos y registro de cambios', permiso: () => puede('gestionar_plataforma'),
  tabs: [['orgs', 'Organizaciones', () => pintarOrganizaciones()], ['accesos', 'Accesos', () => panelDeModulo('accesos')],
         ['auditoria', 'Auditoría', () => panelDeModulo('auditoria')]] };
// Organización (de cada empresa) ya no lleva la lista de organizaciones: está en el panel de delcos
(() => {
  const g = Object.getOwnPropertyDescriptor(PAGINAS.organizacion, 'tabs').get;
  Object.defineProperty(PAGINAS.organizacion, 'tabs', { get() { return g.call(this).filter(x => x[0] !== 'orgs'); }, configurable: true });
})();
// Configuración: Inicio primero; Usuarios y roles, y Seguridad y registro, ya no están aquí
arbolConfig = (orig => function () {
  const g = orig().map(([n, l]) => [n, l.filter(x => !['equipo', 'seguridad', 'orgs'].includes(x.k))]).filter(x => x[1].length);
  for (const grupo of g) {
    const i = grupo[1].findIndex(x => x.k === 'inicio');
    if (i >= 0) { const [it] = grupo[1].splice(i, 1); g[0][1].unshift(it); break; }
  }
  return g;
})(arbolConfig);
// Lo que antes se abría en Configuración lleva a su página
ir = (orig => function (t, ...a) {
  if (t === 'config' && CFG_SEC === 'equipo') { PAG_TAB.usuarios = CFG_SUB === 'roles' ? 'roles' : 'usuarios'; CFG_SEC = 'inicio'; CFG_SUB = null; t = 'usuarios'; }
  if (t === 'config' && CFG_SEC === 'seguridad' && puede('gestionar_plataforma')) { PAG_TAB.delcos = CFG_SUB === 'accesos' ? 'accesos' : 'auditoria'; CFG_SEC = 'inicio'; CFG_SUB = null; t = 'delcos'; }
  if (t === 'config' && CFG_SEC === 'orgs' && puede('gestionar_plataforma')) { PAG_TAB.delcos = 'orgs'; CFG_SEC = 'inicio'; t = 'delcos'; }
  return orig.call(this, t, ...a);
})(ir);

// Menú: «Usuarios y roles» (quien administra) y «Panel delcos» (quien gestiona la plataforma)
function menuPaginas2131() {
  const nav = document.querySelector('nav.main .in'); if (!nav || ES_MEDICO()) return;
  const pon = (t, txt, ve) => {
    let b = nav.querySelector(`[data-t="${t}"]`);
    if (!b && ve) { nav.insertAdjacentHTML('beforeend', `<button data-t="${t}" aria-selected="false">${txt}</button>`); b = nav.querySelector(`[data-t="${t}"]`); }
    if (b) { b.classList.toggle('hide', !ve); if (!b.closest('.mlbs') && b !== nav.lastElementChild) nav.appendChild(b); }   // v2.132.0: si ya está en su bloque del menú lateral, se queda
  };
  pon('usuarios', 'Usuarios y roles', puede('administrar'));
  pon('delcos', 'Panel delcos', puede('gestionar_plataforma'));
}
aplicarPermisosMenu = (orig => function (...a) { const r = orig.apply(this, a); menuPaginas2131(); franjaVista(); return r; })(aplicarPermisosMenu);

// Franja «Estás viendo X · Salir» cuando el Administrador de delcos está dentro de otra organización
let VISTA_ORG = null;
async function franjaVista() {
  if (!PERFIL || !puede('gestionar_plataforma')) { quitarFranja(); return; }
  const { data } = await RPC_ORIG('vista_organizacion', {});
  VISTA_ORG = data || null;
  if (!VISTA_ORG) { quitarFranja(); return; }
  let f = $('orgvista');
  if (!f) { document.body.insertAdjacentHTML('afterbegin', '<div id="orgvista" class="orgvista" role="status"></div>'); f = $('orgvista'); }
  f.innerHTML = `<span>Estás viendo <b>${esc(VISTA_ORG.nombre)}</b>${VISTA_ORG.bloqueada ? ` <span class="pill p-warn">${VISTA_ORG.bloqueada === 'desactivada' ? 'desactivada' : 'prueba terminada'}</span>` : ''} tal cual la ve esa empresa. Lo que hagas queda en su registro.</span>
    <button type="button" class="btn sec" id="orgvistasal">Salir</button>`;
  document.body.classList.add('con-vista');
  document.documentElement.style.setProperty('--alto-franja', f.offsetHeight + 'px');
  $('orgvistasal').onclick = async ev => {
    ev.target.disabled = true;
    const { data: r } = await db.rpc('salir_organizacion', {});
    if (!r || !r.ok) { ev.target.disabled = false; toast('No se ha podido salir', true); return; }
    location.reload();
  };
}
function quitarFranja() {
  const f = $('orgvista'); if (f) f.remove();
  document.body.classList.remove('con-vista'); document.documentElement.style.setProperty('--alto-franja', '0px');
}
// (v2.183.0: aquí iba la primera versión de entrarEnOrganizacion; se redefine entera más abajo)
setTimeout(() => { try { menuPaginas2131(); franjaVista(); } catch (e) {} }, 0);
/* ---------------- v2.132.0 · Menú lateral de escritorio (elegido por Eric: barra a la izquierda, agrupada por áreas) ----------------
   Los botones siguen siendo los de siempre (nav.main #nav [data-t]): aquí solo se reparten en bloques, se pliega la barra a iconos
   (por defecto en pantallas de menos de 1440 px; se recuerda en el dispositivo) y cada persona ordena los bloques y oculta secciones
   («Personalizar menú», guardado en preferencias.menu). Solo en escritorio (≥ 900 px); el móvil sigue con su barra inferior.
   Un botón nuevo en #nav que no esté en ningún bloque sale en «Otros». «Plataforma» (panel de delcos) va siempre al final, fijo. */
const MENU_GRUPOS = [
  { id: 'dia', t: 'Tu día', items: ['inicio', 'agenda', 'rutas'] },
  { id: 'cartera', t: 'Cartera', items: ['directorio', 'pacientes', 'seguimiento'] },
  { id: 'ventas', t: 'Ventas', items: ['ventas', 'productos', 'facturacion'] },
  { id: 'resultados', t: 'Resultados', items: ['analitica', 'informe'] },
  { id: 'equipo', t: 'Equipo', items: ['usuarios'] }];
const MENU_FIJO = { id: 'plataforma', t: 'Plataforma', items: ['delcos'] };
const MENU_PLEGAR_BAJO = 1440;
// Iconos de las secciones nuevas (v2.131.0): Usuarios y roles con la llave de accesos y el panel de delcos con el escudo
Object.assign(ICO_NAV, { usuarios: 'key-round', delcos: 'shield' });
const ICO_SUBIR = '<path d="m18 15-6-6-6 6"/>';
const ICO_PLEGAR = '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="m16 15-3-3 3-3"/>';
const menuPrefs = () => ((typeof PERFIL !== 'undefined' && PERFIL && PERFIL.preferencias) || {}).menu || {};
function menuGrupos() {
  const p = menuPrefs(), conocidos = new Set([...MENU_GRUPOS.flatMap(g => g.items), ...MENU_FIJO.items]);
  const gs = MENU_GRUPOS.map(g => ({ id: g.id, t: g.t, items: [...g.items] }));
  gs.forEach(g => { const o = (p.items || {})[g.id]; if (Array.isArray(o)) g.items = [...o.filter(k => g.items.includes(k)), ...g.items.filter(k => !o.includes(k))]; });
  const orden = Array.isArray(p.orden) ? p.orden : [];
  gs.sort((a, b) => ((orden.indexOf(a.id) + 1) || 99) - ((orden.indexOf(b.id) + 1) || 99));
  const otros = [...document.querySelectorAll('#nav button[data-t]')].map(b => b.dataset.t).filter(k => !conocidos.has(k));
  if (otros.length) gs.push({ id: 'otros', t: 'Otros', items: otros });
  // v2.337.0 (Eric): Inicio siempre el primero, se ordene como se ordene el resto
  gs.forEach(g => { g.items = g.items.filter(k => k !== 'inicio'); });
  if (gs.length && conocidos.has('inicio')) gs[0].items.unshift('inicio');
  return gs;
}
const menuEscritorio = () => innerWidth >= 900;
const menuPlegado = () => { try { const v = localStorage.getItem('dlc-menu-plegado'); if (v === '1' || v === '0') return v === '1'; } catch (e) {} return innerWidth < MENU_PLEGAR_BAJO; };
let MENU_FIRMA = '';
function montarMenuLateral() {
  const inn = $('nav'); if (!inn) return;
  // Con una sola sección (portal del médico o del centro) no hace falta barra lateral: se queda la cabecera de siempre
  const visibles = [...inn.querySelectorAll('button[data-t]')].filter(b => !b.classList.contains('hide') && b.dataset.t !== 'seguimiento' && b.style.display !== 'none' && (b.classList.contains('mloculto') || getComputedStyle(b).display !== 'none' || document.body.classList.contains('menulat')));
  // v2.135.0: el portal nunca lleva barra lateral (al arrancar veía un instante dos secciones y la montaba)
  const portal = (() => { try { return ES_MEDICO(); } catch (e) { return false; } })();
  const lat = menuEscritorio() && typeof PERFIL !== 'undefined' && !!PERFIL && !portal && visibles.length > 1;
  document.body.classList.toggle('menulat', lat);
  if (!lat) return;
  document.body.classList.toggle('menupleg', menuPlegado());
  const ocultos = menuPrefs().ocultos || [];
  const botones = [...inn.querySelectorAll('button[data-t]')];
  // Firma: si no ha cambiado nada (botones, permisos, preferencias), no se rehace (evita bucles con el observador)
  const firma = botones.map(b => b.dataset.t + (b.classList.contains('hide') ? '-' : '+') + b.textContent.trim()).join('|') + JSON.stringify(menuPrefs()) + document.body.classList.contains('menupleg');
  if (firma === MENU_FIRMA && inn.querySelector('.mlmarca')) return;
  MENU_FIRMA = firma;
  if (!inn.querySelector('.mlmarca')) {
    const logo = (document.querySelector('header .logo') || {}).src || './logo-app.png';
    inn.insertAdjacentHTML('afterbegin', `<div class="mlmarca"><img src="${esc(logo)}" alt=""><b class="mllab"></b></div>`);
  }
  const marca = (typeof AJUSTES !== 'undefined' && AJUSTES && AJUSTES.marca) || {};
  inn.querySelector('.mlmarca b').textContent = marca.nombre || document.title || '';
  const grupos = [...menuGrupos(), MENU_FIJO];
  grupos.forEach(g => {
    let c = inn.querySelector(`.mlgrupo[data-g="${g.id}"]`);
    if (!c) {
      inn.insertAdjacentHTML('beforeend', `<div class="mlgrupo${g === MENU_FIJO ? ' fijo' : ''}" data-g="${g.id}"><div class="mltit">${esc(g.t)}</div><div class="mlbs"></div></div>`);
      c = inn.querySelector(`.mlgrupo[data-g="${g.id}"]`);
    }
    inn.appendChild(c);
    const bs = c.querySelector('.mlbs');
    g.items.forEach(k => { const b = inn.querySelector(`button[data-t="${k}"]`); if (b) bs.appendChild(b); });
  });
  botones.forEach(b => {
    b.classList.toggle('mloculto', ocultos.includes(b.dataset.t) && !MENU_FIJO.items.includes(b.dataset.t) && b.dataset.t !== 'inicio');
    // El texto va en su propia etiqueta (se oculta al plegar) y el nombre sirve de aviso al pasar el ratón
    const t = [...b.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim());
    if (t.length) {
      const txt = t.map(n => n.textContent).join('').trim(); t.forEach(n => n.remove());
      const l = b.querySelector('.mllab'); if (l) l.textContent = txt; else b.insertAdjacentHTML('beforeend', `<span class="mllab">${esc(txt)}</span>`);
    }
    b.dataset.tip = (b.querySelector('.mllab') || b).textContent.trim();
  });
  inn.querySelectorAll('.mlgrupo').forEach(g => g.classList.toggle('vacio', ![...g.querySelectorAll('button[data-t]')]
    .some(b => !b.classList.contains('hide') && !b.classList.contains('mloculto') && b.dataset.t !== 'seguimiento' && getComputedStyle(b).display !== 'none')));
  if (!inn.querySelector('.mlpie')) {
    inn.insertAdjacentHTML('beforeend', `<div class="mlpie">
      <button type="button" class="mlitem" id="mlcfg" data-tip="Configuración">${svgIco(ICON_NOM.settings)}<span class="mllab">Configuración</span></button>
      <button type="button" class="mlitem" id="mlpers" data-tip="Personalizar menú">${svgIco(ICON_NOM['sliders-horizontal'])}<span class="mllab">Personalizar menú</span></button>
      <button type="button" class="mlplegar" id="mlplegar" aria-label="Plegar o desplegar el menú">${svgIco(ICO_PLEGAR)}</button></div>`);
    $('mlcfg').onclick = () => ir('config');
    $('mlpers').onclick = e => { e.stopPropagation(); menuPersonalizar(); };
    $('mlplegar').onclick = () => {
      const p = !document.body.classList.contains('menupleg');
      try { localStorage.setItem('dlc-menu-plegado', p ? '1' : '0'); } catch (e) {}
      document.body.classList.toggle('menupleg', p); menuTip(null); MENU_FIRMA = ''; montarMenuLateral();
    };
  }
  inn.appendChild(inn.querySelector('.mlpie'));
  const cfg = document.querySelector('#umenu [data-u="cfg"]');
  $('mlcfg').classList.toggle('hide', !cfg || cfg.classList.contains('hide'));
  $('mlplegar').dataset.tip = document.body.classList.contains('menupleg') ? 'Desplegar el menú' : 'Plegar el menú';
}
// Aviso con el nombre al pasar el ratón por un icono (barra plegada)
function menuTip(b) {
  let t = $('mltip');
  if (!b || !document.body.classList.contains('menupleg') || !document.body.classList.contains('menulat')) { if (t) t.classList.remove('ver'); return; }
  if (!t) { document.body.insertAdjacentHTML('beforeend', '<div id="mltip" role="tooltip"></div>'); t = $('mltip'); }
  const r = b.getBoundingClientRect();
  t.textContent = b.dataset.tip || ''; t.style.top = (r.top + r.height / 2) + 'px'; t.style.left = (r.right + 10) + 'px'; t.classList.add('ver');
}
document.addEventListener('mouseover', e => { const b = e.target.closest && e.target.closest('nav.main [data-tip]'); menuTip(b || null); });
// (v2.183.0: aquí iba la primera versión de menuPersonalizar; se redefine entera más abajo)
// Se monta al arrancar y se rehace si cambian los botones (permisos, módulos, portal), el tamaño de la pantalla o la sesión
let MENU_RAF = 0;
const menuRehacer = () => { if (MENU_RAF) return; MENU_RAF = requestAnimationFrame(() => { MENU_RAF = 0; montarMenuLateral(); }); };
if ($('nav')) new MutationObserver(menuRehacer).observe($('nav'), { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
addEventListener('resize', menuRehacer);
if ($('app')) new MutationObserver(menuRehacer).observe($('app'), { attributes: true, attributeFilter: ['class'] });
menuRehacer();


/* v2.133.0 · Entorno de pruebas: «Traer los datos de producción». Junto a «Volver a los datos de partida» (y para quien puede
   usarlo), pide a la función «refrescar-pruebas» de Supabase que lance el proceso de GitHub que copia los datos actuales de
   producción (solo los lee) y los deja como nuevos datos de partida. La franja enseña en qué punto está y recarga al terminar. */
const MOTIVO_REFRESCO = { permiso: 'Solo la administración puede traer los datos de producción', responsable: 'Solo la persona responsable del entorno de pruebas puede hacerlo',
  en_marcha: 'Ya se están copiando los datos de producción', github: 'No se ha podido lanzar la copia en GitHub', no_es_pruebas: 'Esto solo funciona en el entorno de pruebas' };
let REFRESCO_VIGILA = null;
async function estadoRefresco(recargarAlAcabar) {
  const { data: e } = await RPC_ORIG_FROM('entorno_pruebas').select('*').eq('id', 1).single();
  const el = $('prrefresco'); if (!el || !e) return null;
  const fmt = x => new Date(x).toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const enMarcha = ['pedido', 'copiando'].includes(e.refresco_estado);
  el.textContent = enMarcha ? `· Copiando los datos de producción (${e.refresco_estado === 'pedido' ? 'empezando' : 'en marcha'}): tarda unos minutos`
    : e.refresco_estado === 'error' ? '· La última copia de producción falló' + (e.refresco_error ? ': ' + e.refresco_error : '')
    : e.refresco_error ? '· ' + e.refresco_error : '';
  el.classList.toggle('falta', e.refresco_estado === 'error');
  if ($('prtraer')) $('prtraer').disabled = enMarcha;
  if (enMarcha && !REFRESCO_VIGILA) REFRESCO_VIGILA = setInterval(async () => {
    const x = await estadoRefresco(true);
    if (x && !['pedido', 'copiando'].includes(x.refresco_estado)) {
      clearInterval(REFRESCO_VIGILA); REFRESCO_VIGILA = null;
      if (x.refresco_estado === 'ok') { toast('Datos de producción copiados'); limpiarDatosLocales(); setTimeout(() => location.reload(), 800); }
      else toast('La copia de producción ha fallado', true);
    }
  }, 20000);
  return e;
}
if (EN_PRUEBAS) {
  pintarFranjaPruebas = (orig => async function () {
    await orig();
    await new Promise(r => setTimeout(r, 120));
    const b = $('prreset'); if (!b || $('prtraer')) return;   // sin «Volver…» (no es responsable) tampoco puede traer datos
    b.insertAdjacentHTML('beforebegin', '<button class="btn sec" id="prtraer" title="Copia aquí los datos actuales de producción y los deja como nuevos datos de partida">⇣ Traer los datos de producción</button>');
    const p = $('prpunto'); if (p && !$('prrefresco')) p.insertAdjacentHTML('afterend', ' <span class="prpunto" id="prrefresco"></span>');
    estadoRefresco();
    $('prtraer').onclick = async ev => {
      if (!await preguntar('Se copiarán aquí los datos actuales de producción (producción no se toca) y pasarán a ser los nuevos datos de partida. Todo lo hecho en pruebas se perderá. Tarda unos minutos; puedes seguir usando la app mientras tanto.',
        { titulo: '¿Traer los datos de producción?', ok: 'Sí, traerlos', peligro: true })) return;
      ev.target.disabled = true;
      const { data: r, error } = await db.functions.invoke('refrescar-pruebas', { body: {} });
      let res = r;
      if (error && error.context && typeof error.context.json === 'function') { try { res = await error.context.json(); } catch (e) {} }
      if (!res || !res.ok) {
        ev.target.disabled = false;
        toast((res && MOTIVO_REFRESCO[res.motivo]) || 'No se ha podido lanzar la copia' + (error && !res ? ': falta la función «refrescar-pruebas» en Supabase' : ''), true);
        return;
      }
      toast('Copia de producción en marcha: tarda unos minutos');
      estadoRefresco();
    };
  })(pintarFranjaPruebas);
  if ($('prreset')) pintarFranjaPruebas();
}
/* v2.134.0 · Portal del centro (diseño): en «Pedir reposición», la fila de un producto con unidades se marca en azul suave */
document.addEventListener('input', e => {
  const i = e.target.closest && e.target.closest('#ctprods [data-ctp]'); if (!i) return;
  const f = i.closest('.ctlin'); if (f) f.classList.toggle('con', (+i.value || 0) > 0);
});

// v2.135.0 · Menú lateral: «Configuración» (pie del menú) se marca como sección activa cuando se está en Configuración
function menuMarcarPie() { const b = $('mlcfg'); if (b) b.classList.toggle('activo', TAB === 'config'); }
ir = (orig => function (...a) { const r = orig.apply(this, a); menuMarcarPie(); setTimeout(menuMarcarPie, 0); return r; })(ir);

// v2.136.0 · Al cambiar de pantalla se cierra lo que va «en la página» (Diseño del PDF): en el móvil es una ventana y seguía
// abierta encima de la pantalla siguiente (Usuarios, Panel delcos…)
ir = (orig => function (...a) { const d = $('dlg'); if (d && d.open && (d.dataset.fija || d.dataset.depagina)) d.close(); return orig.apply(this, a); })(ir);


/* v2.137.0 · Entorno de pruebas sin franja (petición de Eric: tapaba la cabecera y no hace falta algo tan grande). Junto al logo, un
   indicador pequeño «Pruebas»; los botones «Traer los datos de producción» y «Volver a los datos de partida», con sus fechas y el
   estado de la copia, pasan a Organización → Entorno de pruebas. */
async function volverDatosPartida() {
  if (!await preguntar('Se borrará todo lo creado o cambiado en el entorno de pruebas y los datos volverán a como se copiaron de producción. No se puede deshacer.',
    { titulo: '¿Volver a los datos de partida?', ok: 'Sí, volver', peligro: true })) return;
  pantallaCarga('Volviendo a los datos de partida…');
  let { data: r, error } = await RPC_ORIG('pruebas_resetear_responsable', { p_confirmacion: 'RESTABLECER' });
  if (error && /pruebas_resetear_responsable|PGRST202|not find/i.test(error.message || '')) ({ data: r, error } = await RPC_ORIG('pruebas_resetear', { p_confirmacion: 'RESTABLECER' }));
  if (error || !r || !r.ok) {
    quitarCarga();
    toast(r && r.error === 'permiso' ? 'Solo la persona responsable del entorno puede hacerlo' : r && r.error === 'sin_maestro' ? 'Faltan los datos de partida' : 'No se ha podido: ' + ((error && error.message) || (r && r.error) || ''), true);
    return;
  }
  limpiarDatosLocales(); location.reload();
}
async function traerProduccion(ev) {
  if (!await preguntar('Se copiarán aquí los datos actuales de producción (producción no se toca) y pasarán a ser los nuevos datos de partida. Todo lo hecho en pruebas se perderá. Tarda unos minutos; puedes seguir usando la app mientras tanto.',
    { titulo: '¿Traer los datos de producción?', ok: 'Sí, traerlos', peligro: true })) return;
  if (ev && ev.target) ev.target.disabled = true;
  const { data: r, error } = await db.functions.invoke('refrescar-pruebas', { body: {} });
  let res = r;
  if (error && error.context && typeof error.context.json === 'function') { try { res = await error.context.json(); } catch (e) {} }
  if (!res || !res.ok) {
    if (ev && ev.target) ev.target.disabled = false;
    toast((res && MOTIVO_REFRESCO[res.motivo]) || 'No se ha podido lanzar la copia' + (error && !res ? ': falta la función «refrescar-pruebas» en Supabase' : ''), true);
    return;
  }
  toast('Copia de producción en marcha: tarda unos minutos');
  estadoRefresco();
}
async function pintarCfgPruebas() {
  const c = $('cfgcuerpo'); if (!c) return;
  c.innerHTML = `<div class="card">${skelCard('Cargando…')}</div>`;
  const [{ data: e }, { data: puedeR, error: eR }] = await Promise.all([
    RPC_ORIG_FROM('entorno_pruebas').select('*').eq('id', 1).maybeSingle(), RPC_ORIG('pruebas_puede_restablecer', {})]);
  if (!$('cfgcuerpo')) return;
  const fmt = x => x ? new Date(x).toLocaleString('es', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
  const permitido = puede('administrar') && (eR ? true : puedeR === true);
  c.innerHTML = `<div class="card" id="cfpruebas"><div class="fh"><div><h2>Entorno de pruebas</h2>
      <div class="sm">Una copia completa de la plataforma con su propia base de datos: nada de lo que hagas aquí afecta a los datos reales.</div></div></div>
    <div class="minis">
      <div><b>${fmt(e && e.maestro_guardado_en)}</b><span>Datos de partida (copia de producción)</span></div>
      <div><b>${fmt(e && e.ultimo_reset)}</b><span>Última vuelta a los datos de partida</span></div></div>
    <div class="sm" id="prrefresco" style="padding:0 16px"></div>
    ${permitido ? `<div class="acts" style="justify-content:flex-start;flex-wrap:wrap">
        <button type="button" class="btn" id="prtraer">⇣ Traer los datos de producción</button>
        <button type="button" class="btn sec" id="prreset">↺ Volver a los datos de partida</button></div>
      <p class="leer"><b>Traer los datos de producción</b> copia aquí los datos de hoy (producción solo se lee) y pasan a ser los nuevos datos de partida.
        <b>Volver a los datos de partida</b> deshace todo lo hecho en pruebas desde la última copia. En los dos casos se pierde lo hecho en pruebas.</p>`
      : '<p class="sm" style="padding:0 16px">Solo la persona responsable del entorno de pruebas puede traer los datos de producción o volver a los datos de partida.</p>'}</div>`;
  if ($('prtraer')) $('prtraer').onclick = traerProduccion;
  if ($('prreset')) $('prreset').onclick = volverDatosPartida;
  estadoRefresco();
}
(() => {
  const g = Object.getOwnPropertyDescriptor(PAGINAS.organizacion, 'tabs').get;
  Object.defineProperty(PAGINAS.organizacion, 'tabs', { get() { const t = g.call(this); return EN_PRUEBAS ? [...t, ['pruebas', 'Entorno de pruebas', () => pintarCfgPruebas()]] : t; }, configurable: true });
})();
if (EN_PRUEBAS) {
  pintarFranjaPruebas = function () {
    const f = $('franjapruebas'); if (f) f.remove();
    const logo = document.querySelector('.top .logo');
    if (!logo || $('indpruebas')) return;
    logo.insertAdjacentHTML('afterend', '<button type="button" id="indpruebas" class="indpruebas" title="Entorno de pruebas: nada de lo que hagas aquí afecta a los datos reales">Pruebas</button>');
    $('indpruebas').onclick = () => {
      if (puedeOrganizacion()) { PAG_TAB.organizacion = 'pruebas'; ir('organizacion'); }
      else toast('Entorno de pruebas: nada de lo que hagas aquí afecta a los datos reales');
    };
  };
  pintarFranjaPruebas();
}

// v2.138.0 · Pastilla «Pruebas» en el menú lateral: junto a la marca (desplegado) o como punto sobre el logo (plegado); sin menú
// lateral vuelve a la cabecera, detrás del logo
function colocarIndPruebas() {
  const p = $('indpruebas'); if (!p) return;
  const marca = document.body.classList.contains('menulat') && document.querySelector('nav.main .mlmarca');
  const casa = marca || document.querySelector('.top .logo');
  if (!casa) return;
  if (marca) { if (p.parentNode !== marca) marca.appendChild(p); }
  else if (p.previousElementSibling !== casa) casa.insertAdjacentElement('afterend', p);
}
montarMenuLateral = (orig => function (...a) { const r = orig.apply(this, a); colocarIndPruebas(); return r; })(montarMenuLateral);
colocarIndPruebas();


/* v2.139.0 · Arreglos rápidos de la lista de Eric (3/10/2026):
   - Menú «⋯» de la cita: solo gestionar la cita (hora, aplazar, confirmar, descartar); lo del registro va en «Registrar».
   - Pedidos, Oportunidades, Compras y Proveedores, cada uno con su entrada en el menú (antes, pestañas dentro de Pedidos).
   - «Por hacer» de pedidos: título que dice algo, cada persona elige qué avisos ve y descarta los sueltos; la administración puede
     fijar por rol los que son obligatorios (no se ocultan ni se descartan). */

// Menú «⋯» de la cita
menuCita = function (boton, c) {
  document.querySelectorAll('.tdmenu').forEach(m => m.remove());
  const abierta = CITA_ABIERTA.includes(c.estado);
  const ops = [
    abierta ? ['hora', c.hora ? 'Cambiar la hora' : 'Fijar una hora', ''] : null,
    abierta ? ['aplazar', 'Aplazar a otro día', 'Queda como aplazada y se crea la cita nueva'] : null,
    abierta && c.estado === 'Planificada' ? ['confirmar', 'Marcar como confirmada', 'Ya has confirmado la cita'] : null,
    abierta && c.estado === 'Confirmada' ? ['desconfirmar', 'Quitar la confirmación', ''] : null,
    abierta ? ['descartar', 'Descartar la cita', 'Ya no hace falta ir'] : null,
    abierta && c.fecha >= hoyISO() ? ['borrar', 'Eliminar la cita', 'Fue un error: desaparece de la agenda'] : null   // v2.273.0
  ].filter(Boolean);
  if (!ops.length) { toast('Esta cita ya está cerrada'); return; }
  const m = document.createElement('div');
  m.className = 'tdmenu'; m.__t = Date.now();
  m.innerHTML = ops.map(([k, t, s]) => `<button data-tdop="${k}" class="${k === 'descartar' || k === 'borrar' ? 'peligro' : ''}"><b>${esc(t)}</b>${s ? `<span>${esc(s)}</span>` : ''}</button>`).join('');
  document.body.appendChild(m);
  const r = boton.getBoundingClientRect();
  m.style.top = Math.min(window.innerHeight - m.offsetHeight - 10, r.bottom + 6) + 'px';
  m.style.left = Math.max(10, Math.min(window.innerWidth - m.offsetWidth - 10, r.right - m.offsetWidth)) + 'px';
  m.querySelectorAll('[data-tdop]').forEach(b => b.onclick = () => { m.remove(); accionCita(b.dataset.tdop, c); });
};

// Pedidos, Oportunidades, Compras y Proveedores: cada uno su entrada en el menú (por dentro, el mismo módulo con su sección)
const ALIAS_PEDIDOS = { oportunidades: 'llamadas', compras: 'compras', proveedores: 'proveedores' };
const TITULO_PEDSEC = { ventas: ['Pedidos', 'Pedidos de tus clientes, con sus unidades e importes'], llamadas: ['Oportunidades', 'Cada venta, se cierre con pedido o no, y por qué'],
  compras: ['Compras', 'Pedidos a proveedores y mercancía en camino'], proveedores: ['Proveedores', 'A quién compras y en qué condiciones'] };
let IR_DESDE_MENU = false;
document.addEventListener('click', e => {
  if (e.target.closest('nav.main [data-t], #bnav [data-t], [data-bm]')) { IR_DESDE_MENU = true; setTimeout(() => { IR_DESDE_MENU = false; }, 0); }
}, true);
function marcarPedsec() {
  if (TAB !== 'ventas') return;
  const alias = Object.keys(ALIAS_PEDIDOS).find(k => ALIAS_PEDIDOS[k] === pedsecVista()) || 'ventas';
  document.querySelectorAll('nav.main [data-t], #bnav [data-t]').forEach(x => x.setAttribute('aria-selected', String(x.dataset.t === alias)));
}
ir = (orig => function (t, ...a) {
  if (t in ALIAS_PEDIDOS) { PEDSEC = ALIAS_PEDIDOS[t]; const r = orig.call(this, 'ventas', ...a); marcarPedsec(); return r; }
  if (t === 'ventas' && IR_DESDE_MENU) PEDSEC = 'ventas';   // «Pedidos» del menú siempre abre los pedidos
  const r = orig.call(this, t, ...a);
  if (t === 'ventas') marcarPedsec();
  return r;
})(ir);
cargarVentas = (orig => async function (...a) {
  const r = await orig.apply(this, a);
  const v = $('v-ventas'), [t, d] = TITULO_PEDSEC[PEDSEC] || TITULO_PEDSEC.ventas;
  const h = v && v.querySelector('.saludo h1'); if (h && h.firstChild) h.firstChild.textContent = t;
  const f = v && v.querySelector('.saludo .fecha'); if (f) f.textContent = d;
  marcarPedsec();
  return r;
})(cargarVentas);
function menuPedidos2139() {
  const nav = document.querySelector('nav.main .in'); if (!nav || ES_MEDICO()) return;
  const ped = nav.querySelector('[data-t="ventas"]'); if (!ped) return;
  const ve = !ped.classList.contains('hide') && puedeModulo('ventas');
  let tras = ped;
  [['oportunidades', 'Oportunidades', ve && VE_TODO() && hayOportunidades()], ['compras', 'Compras', ve], ['proveedores', 'Proveedores', ve]].forEach(([t, txt, vis]) => {
    let b = nav.querySelector(`[data-t="${t}"]`);
    if (!b) { tras.insertAdjacentHTML('afterend', `<button data-t="${t}" aria-selected="false">${txt}</button>`); b = nav.querySelector(`[data-t="${t}"]`); }
    b.classList.toggle('hide', !vis);
    if (!b.closest('.mlbs')) tras = b;   // con el menú lateral, cada uno va en su bloque
  });
}
// Los botones se crean antes de que el menú lateral reparta los bloques (y se vuelve a mirar su permiso después)
aplicarPermisosMenu = (orig => function (...a) { try { menuPedidos2139(); } catch (e) {} const r = orig.apply(this, a); menuPedidos2139(); return r; })(aplicarPermisosMenu);
Object.assign(ICO_NAV, { oportunidades: 'phone', compras: 'clipboard-list', proveedores: 'building' });
(() => { const g = MENU_GRUPOS.find(x => x.id === 'ventas'); if (!g) return; ['proveedores', 'compras', 'oportunidades'].forEach(k => { if (!g.items.includes(k)) g.items.splice(g.items.indexOf('ventas') + 1, 0, k); }); })();
setTimeout(() => { try { menuPedidos2139(); } catch (e) {} }, 0);

// «Por hacer» de pedidos, configurable
const AVISOS_PED = [['pago', 'Pendientes de cobro', '💳'], ['paquete', 'Paquetes por preparar', '📦'], ['email_factura', 'Facturas por enviar', '🧾'], ['email_pago', 'Datos de pago por enviar', '✉️']];
async function guardarPrefsAvisos(avisos) {
  const prefs = Object.assign({}, (PERFIL && PERFIL.preferencias) || {}, { avisos_pedidos: avisos });
  const { data, error } = await db.rpc('guardar_preferencias', { p: prefs });
  if (error) { toast('No se ha podido guardar', true); return false; }
  PERFIL.preferencias = data || prefs; return true;
}
pintarOperativa = async function () {
  let c = $('operativa');
  if (!c) { const ref = $('vcuerpo'); if (!ref) return; ref.insertAdjacentHTML('beforebegin', '<div class="card" id="operativa"></div>'); c = $('operativa'); }
  const [{ data }, { data: aj }, { data: desc }] = await Promise.all([RPC_ORIG('operativa_pendiente', {}),
    db.from('ajustes').select('valor').eq('clave', 'avisos_pedidos').maybeSingle(), RPC_ORIG('mis_alertas_descartadas', {})]);
  if (!$('operativa')) return;
  const d = data || {}, oblig = (((aj && aj.valor) || {}).obligatorios || {})[PERFIL.rol] || [];
  const pref = ((PERFIL.preferencias || {}).avisos_pedidos) || {};
  const fuera = new Set((desc || []).map(x => x.clave));
  const vis = AVISOS_PED.filter(([k]) => oblig.includes(k) || pref[k] !== false);
  const de = k => (d[k] || []).filter(p => oblig.includes(k) || !fuera.has(`op:${k}:${p.id}`));
  const tot = vis.reduce((n, [k]) => n + de(k).length, 0);
  c.innerHTML = `<div class="fh"><h2>${tot ? `${num(tot)} ${tot === 1 ? 'aviso' : 'avisos'} de pedidos` : 'Pedidos al día'}</h2>
      <button type="button" class="btn sec" id="opcfg" aria-label="Elegir qué avisos ver" title="Elegir qué avisos ver">${svgIco(ICON_NOM.settings || '')}</button></div>
    ${!vis.length ? '<div class="sm" style="padding:0 16px 12px">Has ocultado todos los avisos de pedidos. Vuelve a elegirlos con el engranaje.</div>'
      : tot ? `<div class="opgrid">${vis.map(([k, t, ic]) => `<details class="opcol"><summary><b>${num(de(k).length)}</b> ${ic} ${t}</summary>
        <div class="lista">${de(k).slice(0, 30).map(p => `<div class="item opit" style="padding:6px 8px"><button type="button" class="tx" data-opped="${p.id}"><b>${esc(p.cliente)}</b>
          <span class="sm">${esc(p.numero || 'Sin número')} · ${fechaCorta(p.fecha)}${verImportes() ? ' · ' + eurI(p.total || 0) : ''}${p.forma_pago ? ' · ' + esc(p.forma_pago) : ''}</span></button>
          ${oblig.includes(k) ? '' : `<button type="button" class="x opx" data-opx="${k}|${p.id}" aria-label="Quitar este aviso" title="Quitar este aviso">✕</button>`}</div>`).join('') || '<div class="sm">Nada pendiente.</div>'}</div></details>`).join('')}</div>`
      : '<div class="vacio" style="padding:10px 16px">Nada pendiente: todo cobrado, paquetes preparados y correos enviados.</div>'}`;
  c.querySelectorAll('[data-opped]').forEach(b => b.onclick = () => verPedido(b.dataset.opped));
  c.querySelectorAll('[data-opx]').forEach(b => b.onclick = async () => {
    const [k, id] = b.dataset.opx.split('|'), p = (d[k] || []).find(x => x.id === id) || {};
    await db.rpc('descartar_alerta', { p_clave: `op:${k}:${id}`, p_dias: null, p_titulo: (AVISOS_PED.find(x => x[0] === k) || [])[1] || 'Aviso de pedido', p_detalle: `${p.cliente || ''} · ${p.numero || ''}` });
    pintarOperativa();
  });
  $('opcfg').onclick = () => configurarAvisosPedidos(oblig);
};
async function configurarAvisosPedidos(oblig) {
  const pref = ((PERFIL.preferencias || {}).avisos_pedidos) || {}, admin = puede('administrar');
  const { data: aj } = admin ? await db.from('ajustes').select('valor').eq('clave', 'avisos_pedidos').maybeSingle() : { data: null };
  const fij = ((aj && aj.valor) || {}).obligatorios || {}, roles = admin ? rolesNombres().filter(r => !rolPuede(r, 'portal_prescriptor')) : [];
  $('dbody').innerHTML = `<div class="fh"><div><h2>Avisos de pedidos</h2><div class="sm">Qué avisos quieres ver arriba en Pedidos</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="lista">${AVISOS_PED.map(([k, t, ic]) => `<label class="item" style="cursor:default"><input type="checkbox" data-avp="${k}" ${oblig.includes(k) || pref[k] !== false ? 'checked' : ''} ${oblig.includes(k) ? 'disabled' : ''}>
        <span class="tx"><b>${ic} ${t}</b>${oblig.includes(k) ? '<span class="sm">Obligatorio para tu rol</span>' : ''}</span></label>`).join('')}</div>
    ${admin ? `<h3 style="margin:14px 0 4px">Obligatorios por rol</h3><p class="sm">Los marcados no se pueden ocultar ni quitar.</p>
      <div class="dgrid-wrap"><table class="tabla avrol"><thead><tr><th>Rol</th>${AVISOS_PED.map(([, t]) => `<th>${t}</th>`).join('')}</tr></thead>
        <tbody>${roles.map(r => `<tr><td>${esc(r)}</td>${AVISOS_PED.map(([k]) => `<td style="text-align:center"><input type="checkbox" data-avr="${esc(r)}|${k}" ${(fij[r] || []).includes(k) ? 'checked' : ''} aria-label="${esc(r)}: obligatorio"></td>`).join('')}</tr>`).join('')}</tbody></table></div>` : ''}
    <div class="acts" style="justify-content:flex-end"><button class="btn sec" data-cerrar>Cancelar</button><button class="btn" id="avpok">Guardar</button></div>`;
  $('dlg').showModal();
  $('avpok').onclick = async () => {
    const av = {}; $('dbody').querySelectorAll('[data-avp]').forEach(x => { if (!x.disabled) av[x.dataset.avp] = x.checked; });
    if (!await guardarPrefsAvisos(av)) return;
    if (admin) {
      const ob = {}; $('dbody').querySelectorAll('[data-avr]:checked').forEach(x => { const [r, k] = x.dataset.avr.split('|'); (ob[r] = ob[r] || []).push(k); });
      const { data: r, error } = await db.rpc('guardar_ajuste', { p_clave: 'avisos_pedidos', p_valor: { obligatorios: ob } });
      if (error || (r && r.ok === false)) { toast('No se han podido guardar los obligatorios', true); return; }
    }
    $('dlg').close(); toast('Avisos guardados'); pintarOperativa();
  };
}
/* v2.140.0 · «Filtros y columnas» en la cabecera de cada pantalla, en la misma fila que la acción principal («+ Nueva venta»,
   «+ Nuevo producto»…), a su derecha (decisión de Eric, 3/10/2026: misma posición en todas las
   pantallas). Va el último por la derecha, para caer siempre en el mismo sitio aunque cambie la acción principal o no la haya. Antes iba en la barra de la tabla
   (v2.57.0) y en cada pantalla caía en un sitio distinto. */
ordenarBotones = function (sec) {
  // Cabecera: secundarios → acción principal → «Filtros y columnas» (el último: el mismo sitio en todas las pantallas)
  sec.querySelectorAll('.saludo .acts, #dircab .acts').forEach(acts => {
    const bs = [...acts.children].filter(b => b.matches('button, a.btn, select'));
    const vista = b => b.dataset && b.dataset.ag && b.dataset.ag !== 'nueva';
    const peso = b => (b.classList.contains('htbtn') || b.id === 'dirtools') ? 4
      : (b.matches('.btn:not(.sec)') && !b.classList.contains('icobtn') && !b.classList.contains('iniact') && !vista(b)) ? 3 : b.matches('select') ? 0 : 1;
    const orden = [...bs].sort((a, c) => peso(a) - peso(c));
    if (orden.some((b, i) => b !== bs[i])) orden.forEach(b => acts.appendChild(b));
    const dt = acts.querySelector(':scope > #dirtools'), h = acts.querySelector(':scope > .ai-hueco');
    if (dt && h && h.nextElementSibling !== dt) acts.insertBefore(h, dt);
    acts.querySelectorAll(':scope > .ai-dir').forEach(x => x.remove());
  });
};
const BARRA_TABLA_V257 = barraTabla;
barraTabla = function (sec) {
  // v2.142.0: también en el móvil (antes quedaba una fila casi vacía solo para el botón en Compras, Proveedores, Productos…)
  const b = sec.querySelector('.htbtn'), sal = sec.querySelector('.saludo');
  if (b && sal) {
    let acts = sal.querySelector(':scope > .acts');
    if (!acts) { sal.insertAdjacentHTML('beforeend', '<div class="acts htacts"></div>'); acts = sal.querySelector(':scope > .acts'); }
    if (!acts.classList.contains('htacts')) acts.classList.add('htacts');
    if (b.parentElement !== acts) {
      const antes = b.parentElement; b.classList.remove('aderecha'); acts.appendChild(b);
      if (antes && antes.classList.contains('tbarra') && !antes.children.length && !antes.textContent.trim()) antes.remove();
      else if (antes && antes.classList.contains('conbtn')) antes.classList.remove('conbtn');
    }
  }
  // Prescriptores: su «Filtros y columnas» (#dirtools) también va junto a «Crear nuevo» (en el móvil se queda junto a «Cerca de mí»)
  const dt = sec.id === 'v-directorio' && innerWidth >= 900 && $('dirtools'), dacts = document.querySelector('#dircab .acts');
  if (dt && dacts && dt.parentElement !== dacts) {
    dt.classList.remove('aderecha');
    // La ayuda «i» de la barra se pone delante de #dirtools si no hay ya una: un hueco oculto evita que aparezca en la cabecera
    dacts.insertAdjacentHTML('beforeend', '<span class="ai ai-hueco hide" aria-hidden="true"></span>');
    dacts.appendChild(dt);
  }
};

