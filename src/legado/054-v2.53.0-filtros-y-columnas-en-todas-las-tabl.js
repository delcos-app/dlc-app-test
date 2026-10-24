/* ============================================================
   v2.53.0 · Filtros y columnas en todas las tablas, columna de
   acceso en Prescriptores y páginas propias de Perfil, Empresa y Plan
   ============================================================ */

/* ---------------- componente común: «Filtros y columnas» ---------------- */

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


