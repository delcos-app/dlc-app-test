// pantallas/manual.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

async function cargarManualPaso1() {
  const q = $('manq'); if (!q) return;
  q.insertAdjacentHTML('afterend', '<div class="manres hide" id="manres"></div>');
  const quitar = s => String(s).replace(/<[^>]+>/g, '');
  const norm = s => quitar(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const indice = [];
  MANUAL.forEach(s => {
    indice.push({ sec: s.id, mod: s.t, txt: s.para });
    s.hacer.forEach(h => indice.push({ sec: s.id, mod: s.t, txt: h[1] }));
    (s.config || []).forEach(c => indice.push({ sec: s.id, mod: s.t, txt: 'Dónde se configura: ' + c }));
    const ay = AYUDA[s.id]; if (ay && ay[2]) ay[2].forEach(x => indice.push({ sec: s.id, mod: s.t, txt: quitar(x) }));
  });
  FAQ.forEach(([p, r]) => indice.push({ sec: null, mod: 'Pregunta frecuente', txt: p + ' — ' + r }));
  q.oninput = () => {
    const t = norm(q.value.trim()), res = $('manres');
    document.querySelectorAll('.mancard').forEach(c => c.classList.remove('hide'));
    if (t.length < 2) { res.classList.add('hide'); return; }
    const palabras = t.split(/\s+/);
    const hits = indice.filter(x => palabras.every(p => norm(x.txt + ' ' + x.mod).includes(p))).slice(0, 12);
    res.classList.remove('hide');
    res.innerHTML = hits.length ? hits.map(h => {
      let txt = esc(quitar(h.txt)); palabras.forEach(p => { txt = txt.replace(new RegExp('(' + p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>'); });
      return `<button class="manhit" ${h.sec ? `data-mansec2="${h.sec}"` : ''}><span class="mhm">${esc(h.mod)}</span><span>${txt}</span></button>`;
    }).join('') : `<div class="manhit">No hay resultados para «${esc(q.value)}». Prueba con otra palabra: cita, ruta, pedido, factura…</div>`;
    res.querySelectorAll('[data-mansec2]').forEach(b => b.onclick = () => { res.classList.add('hide'); const c = document.querySelector(`.mancard[data-mansec="${b.dataset.mansec2}"]`); if (c) c.click(); });
  };
}

async function cargarManualPaso2() {
  const v = $('v-manual');
  v.onclick = e => {
    const m = e.target.closest('[data-mira]'); if (!m) return;
    const i = [...v.querySelectorAll('.manpaso')].indexOf(m.closest('.manpaso'));
    const pasos = PRIMEROS_PASOS[['cartera', 'televenta'].find(c => puede(c))] || PRIMEROS_PASOS.default;
    if (i >= 0 && pasos[i]) infoManual(null, pasos[i]);
  };
  v.querySelectorAll('.mancard').forEach(c => c.onclick = () => infoManual(c.dataset.mansec));
  if ($('mandet')) $('mandet').remove();
  const res = $('manres');
  if (res) res.addEventListener('click', e => { const b = e.target.closest('[data-mansec2]'); if (b) { e.stopImmediatePropagation(); res.classList.add('hide'); infoManual(b.dataset.mansec2); } }, true);
}

async function cargarManualPaso3() {
  document.querySelectorAll('.mancard').forEach(c => {
    const mod = MOD_DE_MANUAL[c.dataset.mansec]; if (!mod || planIncluye(mod)) return;
    const p = planMinimo(mod), pill = c.querySelector('.pill');
    if (pill) { pill.className = 'pill p-plan'; pill.innerHTML = `${svgIco(ICON_NOM.lock)} Incluido en el plan ${esc(p ? p.nombre : 'Premium')}`; }
    c.classList.add('bloq'); c.onclick = () => avisoPlan(mod);
  });
}

async function cargarManualBase() {
  const v = $('v-manual');
  const accesoTxt = s => s.a ? NIVEL_TXT[nivelDe2(s.a)] : (puede('administrar') ? 'Completo' : '—');
  const nivelSec = s => s.a ? nivelDe2(s.a) : (puede('administrar') ? 3 : (s.id === 'roles' || s.id === 'permisos') ? 1 : 0);
  const modulos = Object.keys(MODULO_AREA).filter(puedeModulo).length;
  const pasos = PRIMEROS_PASOS[['cartera', 'televenta'].find(c => puede(c))] || PRIMEROS_PASOS.default;
  v.innerHTML = `
    <div class="manhero">
      <div><h1>Manual de uso</h1><p>Todo lo que puedes hacer en la plataforma, explicado para tu perfil.</p>
        <div class="manchips"><span>👤 ${esc(PERFIL.nombre)}</span><span>🎫 ${esc(PERFIL.rol)}</span><span>🧩 ${num(modulos)} módulos disponibles</span></div></div>
      <div class="manbusca"><input id="manq" type="search" placeholder="¿Qué quieres hacer? Aplazar una cita, bloquear un día, emitir una factura…" aria-label="Buscar en el manual"></div>
    </div>
    <h2 class="mantit">Primeros pasos</h2>
    <div class="manpasos">${pasos.map(([ic, t, d, m], i) => `<button class="manpaso" data-mira="${m}"><span class="mpn">${i + 1}</span><span class="mpi">${ic}</span><b>${esc(t)}</b><span>${esc(d)}</span></button>`).join('')}</div>
    <h2 class="mantit">Por módulo</h2>
    <div class="mangrid">${MANUAL.map(s => {
      const n = nivelSec(s);
      return `<button class="mancard ${n ? '' : 'bloq'}" data-mansec="${s.id}"><span class="mci">${ICONOS_MANUAL[s.id] || '📘'}</span>
        <b>${esc(s.t)}</b><span class="mcd">${esc(s.para)}</span><span class="pill ${n >= 2 ? 'p-est' : n === 1 ? 'p-per' : 'p-anu'}">${n ? 'Tu acceso: ' + accesoTxt(s) : 'Sin acceso'}</span></button>`;
    }).join('')}</div>
    <div id="mandet"></div>
    <h2 class="mantit">Preguntas frecuentes</h2>
    <div class="card manfaqs">${FAQ.map(([q, r]) => `<details class="manfaq"><summary>${esc(q)}</summary><p>${esc(r)}</p></details>`).join('')}</div>`;
  const abrir = id => {
    const s = MANUAL.find(x => x.id === id); if (!s) return;
    const n = nivelSec(s), ay = AYUDA[id === 'visitas' ? 'agenda' : id === 'centros' ? 'directorio' : id] || null;
    v.querySelectorAll('.mancard').forEach(c => c.classList.toggle('on', c.dataset.mansec === id));
    $('mandet').innerHTML = `<div class="card mandet"><div class="manh"><h2 style="padding:0">${ICONOS_MANUAL[id] || '📘'} ${esc(s.t)}</h2>
        ${MODULO_AREA[id] && puedeModulo(id) ? `<button class="btn sec" data-mira="${id}">Abrir ${esc(s.t)}</button>` : ''}</div>
      <p>${esc(s.para)}</p>
      <div class="mancols"><div><h3>Qué se puede hacer</h3><ul class="manlist">${s.hacer.map(([req, txt]) => `<li class="${n >= req ? 'si' : 'no'}"><span>${n >= req ? '✓' : '🔒'}</span><span>${esc(txt)}${n >= req ? '' : ` <em>· requiere ${esc(s.a ? (AREAS.find(x => x[0] === s.a) || [])[1] || s.t : 'Administración')} en «${NIVEL_TXT[req]}»</em>`}</span></li>`).join('')}</ul></div>
        ${ay && ay[2] && ay[2].length ? `<div><h3>Cómo funciona</h3><ul class="manlist">${ay[2].map(x => `<li><span>•</span><span>${x}</span></li>`).join('')}</ul></div>` : ''}</div>
      ${s.config.length ? `<h3>Dónde se configura</h3><div class="mancfg">${s.config.map(x => `<span>⚙ ${esc(x)}</span>`).join('')}</div>` : ''}</div>`;
    $('mandet').scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  v.querySelectorAll('[data-mansec]').forEach(b => b.onclick = () => abrir(b.dataset.mansec));
  v.onclick = e => { const m = e.target.closest('[data-mira]'); if (m && puedeModulo(m.dataset.mira)) { if (m.dataset.mira === 'config') CFG_SEC = 'prefs'; ir(m.dataset.mira); } };
  $('manq').oninput = e => {
    const q = e.target.value.trim().toLowerCase();
    if (!q) { v.querySelectorAll('.mancard').forEach(c => c.classList.remove('hide')); return; }
    let primera = null;
    v.querySelectorAll('.mancard').forEach(c => {
      const s = MANUAL.find(x => x.id === c.dataset.mansec), ay = AYUDA[s.id] || [];
      const txt = [s.t, s.para, ...s.hacer.map(h => h[1]), ...s.config, ...(ay[2] || [])].join(' ').toLowerCase();
      const ok = txt.includes(q); c.classList.toggle('hide', !ok); if (ok && !primera) primera = s.id;
    });
    v.querySelectorAll('.manfaq').forEach(d => { const ok = d.textContent.toLowerCase().includes(q); d.open = ok; });
    if (primera) abrir(primera);
  };
}

function infoManual(id, paso) {
  const s = MANUAL.find(x => x.id === id);
  if (!s && !paso) return;
  if (paso) {
    const [ic, t, d, m] = paso;
    $('dbody').innerHTML = `<div class="fh"><div><h2>${ic} ${esc(t)}</h2><div class="sm">Primeros pasos</div></div><button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
      <p>${esc(d)}</p>${(MANUAL.find(x => x.id === m) || {}).para ? `<p class="sm">${esc(MANUAL.find(x => x.id === m).para)}</p>` : ''}
      <div class="acts" style="justify-content:flex-end"><button class="btn sec" data-cerrar>Ahora no</button>
        ${m === 'config' || puedeModulo(m) ? `<button class="btn" id="mangoir">Llévame</button>` : ''}</div>`;
    $('dlg').showModal();
    if ($('mangoir')) $('mangoir').onclick = () => { $('dlg').close(); if (m === 'config') CFG_SEC = 'prefs'; ir(m); };
    return;
  }
  const n = s.a ? nivelDe2(s.a) : (puede('administrar') ? 3 : 1);
  const ay = AYUDA[id === 'visitas' ? 'agenda' : id === 'centros' ? 'directorio' : id] || null;
  const destino = MODULO_AREA[id] || ['manual', 'config'].includes(id) ? id : null;
  const cfg = CFG_DE_MODULO[id];
  $('dbody').innerHTML = `<div class="fh"><div><h2>${ICONOS_MANUAL[id] || '📘'} ${esc(s.t)}</h2><div class="sm">${esc(s.para)}</div></div><button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <h3 class="mansub">Qué puedes hacer</h3><ul class="manlist">${s.hacer.map(([req, txt]) => `<li class="${n >= req ? 'si' : 'no'}"><span>${n >= req ? '✓' : '🔒'}</span><span>${esc(txt)}</span></li>`).join('')}</ul>
    ${ay && ay[2] && ay[2].length ? `<h3 class="mansub">Cómo funciona</h3><ul class="manlist">${ay[2].map(x => `<li><span>•</span><span>${x}</span></li>`).join('')}</ul>` : ''}
    ${s.config.length ? `<h3 class="mansub">Dónde se configura</h3><div class="mancfg">${s.config.map(x => `<span>⚙ ${esc(x)}</span>`).join('')}</div>` : ''}
    <div class="acts" style="justify-content:flex-end;flex-wrap:wrap;margin-top:14px"><button class="btn sec" data-cerrar>Cerrar</button>
      ${cfg && (puede('administrar') || ['horario', 'kpis', 'prefs'].includes(cfg)) ? `<button class="btn sec" id="manircfg">Ir a su configuración</button>` : ''}
      ${destino && destino !== 'manual' && (destino === 'config' || puedeModulo(destino)) ? `<button class="btn" id="manirmod">Abrir ${esc(s.t)}</button>` : ''}</div>`;
  $('dlg').showModal();
  if ($('manirmod')) $('manirmod').onclick = () => { $('dlg').close(); ir(destino); };
  if ($('manircfg')) $('manircfg').onclick = () => { $('dlg').close(); CFG_SEC = cfg; ir('config'); };
}

function guardarVocabManual() {
  try {
    localStorage.setItem('delcos-manual', JSON.stringify({ empresa: nombreApp(),
      terminos: Object.fromEntries(Object.keys(TERM_DEF).map(k => [k, terminoDe(k)])) }));
  } catch (e) {}
}

async function volverDelManual() {
  const v = MANUAL_VUELTA; MANUAL_VUELTA = null;
  if (!v) { ir('inicio'); return; }
  ir(v.tab);
  // Espera a que la pantalla esté pintada (sin «preparando») y tenga alto suficiente para volver al mismo punto
  const fin = Date.now() + 4000;
  while (Date.now() < fin) {
    await new Promise(res => setTimeout(res, 120));
    const sec = $('v-' + v.tab) || document.querySelector('main > section:not(.hide)');
    const listo = !document.querySelector('main > section.preparando') && (!sec || !sec.classList.contains('cargando'));
    if (listo && document.documentElement.scrollHeight - innerHeight >= v.y - 2) break;
  }
  window.scrollTo(0, v.y);
}

const MOD_DE_MANUAL = { agenda: 'agenda', rutas: 'rutas', directorio: 'directorio', ventas: 'ventas', facturacion: 'facturacion', analitica: 'analitica', productos: 'productos', pacientes: 'pacientes', seguimiento: 'seguimiento' };

/* v2.204.0 · Manual nuevo: un libro aparte en manual/ (decisiones de Eric: se abre desde la app, fotos y vídeos de la empresa de demostración,
   con el vocabulario de cada empresa, y por capítulos; el primero, «Tu día»).
   - «Manual de uso» abre el libro en otra pestaña; antes deja en el navegador las palabras de la empresa (médico, visita, paciente) y su nombre.
   - Cada pantalla lleva un «?» junto al título que abre el manual en su capítulo (los que aún no están escritos abren la portada).
   - El portal del profesional sigue con su manual de siempre hasta que tenga capítulo. */
const MANUAL_ANCLA = { inicio: 'inicio', agenda: 'agenda', rutas: 'rutas', ciclo: 'ciclo', cirugias: 'cirugias', directorio: 'directorio', seguimiento: 'calidad',
  duplicados: 'duplicados', eventos: 'eventos', pacientes: 'clientes', ventas: 'pedidos', oportunidades: 'oportunidades', compras: 'compras', proveedores: 'proveedores', concursos: 'concursos', parque: 'parque', productos: 'productos',
  facturacion: 'facturacion', analitica: 'analitica', config: 'ajustes', perfil: 'perfil', empresa: 'organizacion', plan: 'plan', organizacion: 'organizacion', usuarios: 'usuarios' };

/* v2.211.0 · El manual, dentro de la app (decisión de Eric, opción B: sin abrir otra pestaña y con el mismo peso).
   - «Manual de uso» y el «?» de cada pantalla llevan a la pantalla «manual», que enseña el libro (manual/index.html?app=1) en un marco a todo el
     ancho; el libro solo se descarga al abrirlo, capítulo a capítulo. Si ya se está en el manual, el «?» solo mueve el libro a su sección.
   - El portal del médico sigue con su manual de siempre (cargarManual original).
   - window.MANUAL_ULTIMA guarda la última dirección pedida (la usan las pruebas). */
let MANUAL_DESTINO = '';

/* v2.224.0 · Volver desde el manual al punto exacto (aviso de Eric: al pulsar un «?» y llegar al manual faltaba una flecha para volver).
   - Al entrar en el manual desde otra pantalla se guarda dónde estaba (MANUAL_VUELTA: pantalla y desplazamiento); la pestaña de cada página,
     el apartado de Configuración y el día de la Agenda ya se recuerdan solos (PAG_TAB, CFG_KEY, AG_FECHA).
   - La cabecera del manual lleva «‹ Volver a …» (#manvolver): vuelve a esa pantalla y, cuando ha terminado de pintarse, al mismo punto. */
let MANUAL_VUELTA = null;

/* cargarManual: la parte base y, en orden, cada paso que se le añade (antes eran 3 capas separadas). */
async function cargarManualBase2() {
  await cargarManualBase();
  await cargarManualPaso1();
  await cargarManualPaso2();
  await cargarManualPaso3();
}

async function cargarManualBase3(...a) {
  await cargarManualBase2(...a);
  const v = $('v-manual'); return;   // el índice lateral se retiró
  const tit = [...v.querySelectorAll('h2.mantit')];
  if (tit.length < 2) return;
  tit.forEach((h, i) => { h.id = h.id || 'mant' + i; });
  v.classList.add('conindice');
  v.insertAdjacentHTML('afterbegin', `<nav class="manindice"><b>En esta página</b>${tit.map(h => `<a href="#${h.id}" data-manir="${h.id}">${esc(h.textContent)}</a>`).join('')}</nav>`);
  v.querySelectorAll('[data-manir]').forEach(a => a.onclick = e => { e.preventDefault(); const h = $(a.dataset.manir); scrollTo({ top: h.getBoundingClientRect().top + scrollY - 140, behavior: 'smooth' }); });
}

async function cargarManualBase4(...a) {
  if (ES_MEDICO()) return cargarManualBase3.apply(this, a);
  const v = $('v-manual'); if (!v) return;
  guardarVocabManual();
  const url = 'manual/index.html?app=1' + (MANUAL_DESTINO ? '#' + MANUAL_DESTINO : ''); MANUAL_DESTINO = '';
  v.innerHTML = `<div class="saludo"><div><h1>Manual de uso</h1><div class="fecha">Todo lo que puedes hacer con delcos, paso a paso, con fotos y vídeos</div></div></div>
    <iframe id="manlibro" class="manlibro" title="Manual de uso" src="${url}"></iframe>`;
}

async function cargarManualBase5(...a) {
  if (!ES_IOS || ES_MEDICO()) return cargarManualBase4.apply(this, a);
  guardarVocabManual();
  const url = 'manual/index.html' + (MANUAL_DESTINO ? '#' + MANUAL_DESTINO : ''); MANUAL_DESTINO = '';
  window.MANUAL_ULTIMA = url;
  location.href = url;
}

async function cargarManual(...a) {
  const r = await cargarManualBase5.apply(this, a);
  const h = document.querySelector('#v-manual .saludo');
  if (h && MANUAL_VUELTA && !$('manvolver')) {
    h.insertAdjacentHTML('afterbegin', `<button type="button" class="manvuelta" id="manvolver"><b aria-hidden="true">‹</b> Volver a ${esc(nombrePantalla(MANUAL_VUELTA.tab))}</button>`);
    $('manvolver').onclick = () => volverDelManual();
  }
  return r;
}

function abrirManual(ancla) {
  guardarVocabManual();
  MANUAL_DESTINO = ancla || '';
  window.MANUAL_ULTIMA = 'manual/index.html' + (ancla ? '#' + ancla : '');
  const f = $('manlibro');
  if (TAB === 'manual' && f) { try { f.contentWindow.location.hash = ancla || 'portada'; } catch (e) {} return; }
  ir('manual');
}
