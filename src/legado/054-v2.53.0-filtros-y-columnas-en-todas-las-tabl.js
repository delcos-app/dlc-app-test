/* ============================================================
   v2.53.0 · Filtros y columnas en todas las tablas, columna de
   acceso en Prescriptores y páginas propias de Perfil, Empresa y Plan
   ============================================================ */

/* ---------------- componente común: «Filtros y columnas» ---------------- */

// Columnas: se quitan de la rejilla conservando las proporciones del resto
function htAplicarColumnas(g) {
  const tipo = htTipo(g), ocultas = htOcultas(tipo);
  if (!g.dataset.colsBase) g.dataset.colsBase = getComputedStyle(g).getPropertyValue('--cols').trim();
  const pistas = []; let prof = 0, act = '';
  for (const ch of g.dataset.colsBase) { if (ch === '(') prof++; if (ch === ')') prof--; if (ch === ' ' && !prof) { if (act) pistas.push(act); act = ''; } else act += ch; }
  if (act) pistas.push(act);
  if (!pistas.length) return;
  g.style.setProperty('--cols', pistas.filter((_, i) => !ocultas.includes(i)).join(' '));
  if (ocultas.length) g.style.minWidth = 'auto';
  g.querySelectorAll(':scope > .dh, :scope > .dr').forEach(f => [...f.children].forEach((c, i) => c.classList.toggle('htno', ocultas.includes(i))));
}
// Filtros automáticos por columna (columnas con pocos valores distintos) y búsqueda dentro de la tabla
// v2.242.0: aquí iba la primera versión de htAplicarFiltros (se redefine entera más abajo)
function htActivos(sec) {
  const g = sec.querySelector('.dgrid'); const st = g ? HT_ESTADO[htTipo(g)] || {} : {};
  let n = Object.values(st.facetas || {}).filter(Boolean).length + (st.texto ? 1 : 0);
  sec.querySelectorAll('.htpanel .htpropios select').forEach(s => { if (s.selectedIndex > 0) n++; });
  return n;
}
function htPintarPanel(sec) {
  const panel = sec.querySelector('.htpanel'); if (!panel) return;
  const g = sec.querySelector('.dgrid');
  const zona = panel.querySelector('.htauto'); zona.innerHTML = '';
  if (g) {
    const tipo = htTipo(g), st = HT_ESTADO[tipo] = HT_ESTADO[tipo] || { texto: '', facetas: {} };
    const cab = [...(g.querySelector(':scope > .dh') || { children: [] }).children].map(c => c.textContent.trim());
    const filas = [...g.querySelectorAll(':scope > .dr')];
    const facetas = cab.map((nombre, i) => {
      const vals = [...new Set(filas.map(f => (f.children[i] || {}).textContent ? f.children[i].textContent.trim() : '').filter(Boolean))];
      return vals.length > 1 && vals.length <= 15 && nombre ? { i, nombre, vals: vals.sort() } : null;
    }).filter(Boolean);
    const ocultas = htOcultas(tipo);
    zona.innerHTML = `
      <div class="htbloque"><h4>Buscar en la tabla</h4><input type="search" class="httexto" value="${esc(st.texto || '')}" placeholder="Cualquier dato de la tabla"></div>
      ${facetas.length ? `<div class="htbloque"><h4>Filtrar por columna</h4><div class="htfacetas">${facetas.map(f => `<label><span>${esc(f.nombre)}</span><select data-htf="${f.i}"><option value="">Todos</option>${f.vals.map(v => `<option ${st.facetas[f.i] === v ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select></label>`).join('')}</div></div>` : ''}
      ${cab.filter(Boolean).length > 2 ? `<div class="htbloque"><h4>Columnas</h4><div class="htcols">${cab.map((n, i) => n ? `<label class="opt"><input type="checkbox" data-htc="${i}" ${ocultas.includes(i) ? '' : 'checked'} ${i === 0 ? 'disabled' : ''}> ${esc(n)}</label>` : '').join('')}</div></div>` : ''}
      <div class="acts" style="margin:0;justify-content:flex-end"><button class="btn sec dang" type="button" data-htlimpiar>${svgIco(ICON_NOM.x)} Eliminar filtros</button></div>`;
    zona.querySelector('.httexto').oninput = e => { st.texto = e.target.value; htAplicarFiltros(g); htContador(sec); };
    zona.querySelectorAll('[data-htf]').forEach(s => s.onchange = () => { st.facetas[s.dataset.htf] = s.value; htAplicarFiltros(g); htContador(sec); });
    zona.querySelectorAll('[data-htc]').forEach(c => c.onchange = () => {
      const o = new Set(htOcultas(tipo)); c.checked ? o.delete(+c.dataset.htc) : o.add(+c.dataset.htc);
      localStorage.setItem('ht-cols-' + tipo, JSON.stringify([...o])); htAplicarColumnas(g);
    });
    zona.querySelector('[data-htlimpiar]').onclick = () => {
      HT_ESTADO[tipo] = { texto: '', facetas: {} };
      panel.querySelectorAll('.htpropios select').forEach(s => { if (s.selectedIndex > 0) { s.selectedIndex = 0; s.dispatchEvent(new Event('change', { bubbles: true })); } });
      htAplicarFiltros(g); htPintarPanel(sec); htContador(sec);
    };
  }
}
function htPreparar(sec) {
  const id = sec.id.replace('v-', '');
  if (id === 'directorio') { const f = sec.querySelector('.panel > .filtros'); if (f) f.classList.add('hide'); return; }
  // v2.87.0: en la configuración de facturación no hay tablas que filtrar
  if (id === 'facturacion' && typeof FSEC !== 'undefined' && FSEC !== 'facturas') return;
  const g = sec.querySelector('.dgrid'), propios = HT_FILTROS[id] ? document.querySelector(HT_FILTROS[id]) : null;
  if (!g && !propios) return;
  let panel = sec.querySelector('.htpanel');
  if (!panel) {
    const ref = sec.querySelector('.subnav') || sec.querySelector('.saludo');
    let acts = sec.querySelector('.saludo .acts');
    if (!acts && sec.querySelector('.saludo')) { sec.querySelector('.saludo').insertAdjacentHTML('beforeend', '<div class="acts"></div>'); acts = sec.querySelector('.saludo .acts'); }
    if (!ref || !acts) return;
    ref.insertAdjacentHTML('afterend', '<div class="htpanel hide"><div class="htpropios"></div><div class="htauto"></div></div>');
    panel = sec.querySelector('.htpanel');
    acts.insertAdjacentHTML('afterbegin', `<button class="btn sec chico htbtn" type="button" title="Filtros y columnas" aria-label="Filtros y columnas">${svgIco(ICON_NOM['sliders-horizontal'])}<span class="htl"> Filtros y columnas</span><span class="htn"></span></button>`);
    acts.querySelector('.htbtn').onclick = () => { panel.classList.toggle('hide'); if (!panel.classList.contains('hide')) htPintarPanel(sec); };
  }
  // Los filtros propios de la pantalla pasan al panel; la búsqueda por texto se queda a la vista
  if (propios && !propios.dataset.ht) {
    propios.dataset.ht = '1';
    [...propios.children].forEach(ch => {
      if (ch.matches('input[type=search],input[type=text]') || ch.querySelector('input[type=search],input[type=text]')) return;
      panel.querySelector('.htpropios').appendChild(chicoEn(ch, true));
    });
    if (!propios.children.length) propios.classList.add('hide');
    panel.querySelectorAll('.htpropios select').forEach(s => s.addEventListener('change', () => htContador(sec)));
  }
  // Una tabla nueva (datos recién pintados): se le aplican columnas y filtros, y se actualiza el panel si está abierto
  if (g && !g.dataset.ht) { g.dataset.ht = '1'; htAplicarColumnas(g); htAplicarFiltros(g); if (!panel.classList.contains('hide')) htPintarPanel(sec); }
  htContador(sec);
}
new MutationObserver(() => {
  if (HT_PEND) return; HT_PEND = true;
  queueMicrotask(() => { HT_PEND = false; const sec = $('v-' + TAB); if (sec && !sec.classList.contains('hide')) htPreparar(sec); });
}).observe(document.querySelector('main'), { childList: true, subtree: true });

/* ---------------- Prescriptores: columna «Acceso a la plataforma» ---------------- */

COLS.push({ k: 'acceso', t: 'Acceso a la plataforma', w: 170 });
function celda(m, k) {
  if (k !== 'acceso') return celdaBase(m, k);
  if (!MED_ACCESO) { cargarAccesoMedicos().then(() => { if (TAB === 'directorio') buscar(true); }); return ''; }
  const a = MED_ACCESO[m.id];
  return a ? `<span class="pill ${a.activo ? 'p-est' : 'p-anu'}">${a.activo ? 'Con acceso' : 'Acceso desactivado'}</span>` : '<span class="sm">Sin acceso</span>';
}

/* ---------------- páginas propias: Perfil, Empresa y Plan ---------------- */

let PAG_TAB = {};
function cargarPagina(t) {
  const P = PAGINAS[t];
  if (P.permiso && !P.permiso()) { ir('inicio'); return; }   // v2.121.0: páginas con su propio permiso (Organización)
  if (P.admin && !puede('administrar')) { ir('inicio'); return; }
  let sec = $('v-' + t);
  if (!sec) { document.querySelector('main').insertAdjacentHTML('beforeend', `<section id="v-${t}"></section>`); sec = $('v-' + t); }
  // Solo puede haber un contenedor de contenido a la vez: Configuración y las otras páginas se vacían (se repintan al volver)
  if ($('v-config')) $('v-config').innerHTML = '';
  Object.keys(PAGINAS).forEach(o => { if (o !== t && $('v-' + o)) $('v-' + o).innerHTML = ''; });
  const tab = P.tabs.some(x => x[0] === PAG_TAB[t]) ? PAG_TAB[t] : P.tabs[0][0];
  sec.innerHTML = `${t === 'plan' ? '' : `<div class="saludo"><div><h1>${esc(P.t)}</h1><div class="fecha">${esc(P.d)}</div></div></div>`}
    ${P.tabs.length > 1 ? `<div class="cfgsubs pagtabs">${P.tabs.map(([k, n]) => `<button data-ptab="${k}" class="${k === tab ? 'on' : ''}">${esc(n)}</button>`).join('')}</div>` : ''}
    <div id="cfgcuerpo" class="pagcuerpo"></div>`;
  sec.querySelectorAll('.pagtabs [data-ptab]').forEach(b => b.onclick = () => { PAG_TAB[t] = b.dataset.ptab; cargarPagina(t); });
  Promise.resolve().then(P.tabs.find(x => x[0] === tab)[2]);
}
const IR_V253 = ir;
ir = function (t) {
  // Apartados que ahora tienen página propia: solo se redirige cuando se piden expresamente
  if (t === 'config' && CFG_SEC === 'notif') { PAG_TAB.perfil = 'notif'; CFG_SEC = 'rutas'; t = 'perfil'; }
  if (t === 'config' && ['perfil', 'prefs'].includes(CFG_SEC)) CFG_SEC = 'rutas';
  if (t === 'config' && ['__empresa', 'empresa', 'marca', 'correo', 'copias'].includes(CFG_SEC)) { PAG_TAB.empresa = ['correo', 'copias'].includes(CFG_SUB) ? CFG_SUB : (['correo', 'copias'].includes(CFG_SEC) ? CFG_SEC : 'marca'); CFG_SEC = 'rutas'; t = 'empresa'; }
  if (t === 'config' && CFG_SEC === 'plan') { CFG_SEC = 'rutas'; t = 'plan'; }
  IR_V253(t);
  if (PAGINAS[t]) cargarPagina(t);
};
// Configuración ya no repite Mi perfil ni Notificaciones: están en su propia página
arbolConfig = (orig => function () { return orig().map(([g, l]) => [g, l.filter(x => !['perfil', 'notif'].includes(x.k))]).filter(g => g[1].length); })(arbolConfig);
// Menú de usuario: cada opción abre su página
document.addEventListener('click', e => {
  const b = e.target.closest('[data-u="perfil"], [data-u="empresa"], [data-u="plan"]'); if (!b) return;
  e.stopImmediatePropagation(); e.preventDefault();
  document.querySelectorAll('.umenu, #umenu').forEach(m => m.classList.add('hide'));
  ir(b.dataset.u);
}, true);

// Plan y suscripción: página comercial con lo que aporta cada plan y cada módulo
const MOD_PLAN = [
  ['agenda', 'Agenda y «Tu día»', `Citas, ${TT('visita', 'p', '', 'l', 'l')} y el plan de cada jornada`], ['rutas', 'Rutas', 'Rutas optimizadas y planificación semanal'],
  ['directorio', etiquetaContactos(), `${TT('medico', 'p', '', 'l', 'C')}, centros y fichas`], ['seguimiento', 'Calidad del dato', 'Duplicados y datos que faltan'],
  ['ventas', 'Pedidos y llamadas', 'Ventas, compras, proveedores y televenta'], ['pacientes', 'Clientes', `${TT('paciente', 'p', '', 'l', 'C')} y empresas con su historial`],
  ['productos', 'Productos y stock', 'Catálogo, lotes, caducidades y almacenes'], ['analitica', 'Analítica', `Ventas, ranking de ${TT('medico', 'p', '', 'l', 'l')} y comisiones`],
  ['facturacion', 'Facturación', 'Facturas con VeriFactu, cobros y rectificativas']];
async function pintarPaginaPlan() {
  const { data } = await RPC_ORIG('plan_uso', {});
  const d = data || {}, act = planDe((d.plan || {}).plan), bloques = +((d.plan || {}).bloques_extra || 0);
  const maxU = act.incluidos + bloques * act.bloque[0], pct = Math.min(100, Math.round((d.usuarios || 0) / maxU * 100));
  const enlaces = ((d.pagos || {}).enlaces) || {};
  $('cfgcuerpo').innerHTML = `
    <div class="planhero"><div><div class="planeti">Tu plan</div><h1>${esc(act.nombre)}</h1><p>${esc(act.para)}</p></div>
      <div class="planheronum"><b>${num(d.usuarios || 0)} <span>/ ${num(maxU)}</span></b><span>usuarios activos</span><div class="barra"><i style="width:${pct}%"></i></div>
        <span class="sm">${eurI(act.precio)}/mes · ${act.incluidos} usuarios incluidos${bloques ? ` + ${bloques} extra` : ''}</span></div></div>
    <h2 class="plantit">Elige cómo crece tu equipo</h2>
    <div class="planes">${PLANES.map((p, i) => `<div class="plan ${p.id === act.id ? 'actual' : ''} ${p.id === 'avanzado' ? 'dest' : ''}">
      ${p.id === 'avanzado' ? '<span class="plancinta">El más elegido</span>' : ''}${p.id === act.id ? '<span class="plancinta actualc">Tu plan</span>' : ''}
      <h3>${esc(p.nombre)}</h3><div class="sm">${esc(p.para)}</div>
      <div class="planprecio"><b>${eurI(p.precio)}</b><span>/mes</span></div>
      <div class="sm">${p.incluidos} usuarios · usuario extra ${eurI(p.bloque[1])}/mes</div>
      <ul class="manlist">${p.ventajas.map(v => `<li><span>✓</span><span>${esc(v)}</span></li>`).join('')}</ul>
      ${p.id === act.id ? '<button class="btn sec" disabled>Tu plan actual</button>' : `<button class="btn ${p.id === 'avanzado' ? '' : 'sec'}" data-pcontratar="${p.id}">${i > PLANES.indexOf(act) ? 'Mejorar a ' : 'Cambiar a '}${esc(p.nombre)}</button>`}
    </div>`).join('')}</div>
    <h2 class="plantit">Qué incluye cada plan</h2>
    <div class="card"><div class="dgrid-wrap"><table class="planmat"><thead><tr><th>Módulo</th>${PLANES.map(p => `<th class="${p.id === act.id ? 'act' : ''}">${esc(p.nombre)}</th>`).join('')}</tr></thead>
      <tbody>${MOD_PLAN.map(([m, n, desc]) => `<tr><td><b>${esc(n)}</b><span class="sm">${esc(desc)}</span></td>${PLANES.map(p => `<td class="${p.id === act.id ? 'act' : ''}">${p.modulos.includes(m) ? '<span class="si">✓</span>' : '<span class="no">—</span>'}</td>`).join('')}</tr>`).join('')}
        <tr><td><b>Usuarios incluidos</b></td>${PLANES.map(p => `<td class="${p.id === act.id ? 'act' : ''}"><b>${p.incluidos}</b></td>`).join('')}</tr>
        <tr><td><b>${TT('medico', 'p', '', 'l', 'C')} con acceso a su informe</b></td>${PLANES.map(p => `<td class="${p.id === act.id ? 'act' : ''}">${p.medicos === null ? 'Sin límite' : p.medicos ? p.medicos : '—'}</td>`).join('')}</tr></tbody></table></div></div>
    <div class="card cfgpanel"><h3 style="margin-top:0">Cómo funciona</h3><ul class="manlist">
      <li><span>💳</span><span>Pago mensual con tarjeta, sin permanencia.</span></li>
      <li><span>👥</span><span>Si el equipo crece, se añaden usuarios sueltos sin cambiar de plan.</span></li>
      <li><span>🩺</span><span>${TT('medico', 'p', 'el', 'C', 'l')} con acceso a su informe no cuentan como usuarios.</span></li>
      <li><span>🔄</span><span>El cambio de plan se aplica en cuanto se confirma el pago.</span></li></ul>
      <div class="acts"><button class="btn sec" id="pextra">+ Añadir un usuario (${eurI(act.bloque[1])}/mes)</button></div></div>`;
  const contratar = clave => { if (enlaces[clave]) { window.open(enlaces[clave], '_blank', 'noopener'); return; }
    location.href = `mailto:${encodeURIComponent((d.pagos || {}).contacto || '')}?subject=${encodeURIComponent('Contratación: ' + clave)}&body=${encodeURIComponent('Empresa: ' + nombreApp() + '\nQuiero: ' + clave)}`; };
  $('cfgcuerpo').querySelectorAll('[data-pcontratar]').forEach(b => b.onclick = () => contratar(b.dataset.pcontratar));
  $('pextra').onclick = () => contratar('usuario-' + act.id);
}


