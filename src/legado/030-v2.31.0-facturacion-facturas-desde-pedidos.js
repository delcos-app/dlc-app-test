/* ============================================================
   DLC OS 2.0 · v2.31.0 · Facturación: facturas desde pedidos,
   series y numeración, rectificativas, cobros, PDF y VeriFactu preparado
   ============================================================ */

Object.assign(RPC_TTL, { facturas_lista: 20, series_lista: 60, eventos_facturacion_lista: 20 });

/* ---------------- navegación ---------------- */


/* ---------------- módulo ---------------- */

async function cargarFacturacion() {
  const admin = puede('administrar');
  const secs = [['facturas', 'Facturas'], ['series', 'Series y numeración']].concat(admin ? [['empresa', 'Datos fiscales'], ['verifactu', 'VeriFactu'], ['registro', 'Registro']] : []);
  if (!secs.some(s => s[0] === FSEC)) FSEC = 'facturas';
  $('v-facturacion').innerHTML = `
    <div class="saludo"><div><h1>Facturación</h1><div class="fecha">Facturas emitidas desde los pedidos, rectificativas y cobros</div></div>
      <div class="acts" style="margin:0"></div></div>
    <div class="subnav">${secs.map(([k, t]) => `<button data-fsec="${k}" aria-pressed="${FSEC === k}">${t}</button>`).join('')}</div>
    <div id="fcuerpo"></div>`;
  $('v-facturacion').querySelectorAll('[data-fsec]').forEach(b => b.onclick = () => { FSEC = b.dataset.fsec; cargarFacturacion(); });
  if (FSEC === 'facturas') pintarFacturas();
  if (FSEC === 'series') pintarSeries();
  if (FSEC === 'empresa') pintarEmpresa();
  if (FSEC === 'verifactu') pintarVerifactu();
  if (FSEC === 'registro') pintarRegistro();
}







/* ---------------- ver e imprimir (PDF desde el navegador) ---------------- */


/* ---------------- series ---------------- */



/* ---------------- datos fiscales y preferencias de facturación ---------------- */

async function pintarEmpresa() {
  await cargarAjustes();
  const e = AJUSTES.empresa || {}, c = Object.assign({ vencimiento_dias: 15, forma_pago: '', emitir_al_validar: false }, AJUSTES.facturacion || {});
  const f = (k, t, extra) => `<div><label for="em_${k}">${t}</label><input id="em_${k}" value="${esc(e[k] || '')}" ${extra || ''}></div>`;
  $('fcuerpo').innerHTML = `<div class="card" style="padding-top:16px;padding-bottom:16px">
    <h2 style="padding:0 0 8px">Datos fiscales del emisor</h2><p class="sm">Aparecen en cada factura. Las facturas ya emitidas conservan los datos con los que se emitieron.</p>
    <div class="g2">${f('razon_social', 'Razón social')}${f('nif', 'NIF')}</div>
    <div class="g2">${f('direccion', 'Dirección')}${f('cp', 'Código postal')}</div>
    <div class="g2">${f('municipio', 'Población')}${f('provincia', 'Provincia')}</div>
    <div class="g2">${f('telefono', 'Teléfono')}${f('email', 'Email', 'type="email"')}</div>
    <div class="g2">${f('iban', 'IBAN para transferencias')}${f('registro', 'Datos registrales (Registro Mercantil)')}</div>
    <label for="em_pie">Pie de factura</label><textarea id="em_pie" rows="2" placeholder="Condiciones, protección de datos…">${esc(e.pie || '')}</textarea>
    <h2 style="padding:18px 0 8px">Al emitir</h2>
    <div class="g2"><div><label for="fcv">Días hasta el vencimiento</label><input id="fcv" type="number" min="0" value="${+c.vencimiento_dias || 0}"></div>
      <div><label for="fcf">Forma de pago si el pedido no la indica</label><select id="fcf"><option value="">—</option>${(CAT.forma_pago || []).map(x => `<option ${x.valor === c.forma_pago ? 'selected' : ''}>${esc(x.valor)}</option>`).join('')}</select></div></div>
    <label class="opt" style="margin-top:10px"><input type="checkbox" id="fce" ${c.emitir_al_validar ? 'checked' : ''}>
      <span><b>Emitir la factura automáticamente al confirmar un pedido</b><br><span class="sm">Si no, se emite a mano desde el pedido con «Emitir factura».</span></span></label>
    <div class="acts" style="justify-content:flex-end"><button class="btn" id="emok">Guardar</button></div></div>`;
  $('emok').onclick = async () => {
    const emp = {}; ['razon_social', 'nif', 'direccion', 'cp', 'municipio', 'provincia', 'telefono', 'email', 'iban', 'registro', 'pie'].forEach(k => emp[k] = $('em_' + k).value.trim());
    emp.pais = e.pais || 'España';
    if (!emp.razon_social || !emp.nif) { toast('La razón social y el NIF son obligatorios', true); return; }
    const [a, b] = await Promise.all([
      db.rpc('guardar_ajuste', { p_clave: 'empresa', p_valor: emp }),
      db.rpc('guardar_ajuste', { p_clave: 'facturacion', p_valor: { vencimiento_dias: +$('fcv').value || 0, forma_pago: $('fcf').value, emitir_al_validar: $('fce').checked } })]);
    if (a.error || b.error) { toast('No se ha podido guardar', true); return; }
    AJUSTES.empresa = emp; toast('Datos guardados');
  };
}

