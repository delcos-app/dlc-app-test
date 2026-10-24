/* ============================================================
   DLC OS 2.0 · v2.34.0 · Permisos por módulo e indicadores, zonas de
   los comerciales, operativa de pedidos, registro de llamadas,
   comisiones con fecha de efecto, varios meses en la agenda y
   «Calidad del dato»
   ============================================================ */

Object.assign(RPC_TTL, { operativa_pendiente: 20, llamadas_lista: 20, llamadas_resumen: 30, calidad_datos: 60, zonas_resumen: 120 });

/* ---------------- permisos nuevos ---------------- */

(function () {
  const i = AREAS.findIndex(a => a[0] === 'V');
  AREAS[i][1] = 'Pedidos (ventas y compras)';
  AREAS.splice(i + 1, 0, ['L', 'Clientes'], ['P', 'Productos y stock'], ['F', 'Facturación'], ['A', 'Analítica'],
    ['E', 'Importes de ventas'], ['Q', 'Calidad del dato']);
})();

/* aplicarPermisosMenu: la parte base y, en orden, cada paso que se le añade (antes eran 3 capas separadas). */
function aplicarPermisosMenuBase2() {
  aplicarPermisosMenuBase();
  aplicarPermisosMenuPaso1();
  aplicarPermisosMenuPaso2();
  aplicarPermisosMenuPaso3();
}





/* ---------------- indicadores con su categoría y permiso ---------------- */


/* ---------------- zonas de cada comercial ---------------- */



/* ---------------- operativa de los pedidos ---------------- */




// (v2.183.0: aquí iba la primera versión de pintarOperativa; se redefine entera más abajo)

/* ---------------- Pedidos: pestaña «Llamadas» ---------------- */




/* ---------------- Inicio: operativa pendiente para televenta y administración ---------------- */


/* ---------------- Agenda: ver varios meses ---------------- */


/* ---------------- «Seguimiento» pasa a «Calidad del dato» ---------------- */

document.querySelectorAll('[data-t="seguimiento"]').forEach(b => { if (b.closest('nav.main')) b.textContent = 'Calidad del dato'; });

/* ---------------- ayudas y manual ---------------- */

AYUDA.seguimiento = ['Calidad del dato', `Qué parte de la base está completa y qué falta, y el avance comercial de cada ${TT('medico', 's', '', 'l', 'l')}.`, [
  `Arriba, el porcentaje de fichas completas y cuántas fichas no tienen ubicación, horario, ${TT('especialidad', 's', '', 'l', 'l')}, contacto, provincia o comercial.`,
  `Debajo, cada ${TT('medico', 's', '', 'l', 'l')} con su estado, ${TT('visita', 'p', '', 'l', 'l')} y próxima acción, con filtros para localizar los atrasados.`]];
MANUAL.forEach(s => {
  if (s.id === 'ventas') s.hacer.push([1, 'Operativa de cada pedido: pago recibido, paquete preparado y emails enviados (televenta)'], [1, `Registro de llamadas de televenta, con motivo, resultado y ${TT('medico', 's', '', 'l', 'l')} del que viene`]);
  if (s.id === 'admin') s.hacer.push([3, `Zona de cada comercial por provincias; ${TT('medico', 'p', 'el', 'l', 'l', 'nuevo')} de su zona entran solos en su cartera`], [3, 'Esquema de comisión con fecha de efecto: hoy, todo el histórico o una fecha concreta']);
});
MANUAL.push({ id: 'permisos', t: 'Permisos por módulo', a: null, para: 'Cada módulo se abre con su permiso; si no lo tienes, no aparece en el menú.',
  hacer: [[0, 'Clientes, Productos y stock, Facturación, Analítica y Calidad del dato tienen su propio permiso'],
    [0, '«Importes de ventas» decide si se ven euros o solo unidades en Inicio, Analítica y listados']], config: ['Administración → Usuarios → Editar'] });


