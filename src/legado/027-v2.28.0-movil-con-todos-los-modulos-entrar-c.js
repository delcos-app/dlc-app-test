// @ts-check
/* ============================================================
   DLC OS 2.0 · v2.28.0 · Móvil con todos los módulos, entrar como
   otro usuario, manual, alertas de cruce, cartera exclusiva, aviso
   de visita reciente, servicios, inicio de Rutas y un Inicio con más valor
   ============================================================ */

Object.assign(RPC_TTL, { alertas_mias: 60, alertas_cruce: 120, actividades_recientes: 30 });

/* ---------------- móvil: los cuatro principales y «Más» ---------------- */

// La barra inferior del móvil está en src/app/core/mobile/navigation.ts (v2.424.0)

/* ---------------- entrar como otro usuario ---------------- */

const SKEY = 'dlc-suplantador';

window.delcos.legacyB.listenToImpersonateAndManual();

/* ---------------- manual de uso ---------------- */

const MANUAL = window.delcos.content.manualSections();

const FAQ = window.delcos.content.questions();

/* ---------------- reglas de cartera ---------------- */

// Agenda → Equipo con «Reglas de cartera» (src/app/screens/agenda/team-rules.ts, v2.424.0)
function pintarEquipo() { return window.delcos.legacyB.paintTeam(); }

/* ---------------- aviso de visita reciente ---------------- */

// Plan de ruta: marca a quien ya se ha visto hace poco y permite quitarlo

// Preferencias: el aviso se puede activar, desactivar y ajustar

/* ---------------- Rutas: resumen como pantalla de entrada ---------------- */

RSEC = 'inicio';

// v2.242.0: aquí iba resumenRutas (nadie la usaba)

/* ---------------- ayudas ---------------- */

