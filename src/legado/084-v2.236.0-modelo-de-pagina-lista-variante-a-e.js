/* ============================================================
   v2.236.0 · Modelo de página «Lista» (variante A elegida por Eric): cabecera con la acción principal y «⋯»,
   indicadores que filtran, barra con buscador, filtros rápidos, «Filtros», «Columnas» y el recuento, tabla con su pie
   y tarjetas en el móvil. Al llegar no se tapa la pantalla: se ve el esqueleto con la misma forma. Primero en
   Contactos (directorio) y Clientes; se monta encima de lo que ya pintan sus funciones, sin cambiar su lógica.
   ============================================================ */
const plIco = (...n) => svgIco(n.map(k => ICON_NOM[k] || ICON_EMOJI[k]).find(Boolean) || '');
const PL_KPI = {};   // indicadores por pantalla: {t, epoca, datos}
const PL = {
  directorio: {
    que: () => TT('medico', 'p', '', 'l', 'l'),
    nuevo: () => $('nuevoBtn'),
    textoNuevo: () => 'Añadir ' + TT('medico', 's', '', 'l', 'l'),
    cuerpo: () => $('lista'), tabla: () => $('tabla'), pie: () => $('dirpag'), cuenta: () => $('cuenta'),
    conDatos: el => !!el.querySelector('.trow, .vacio'),
    rapidos: [['ftipo', 'Tipo'], ['fest', 'Estado'], ['fcom', ''], ['fprov', 'Provincia'], ['fmuni', 'Municipio'], ['fesp', 'Especialidad']],
    q: () => F.q || '',
    buscarQ: v => { F.q = v; buscar(true); },
    buscaTxt: () => 'Buscar cuentas',
    nKpis: 5,   // v2.304.0: el esqueleto con los mismos cinco huecos
    // v2.296: un campo personalizado vaciado se quedaba como clave y contaba como filtro sin verse en el panel
    activos: () => ['tipo', 'prov', 'muni', 'esp', 'est', 'rep', 'com'].filter(k => F[k]).length + ['urg', 'mios', 'sin'].filter(k => F[k]).length + Object.values(F.campos || {}).filter(filtroConValor).length,
    quitar: () => {
      Object.assign(F, { q: '', tipo: '', prov: '', muni: '', esp: '', est: '', urg: false, mios: false, sin: false, com: '', rep: '', campos: {} });
      ['ftipo', 'fest', 'fprov', 'fmuni', 'fesp', 'fcom', 'frep', 'q'].forEach(id => { if ($(id)) $(id).value = ''; });
      const t = $('tools'); if (t && t.classList.contains('abierto') && HERR_CTX === 'directorio') t.classList.remove('abierto');
      cargarFiltros(); buscar(true);
    },
    filtros: () => { const b = $('dirtools'); if (b) b.click(); },
    columnas: () => abrirColumnas(),
    mapa: () => $('mapaBtn'),
    mas: () => [['dircalidad', 'Calidad del dato'], ['cercaBtn', 'Cerca de mí']],
    kpis: async () => {
      const t = x => RPC_ORIG('buscar_cuentas', { q: null, lim: 1, desplaz: 0, ...x }).then(r => (r.data && r.data.total) || 0, () => 0);
      // v2.304.0: profesionales y centros por separado (antes una sola cifra con el nombre de los profesionales que contaba también los centros)
      const [pro, cen, urg, sin, mios] = await Promise.all([t({ f_tipo: 'Persona' }), t({ f_tipo: 'Centro' }), t({ f_urgentes: true }), t({ f_sin_visitar: true }), t({ f_mios: true })]);
      return [{ k: 'Persona', t: TT('medico', 'p', '', 'l', 'C'), n: pro, s: 'en total' }, { k: 'Centro', t: 'Centros', n: cen, s: 'en total' }, { k: 'urg', t: 'Urgentes', n: urg, s: 'marcados como urgentes' },
        { k: 'sin', t: 'Sin visitar nunca', n: sin, s: 'todavía sin ' + TT('visita', 'p', '', 'l', 'l') }, { k: 'mios', t: 'De mi cartera', n: mios, s: 'asignados a ti' }];
    },
    kpiOn: k => k === 'Persona' || k === 'Centro' ? F.tipo === k : !!F[k],
    kpiPulsar: k => { if (k === 'Persona' || k === 'Centro') { F.tipo = F.tipo === k ? '' : k; if ($('ftipo')) $('ftipo').value = F.tipo; } else F[k] = !F[k]; buscar(true); },
    card: null   // las tarjetas del directorio las pone filaTabla (abajo), con los datos de la ficha
  },
  pacientes: {
    que: () => 'clientes',
    nuevo: () => $('pacnuevo'),
    cuerpo: () => $('paclista'), tabla: () => $('paclista'), pie: () => $('pacpag'), cuenta: () => $('paccuenta'),
    conDatos: el => !!el.querySelector('.dgrid, .vacio'),
    rapidos: [['pactipo', 'Tipo'], ['pacped', 'Pedidos'], ['pacmun', 'Población']],
    q: () => PAC.q || '',
    buscarQ: v => { const i = $('pacq'); if (i) { i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); } else { PAC.q = v; PAC.pagina = 0; listaPacientes(); } },
    activos: () => (PAC.tipo ? 1 : 0) + (PAC.pedidos ? 1 : 0) + (PAC.municipio ? 1 : 0) + (PAC.medico ? 1 : 0) + Object.keys(PAC.campos || {}).length,
    filtros: () => { const b = document.querySelector('#v-pacientes .htbtn'); if (b) b.click(); },
    columnas: () => { const b = document.querySelector('#v-pacientes .htbtn'); if (!b) return; b.click(); setTimeout(() => { const c = $('tools') && $('tools').querySelector('.t2abrir'); if (c) c.click(); }, 80); },
    mapa: () => null,
    mas: () => [],
    kpis: async () => {
      const t = x => RPC_ORIG('clientes_lista', { q: null, p_medico: null, lim: 1, desplaz: 0, p_tipo: null, p_pedidos: null, p_municipio: null, ...x }).then(r => (r.data && r.data.total) || 0, () => 0);
      const [tot, con, sin, emp] = await Promise.all([t({}), t({ p_pedidos: 'con' }), t({ p_pedidos: 'sin' }), t({ p_tipo: 'Empresa' })]);
      return [{ k: 'tot', t: 'Clientes', n: tot, s: 'en total' }, { k: 'con', t: 'Con pedidos', n: con, s: 'han comprado alguna vez' },
        { k: 'sin', t: 'Sin pedidos', n: sin, s: 'todavía sin compras' }, { k: 'emp', t: 'Empresas', n: emp, s: 'centros, tiendas y otras' }];
    },
    kpiOn: k => k === 'tot' ? !PAC.tipo && !PAC.pedidos : k === 'emp' ? PAC.tipo === 'Empresa' : PAC.pedidos === k,
    kpiPulsar: k => {
      if (k === 'tot') { PAC.tipo = ''; PAC.pedidos = ''; }
      else if (k === 'emp') PAC.tipo = PAC.tipo === 'Empresa' ? '' : 'Empresa';
      else PAC.pedidos = PAC.pedidos === k ? '' : k;
      if ($('pactipo')) $('pactipo').value = PAC.tipo || ''; if ($('pacped')) $('pacped').value = PAC.pedidos || '';
      PAC.pagina = 0; listaPacientes();
    },
    // Tarjeta del móvil a partir de la fila de la tabla: nombre, población y teléfono, y el tipo a la derecha
    card: dr => { const c = dr.children, tx = i => c[i] ? c[i].textContent.trim() : '';
      return { a: tx(0), b: [tx(5), tx(3)].filter(x => x && x !== '—').join(' · '), c: c[1] ? c[1].innerHTML : '' }; }
  }
};

