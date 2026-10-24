/* ============================================================
   v2.283.0 · Packs para los centros (petición de Eric, 12/10/2026, con las directrices comerciales de los centros; SQL 151).
   - Producto: «Packs para los centros» (compras N, te regalan M) y PVP de referencia con IVA. Con packs, el centro pide ese
     producto solo por packs desde su portal; el regalo va en el pedido como línea aparte al 100 % de descuento.
   - Portal del centro, «Pedir reposición»: cada pack con sus unidades, su importe, el coste real por unidad y el margen sobre el
     PVP de referencia; cuántos packs de cada (0 a 50, avisando en la fila si no vale); entrega en la dirección del centro o
     repartida entre varias direcciones (las unidades repartidas tienen que cuadrar). La bonificación es de cada pedido.
   ============================================================ */
const PC_PACK_MAX = 50;
const pcPct = v => (Math.round(v * 1000) / 10).toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %';


// Producto: packs para los centros y PVP de referencia
editorProducto = (orig => function (p, ...r) {
  const x = orig.call(this, p, ...r);
  setTimeout(async () => {
    if (!puede('administrar') || !$('dbody') || !$('prok') || $('prpacks') || !p || !p.id) return;
    const { data: d } = await db.from('productos').select('packs, pvp_recomendado').eq('id', p.id).maybeSingle();
    const ref = $('prmat') || $('dbody').querySelector('.acts:last-of-type'); if (!ref || $('prpacks')) return;
    let packs = (d && Array.isArray(d.packs) ? d.packs : []).map(k => ({ compra: +k.compra || 0, regalo: +k.regalo || 0 }));
    ref.insertAdjacentHTML('beforebegin', `<div class="blk" id="prpacks"><h3>Packs para los centros</h3>
      <p class="sm">Si pones packs, los centros piden este producto solo por packs desde su portal. El regalo va en el pedido como línea aparte al 100 % de descuento. El PVP de referencia (con IVA) sirve para enseñarles su margen.</p>
      <div id="prpkl"></div><button type="button" class="btn sec chico" id="prpkmas">+ Añadir pack</button>
      <div class="g2" style="margin-top:10px"><div><label for="prpkpvp">PVP de referencia (con IVA)</label><input id="prpkpvp" type="number" step="0.01" value="${d && d.pvp_recomendado != null ? +d.pvp_recomendado : ''}" placeholder="Sin indicar"></div></div>
      <span class="pcerr" id="prpkerr" hidden></span>
      <div class="prpkacts"><button type="button" class="btn sec" id="prpkok">Guardar packs</button></div></div>`);
    const leer = () => [...$('prpkl').querySelectorAll('.prpkf')].map(f => ({ compra: f.querySelector('[data-pkc]').value, regalo: f.querySelector('[data-pkg]').value }));
    const pinta = () => {
      $('prpkl').innerHTML = packs.length ? packs.map((k, i) => `<div class="prpkf"><label>Compra <input type="number" step="1" data-pkc value="${k.compra || ''}"></label>
          <label>Regalo <input type="number" step="1" data-pkg value="${k.regalo || 0}"></label><button type="button" class="pmhx" data-pkx="${i}" aria-label="Quitar este pack">✕</button></div>`).join('')
        : '<p class="sm">Sin packs: los centros lo piden por unidades.</p>';
      $('prpkl').querySelectorAll('[data-pkx]').forEach(b => b.onclick = () => { packs = leer(); packs.splice(+b.dataset.pkx, 1); pinta(); });
    };
    pinta();
    $('prpkmas').onclick = () => { packs = leer(); packs.push({ compra: '', regalo: 0 }); pinta(); };
    $('prpkok').onclick = async ev => {
      const l = leer().map(k => ({ compra: Number(k.compra), regalo: Number(k.regalo || 0) })), err = $('prpkerr');
      const malo = l.find(k => !Number.isInteger(k.compra) || k.compra < 1 || !Number.isInteger(k.regalo) || k.regalo < 0);
      const rep = l.some((k, i) => l.findIndex(y => y.compra === k.compra && y.regalo === k.regalo) !== i);
      const pv = $('prpkpvp').value === '' ? null : Number($('prpkpvp').value);
      const txt = malo ? 'Cada pack necesita una compra de 1 o más unidades y un regalo de 0 o más (números enteros).' : rep ? 'Hay dos packs iguales.' : pv != null && (!(pv >= 0) || isNaN(pv)) ? 'El PVP de referencia tiene que ser un importe de 0 o más.' : '';
      err.hidden = !txt; err.textContent = txt; if (txt) return;
      ev.target.disabled = true;
      const { error } = await db.from('productos').update({ packs: l.length ? l.sort((a, b) => a.compra - b.compra) : null, pvp_recomendado: pv }).eq('id', p.id);
      ev.target.disabled = false;
      if (error) { toast('No se han podido guardar los packs: ' + error.message, true); return; }
      packs = l; pinta(); toast(l.length ? `Packs guardados (${num(l.length)})` : 'Sin packs: se pide por unidades');
    };
  }, 0);
  return x;
})(editorProducto);




