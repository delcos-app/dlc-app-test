// @ts-check
// nucleo/arranque.js · lo que se ejecuta al abrir la app, en este orden. Va lo último de src/orden.json: cuando se ejecuta, todas las
// funciones ya tienen su forma final (antes, estas llamadas estaban repartidas por legado y el primer pintado usaba versiones a medias
// de las funciones que se envolvían más abajo). Plan de migración, bloque 6.
mejorarCampos(document);   // antes en 035
aplicarMarca();   // antes en 041
aplicarMarca();   // antes en 043
if (RECUPERANDO) pantallaRecuperacion();   // antes en 046
pintarBnav();   // antes en 069
pintarConexion();   // antes en 069
vaciarCola();   // antes en 069
arrancar();   // antes en 069
if (typeof PERFIL !== 'undefined' && PERFIL) menuOrganizacion();   // antes en 072
// Vuelta de Stripe (v2.167.0): si la app ya ha entrado (perfil guardado), se va a «Plan y suscripción»
if (PAGO_IR_PLAN && typeof PERFIL !== 'undefined' && PERFIL) setTimeout(() => { if (PAGO_IR_PLAN) ir('plan'); }, 0);   // antes en 076
