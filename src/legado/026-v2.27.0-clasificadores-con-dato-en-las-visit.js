/* ============================================================
   DLC OS 2.0 · v2.27.0 · Clasificadores con dato en las visitas,
   material comercial, Clientes con filtros, columnas en el panel
   lateral, mapa del plan y aviso de cita repetida
   ============================================================ */

Object.assign(RPC_TTL, { clasificadores_actividad: 300, municipios_clientes: 300 });

/* ---------------- registrar visita con datos ---------------- */

// v2.205.0: el material y los datos de una visita en una línea (src/app/screens/accounts/card/visit-details.ts, v2.424.0)
function detTxt(v) { return window.delcos.legacyB.visitDetails(v); }

/* ---------------- Clientes (antes Pacientes): tipo y filtros ---------------- */

Object.assign(PAC, { tipo: '', pedidos: '', municipio: '' });

window.delcos.legacyB.renameMenuEntry('pacientes');

/* ---------------- ayudas ---------------- */

Object.assign(AYUDA, {
  pacientes: ['Clientes', `${TT('paciente', 'p', '', 'l', 'C')} (personas) y empresas que compran con ${TT('medico', 's', 'un', 'l', 'l')} de referencia.`, [
    `La columna <b>Tipo</b> distingue ${TT('paciente', 'p', '', 'l', 'l')} y empresas. Filtra por tipo, si tienen pedidos o por población.`,
    `Cada cliente tiene un <b>${TT('medico', 's', '', 'l', 'l')} que lo trata</b>: se elige al darlo de alta o se asigna solo con su primer pedido.`,
    'A una persona se le pide DNI o NIE; a una empresa, el CIF.']]
});
AYUDA.config = AYUDA.config || ['Configuración', '', []];
AYUDA.config[2].push(`En <b>Clasificadores</b>, los de ${TT('visita', 'p', '', 'l', 'l')} (resultados, material comercial…) pueden pedir un <b>dato</b> al marcarse: una cantidad, un texto o una opción de una lista. Usa «+ Dato» en cada valor.`);
AYUDA.agenda[2].push(`Si añades una cita a ${TT('medico', 's', 'un', 'l', 'l')} que ya tiene otra ese día, te avisa y eliges: mantener las dos o quedarte solo con la nueva.`);
