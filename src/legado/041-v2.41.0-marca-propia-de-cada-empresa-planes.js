// @ts-check
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

const PLANES = window.delcos.content.plans();
window.delcos.legacyB.loadPlanUsage();

// Los módulos que no entran en el plan se ven con candado y explican cómo conseguirlos
const puedeModuloV2400 = t => window.delcos.core.permissions.canUseModule(t);

// No se puede superar el número de usuarios del plan

// Desde la ficha del médico: darle acceso a su espacio

/* ---------------- Roles y permisos ---------------- */

const QUE_ABRE = window.delcos.content.areaHints();

/* ---------------- Configuración única (Administración queda integrada) ---------------- */

window.delcos.legacyB.hideAdminMenu();

/* ---------------- menú «Más» del móvil: continuación de la barra ---------------- */

// Intentar entrar en un módulo que no incluye el plan
