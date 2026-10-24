/* ============================================================
   v2.272.0 · Configuración del profesional ajustada a lo suyo (aviso de Eric, 12/10/2026): la ayuda «i» habla solo de lo que
   puede hacer (Mis datos y Notificaciones; su consulta y visitas, en «Mi ficha») y las dos tarjetas de «Mis datos» miden lo mismo.
   ============================================================ */
// La ayuda de Configuración, según quién la mira: el profesional solo tiene sus datos y sus avisos
(() => {
  let general = AYUDA.config;
  const suya = ['Configuración', 'Aquí cambias tu cuenta.', [
    '<b>Mis datos</b>: tu nombre, tu teléfono, el idioma y la contraseña; también cierras la sesión.',
    '<b>Notificaciones</b>: qué avisos te llegan (por ejemplo, cada ' + TT('pauta', 's', '', 'l', 'l') + ' registrada) y si los quieres al momento, en el resumen de la mañana o no.',
    'Dónde y cuándo atiendes y cómo prefieres las ' + TT('visita', 'p', '', 'l', 'l') + ' se indica en <b>Mi ficha</b>, dentro de Mi informe.']];
  Object.defineProperty(AYUDA, 'config', { configurable: true, enumerable: true, get: () => (typeof ES_MEDICO === 'function' && ES_MEDICO() ? suya : general), set: v => { general = v; } });
})();




