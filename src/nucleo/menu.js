// nucleo/menu.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

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

// Aviso con el nombre al pasar el ratón por un icono (barra plegada)
function menuTip(b) {
  let t = $('mltip');
  if (!b || !document.body.classList.contains('menupleg') || !document.body.classList.contains('menulat')) { if (t) t.classList.remove('ver'); return; }
  if (!t) { document.body.insertAdjacentHTML('beforeend', '<div id="mltip" role="tooltip"></div>'); t = $('mltip'); }
  const r = b.getBoundingClientRect();
  t.textContent = b.dataset.tip || ''; t.style.top = (r.top + r.height / 2) + 'px'; t.style.left = (r.right + 10) + 'px'; t.classList.add('ver');
}

function movNombre(t) {
  const b = document.querySelector(`nav.main [data-t="${t}"]`); if (!b) return t;
  const x = txTexto(b); return ((x && x.get()) || b.textContent).replace('Pronto', '').trim();
}

function movDisponibles() {
  const vistos = new Set();
  return [...document.querySelectorAll('nav.main [data-t]')].filter(x => {
    const t = x.dataset.t;
    if (vistos.has(t) || x.classList.contains('hide') || x.disabled || x.classList.contains('bloq') || x.classList.contains('mlplan') || MENU_FUERA.includes(t)) return false;
    vistos.add(t); return true;
  }).map(x => x.dataset.t).sort((x, y) => movOrden(x) - movOrden(y));
}

function movOrden(t) {   // como el menú del ordenador: Tu día, Cartera, Ventas…
  let l = []; try { l = menuGrupos().flatMap(g => g.items); } catch (e) {}
  const i = l.indexOf(t); return i < 0 ? 999 : i;
}

function movBarra() {
  const disp = movDisponibles(), p = menuPrefs().barra;
  let l = (Array.isArray(p) && p.length ? p : MOV_BARRA_DEF).filter(t => disp.includes(t) && t !== 'inicio');
  if (disp.includes('inicio')) l.unshift('inicio');   // v2.337.0: Inicio siempre el primero
  l = l.slice(0, 4);
  if (!l.length) l = MOV_BARRA_DEF.filter(t => disp.includes(t));
  return l;
}

