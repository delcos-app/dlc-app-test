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

function pcPintarPedido(lp) {
  const box = $('pcped'); if (!box) return;
  const conIva = x => r2((+x.precio || 0) * (1 + (+x.iva || 0) / 100));
  const dirs = [...new Set((PM.ubic || []).map(u => [u.direccion, u.municipio].filter(Boolean).join(', ')).filter(Boolean))];
  const prod = x => {
    const pu = conIva(x), packs = Array.isArray(x.packs) ? x.packs : [], pvp = +x.pvp_recomendado || 0;
    if (!packs.length) return `<div class="pcprod"><div class="pcpcab"><b>${esc(x.nombre)}</b><span class="sm">${eurI(pu)} la unidad con IVA${x.propio ? ' · vuestro precio' : ''}</span></div>
      <div class="pclin"><span class="sm">Unidades</span><input type="number" step="1" value="0" data-ctp="${x.producto_id}" data-ctpr="${pu}" aria-label="Unidades de ${esc(x.nombre)}"><span class="pcerr" hidden></span></div></div>`;
    return `<div class="pcprod"><div class="pcpcab"><b>${esc(x.nombre)}</b><span class="sm">${eurI(pu)} la unidad con IVA${pvp ? ` · PVP de referencia ${eurI(pvp)}` : ''}</span></div>
      <div class="pcpacks">${packs.map((k, i) => {
        const c = +k.compra || 0, g = +k.regalo || 0, imp = r2(c * pu), coste = (c + g) ? imp / (c + g) : 0;
        return `<div class="pclin pcpack"><span class="pcpk"><b>Pack ${num(c)}${g ? ' + ' + num(g) : ''}</b><span class="sm">${num(c + g)} unidades${g ? ` (${num(g)} de regalo)` : ''}</span></span>
          <span class="pcdato"><b>${eurI(imp)}</b><span class="sm">con IVA</span></span>
          <span class="pcdato"><b>${eurI(coste)}</b><span class="sm">por unidad</span></span>
          ${pvp ? `<span class="pcdato"><b>${pcPct((pvp - coste) / pvp)}</b><span class="sm">de margen</span></span>` : '<span></span>'}
          <input type="number" step="1" value="0" data-pcpk="${x.producto_id}" data-pci="${i}" data-pcc="${c}" data-pcg="${g}" data-pcimp="${imp}" aria-label="Cuántos packs ${num(c)}${g ? '+' + num(g) : ''}">
          <span class="pcerr" hidden></span></div>`;
      }).join('')}</div></div>`;
  };
  box.innerHTML = `<div class="card ancard pmcons pcped"><h2>Pedir reposición ${pmAyu('Pedir reposición', `Elige cuántos packs quieres de cada producto (de 0 a ${num(PC_PACK_MAX)} de cada pack). El coste por unidad incluye las de regalo, y el margen se calcula sobre el PVP de referencia. La bonificación es de cada pedido. Tu comercial lo revisa y lo confirma; en «Resumen» verás cómo va.`)}</h2>
    ${lp.length ? `<div id="ctprods">${lp.map(prod).join('')}</div>
      <div class="pcent"><b>Entrega</b>
        <label class="opt"><input type="radio" name="pcent" value="una" checked> En la dirección del centro</label>
        <label class="opt"><input type="radio" name="pcent" value="varias"> Repartir entre varias direcciones</label>
        <div id="pcentl" class="pcentl" hidden><datalist id="pcdirs">${dirs.map(d => `<option value="${esc(d)}">`).join('')}</datalist>
          <div id="pcentf"></div><button type="button" class="btn sec chico" id="pcentmas">+ Otra dirección</button><span class="sm" id="pcentres"></span></div></div>
      ${window.PC_ANT ? '<p class="sm pcant">Pago por adelantado: cuando tu comercial lo confirme, descarga la factura proforma en «Resumen» y haz la transferencia. Lo preparamos en cuanto llegue.</p>' : ''}<label for="ctnota">Nota</label><input id="ctnota" placeholder="Opcional: horario de entrega, persona de contacto…">
      <div class="pctot"><span id="pctxt">Total <b id="cttot">${eurI(0)}</b> con IVA</span><button type="button" class="btn" id="ctok">Enviar pedido</button></div>`
      : '<p class="sm">Todavía no tenéis productos para pedir. Tu comercial os los dará de alta.</p>'}</div>`;
  if (!lp.length) return;
  const entFila = (d = '', u = '') => `<div class="pcef"><input list="pcdirs" placeholder="Dirección de entrega" value="${esc(d)}" data-pced><input type="number" step="1" placeholder="Unidades" value="${esc(u)}" data-pceu><button type="button" class="pmhx" data-pcex aria-label="Quitar esta dirección">✕</button></div>`;
  const entPintar = () => { if (!$('pcentf').children.length) $('pcentf').innerHTML = entFila() + entFila(); };   // sin repintar: se perdería lo escrito
  const revisar = () => {
    let total = 0, uds = 0, regalo = 0, mal = 0;
    box.querySelectorAll('[data-ctp], [data-pcpk]').forEach(i => {
      const n = Number(i.value || 0), e = i.closest('.pclin').querySelector('.pcerr'), pk = !!i.dataset.pcpk, max = pk ? PC_PACK_MAX : PC_MAX;
      const bad = !Number.isInteger(n) || n < 0 || n > max;
      e.hidden = !bad; e.textContent = bad ? (n > max ? (pk ? `Como máximo ${num(max)} packs de este tipo en cada pedido` : `Como máximo ${num(max)} unidades en cada pedido`) : 'Escribe un número entero') : '';
      if (bad) { mal++; return; }
      if (pk) { total += n * (+i.dataset.pcimp || 0); uds += n * ((+i.dataset.pcc || 0) + (+i.dataset.pcg || 0)); regalo += n * (+i.dataset.pcg || 0); }
      else { total += n * (+i.dataset.ctpr || 0); uds += n; }
    });
    const varias = (box.querySelector('[name=pcent]:checked') || {}).value === 'varias';
    $('pcentl').hidden = !varias;
    let repartidas = 0;
    if (varias) { entPintar(); box.querySelectorAll('[data-pceu]').forEach(i => { repartidas += Math.max(0, Math.floor(+i.value || 0)); }); }
    const res = $('pcentres');
    if (res) { res.textContent = varias ? `Repartidas ${num(repartidas)} de ${num(uds)} unidades` : ''; res.classList.toggle('pcmal', varias && repartidas !== uds); }
    $('pctxt').innerHTML = `Total <b id="cttot">${eurI(total)}</b> con IVA${uds ? ` · ${num(uds)} unidades${regalo ? ` (${num(regalo)} de regalo)` : ''}` : ''}`;
    return { mal, uds, varias, repartidas };
  };
  box.addEventListener('input', revisar); box.addEventListener('change', revisar);
  box.addEventListener('click', e => {
    if (e.target.closest('#pcentmas')) { $('pcentf').insertAdjacentHTML('beforeend', entFila()); revisar(); }
    const x = e.target.closest('[data-pcex]'); if (x) { x.closest('.pcef').remove(); revisar(); }
  });
  $('ctok').onclick = async ev => {
    const r = revisar();
    if (r.mal) { toast('Revisa las cantidades marcadas en rojo', true); return; }
    const lineas = [];
    box.querySelectorAll('[data-pcpk]').forEach(i => { const n = Math.floor(+i.value || 0); if (n > 0) lineas.push({ producto_id: i.dataset.pcpk, pack: { compra: +i.dataset.pcc, regalo: +i.dataset.pcg }, packs: n }); });
    box.querySelectorAll('[data-ctp]').forEach(i => { const n = Math.floor(+i.value || 0); if (n > 0) lineas.push({ producto_id: i.dataset.ctp, unidades: n }); });
    if (!lineas.length) { toast('Elige algún pack o pon unidades', true); return; }
    let entregas = null;
    if (r.varias) {
      entregas = [...box.querySelectorAll('.pcef')].map(f => ({ direccion: f.querySelector('[data-pced]').value.trim(), unidades: Math.floor(+f.querySelector('[data-pceu]').value || 0) }))
        .filter(x => x.direccion && x.unidades > 0);
      if (entregas.length < 2 || r.repartidas !== r.uds) { toast(`Reparte las ${num(r.uds)} unidades entre al menos dos direcciones`, true); return; }
    }
    ev.target.disabled = true;
    const { data: res } = await db.rpc('pedido_portal', { p_lineas: lineas, p_nota: $('ctnota').value.trim() || null, p_entregas: entregas });
    ev.target.disabled = false;
    if (!res || !res.ok) {
      const m = res && res.motivo;
      toast(m === 'vacio' ? 'Elige algún pack o pon unidades' : m === 'pack' ? `Ese pack de ${res.producto || 'producto'} ya no está disponible: vuelve a cargar la página`
        : m === 'unidades' ? `Revisa las cantidades de ${res.producto || 'un producto'}` : m === 'entregas' ? `Las direcciones tienen que sumar ${num(res.total)} unidades` : motivoPortal(res), true);
      return;
    }
    toast('Pedido enviado: tu comercial lo confirmará'); PM.tab = 'res'; await centroPintar(); pmTab('res');
  };
  revisar();
}

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




