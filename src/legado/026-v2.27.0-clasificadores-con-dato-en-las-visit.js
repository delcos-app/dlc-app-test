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