function movPersonalizar() {
  // v2.337.0 (Eric): agrupadas: primero la barra de abajo, después «Más» y al final las ocultas. Al cambiar una de grupo va directa a su
  // grupo (al final; a la barra, si está llena, la última pasa a ser la primera de «Más»). Se ordenan arrastrando (dedo o ratón, por el
  // asa ⠿; se puede soltar también en otro grupo) o con las flechas, dentro de su grupo. Inicio, siempre la primera de la barra.
  const disp = movDisponibles(), p = menuPrefs(), FIJA = disp.includes('inicio') ? 'inicio' : null;
  const barra0 = movBarra().filter(t => t !== FIJA), resto = movMasOrden(disp.filter(t => !barra0.includes(t) && t !== FIJA));
  const G = { barra: [...barra0], mas: resto.filter(t => !(p.ocultos || []).includes(t)), oculta: resto.filter(t => (p.ocultos || []).includes(t)) };
  const MAXB = FIJA ? 3 : 4;
  const GRUPOS = [['barra', 'Barra de abajo', 'Hasta 4'], ['mas', 'En «Más»', ''], ['oculta', 'Ocultas', 'Tampoco salen en el menú del ordenador']];
  const ZONAS = [['barra', 'Barra'], ['mas', 'Más'], ['oculta', 'Oculta']];
  const ajustar = () => { while (G.barra.length > MAXB) G.mas.unshift(G.barra.pop()); };
  const fila = (t, z, i, n) => `<div class="movp movp-${z}" data-mpt="${t}">
      <span class="movpdrag" data-mpd="${t}" aria-hidden="true" title="Arrastrar">⠿</span>
      <span class="movpmv"><button type="button" class="kmv" data-mpm="-1|${t}" aria-label="Subir" ${i === 0 ? 'disabled' : ''}>↑</button><button type="button" class="kmv" data-mpm="1|${t}" aria-label="Bajar" ${i === n - 1 ? 'disabled' : ''}>↓</button></span>
      <span class="movpico">${ICO_MOD[t] || '•'}</span><span class="movpn">${esc(movNombre(t))}</span>
      <div class="segs" role="group" aria-label="Dónde va">${ZONAS.map(([k, x]) => `<button type="button" data-mpz="${k}|${t}" class="${z === k ? 'on' : ''}">${x}</button>`).join('')}</div></div>`;
  const pinta = () => {
    $('dlg2body').innerHTML = `<div class="fh"><div><h2>Personalizar menú</h2></div><button class="x" data-cerrar2 aria-label="Cerrar">✕</button></div>
      <p class="sm">Arrastra por ⠿ (o usa las flechas) para cambiar el orden. Si pasas una pantalla a otro grupo, se coloca sola al final de ese grupo.</p>
      ${GRUPOS.map(([z, n, x]) => `<div class="movpg"><h3>${n} <span class="sm">· ${G[z].length + (z === 'barra' && FIJA ? 1 : 0)}${x ? ' · ' + x : ''}</span></h3>
        ${z === 'barra' && FIJA ? `<div class="movp movp-barra movpfijo"><span class="movpico">${ICO_MOD[FIJA] || '•'}</span><span class="movpn">${esc(movNombre(FIJA))}</span><span class="sm">Siempre la primera</span></div>` : ''}
        <div class="movpl" data-mpg="${z}">${G[z].map((t, i) => fila(t, z, i, G[z].length)).join('') || '<div class="movpvac sm">Suelta aquí una pantalla</div>'}</div></div>`).join('')}
      <div class="acts"><button type="button" class="btn sec" id="movpdef">Restablecer</button><button type="button" class="btn" id="movpok">Guardar</button></div>`;
  };
  pinta();
  const d = $('dlg2'), cuerpo = $('dlg2body');
  const grupoDe = t => Object.keys(G).find(z => G[z].includes(t));
  const clic = async e => {
    const mv = e.target.closest('[data-mpm]'), zn = e.target.closest('[data-mpz]');
    if (mv) {
      const [dir, t] = mv.dataset.mpm.split('|'), l = G[grupoDe(t)], i = l.indexOf(t), j = i + +dir;
      if (j < 0 || j >= l.length) return;
      [l[i], l[j]] = [l[j], l[i]]; pinta(); return;
    }
    if (zn) {
      const [z, t] = zn.dataset.mpz.split('|'), de = grupoDe(t);
      if (z === de) return;
      if (de === 'barra' && !FIJA && G.barra.length <= 1) { toast('La barra de abajo necesita al menos una pantalla', true); return; }
      G[de] = G[de].filter(x => x !== t);
      if (z === 'barra' && G.barra.length >= MAXB) G.mas.unshift(G.barra.pop());
      G[z].push(t); pinta(); return;
    }
    if (e.target.closest('#movpdef')) {
      G.barra = MOV_BARRA_DEF.filter(t => disp.includes(t) && t !== FIJA); G.mas = disp.filter(t => !G.barra.includes(t) && t !== FIJA); G.oculta = []; pinta(); return;
    }
    const ok = e.target.closest('#movpok'); if (!ok) return;
    const ocultos = [...new Set([...(p.ocultos || []).filter(t => !disp.includes(t)), ...G.oculta])];
    const barra = FIJA ? [FIJA, ...G.barra] : [...G.barra];
    const prefs = Object.assign({}, PERFIL.preferencias || {}, { menu: Object.assign({}, menuPrefs(), { barra, mas: [...G.mas, ...G.oculta], ocultos }) });
    ok.disabled = true;
    const { data, error } = await db.rpc('guardar_preferencias', { p: prefs });
    ok.disabled = false;
    if (error) { toast('No se ha podido guardar el menú', true); return; }
    PERFIL.preferencias = data || prefs;
    d.close();
    pintarBnav(); MENU_FIRMA = ''; try { montarMenuLateral(); } catch (er) {}
    toast('Menú guardado');
  };
  // Arrastrar con el dedo o el ratón (eventos de puntero: el arrastrar del navegador no funciona con el dedo)
  let arr = null;
  const abajo = e => {
    const h = e.target.closest('[data-mpd]'); if (!h) return;
    const row = h.closest('.movp'); e.preventDefault();
    const r = row.getBoundingClientRect();
    arr = { row, dy: e.clientY - r.top, id: e.pointerId, h };
    arr.hueco = document.createElement('div'); arr.hueco.className = 'movphueco'; arr.hueco.style.height = r.height + 'px';
    row.before(arr.hueco);
    row.classList.add('movparr'); row.style.width = r.width + 'px'; row.style.top = r.top + 'px'; row.style.left = r.left + 'px';
    try { h.setPointerCapture(e.pointerId); } catch (er) {}
  };
  const mueve = e => {
    if (!arr || e.pointerId !== arr.id) return;
    arr.row.style.top = (e.clientY - arr.dy) + 'px';
    const filas = [...cuerpo.querySelectorAll('.movpl > .movp:not(.movparr), .movpl > .movpvac')];
    const destino = filas.find(f => { const r = f.getBoundingClientRect(); return e.clientY < r.top + r.height / 2; });
    if (destino) destino.before(arr.hueco);
    else { const ls = cuerpo.querySelectorAll('.movpl'); ls[ls.length - 1].appendChild(arr.hueco); }
    const sc = d.getBoundingClientRect(); if (e.clientY < sc.top + 60) d.scrollTop -= 12; else if (e.clientY > sc.bottom - 60) d.scrollTop += 12;
  };
  const suelta = e => {
    if (!arr || e.pointerId !== arr.id) return;
    const { row, hueco } = arr; arr = null;
    hueco.replaceWith(row); row.classList.remove('movparr'); row.style.width = row.style.top = row.style.left = '';
    const t = row.dataset.mpt;
    cuerpo.querySelectorAll('.movpl').forEach(l => { G[l.dataset.mpg] = [...l.querySelectorAll(':scope > .movp')].map(x => x.dataset.mpt); });
    if (!FIJA && !G.barra.length) { Object.keys(G).forEach(z => { G[z] = G[z].filter(x => x !== t); }); G.barra = [t]; toast('La barra de abajo necesita al menos una pantalla', true); }
    ajustar(); pinta();
  };
  const evs = [['click', clic], ['pointerdown', abajo], ['pointermove', mueve], ['pointerup', suelta], ['pointercancel', suelta]];
  evs.forEach(([n, f]) => cuerpo.addEventListener(n, f));
  d.addEventListener('close', () => evs.forEach(([n, f]) => cuerpo.removeEventListener(n, f)), { once: true });
  d.showModal();
}

