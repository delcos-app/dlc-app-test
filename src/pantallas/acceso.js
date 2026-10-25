// pantallas/acceso.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

function claveAlerta(titulo, x) { return window.delcos.leftovers.alertKey(titulo, x); }

/* v2.181.0 · Nombres neutros en las respuestas de la base (decisión de Eric: dos versiones). Desde la v2.182.0 (SQL 116) estas funciones
   responden con nombres neutros (cuenta, ubicaciones, actividades…) en lugar de los de DLC (medico, consultas, visitas…). La app sigue usando
   por dentro los de siempre: al recibir la respuesta de una de ellas, cada clave nueva se copia también con su nombre antiguo (si no viene ya).
   Con la base todavía en los nombres antiguos no hace nada. Para una función nueva que use estos nombres, añadirla a FN_NEUTRAS. */
const CLAVES_NEUTRAS = { cuenta: 'medico', cuentas: 'medicos', ubicaciones: 'consultas', actividades: 'visitas', cuenta_codigo: 'medico_codigo',
  clientes: 'pacientes', ultima_actividad: 'ultima_visita', actividades_mes: 'visitas_mes', actividades_semana: 'visitas_semana',
  ubicacion_telefono: 'consulta_telefono', dias_con_actividad: 'dias_con_visitas', dias_sin_actividad: 'dias_sin_visita',
  cuentas_visitadas: 'medicos_visitados', n_ubicaciones: 'n_consultas', n_actividades: 'n_visitas', por_cuenta: 'por_medico',
  ultimas_actividades: 'ultimas_visitas', actividades_dia: 'visitas_dia', actividades_total: 'visitas_total' };

let MED_ACCESO = null;

const claveAnchos = tipo => `ht-anchos-${(PERFIL || {}).id || ''}-${tipo}`;

let PAG_CLAVE = '';

// Acceso está en src/app/screens/access (v2.414.0). Estos nombres se quedan: el acceso, la navegación, Configuración,
// legado 001, 047, 076 y 129 y las pruebas los usan.
function medidorClave(inp, rep, boton) { window.delcos.screens.access.addPasswordMeter(inp, rep, boton); }
function accesoSinActivar(texto) { window.delcos.screens.access.showNotActivated(texto); }
function restablecerPassword(u) { return window.delcos.screens.access.resetPassword(u); }
function bienvenidaAlta() { return window.delcos.screens.access.showWelcome(); }
function reenviarActivacion(email, o = {}) { return window.delcos.screens.access.resendActivation(email, o); }
function mostrarLogin(msg) { window.delcos.screens.access.showLogin(msg); }
