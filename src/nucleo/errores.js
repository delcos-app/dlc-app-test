// @ts-check
// nucleo/errores.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función y constantes de valor puro: su sitio no cambia lo que hace la app. Normas: docs/normas_codigo.md.

let ERR_ENVIADOS = new Set();

function registrarErrorBase(tipo, mensaje, detalle) {
  try {
    const m = String(mensaje || '').slice(0, 500);
    ERRORES_SESION.push({ t: new Date().toISOString(), tipo, m, pantalla: TAB }); if (ERRORES_SESION.length > 20) ERRORES_SESION.shift();
    const clave = tipo + '|' + m; if (ERR_ENVIADOS.has(clave) || !PERFIL) return; ERR_ENVIADOS.add(clave);
    // La consulta solo se envía cuando se espera su resultado
    Promise.resolve(RPC_ORIG('registrar_error', { p: { tipo, mensaje: m, detalle: detalle || null, pantalla: TAB, version: VERSION_APP, navegador: navigator.userAgent } })).then(() => {}, () => {});
  } catch (e) {}
}

function registrarErrorBase2(tipo, mensaje, detalle) {
  if (tipo === 'api' && esErrorRed(mensaje)) return;
  return registrarErrorBase.call(this, tipo, mensaje, detalle);
}

// En solo lectura, los fallos al guardar se explican (toast, en componentes/aviso.js) y no cuentan como errores de la plataforma
function registrarError(tipo, mensaje, detalle) {
  if (PAGO_ESTADO && PAGO_ESTADO.solo_lectura && /row-level security|violates row-level/i.test(String(mensaje))) return;
  return registrarErrorBase2.call(this, tipo, mensaje, detalle);
}
