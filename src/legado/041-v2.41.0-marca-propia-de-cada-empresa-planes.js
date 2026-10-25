/* ============================================================
   v2.41.0 · Marca propia de cada empresa, planes contratables,
   Usuarios renovado, Roles y permisos, configuración sin redundancias
   (Administración se integra en Configuración), acceso de médicos
   desde su ficha y menú «Más» como extensión de la barra
   ============================================================ */

Object.assign(RPC_TTL, { usuarios_resumen: 30, plan_uso: 60 });

/* ---------------- marca de la empresa ---------------- */

let MARCA = (() => { try { return JSON.parse(localStorage.getItem('app-marca')) || {}; } catch (e) { return {}; } })();
// v2.103.0: la marca del dominio desde el que se abre (con varias empresas, cada una la suya)
// v2.170.0: quien vuelve de darse de alta (?alta=ok) ve la marca de delcos, aunque la dirección sea la de otra empresa
Promise.resolve(RPC_ORIG('marca_publica', { p_dominio: /[?&]alta=ok/.test(location.search) ? null : location.hostname })).then(r => {
  if (r && r.data) { MARCA = Object.assign({}, MARCA, r.data); try { localStorage.setItem('app-marca', JSON.stringify(MARCA)); } catch (e) {} aplicarMarca(); }
}, () => {});
// El logo de la empresa también en las facturas


/* ---------------- planes ---------------- */

const PLANES = [
  { id: 'esencial', nombre: 'Esencial', precio: 149, incluidos: 5, bloque: [5, 99], medicos: 0,
    para: `Equipos pequeños que quieren ordenar sus ${TT('visita', 'p', '', 'l', 'l')}`,
    modulos: ['inicio', 'agenda', 'rutas', 'directorio', 'seguimiento'],
    ventajas: [`Directorio de ${TT('medico', 'p', '', 'l', 'l')} y centros`, `Agenda, «Tu día» y registro de ${TT('visita', 'p', '', 'l', 'l')}`, 'Rutas optimizadas y planificación semanal', 'Calidad del dato y duplicados', 'App móvil instalable'] },
  { id: 'profesional', nombre: 'Profesional', precio: 349, incluidos: 10, bloque: [5, 149], medicos: 0,
    para: 'Equipos que venden y quieren medir resultados',
    modulos: ['inicio', 'agenda', 'rutas', 'directorio', 'seguimiento', 'ventas', 'pacientes', 'productos', 'analitica'],
    ventajas: ['Todo lo de Esencial', 'Pedidos, clientes y registro de llamadas', 'Productos y stock por lotes', `Analítica y ranking de ${TT('medico', 'p', '', 'l', 'l')}`, 'Comisiones por tramos'] },
  { id: 'avanzado', nombre: 'Avanzado', precio: 649, incluidos: 20, bloque: [10, 249], medicos: 50,
    para: 'Empresas con facturación propia y varios equipos',
    modulos: ['inicio', 'agenda', 'rutas', 'directorio', 'seguimiento', 'ventas', 'pacientes', 'productos', 'analitica', 'facturacion'],
    ventajas: ['Todo lo de Profesional', 'Facturación con VeriFactu y cobros', 'Compras, proveedores y trazabilidad', 'Zonas, supervisión del equipo y alertas', `Espacio ${TT('medico', 's', 'del', 'l', 'l')} (hasta 50 ${TT('medico', 'p', '', 'l', 'l')})`] },
  { id: 'premium', nombre: 'Premium', precio: 1190, incluidos: 40, bloque: [10, 249], medicos: null,
    para: 'Redes comerciales grandes que lo quieren todo',
    modulos: ['inicio', 'agenda', 'rutas', 'directorio', 'seguimiento', 'ventas', 'pacientes', 'productos', 'analitica', 'facturacion'],
    ventajas: ['Todo lo de Avanzado', `Espacio ${TT('medico', 's', 'del', 'l', 'l')} sin límite`, 'Impersonalización de usuarios y auditoría completa', 'Puesta en marcha y migración de datos incluidas', 'Soporte prioritario'] }
];
Promise.resolve(RPC_ORIG('plan_uso', {})).then(r => { if (r && r.data && r.data.plan) { PLAN_ACTUAL = r.data.plan; if (PERFIL) aplicarPermisosMenu(); } }, () => {});

// Los módulos que no entran en el plan se ven con candado y explican cómo conseguirlos
const puedeModuloV2400 = puedeModulo;

