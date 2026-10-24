


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

// (v2.183.0: aquí iba la primera versión de entrarEnOrganizacion; se redefine entera más abajo)
setTimeout(() => { try { menuPaginas2131(); franjaVista(); } catch (e) {} }, 0);
// Iconos de las secciones nuevas (v2.131.0): Usuarios y roles con la llave de accesos y el panel de delcos con el escudo
Object.assign(ICO_NAV, { usuarios: 'key-round', delcos: 'shield' });
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
document.addEventListener('mouseover', e => { const b = e.target.closest && e.target.closest('nav.main [data-tip]'); menuTip(b || null); });
if ($('nav')) new MutationObserver(menuRehacer).observe($('nav'), { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
addEventListener('resize', menuRehacer);
if ($('app')) new MutationObserver(menuRehacer).observe($('app'), { attributes: true, attributeFilter: ['class'] });
menuRehacer();


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

ir = (orig => function (...a) { const r = orig.apply(this, a); menuMarcarPie(); setTimeout(menuMarcarPie, 0); return r; })(ir);

// v2.136.0 · Al cambiar de pantalla se cierra lo que va «en la página» (Diseño del PDF): en el móvil es una ventana y seguía
// abierta encima de la pantalla siguiente (Usuarios, Panel delcos…)
ir = (orig => function (...a) { const d = $('dlg'); if (d && d.open && (d.dataset.fija || d.dataset.depagina)) d.close(); return orig.apply(this, a); })(ir);


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

document.addEventListener('click', e => {
  if (e.target.closest('nav.main [data-t], #bnav [data-t], [data-bm]')) { IR_DESDE_MENU = true; setTimeout(() => { IR_DESDE_MENU = false; }, 0); }
}, true);
ir = (orig => function (t, ...a) {
  if (t in ALIAS_PEDIDOS) { PEDSEC = ALIAS_PEDIDOS[t]; const r = orig.call(this, 'ventas', ...a); marcarPedsec(); return r; }
  if (t === 'ventas' && IR_DESDE_MENU) PEDSEC = 'ventas';   // «Pedidos» del menú siempre abre los pedidos
  const r = orig.call(this, t, ...a);
  if (t === 'ventas') marcarPedsec();
  return r;
})(ir);
// Los botones se crean antes de que el menú lateral reparta los bloques (y se vuelve a mirar su permiso después)
aplicarPermisosMenu = (orig => function (...a) { try { menuPedidos2139(); } catch (e) {} const r = orig.apply(this, a); menuPedidos2139(); return r; })(aplicarPermisosMenu);
Object.assign(ICO_NAV, { oportunidades: 'phone', compras: 'clipboard-list', proveedores: 'building' });
(() => { const g = MENU_GRUPOS.find(x => x.id === 'ventas'); if (!g) return; ['proveedores', 'compras', 'oportunidades'].forEach(k => { if (!g.items.includes(k)) g.items.splice(g.items.indexOf('ventas') + 1, 0, k); }); })();
setTimeout(() => { try { menuPedidos2139(); } catch (e) {} }, 0);

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

