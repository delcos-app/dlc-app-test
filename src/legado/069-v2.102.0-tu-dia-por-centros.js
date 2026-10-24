// La consulta de la visita: la del centro de la cita; si no, la que tiene consulta hoy; si no, la principal
consultaDeLaVisita = (orig => function (cons) {
  const pref = FICHA_CENTRO ? clasNorm(FICHA_CENTRO) : '';
  return (pref && (cons || []).find(c => clasNorm(c.centro_nombre) === pref)) || orig(cons);
})(consultaDeLaVisita);
abrirFicha = (orig => async function (...a) { try { return await orig.apply(this, a); } finally { FICHA_CENTRO = null; } })(abrirFicha);
accionCita = (orig => function (k, c, ...r) { if (k === 'ficha') FICHA_CENTRO = c.centro_nombre || null; return orig(k, c, ...r); })(accionCita);


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

/* v2.74.0 · El detalle del pedido muestra sus campos personalizados */
verPedido = (orig => async function (id, ...a) { const r = await orig.call(this, id, ...a); if (id) setTimeout(() => bloqueCampos('pedidos', id, $('dbody')), 150); return r; })(verPedido);


