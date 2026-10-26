// @ts-check
/* ============================================================
   v2.45.2 · Contraseñas con indicador de seguridad y formularios
   de acceso sin avisos nativos del navegador
   ============================================================ */

// Pantalla de contraseña nueva: indicador y botón activo solo cuando es válida
// La pantalla de contraseña nueva está en src/app/screens/access/recovery.ts (v2.424.0); el arranque y la navegación usan este nombre
function pantallaRecuperacion() { return window.delcos.legacyB.showRecovery(); }
// Si la pantalla ya se abrió al cargar (antes de este punto), se completa ahora
window.delcos.legacyB.completeRecoveryForm();
// Mi perfil → contraseña

// Acceso: «Entrar» se activa al rellenar correo y contraseña; avisos con el diseño de la plataforma
window.delcos.legacyB.prepareLoginForm();
