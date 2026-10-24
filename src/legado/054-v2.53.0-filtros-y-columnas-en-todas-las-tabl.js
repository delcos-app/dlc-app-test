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


