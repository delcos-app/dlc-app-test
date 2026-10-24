/* ============================================================
   v2.331.0 · Cobro con tarjeta o Bizum desde el pedido (petición de Eric, 20/10/2026; SQL 171 y función del servidor «cobro_tpv»).
   - Al confirmar un pedido con forma de pago tarjeta o Bizum (y el cobro configurado), delcos pide a Redsys un cobro PayGold y el banco
     envía al móvil del cliente un SMS con el enlace; en esa página paga con tarjeta o Bizum. Cuando paga, Redsys avisa y el pedido pasa
     solo a «Cobrado» (y, si tiene factura, se apunta el cobro). Nadie coge el TPV ni mira la cuenta.
   - En el pedido, dentro de «Pago», el cobro con tarjeta o Bizum: estado del envío (enviado, pagado, no pagado, caducado),
     «Volver a enviar» y, en el entorno de pruebas, «Abrir la página de pago» (el banco de pruebas no envía SMS).
   - Configuración → Facturación → «Cobro con tarjeta y Bizum» (quien configura la empresa): número de comercio, terminal, clave
     secreta, entorno pruebas/real, «Probar» y la dirección de aviso para el banco.
   ============================================================ */
const tpvCfg = () => AJUSTES.cobro_tpv || {};
// v2.345.0: solo en pruebas hasta tener el terminal del banco (decisión de Eric); para abrirlo en producción, TPV_VISIBLE = true
const TPV_VISIBLE = EN_PRUEBAS || /^(localhost|127\.)/.test(location.hostname);   // en local, para la batería
const tpvActivo = () => !!(TPV_VISIBLE && tpvCfg().activo && puedeModulo('ventas'));
const esPagoTpv = fp => /tarjeta|bizum/i.test(fp || '');
const tpvMovil = t => { let m = String(t || '').replace(/\D/g, ''); m = m.replace(/^(0034|34)(?=[67]\d{8}$)/, ''); return /^[67]\d{8}$/.test(m) ? m : ''; };
const TPV_ERR = {
  permiso: 'No tienes permiso para enviar cobros', estado: 'El pedido tiene que estar confirmado', pagado: 'Este pedido ya está cobrado',
  sin_cargo: 'Una entrega sin cargo no se cobra', importe: 'El pedido no tiene importe', sesion: 'La sesión ha caducado: vuelve a entrar',
  sin_configurar: 'El cobro con tarjeta o Bizum no está configurado (Configuración → Facturación)', no_encontrado: 'No se encuentra el pedido'
};
function tpvError(r) {
  r = r || {};
  if (r.error === 'movil') return `Falta el móvil ${TT('paciente', 's', 'del', 'l', 'l')}: hace falta un móvil español para enviarle el enlace`;
  if (r.error === 'redsys') return r.detalle || 'El banco no ha aceptado el cobro';
  return TPV_ERR[r.error] || ('No se ha podido enviar el enlace de pago' + (r.detalle ? ': ' + r.detalle : ''));
}
async function tpvLlamar(body) {
  let { data, error } = await db.functions.invoke('cobro_tpv', { body });
  if (!data && error) { try { data = await error.context.json(); } catch (e) { data = null; } }
  if (!data && error) data = { ok: false, error: 'interno', detalle: /Failed to send|not found|404/i.test(error.message || '') ? 'falta publicar la función «cobro_tpv» en el servidor' : error.message };
  return data || { ok: false };
}
async function tpvEnviar(pedidoId) {
  const r = await tpvLlamar({ accion: 'enviar', pedido_id: pedidoId });
  if (!r.ok) { toast(tpvError(r), true); return r; }
  toast(`Enlace de pago enviado por SMS al ${r.movil}`);
  return r;
}
const TPV_EST = { Enviado: ['Enviado', 'p-est'], Pagado: ['Pagado', 'p-trfok'], Fallido: ['No pagado', 'p-urg'], Caducado: ['Caducado', 'p-urg'], Preparado: ['Enviando…', 'p-warn'] };
let TPV_MIRA = null;
async function tpvBloque(id) {
  const box = $('pdpago'); if (!box || $('pdtpv')) return;
  const [{ data: ls }, { data: p }] = await Promise.all([
    db.from('pagos_tpv').select('*').eq('pedido_id', id).neq('estado', 'Anulado').order('creado_en', { ascending: false }).limit(1),
    db.from('pedidos').select('estado,pago_estado,forma_pago,sin_cargo').eq('id', id).maybeSingle()]);
  if (!$('pdpago') || $('pdtpv') || !p) return;
  const t = (ls || [])[0];
  const pendiente = ['Confirmado', 'Borrador'].includes(p.estado) && (p.pago_estado || 'Pendiente') === 'Pendiente' && !p.sin_cargo;   // v2.333.0: también en borrador
  const puedeEnviar = pendiente && tpvActivo() && esPagoTpv(p.forma_pago) && (puede('administrar') || nivelDe2('V') >= 2);
  if (!t && !puedeEnviar) return;
  const est = t && t.estado === 'Enviado' && t.caduca_en && new Date(t.caduca_en) < new Date() ? 'Caducado' : t && t.estado;
  const [etq, cls] = TPV_EST[est] || ['', ''];
  const cuando = s => s ? `${fechaCorta(String(s).slice(0, 10))} a las ${new Date(s).toTimeString().slice(0, 5)}` : '';
  const detalle = !t ? 'Todavía no se ha enviado el enlace de pago.'
    : est === 'Pagado' ? `Pagado${t.metodo ? ' con ' + esc(t.metodo === 'Bizum' ? t.metodo : t.metodo.toLowerCase()) : ''} el ${cuando(t.pagado_en)}${t.autorizacion ? ' · autorización ' + esc(t.autorizacion) : ''}${t.metodo && t.forma_pedida && t.forma_pedida.toLowerCase() !== t.metodo.toLowerCase() ? ` · el pedido se hizo con «${esc(t.forma_pedida)}» y el cliente eligió ${esc(t.metodo === 'Bizum' ? t.metodo : t.metodo.toLowerCase())}` : ''}`
    : est === 'Fallido' ? esc(t.error || 'El banco no ha autorizado el pago')
    : est === 'Caducado' ? `El enlace enviado al ${esc(t.movil || '')} el ${cuando(t.creado_en)} ha caducado sin pagar`
    : `Enviado por SMS al ${esc(t.movil || '')} el ${cuando(t.creado_en)} · esperando el pago${p.estado === 'Borrador' ? '. Cuando pague, el pedido se confirma solo.' : ''}`;
  const verPrueba = t && t.entorno === 'pruebas' && est === 'Enviado' && t.url_pago;
  box.insertAdjacentHTML('beforeend', `<div class="tpvped" id="pdtpv">
    <div class="pdpagof"><span class="sm">Cobro con tarjeta o Bizum</span>${etq ? `<span class="pill ${cls}">${etq}</span>` : ''}</div>
    <p class="sm">${detalle}</p>
    ${puedeEnviar || verPrueba ? `<div class="acts">
      ${verPrueba ? `<a class="btn sec chico" id="tpvabrir" href="${esc(t.url_pago)}" target="_blank" rel="noopener">Abrir la página de pago (pruebas)</a>` : ''}
      ${puedeEnviar ? `<button type="button" class="btn ${t ? 'sec ' : ''}chico" id="tpvenviar">${t ? 'Volver a enviar' : 'Enviar enlace de pago'}</button>` : ''}</div>` : ''}</div>`);
  const b = $('tpvenviar');
  if (b) b.onclick = async () => {
    if (t && est === 'Enviado' && !await preguntar('El enlace anterior deja de valer y le llega uno nuevo por SMS.', { titulo: '¿Volver a enviar el enlace de pago?', ok: 'Enviar' })) return;
    b.disabled = true;
    const r = await tpvEnviar(id);
    b.disabled = false;
    if (r.ok && $('pdtpv')) { $('pdtpv').remove(); tpvBloque(id); }
  };
  // Mientras se espera el pago y el pedido está abierto, se mira cada 8 s: al pagar, el pedido se repinta cobrado
  clearTimeout(TPV_MIRA);
  if (est === 'Enviado') TPV_MIRA = setTimeout(async function mira() {
    if (!$('dlg').open || !$('pdtpv')) return;
    const { data: x } = await db.from('pagos_tpv').select('estado').eq('id', t.id).maybeSingle();
    if (!$('dlg').open || !$('pdtpv')) return;
    if (x && x.estado === 'Pagado') { toast(p.estado === 'Borrador' ? 'Cobrado · pedido confirmado' : 'Cobrado'); invalidarCache(); verPedido(id); if (TAB === 'ventas') cargarVentas(); return; }
    if (x && x.estado !== 'Enviado') { $('pdtpv').remove(); tpvBloque(id); return; }
    TPV_MIRA = setTimeout(mira, 8000);
  }, 8000);
}
pedidoPago = (orig => async function (id, ...a) {
  const r = await orig.call(this, id, ...a);
  await tpvBloque(id);
  return r;
})(pedidoPago);