// Orden de «Más»: el que eligió la persona y, detrás, lo nuevo en el orden del menú
function movMasOrden(l) {
  const o = menuPrefs().mas || [];
  return [...l].sort((x, y) => { const a = o.indexOf(x), b = o.indexOf(y); return (a < 0 ? 900 + movOrden(x) : a) - (b < 0 ? 900 + movOrden(y) : b); });
}

function aplicarPermisosMenuPaso1() {
  document.querySelectorAll('nav.main [data-t]').forEach(b => {
    const t = b.dataset.t; if (!(t in MODULO_AREA)) return;
    const bloqueado = puedeModuloV2400(t) && !planIncluye(t);
    b.classList.toggle('bloq', bloqueado);
    if (bloqueado) { b.classList.remove('hide'); if (!b.querySelector('.cand')) b.insertAdjacentHTML('beforeend', '<span class="cand">🔒</span>'); }
    else { const c = b.querySelector('.cand'); if (c) c.remove(); }
  });
}

function aplicarPermisosMenuPaso2() {
 iconosMenu();
}

function aplicarPermisosMenuPaso3() {
 ordenarMenu(); const c = document.querySelector('nav.main [data-t="seguimiento"]'); if (c) c.classList.add('hide');
}

function aplicarPermisosMenuBase() {
  document.querySelectorAll('nav.main [data-t]').forEach(b => {
    if (b.dataset.t in MODULO_AREA) b.classList.toggle('hide', !puedeModulo(b.dataset.t));
  });
  if (typeof pintarBnav === 'function') pintarBnav();
}

