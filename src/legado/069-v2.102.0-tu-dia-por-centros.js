

// Barra inferior del móvil y barra de «Entrar como» desde el primer momento
pintarBnav();

pintarConexion();
vaciarCola();
arrancar();

/* v2.71.0 · Textos fijos de index.html con el vocabulario del cliente (solo si lo ha cambiado) */
(function () {
  if (!Object.keys(TERMINOS || {}).length) return;
  const q = document.getElementById('q'); if (q) q.placeholder = `Buscar ${TT('medico', 's', '', 'l', 'l')}, centro o municipio`;
  const h = document.querySelector('#c-ultimas h2'); if (h) h.textContent = `Últimas ${TT('visita', 'p', '', 'l', 'l')}`;
  const o = document.querySelector('option[value="reciente"]'); if (o) o.textContent = `${TT('visita', 's', '', 'l', 'C')} más reciente`;
  const fe = document.querySelector('label[for="fesp"]'); if (fe) fe.textContent = TT('especialidad', 's', '', 'l', 'C');   // v2.347.0
})();