// Directorio: cada fila lleva su tarjeta (oculta en el ordenador) con el nombre, centro · municipio y el estado
filaTabla = (orig => function (m) {
  const h = orig(m), i = h.lastIndexOf('</button>'); if (i < 0) return h;
  const l2 = [m.centro_nombre, m.municipio].filter(Boolean).join(' · ');
  return h.slice(0, i) + `<span class="plcard"><b>${m.urgente ? '<i class="plurg" aria-label="Urgente"></i>' : ''}${esc(m.nombre || '')}</b><span class="plc2">${esc(l2)}</span><span class="plc3">${celda(m, 'estado_comercial')}</span></span>` + h.slice(i);
})(filaTabla);


function plKpisHtml(tab) {
  const c = PL[tab], k = PL_KPI[tab];
  if (!k || !k.datos) return Array(c.nKpis || 4).fill('').map(() => `<div class="plk plcarga"><span class="plkt"><i class="plsk" style="width:46%"></i></span><b><i class="plsk plskv"></i></b><small><i class="plsk" style="width:70%"></i></small></div>`).join('');
  return k.datos.map(d => `<button type="button" class="plk ${c.kpiOn(d.k) ? 'on' : ''}" data-plk="${d.k}"><span class="plkt">${esc(d.t)}</span><b data-pln="${d.n}">${num(d.n)}</b><small>${esc(d.s)}</small></button>`).join('');
}
function plCargarKpis(tab) {
  const c = PL[tab], k = PL_KPI[tab], ep = typeof RC_EPOCA !== 'undefined' ? RC_EPOCA : 0;
  if (k && (k.pend || (k.datos && k.epoca === ep && Date.now() - k.t < 60000))) return;
  PL_KPI[tab] = Object.assign(k || {}, { pend: true });
  c.kpis().then(datos => {
    const nuevo = !PL_KPI[tab].datos;
    Object.assign(PL_KPI[tab], { datos, t: Date.now(), epoca: ep, pend: false });
    const box = document.querySelector(`#v-${tab} .plkpis`); if (!box) return;
    box.innerHTML = plKpisHtml(tab);
    if (nuevo && !matchMedia('(prefers-reduced-motion: reduce)').matches) box.querySelectorAll('b[data-pln]').forEach(b => {
      const n = +b.dataset.pln, t0 = performance.now(); if (!n) return;
      const paso = () => { const p = Math.min(1, (performance.now() - t0) / 700); b.textContent = num(Math.round(n * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(paso); };
      paso();
    });
  }, () => { PL_KPI[tab].pend = false; });
}

// Sin nombre propio, el filtro rápido usa la etiqueta de su campo (así no se escribe aquí el nombre de un rol)
const plEtiqueta = id => { const l = document.querySelector(`label[for="${id}"]`); return l ? l.textContent.trim() : ''; };
// v2.242.0: aquí iba la primera versión de plToolHtml (se redefine entera más abajo)

// Monta (o vuelve a ajustar) la plantilla sobre lo que haya pintado la pantalla. Se puede llamar las veces que haga falta.
// v2.242.0: aquí iba la primera versión de plSync (se redefine entera más abajo)

// Un observador por pantalla: cada vez que la pantalla se repinta, la plantilla se ajusta antes de que se vea
const PL_OBS = {};
Object.keys(PL).forEach(plObservar);

// Al llegar, sin cargador que tape la pantalla: se ve la plantilla con su esqueleto
revelar = (orig => function (el, max, desde) {
  const tab = el && el.id && el.id.slice(2);
  if (el && PL[tab] && el.matches('main > section')) { el.classList.remove('preparando'); plSync(tab); llegar(el); return; }
  return orig(el, max, desde);
})(revelar);

// Los indicadores se piden aparte (RPC_ORIG): las listas «solo la última» descartarían las consultas paralelas
// Clics de la barra, los indicadores y el menú «⋯»
// Un filtro de campo personalizado cuenta si tiene algo (texto, lista o rango)
const filtroConValor = v => v != null && v !== '' && !(Array.isArray(v) && !v.length) && !(typeof v === 'object' && !Array.isArray(v) && !Object.values(v).some(x => x != null && x !== ''));
const normalizar = typeof quitarAcentos === 'function' ? (s => quitarAcentos(String(s || '').toLowerCase())) : (s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''));
document.addEventListener('click', e => {
  if (!e.target.closest('.plpop') && !e.target.closest('.plchip, .plmas')) plCerrarPop();
  const sec = e.target.closest('main > section.plantilla'); if (!sec) return;
  const tab = sec.id.slice(2), c = PL[tab]; if (!c) return;
  const k = e.target.closest('[data-plk]'); if (k) { c.kpiPulsar(k.dataset.plk); plSync(tab); return; }
  const r = e.target.closest('[data-plr]');
  if (r) {
    if (document.querySelector('.plpop') && r.classList.contains('abierto')) { plCerrarPop(); r.classList.remove('abierto'); return; }
    sec.querySelectorAll('.plchip.abierto').forEach(x => x.classList.remove('abierto'));
    const s = $(r.dataset.plr); if (!s) return;
    r.classList.add('abierto');
    plPop(r, [...s.options].map((o, i) => ({ t: i === 0 ? (o.text || 'Todos') : o.text, on: s.selectedIndex === i, fn: () => { r.classList.remove('abierto'); s.selectedIndex = i; s.dispatchEvent(new Event('change', { bubbles: true })); } })));
    return;
  }
  if (e.target.closest('.plmas')) {
    const items = c.mas().filter(([id]) => $(id) && !$(id).classList.contains('hide')).map(([id, t]) => ({ t, fn: () => $(id).click() }));
    if (items.length) plPop(e.target.closest('.plmas'), items); return;
  }
  if (e.target.closest('.plfil')) { c.filtros(); return; }
  if (e.target.closest('.plquitar') && c.quitar) { c.quitar(); plSync(tab); return; }
  if (e.target.closest('.plcol')) { c.columnas(); return; }
  if (e.target.closest('.plmapa')) { const m = c.mapa(); if (m) m.click(); setTimeout(() => plSync(tab), 50); return; }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.querySelector('.plpop')) plCerrarPop(); });
addEventListener('scroll', () => { if (document.querySelector('.plpop')) plCerrarPop(); }, { passive: true });
// Buscador de la barra
let PL_TQ;
document.addEventListener('input', e => {
  const i = e.target.closest('main > section.plantilla .plqi'); if (!i) return;
  const tab = i.closest('section').id.slice(2);
  clearTimeout(PL_TQ); PL_TQ = setTimeout(() => PL[tab].buscarQ(i.value.trim()), 300);
});
// Si el modo mapa cambia el botón, la barra lo refleja
barraCuentas = (orig => function () { orig(); const b = document.querySelector('#v-directorio .plmapa'), m = $('mapaBtn'); if (b && m && b.dataset.modo !== (m.dataset.modo || '')) { b.dataset.modo = m.dataset.modo || ''; b.innerHTML = m.innerHTML; b.title = m.title; b.setAttribute('aria-label', m.title); } })(barraCuentas);


