
// La «i» del aviso está en src/app/screens/agenda/your-day (v2.397.0)
async function repintarDiaSuave(id, data) {
  const antes = tdPosiciones();
  const r = await repintarDiaSuaveBase.call(this, id, data);
  tdAnimar(antes, id, 320);
  return r;
}