// Configuración → Facturación → «Cobro con tarjeta y Bizum»
arbolCfgUnico = (orig => function (...a) {
  const g = orig.apply(this, a);
  if (!TPV_VISIBLE || !puedeOrganizacion() || !puedeModulo('ventas')) return g;
  let fac = g.find(x => x[0] === 'Facturación');
  if (!fac) { fac = ['Facturación', []]; g.push(fac); }
  if (!fac[1].some(x => x.k === 'tpv'))
    fac[1].push({ k: 'tpv', t: 'Cobro con tarjeta y Bizum', ic: 'credit-card', d: 'El cliente paga desde un SMS y el pedido queda cobrado solo', r: () => pintarTpv() });
  return g;
})(arbolCfgUnico);
CFG_CLAVES.tpv = 'tarjeta bizum tpv redsys paygold cobro pago enlace sms banco';
// Datos públicos del entorno de pruebas de Redsys (no cobran nada)
const TPV_PRUEBAS = { comercio: '999008881', terminal: '1', clave: 'sq7HjrUOBfKmC576ILgskD5srU870gJ7' };
function pintarTpv() {
  const c = $('cfgcuerpo'); if (!c) return;
  const cfg = tpvCfg();
  c.innerHTML = `<div class="card tpvw">
    <p class="sm">Al confirmar un pedido con forma de pago tarjeta o Bizum, ${TT('paciente', 's', 'el', 'l', 'l')} recibe un SMS de vuestro banco con un enlace para pagar con tarjeta o Bizum. Cuando paga, el pedido queda cobrado solo. Funciona con el TPV virtual de Redsys (el de la mayoría de bancos) con PayGold activado: los datos los da el banco.</p>
    <label class="opt"><input type="checkbox" id="tpvact" ${cfg.activo ? 'checked' : ''}> Cobrar con tarjeta o Bizum desde los pedidos</label>
    <div class="g2"><div><label for="tpvcom">Número de comercio</label><input id="tpvcom" inputmode="numeric" value="${esc(cfg.comercio || '')}"></div>
      <div><label for="tpvter">Terminal</label><input id="tpvter" inputmode="numeric" value="${esc(cfg.terminal || '')}"></div></div>
    <div class="g2"><div><label for="tpvcla">Clave secreta del TPV</label><input id="tpvcla" type="password" autocomplete="new-password" placeholder="${cfg.hay_clave ? '•••••••• guardada · escribe solo para cambiarla' : ''}"></div>
      <div><label for="tpvent">Entorno</label><select id="tpvent"><option value="pruebas">Pruebas (sin dinero real)</option><option value="real" ${cfg.entorno === 'real' ? 'selected' : ''}>Real</option></select></div></div>
    <p class="sm">Dirección de aviso que hay que dar al banco: <b id="tpvurl">${esc(CFG.url)}/functions/v1/cobro_tpv</b></p>
    <div class="acts"><button type="button" class="btn sec" id="tpvdemo">Usar los datos de pruebas de Redsys</button>
      <button type="button" class="btn sec" id="tpvprobar">Probar</button><button type="button" class="btn" id="tpvok">Guardar</button></div>
    <p class="sm" id="tpvmsg"></p></div>`;
  $('tpvdemo').onclick = () => { $('tpvcom').value = TPV_PRUEBAS.comercio; $('tpvter').value = TPV_PRUEBAS.terminal; $('tpvcla').value = TPV_PRUEBAS.clave; $('tpvent').value = 'pruebas'; };
  const msg = (t, err) => { $('tpvmsg').innerHTML = `<b class="${err ? 'tpverr' : 'tpvok'}">${t}</b>`; };
  const guardar = async () => {
    const p = { activo: $('tpvact').checked, entorno: $('tpvent').value, comercio: $('tpvcom').value.trim(), terminal: $('tpvter').value.trim() };
    const { data: r, error } = await db.rpc('guardar_cobro_tpv', { p, p_clave: $('tpvcla').value.trim() || null });
    if (error || !r || !r.ok) {
      const e = r && r.error;
      msg(e === 'comercio' ? 'El número de comercio son solo cifras (hasta 9)' : e === 'terminal' ? 'El terminal son solo cifras (hasta 3)'
        : e === 'clave' ? 'Para activarlo falta la clave secreta del TPV' : e === 'permiso' ? 'Solo quien configura la empresa puede cambiar esto'
        : 'No se ha podido guardar' + (error ? ': ' + esc(error.message) : ''), true);
      return false;
    }
    AJUSTES.cobro_tpv = Object.assign({}, p, { hay_clave: r.hay_clave });
    $('tpvcla').value = ''; if (r.hay_clave) $('tpvcla').placeholder = '•••••••• guardada · escribe solo para cambiarla';
    msg('✓ Guardado'); return true;
  };
  $('tpvok').onclick = () => conCarga($('tpvok'), 'Guardando…', guardar);
  $('tpvprobar').onclick = () => conCarga($('tpvprobar'), 'Probando…', async () => {
    if (!await guardar()) return;
    const r = await tpvLlamar({ accion: 'probar' });
    if (!r.ok) { msg(esc(tpvError(r)), true); return; }
    $('tpvmsg').innerHTML = `<b class="tpvok">✓ El banco acepta los datos.</b> ${r.url ? `<a href="${esc(r.url)}" target="_blank" rel="noopener">Ver la página de pago de prueba (1 €)</a>` : ''}`;
  });
}


