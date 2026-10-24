/* ============================================================
   DLC OS 2.0 · Entrega 11: comisiones
   ============================================================ */

let ESQUEMAS = [];
const eur = n => Number(n || 0).toLocaleString('es', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });
const periodoActual = () => hoyISO().slice(0, 7);
const periodoTxt = p => {
  const [a, m] = p.split('-');
  return ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'][+m - 1] + ' ' + a;
};

/* ---------------- panel personal en Inicio ---------------- */


/* ---------------- esquemas de comisión (administración) ---------------- */




async function pintarComisionesBase() {
  ($('admcuerpo') || document.createElement('div')).innerHTML = '<div class="skel"></div><div class="skel" style="width:60%"></div>';
  const [{ data: esq }, { data: liq }] = await Promise.all([
    db.rpc('esquemas_lista'), db.rpc('liquidaciones_lista', { p_periodo: null })
  ]);
  ESQUEMAS = esq || [];

  ($('admcuerpo') || document.createElement('div')).innerHTML = `
    <h2>Esquemas de comisión<span class="n">${ESQUEMAS.length}</span></h2>
    <p class="sm">El tramo alcanzado se aplica a todas las unidades del periodo. Televenta suele ir con importe fijo por unidad.</p>
    <div class="lista">${ESQUEMAS.map(e => `<div class="item" style="cursor:default">
      <span class="ic">${e.calculo === 'fijo' ? '€' : '▤'}</span>
      <span class="tx"><b>${esc(e.nombre)}</b><span class="sm">
        ${e.atribucion === 'cierra' ? 'Por venta cerrada' : 'Por cartera'} ·
        ${e.calculo === 'fijo' ? eur(e.valor_fijo) + ' por unidad'
          : (e.tramos || []).map(t => `${t.desde_u}${t.hasta_u ? '-' + t.hasta_u : '+'}: ${eur(t.valor)}`).join(' · ') || 'sin tramos'}
        ${(e.personas || []).length ? ' · ' + e.personas.map(esc).join(', ') : ' · sin asignar'}</span></span>
      <span class="acts" style="margin:0"><button class="btn sec chico" data-esq="${e.id}">Editar</button></span></div>`).join('')
      || '<div class="vacio">Todavía no hay esquemas.</div>'}</div>
    <div class="acts" style="padding:0 16px 14px"><button class="btn" id="esqnuevo">+ Nuevo esquema</button></div>

    <h2>Liquidaciones</h2>
    <div class="acts" style="padding:0 16px">
      <input id="liqper" type="month" value="${periodoActual()}" style="max-width:190px">
      <button class="btn sec" id="liqcalc">Calcular el periodo</button></div>
    <div class="lista">${(liq || []).map(l => `<div class="item" style="cursor:default">
      <span class="ic ${l.estado === 'Pagada' ? 'o' : ''}">${l.estado === 'Borrador' ? '○' : '✓'}</span>
      <span class="tx"><b>${esc(l.nombre)}</b><span class="sm">${periodoTxt(l.periodo)} · ${num(l.unidades)} unidades · ${eur(l.importe)} · ${esc(l.estado)}</span></span>
      <span class="acts" style="margin:0">
        ${l.estado === 'Borrador' ? `<button class="btn sec" data-liq="${l.usuario_id}|${l.periodo}|Aprobada">Aprobar</button>` : ''}
        ${l.estado === 'Aprobada' ? `<button class="btn sec" data-liq="${l.usuario_id}|${l.periodo}|Pagada">Marcar pagada</button>` : ''}
      </span></div>`).join('') || '<div class="vacio">Sin liquidaciones todavía.</div>'}</div>`;

  $('esqnuevo').onclick = () => editorEsquema(null);
  ($('admcuerpo') || document.createElement('div')).querySelectorAll('[data-esq]').forEach(b => b.onclick = () => editorEsquema(b.dataset.esq));
  $('liqcalc').onclick = calcularLiquidaciones;
  ($('admcuerpo') || document.createElement('div')).querySelectorAll('[data-liq]').forEach(b => b.onclick = async () => {
    const [u, p, estado] = b.dataset.liq.split('|');
    if (!await preguntar(`La liquidación quedará ${estado === 'Aprobada' ? 'aprobada y congelada' : 'marcada como pagada'}.`,
      { titulo: '¿' + (estado === 'Aprobada' ? 'Aprobar' : 'Marcar pagada') + '?', ok: estado === 'Aprobada' ? 'Aprobar' : 'Marcar pagada' })) return;
    await db.rpc('liquidar', { p_usuario: u, p_periodo: p, p_estado: estado });
    toast('Liquidación ' + estado.toLowerCase()); pintarComisiones();
  });
}


