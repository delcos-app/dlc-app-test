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
window.delcos.legacyB.loadPublicBrand();
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
window.delcos.legacyB.loadPlanUsage();

// Los módulos que no entran en el plan se ven con candado y explican cómo conseguirlos
const puedeModuloV2400 = puedeModulo;

// No se puede superar el número de usuarios del plan

// Desde la ficha del médico: darle acceso a su espacio

/* ---------------- Roles y permisos ---------------- */

const QUE_ABRE = { H: 'Inicio: indicadores, alertas y resumen', G: 'Agenda, citas y «Tu día»', R: 'Rutas y planificador', M: `${TT('medico', 'p', '', 'l', 'C')}, centros y sus fichas`,
  C: 'Centros y sus datos', S: `Registro de ${TT('visita', 'p', '', 'l', 'l')}`, V: 'Pedidos: ventas, compras y llamadas', L: `Clientes (${TT('paciente', 'p', '', 'l', 'l')} y empresas)`, P: 'Productos, servicios y stock',
  F: 'Facturación, cobros y rectificativas', A: 'Analítica y rankings', E: 'Importes en euros (si no, solo unidades)', Q: 'Calidad del dato y duplicados',
  K: 'Clasificadores y listas de valores', U: 'Impersonalizar a otros usuarios' };

/* ---------------- Configuración única (Administración queda integrada) ---------------- */

window.delcos.legacyB.hideAdminMenu();

/* ---------------- menú «Más» del móvil: continuación de la barra ---------------- */

// Intentar entrar en un módulo que no incluye el plan
