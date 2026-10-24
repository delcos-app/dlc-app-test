/* ============================================================
   v2.265.0 · Transfer completo con el distribuidor (grupo 4 del plan del 11/10/2026; necesita el SQL 142).
   - Ver pedido → bloque «Distribuidor»: en qué punto está el transfer (Enviado, Aceptado, Servido o Incidencia, con su nota) y
     «Descargar transfer», un PDF con el cliente, su código en el distribuidor y las líneas con referencia y código de barras.
   - Configuración → Datos → Distribuidores: cada distribuidor con sus transfers (cuántos sin enviar, en marcha, servidos y con
     incidencia); al pulsar uno se abre el pedido.
   ============================================================ */
const TRF_EST = [['Enviado', 'Enviado'], ['Aceptado', 'Aceptado'], ['Servido', 'Servido'], ['Incidencia', 'Incidencia']];
const trfPill = e => e ? `<span class="pill ${e === 'Servido' ? 'p-trfok' : e === 'Incidencia' ? 'p-urg' : 'p-per'}">${esc(e)}</span>` : '<span class="pill">Sin enviar</span>';
// Distribuidores: los transfers de cada uno
pintarDistribuidores = (orig => async function (...a) {
  const r = await orig.apply(this, a);
  const c = $('cfgcuerpo'); if (!c || CFG_KEY !== 'distribuidores') return r;
  c.querySelectorAll('.disfila[data-disid] .ajctl').forEach(x => {
    if (x.querySelector('[data-distrf]')) return;
    x.insertAdjacentHTML('afterbegin', `<button type="button" class="btn sec" data-distrf="${x.closest('.disfila').dataset.disid}">Transfers</button>`);
  });
  c.querySelectorAll('[data-distrf]').forEach(b => b.onclick = () => verTransfers(b.dataset.distrf));
  return r;
})(pintarDistribuidores);