function ordenarCabeceraMovil(sec) {
  if (!ES_MOVIL() || !sec) return;
  const sal = sec.querySelector(':scope > .saludo'); if (!sal || sal.dataset.movil) return;
  const acts = sal.querySelector('.acts'); if (!acts) return;
  sal.dataset.movil = '1';
  const hijos = [...acts.children];
  // Acción principal «+ …» como botón flotante
  const principal = hijos.find(b => b.tagName === 'BUTTON' && !b.classList.contains('sec') && /^\s*\+/.test(b.textContent));
  if (principal) {
    principal.classList.add('fab'); principal.setAttribute('aria-label', principal.textContent.replace('+', '').trim());
    // v2.95.0: el «+» es el icono de la biblioteca, no un carácter
    principal.dataset.txt = principal.textContent.replace('+', '').trim(); principal.innerHTML = svgIco(ICON_NOM.plus);
    sec.appendChild(principal);
  }
  // El resto, como fila de controles compactos del mismo tamaño
  // Se mantiene la fila aunque quede vacía: otras partes añaden controles después (vista de agenda, equipo…)
  acts.classList.add('chips'); [...acts.children].forEach(b => b.classList.add('chip'));
}

function ordenarMenu() {
  const nav = document.querySelector('nav.main .in') || document.querySelector('nav.main'); if (!nav) return;
  ORDEN_MENU.forEach(t => { const b = nav.querySelector(`:scope > [data-t="${t}"]`); if (b) nav.appendChild(b); });
  const cal = nav.querySelector('[data-t="seguimiento"]'); if (cal) cal.classList.add('hide', 'fuera');
  const dir = nav.querySelector('[data-t="directorio"]');
  if (dir) [...dir.childNodes].forEach(n => { if (n.nodeType === 3 && /Directorio/.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace('Directorio', `${TT('medico', 'p', '', 'l', 'C')}`); });
}

function candadoSecciones() {
  Object.keys(PLAN_SECCIONES).forEach(t => document.querySelectorAll(`nav.main [data-t="${t}"], .bmasgrid [data-bm="${t}"]`).forEach(b => {
    const bloq = !planIncluyeSeccion(t);
    b.classList.toggle('bloq', bloq);
    const c = b.querySelector('.cand');
    if (bloq && !c && b.matches('nav.main [data-t]')) b.insertAdjacentHTML('beforeend', '<span class="cand">🔒</span>');
    if (!bloq && c) c.remove();
  }));
}

// «Personalizar menú»: candado, interruptor apagado y bloqueado, y la cuenta «N de M» sin lo que no entra
function personalizarCandados() {
  const caja = $('mlpanel'); if (!caja) return;
  caja.querySelectorAll('.mlpi[data-k]').forEach(f => {
    const b = document.querySelector(`#nav button[data-t="${f.dataset.k}"]`); if (!fueraDePlan(b)) return;
    f.classList.add('off', 'fueraplan'); f.title = `No está incluido en tu plan ${PLAN_NOMBRE()}`;
    const v = f.querySelector('[data-vk]'); if (v) { v.checked = false; v.disabled = true; }
    if (!f.querySelector('.mlpcand')) f.querySelector('.mlpn').insertAdjacentHTML('afterend', `<span class="mlpcand" aria-label="No incluido en tu plan"></span>`);
  });
  caja.querySelectorAll('.mlpg').forEach(g => {
    const fs = [...g.querySelectorAll('.mlpi[data-k]')], c = g.querySelector('.mlpcnt');
    if (c) c.textContent = `${fs.filter(f => !f.classList.contains('off')).length} de ${fs.filter(f => !f.classList.contains('fueraplan')).length}`;
  });
}

function aplicarNombresMenu() {
  const mn = menuNombres();
  document.querySelectorAll('nav.main [data-t], #bnav [data-t], .bmasgrid [data-bm]').forEach(b => {
    const t = b.dataset.t || b.dataset.bm; if (!t || t === 'directorio' || /^pd-/.test(t)) return;
    const x = txTexto(b); if (!x) return;
    if (!b.dataset.txdef) b.dataset.txdef = x.get();
    const n = mn[t] || b.dataset.txdef;
    if (x.get() !== n) x.set(n);
  });
  // El título de la pantalla abierta
  const t = typeof TAB !== 'undefined' ? TAB : null, b = t && document.querySelector(`nav.main [data-t="${t}"]`);
  if (t && t !== 'directorio' && b && b.dataset.txdef) {
    const h = document.querySelector(`#v-${t} .saludo h1, #v-${t} .pagcab h1`) || (t === 'ventas' && document.querySelector('#v-ventas .saludo h1'));
    const tn = h && [...h.childNodes].find(x => x.nodeType === 3 && x.nodeValue.trim());
    const n = mn[t] || b.dataset.txdef;
    if (tn && (tn.nodeValue.trim() === b.dataset.txdef || Object.values(mn).includes(tn.nodeValue.trim())) && tn.nodeValue.trim() !== n) tn.nodeValue = tn.nodeValue.replace(tn.nodeValue.trim(), n);
  }
}

/* ============================================================
   v2.338.0 · Ventanas completas en el móvil (D-024; petición de Eric, 20/10/2026): #dlg, #dlg2 y #ficha ocupan toda la pantalla menos el
   menú de abajo, sin esquinas y con su alto final desde que se abren (antes el pedido crecía en blanco mientras cargaba). --bnavh es el
   alto del menú de abajo, medido.
   ============================================================ */
function medirBnav() {
  const b = $('bnav'), h = b && getComputedStyle(b).display !== 'none' ? Math.round(b.getBoundingClientRect().height) : 0;
  document.documentElement.style.setProperty('--bnavh', h + 'px');
}

/* v2.343.0 · El «+» flotante del móvil vuelve a la cabecera al pasar a tamaño de ordenador (aviso de Eric: «+ Añadir médico» se
   quedaba debajo de la tabla tras usar el simulador de móvil o estrechar la ventana sin recargar). */
function fabAOrdenador() {
  if (ES_MOVIL()) return;
  document.querySelectorAll('main > section .fab[data-txt], main > section .fab[data-plfab], main > section > button[data-plfab], main > section > button[data-txt]').forEach(f => {
    const sec = f.closest('main > section'), acts = sec && sec.querySelector(':scope > .saludo .acts'); if (!acts) return;
    const txt = f.dataset.txt || f.getAttribute('aria-label') || 'Añadir';
    f.classList.remove('fab', 'plfuera'); delete f.dataset.plfab; delete f.dataset.txt;
    f.innerHTML = plIco('plus') + ' ' + esc(txt.replace(/^\s*\+\s*/, ''));
    acts.appendChild(f);
  });
}

const ORDEN_MENU = ['inicio', 'agenda', 'rutas', 'directorio', 'ventas', 'pacientes', 'productos', 'facturacion', 'analitica', 'informe'];

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

const menuPrefs = () => ((typeof PERFIL !== 'undefined' && PERFIL && PERFIL.preferencias) || {}).menu || {};

const menuEscritorio = () => innerWidth >= 900;

const menuPlegado = () => { try { const v = localStorage.getItem('dlc-menu-plegado'); if (v === '1' || v === '0') return v === '1'; } catch (e) {} return innerWidth < MENU_PLEGAR_BAJO; };

let MENU_FIRMA = '';

// (v2.183.0: aquí iba la primera versión de menuPersonalizar; se redefine entera más abajo)
// Se monta al arrancar y se rehace si cambian los botones (permisos, módulos, portal), el tamaño de la pantalla o la sesión
let MENU_RAF = 0;

const menuRehacer = () => { if (MENU_RAF) return; MENU_RAF = requestAnimationFrame(() => { MENU_RAF = 0; montarMenuLateral(); }); };

const menuNombres = () => (AJUSTES && AJUSTES.menu_nombres) || {};

/* ============================================================
   v2.335.0 · Menú (peticiones de Eric, 20/10/2026)
   - «Usuarios» fuera del menú (está en Configuración → Equipo → Usuarios): en el menú de escritorio y en «Más» del móvil.
   - Móvil: «Personalizar menú» en «Más» (movPersonalizar): qué pantallas van en la barra de abajo (hasta 4; preferencias.menu.barra)
     y cuáles salen en «Más» (las mismas que se ocultan en el menú de escritorio: preferencias.menu.ocultos). Lo oculto no sale en «Más».
   ============================================================ */
const MOV_BARRA_DEF = ['inicio', 'agenda', 'rutas', 'directorio'];

const MENU_FUERA = ['usuarios'];

let FAB_RZ = 0;
