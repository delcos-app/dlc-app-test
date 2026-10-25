/* ============================================================
   v2.44.0 · Sin aviso de horizontal (tapaba la app al abrir el
   teclado), idioma que se guarda de verdad, Configuración en el
   móvil por pasos (lista → apartado), contenido que no se sale de
   la pantalla y ubicación de centros y consultas con un toque
   ============================================================ */

/* ---------------- idioma ---------------- */

// El idioma se guarda en el perfil y se aplica al recargar, para que todo salga ya traducido
// Al entrar se usa el idioma del perfil; como mucho una recarga por sesión, para no quedar en bucle

/* ---------------- Configuración en el móvil: primero la lista, después el apartado ---------------- */

window.delcos.legacyB.listenToMobileSettings();
// «Elegir qué notificaciones recibo» abre ese apartado directamente