/* ---------------- VeriFactu (solo administración) ---------------- */

// (v2.183.0: aquí iba la primera versión de pintarVerifactu; se redefine entera más abajo)


/* ---------------- desde el pedido: emitir o ver la factura ---------------- */



// Emisión automática al validar, si está configurada
const RPC_V2300 = db.rpc;
db.rpc = function (fn, params, opts) {
  const b = RPC_V2300.call(db, fn, params, opts);
  if (fn !== 'guardar_pedido' || !params || !params.p || params.p.estado === 'Borrador') return b;
  return conCatch(Promise.resolve(b).then(async res => {
    try {
      if (!res.error && res.data && res.data.ok && res.data.estado !== 'Borrador' && (AJUSTES.facturacion || {}).emitir_al_validar && puedeFacturar()) {
        const { data: f } = await RPC_ORIG('emitir_factura', { p_pedido: res.data.id });
        if (f && f.ok) setTimeout(() => toast('Factura ' + f.numero + ' emitida'), 900);
      }
    } catch (e) {}
    return res;
  }));
};

/* ---------------- ayudas ---------------- */

AYUDA.facturacion = ['Facturación', 'Facturas emitidas desde los pedidos, rectificativas y cobros.', [
  'La factura se emite desde un pedido confirmado (<b>🧾 Emitir factura</b> en el pedido) o sola al confirmarlo, si está configurado en Datos fiscales.',
  'Cada serie numera de forma correlativa y puede continuar la numeración de tu programa anterior (indica el siguiente número al configurarla).',
  'Una factura emitida no se puede modificar ni borrar. Si hay un error, <b>Rectificar</b> emite una rectificativa en negativo, total o por unidades, y puede anular el pedido para devolver el stock.',
  'Registra los cobros (total o parcial). El estado pasa a Cobrada, Pendiente o Vencida según el vencimiento.',
  '<b>Ver e imprimir</b> abre la factura lista para imprimir o guardar en PDF.',
  'VeriFactu está preparado (huella encadenada, QR y registro de eventos) y se activa solo desde administración.']];
MANUAL.push({ id: 'facturacion', t: 'Facturación', a: 'V', para: 'Facturas desde pedidos confirmados, rectificativas, cobros, series y VeriFactu.',
  hacer: [[1, 'Ver facturas y cobros (administración y televenta)'], [2, 'Emitir facturas, rectificar y registrar cobros'], [3, 'Configurar series, datos fiscales y VeriFactu (administración)']],
  config: ['Series y numeración', 'Datos fiscales, vencimiento y emisión automática', 'VeriFactu (solo administración)'] });


