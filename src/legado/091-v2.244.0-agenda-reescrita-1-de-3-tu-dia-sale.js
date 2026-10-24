
// La «i» del aviso abre su explicación (antes pulsaba la de la fila oculta)
document.addEventListener('click', e => {
  const b = e.target.closest('[data-tdavi]'); if (!b) return;
  e.stopPropagation();
  const inf = TD_INFO[b.dataset.tdavi]; if (!inf) return;
  appVentana({ titulo: 'Por qué sale este aviso', msg: explicarAviso(inf), ok: 'Entendido', cancel: false });
}, true);
async function repintarDiaSuave(id, data) {
  const antes = tdPosiciones();
  const r = await repintarDiaSuaveBase.call(this, id, data);
  tdAnimar(antes, id, 320);
  return r;
}



