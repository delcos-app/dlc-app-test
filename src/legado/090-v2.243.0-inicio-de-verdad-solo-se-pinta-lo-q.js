pintarInicio = (orig => async function () {
  if (ES_MEDICO()) return orig();
  $('v-inicio').classList.remove('ini-cargando');
  inicioQuitarAntiguo();
  await inicioIndicadores();
})(pintarInicio);