function editorEsquema(id) {
  const e = id ? ESQUEMAS.find(x => x.id === id) : null;
  let tramos = e && e.tramos && e.tramos.length ? e.tramos.slice() : [{ desde_u: 0, hasta_u: 100, valor: 1 }];
  let calc = e ? e.calculo : 'tramo_alcanzado';
  let fijoVal = e && e.valor_fijo ? e.valor_fijo : 1;

  const pinta = () => {
    const fijo = calc === 'fijo';
    $('dbody').innerHTML = `
      <div class="fh"><div><h2>${id ? 'Editar esquema' : 'Nuevo esquema'}</h2>
        <div class="sm">Define cómo se calcula la comisión y a quién se aplica</div></div>
        <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
      <label for="enom">Nombre</label><input id="enom" value="${esc(e ? e.nombre : '')}" placeholder="p. ej. Comercial zona norte">
      <div class="g2">
        <div><label for="eatr">Se cuenta por</label><select id="eatr">
          <option value="comercial" ${e && e.atribucion === 'comercial' ? 'selected' : ''}>Cartera del comercial</option>
          <option value="cierra" ${e && e.atribucion === 'cierra' ? 'selected' : ''}>Ventas que cierra (televenta)</option></select></div>
        <div><label for="ecalc">Cálculo</label><select id="ecalc">
          <option value="tramo_alcanzado" ${calc === 'tramo_alcanzado' ? 'selected' : ''}>Tramo alcanzado a todo el volumen</option>
          <option value="marginal" ${calc === 'marginal' ? 'selected' : ''}>Por tramos (cada unidad a su tramo)</option>
          <option value="fijo" ${calc === 'fijo' ? 'selected' : ''}>Importe fijo por unidad</option></select></div>
      </div>
      <div class="g2">
        <div><label for="ecan">Canal</label><select id="ecan">
          <option value="">Todos</option>
          <option value="paciente" ${e && e.canal === 'paciente' ? 'selected' : ''}>Solo venta ${TT('paciente', 's', 'al', 'l', 'l')}</option>
          <option value="centro" ${e && e.canal === 'centro' ? 'selected' : ''}>Solo venta a centro</option></select></div>
        ${fijo ? `<div><label for="efijo">Euros por unidad</label><input id="efijo" type="number" step="0.01" min="0" value="${fijoVal}"></div>` : '<div></div>'}
      </div>
      ${fijo ? '' : `<label>Tramos <span class="sm">· deja vacío el "hasta" del último</span></label>
      <div class="trcab" aria-hidden="true"><span>Desde (uds.)</span><span>Hasta (uds.)</span><span>€ por unidad</span></div>
      <div id="etramos">${tramos.map((t, i) => `<div class="g2" style="margin-bottom:8px">
        <input data-td="${i}" type="number" min="0" value="${t.desde_u}" placeholder="Desde">
        <input data-th="${i}" type="number" min="0" value="${t.hasta_u == null ? '' : t.hasta_u}" placeholder="Hasta">
        <input data-tv="${i}" type="number" step="0.01" min="0" value="${t.valor}" placeholder="€/unidad">
        ${tramos.length > 1 ? `<button type="button" class="btn sec" data-tx="${i}">✕</button>` : ''}</div>`).join('')}</div>
      <div class="acts"><button type="button" class="btn sec" id="etmas">+ Añadir tramo</button></div>`}
      <div class="acts" style="justify-content:flex-end">
        <button class="btn sec" data-cerrar>Cancelar</button>
        <button class="btn" id="eguardaresq">${id ? 'Guardar' : 'Crear esquema'}</button></div>`;

    const leer = () => {
      if (fijo) return;
      tramos = [...$('etramos').children].map((d, i) => ({
        desde_u: +d.querySelector(`[data-td="${i}"]`).value || 0,
        hasta_u: d.querySelector(`[data-th="${i}"]`).value === '' ? null : +d.querySelector(`[data-th="${i}"]`).value,
        valor: +d.querySelector(`[data-tv="${i}"]`).value || 0
      }));
    };
    $('ecalc').onchange = () => { leer(); if ($('efijo')) fijoVal = $('efijo').value; calc = $('ecalc').value; pinta(); };
    if ($('etmas')) $('etmas').onclick = () => {
      leer();
      const ult = tramos[tramos.length - 1];
      tramos.push({ desde_u: (ult.hasta_u || ult.desde_u) + 1, hasta_u: null, valor: ult.valor });
      pinta();
    };
    $('dbody').querySelectorAll('[data-tx]').forEach(b => b.onclick = () => { leer(); tramos.splice(+b.dataset.tx, 1); pinta(); });
    personasEsquema(id);

    $('eguardaresq').onclick = async ev => {
      leer();
      if (!$('enom').value.trim()) { toast('Ponle un nombre', true); return; }
      ev.target.disabled = true; ev.target.textContent = 'Guardando…';
      const { data: r, error } = await db.rpc('guardar_esquema', { p: {
        id: id || null, nombre: $('enom').value.trim(), atribucion: $('eatr').value,
        calculo: calc, canal: $('ecan').value || null,
        valor_fijo: fijo ? $('efijo').value : null,
        ...(fijo ? {} : { tramos })
      }});
      ev.target.disabled = false; ev.target.textContent = id ? 'Guardar' : 'Crear esquema';
      if (error || (r && r.ok === false)) { toast('No se ha podido guardar', true); return; }
      $('dlg').close(); toast('Esquema guardado'); pintarComisiones();
    };
  };
  pinta();
  $('dlg').showModal();
}

/* ---------------- asignar esquema y visibilidad en el editor de usuario ---------------- */




