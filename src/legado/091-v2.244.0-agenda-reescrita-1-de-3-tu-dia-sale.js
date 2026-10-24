
// La «i» del aviso abre su explicación (antes pulsaba la de la fila oculta)
document.addEventListener('click', e => {
  const b = e.target.closest('[data-tdavi]'); if (!b) return;
  e.stopPropagation();
  const inf = TD_INFO[b.dataset.tdavi]; if (!inf) return;
  appVentana({ titulo: 'Por qué sale este aviso', msg: explicarAviso(inf), ok: 'Entendido', cancel: false });
}, true);
moverCitaLocal = (orig => async function (orden, id, acc) {
  const antes = tdPosiciones();
  const r = await orig.call(this, orden, id, acc);
  tdAnimar(antes, id, 260);
  const b = document.querySelector(`#agcuerpo .tdu [data-td="${acc}|${id}"]:not([disabled])`) || document.querySelector(`#agcuerpo .tdu [data-td$="|${id}"]`);
  if (b) b.focus({ preventScroll: true });
  return r;
})(moverCitaLocal);
async function repintarDiaSuave(id, data) {
  const antes = tdPosiciones();
  const r = await repintarDiaSuaveBase.call(this, id, data);
  tdAnimar(antes, id, 320);
  return r;
}



