// @ts-check
// pantallas/clientes.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

// Ficha · Comercial asignado (administración) y pacientes que vienen de este prescriptor

// v2.113.0 · Ficha · Cuántos clientes tiene (vinculados o que han comprado con ella). Solo números: también lo ve el comercial

const PAC = { q: '', medico: null, medicoNombre: '', pagina: 0 };

/* ============================================================
   v2.311.0 · Dar de baja y eliminar fichas (decisión de Eric; SQL 159). Al pie de la ficha de un profesional o de un centro:
   «Dar de baja» (siempre; se deshace desde Cuentas → «⋯» → «Fichas dadas de baja») y «Eliminar la ficha» (administración o
   nivel completo en fichas; solo si no tiene visitas, ventas, muestras, eventos… — si tiene, lo dice y ofrece la baja).
   ============================================================ */
const BAJA_QUE = { visitas: window.delcos.t('legacyTexts.accountRemoval.visits'), ventas: window.delcos.t('legacyTexts.accountRemoval.sales'), muestras: window.delcos.t('legacyTexts.accountRemoval.samples'), eventos: window.delcos.t('legacyTexts.accountRemoval.events'), cirugias: window.delcos.t('legacyTexts.accountRemoval.surgeries'), concursos: window.delcos.t('legacyTexts.accountRemoval.tenders'), equipos: window.delcos.t('legacyTexts.accountRemoval.equipment'), portal: window.delcos.t('legacyTexts.accountRemoval.portal') };

// El editor del cliente está en src/app/screens/customers/contact-editor (v2.427.0); Clientes, Pedidos, Oportunidades y las pruebas lo abren por este nombre
function editorContacto(c, alGuardar, op) { return window.delcos.leftovers.editContact(c || null, alGuardar || null, op || null); }

// Clientes está en src/app/screens/customers (v2.411.0). Estos nombres se quedan: el menú, la barra de la lista, los filtros de
// campos, Pedidos, Oportunidades, legado 137, «‹ Volver» y las pruebas los usan.
function cargarPacientes() { return window.delcos.screens.customers.loadCustomers(); }
function listaPacientes() { return window.delcos.screens.customers.listCustomers(); }
function fichaPaciente(id) { return window.delcos.screens.customers.showCustomer(id); }
function selectorPaciente(el, o) { return window.delcos.screens.customers.pickCustomer(el, o || {}); }
function bajaCliente(id, baja) { return window.delcos.screens.customers.setCustomerOff(id, baja); }
function buscarClientes(q) { return window.delcos.screens.customers.searchCustomers(q); }