async function pintarPlan2Base() {
  const { data } = await RPC_ORIG('plan_uso', {});
  const d = data || {}, act = planDe((d.plan || {}).plan), bloques = +((d.plan || {}).bloques_extra || 0);
  const maxU = act.incluidos + bloques * act.bloque[0], enlaces = ((d.pagos || {}).enlaces) || {};
  const pct = Math.min(100, Math.round((d.usuarios || 0) / maxU * 100));
  $('cfgcuerpo').innerHTML = `<div class="card cfgpanel">
    <div class="planact"><div><div class="sm">Tu plan</div><h2 style="padding:0;margin:2px 0">${esc(act.nombre)} <span class="pill ${(d.plan || {}).estado === 'activo' ? 'p-est' : 'p-per'}">${esc((d.plan || {}).estado || 'activo')}</span></h2>
      <div class="sm">${eurI(act.precio)}/mes · ${act.incluidos} usuarios incluidos${bloques ? ` + ${bloques} ${bloques === 1 ? 'bloque' : 'bloques'} de ${act.bloque[0]}` : ''}</div></div>
      <div class="planuso"><b>${num(d.usuarios || 0)} / ${num(maxU)}</b><span>usuarios activos</span><div class="barra"><i style="width:${pct}%"></i></div>
        ${act.medicos !== 0 ? `<span class="sm">${num(d.medicos || 0)}${act.medicos ? ' / ' + act.medicos : ''} ${TT('medico', 'p', '', 'l', 'l')} con acceso</span>` : ''}</div></div></div>
    <div class="planes">${PLANES.map(p => `<div class="plan ${p.id === act.id ? 'actual' : ''} ${p.id === 'avanzado' ? 'dest' : ''}">
      ${p.id === 'avanzado' ? '<span class="plancinta">El más elegido</span>' : ''}
      <h3>${esc(p.nombre)}</h3><div class="sm">${esc(p.para)}</div>
      <div class="planprecio"><b>${eurI(p.precio)}</b><span>/mes</span></div>
      <div class="sm">${p.incluidos} usuarios incluidos · +${p.bloque[0]} usuarios por ${eurI(p.bloque[1])}/mes</div>
      <ul class="manlist">${p.ventajas.map(v => `<li><span>✓</span><span>${esc(v)}</span></li>`).join('')}</ul>
      ${p.id === act.id ? '<button class="btn sec" disabled>Tu plan actual</button>'
        : `<button class="btn ${p.id === 'avanzado' ? '' : 'sec'}" data-contratar="${p.id}">${PLANES.indexOf(p) > PLANES.indexOf(act) ? 'Mejorar a ' : 'Cambiar a '}${esc(p.nombre)}</button>`}
    </div>`).join('')}</div>
    <div class="card cfgpanel"><h3 style="margin-top:0">Cómo funciona</h3><ul class="manlist">
      <li><span>💳</span><span>Pago mensual con tarjeta. Con pago anual, dos meses gratis.</span></li>
      <li><span>👥</span><span>Cada plan incluye un número de usuarios; si el equipo crece, se añaden bloques de usuarios sin cambiar de plan.</span></li>
      <li><span>🩺</span><span>${TT('medico', 'p', 'el', 'C', 'l')} con acceso a su informe no cuentan como usuarios.</span></li>
      <li><span>🔄</span><span>Se puede cambiar de plan en cualquier momento; el cambio se aplica al confirmarse el pago.</span></li></ul>
      <div class="acts"><button class="btn sec" id="plbloque">+ Añadir un bloque de ${act.bloque[0]} usuarios (${eurI(act.bloque[1])}/mes)</button></div></div>`;
  const contratar = clave => {
    if (enlaces[clave]) { window.open(enlaces[clave], '_blank', 'noopener'); return; }
    location.href = `mailto:${encodeURIComponent((d.pagos || {}).contacto || '')}?subject=${encodeURIComponent('Contratación: ' + clave)}&body=${encodeURIComponent('Empresa: ' + nombreApp() + '\nQuiero: ' + clave)}`;
  };
  $('cfgcuerpo').querySelectorAll('[data-contratar]').forEach(b => b.onclick = () => contratar(b.dataset.contratar));
  $('plbloque').onclick = () => contratar('bloque-' + act.id);
}

// No se puede superar el número de usuarios del plan

// Desde la ficha del médico: darle acceso a su espacio

/* ---------------- Usuarios renovado ---------------- */


/* ---------------- Roles y permisos ---------------- */

const QUE_ABRE = { H: 'Inicio: indicadores, alertas y resumen', G: 'Agenda, citas y «Tu día»', R: 'Rutas y planificador', M: `${TT('medico', 'p', '', 'l', 'C')}, centros y sus fichas`,
  C: 'Centros y sus datos', S: `Registro de ${TT('visita', 'p', '', 'l', 'l')}`, V: 'Pedidos: ventas, compras y llamadas', L: `Clientes (${TT('paciente', 'p', '', 'l', 'l')} y empresas)`, P: 'Productos, servicios y stock',
  F: 'Facturación, cobros y rectificativas', A: 'Analítica y rankings', E: 'Importes en euros (si no, solo unidades)', Q: 'Calidad del dato y duplicados',
  K: 'Clasificadores y listas de valores', U: 'Impersonalizar a otros usuarios' };

/* ---------------- Configuración única (Administración queda integrada) ---------------- */

document.querySelectorAll('[data-u="adm"]').forEach(b => b.classList.add('hide'));

/* ---------------- menú «Más» del móvil: continuación de la barra ---------------- */


// Intentar entrar en un módulo que no incluye el plan


