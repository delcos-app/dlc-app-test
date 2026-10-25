


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

function aplicarPermisosMenuBase3(...a) { const r = aplicarPermisosMenuBase2.apply(this, a); menuPaginas2131(); franjaVista(); return r; }

// (v2.183.0: aquí iba la primera versión de entrarEnOrganizacion; se redefine entera más abajo)
setTimeout(() => { try { menuPaginas2131(); franjaVista(); } catch (e) {} }, 0);
// Iconos de las secciones nuevas (v2.131.0): Usuarios y roles con la llave de accesos y el panel de delcos con el escudo
Object.assign(ICO_NAV, { usuarios: 'key-round', delcos: 'shield' });
function montarMenuLateralBase() {
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

function montarMenuLateralBase2(...a) { const r = montarMenuLateralBase.apply(this, a); colocarIndPruebas(); return r; }
colocarIndPruebas();


/* v2.139.0 · Arreglos rápidos de la lista de Eric (3/10/2026):
   - Menú «⋯» de la cita: solo gestionar la cita (hora, aplazar, confirmar, descartar); lo del registro va en «Registrar».
   - Pedidos, Oportunidades, Compras y Proveedores, cada uno con su entrada en el menú (antes, pestañas dentro de Pedidos).
   - «Por hacer» de pedidos: título que dice algo, cada persona elige qué avisos ve y descarta los sueltos; la administración puede
     fijar por rol los que son obligatorios (no se ocultan ni se descartan). */


document.addEventListener('click', e => {
  if (e.target.closest('nav.main [data-t], #bnav [data-t], [data-bm]')) { IR_DESDE_MENU = true; setTimeout(() => { IR_DESDE_MENU = false; }, 0); }
}, true);
// Los botones se crean antes de que el menú lateral reparta los bloques (y se vuelve a mirar su permiso después)
function aplicarPermisosMenuBase4(...a) { try { menuPedidos2139(); } catch (e) {} const r = aplicarPermisosMenuBase3.apply(this, a); menuPedidos2139(); return r; }
Object.assign(ICO_NAV, { oportunidades: 'phone', compras: 'clipboard-list', proveedores: 'building' });
(() => { const g = MENU_GRUPOS.find(x => x.id === 'ventas'); if (!g) return; ['proveedores', 'compras', 'oportunidades'].forEach(k => { if (!g.items.includes(k)) g.items.splice(g.items.indexOf('ventas') + 1, 0, k); }); })();
setTimeout(() => { try { menuPedidos2139(); } catch (e) {} }, 0);

async function pintarOperativa() {
  let c = $('operativa');
  if (!c) { const ref = $('vcuerpo'); if (!ref) return; ref.insertAdjacentHTML('beforebegin', '<div id="operativa"></div>'); c = $('operativa'); }
  const [{ data }, { data: aj }] = await Promise.all([RPC_ORIG('operativa_pendiente', {}),
    db.from('ajustes').select('valor').eq('clave', 'avisos_pedidos').maybeSingle()]);
  c = $('operativa'); if (!c) return;
  c.className = 'pkop';
  document.querySelectorAll('#opcfg').forEach(x => x.remove());
  const d = data || {}, oblig = (((aj && aj.valor) || {}).obligatorios || {})[PERFIL.rol] || [];
  const pref = ((PERFIL.preferencias || {}).avisos_pedidos) || {};
  const vis = PK_TARJ.filter(([k]) => oblig.includes(k) || pref[k] !== false);
  const hoy = hoyISO(), dia = x => String(x.fecha || '').slice(0, 10);
  const barras = l => { const m = {}; l.forEach(x => { m[dia(x)] = (m[dia(x)] || 0) + 1; }); return [...Array(10)].map((_, i) => m[isoMas(hoy, i - 9)] || 0); };
  const antig = l => l.length ? Math.max(0, ...l.map(x => Math.round((new Date(hoy) - new Date(dia(x))) / 864e5))) : 0;
  const hace = n => n === 0 ? 'de hoy' : n === 1 ? 'de ayer' : `de hace ${num(n)} días`;
  const frase = (k, l) => {
    if (!l.length) return k === 'pago' ? 'Todo cobrado' : k === 'paquete' ? 'Todo preparado' : 'Todas enviadas';
    const ant = `el más antiguo, ${hace(antig(l))}`;
    if (k === 'pago' && verImportes()) return `<b>${eurI(l.reduce((a, x) => a + (+x.total || 0), 0))}</b> por cobrar · ${ant}`;
    return ant.charAt(0).toUpperCase() + ant.slice(1);
  };
  const gear = `<button type="button" class="pkcfg" id="opcfg" aria-label="Elegir qué avisos ver" title="Elegir qué avisos ver">${svgIco(ICON_NOM.settings || '')}</button>`;
  c.innerHTML = !vis.length
    ? `<div class="pkvacio">Has ocultado los avisos de pedidos. Vuelve a elegirlos con el engranaje. ${gear}</div>`
    : `<div class="pk">${vis.map(([k, f, t, ic]) => {
        const l = d[k] || [], b = barras(l), mx = Math.max(1, ...b), alta = k === 'pago' && l.length;
        return `<button type="button" class="pkt ${alta ? 'alta' : ''}" data-pk="${f}" aria-pressed="false" ${l.length ? '' : 'data-cero'}>
          <span class="pkfil">Filtrando</span><span class="pktt">${svgIco(ICON_NOM[ic] || ICON_NOM.info || '')} ${t}</span>
          <span class="pkn" data-v="${l.length}">${num(l.length)}</span><span class="pks">${frase(k, l)}</span>
          <span class="pkbars" aria-hidden="true">${b.map((n, i) => `<i class="${i === 9 ? 'u' : pkLibre(isoMas(hoy, i - 9)) ? 'fin' : ''}" style="height:${n ? Math.max(14, 100 * n / mx) : 6}%"></i>`).join('')}</span>
          <span class="pkdias">${b.map((n, i) => pkDia(isoMas(hoy, i - 9), n, i === 9)).join('')}</span>
          <span class="pklg">Entrada de los últimos 10 días</span></button>`; }).join('')}${gear}</div>`;
  c.querySelectorAll('[data-pk]').forEach(b => b.onclick = () => {
    const s = $('popf'); if (!s) return;
    s.value = s.value === b.dataset.pk ? '' : b.dataset.pk; s.dispatchEvent(new Event('change', { bubbles: true }));
    pkMarcar();
  });
  // El engranaje, junto a «Filtros y columnas» de la cabecera (si está a la vista)
  const hb = document.querySelector('#v-ventas .htbtn'), g = $('opcfg');
  if (hb && hb.offsetParent && g && vis.length) { g.className = 'btn sec pkcfg pkcfgcab'; hb.insertAdjacentElement('beforebegin', g); }
  $('opcfg').onclick = () => configurarAvisosPedidos(oblig);
  pkMarcar();
  pkContar([...c.querySelectorAll('.pkn[data-v]')], n => num(Math.round(n)));
}
/* v2.140.0 · «Filtros y columnas» en la cabecera de cada pantalla, en la misma fila que la acción principal («+ Nueva venta»,
   «+ Nuevo producto»…), a su derecha (decisión de Eric, 3/10/2026: misma posición en todas las
   pantallas). Va el último por la derecha, para caer siempre en el mismo sitio aunque cambie la acción principal o no la haya. Antes iba en la barra de la tabla
   (v2.57.0) y en cada pantalla caía en un sitio distinto. */
function barraTabla(sec) {
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
}

