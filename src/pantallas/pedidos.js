// pantallas/pedidos.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.


function nuevaVenta(pre) { return editorOportunidad(pre || null); }

function menuPedidos2139() {
  const nav = document.querySelector('nav.main .in'); if (!nav || ES_MEDICO()) return;
  const ped = nav.querySelector('[data-t="ventas"]'); if (!ped) return;
  const ve = !ped.classList.contains('hide') && puedeModulo('ventas');
  let tras = ped;
  [['oportunidades', 'Oportunidades', ve && VE_TODO() && hayOportunidades()], ['compras', 'Compras', ve], ['proveedores', 'Proveedores', ve]].forEach(([t, txt, vis]) => {
    let b = nav.querySelector(`[data-t="${t}"]`);
    if (!b) { tras.insertAdjacentHTML('afterend', `<button data-t="${t}" aria-selected="false">${txt}</button>`); b = nav.querySelector(`[data-t="${t}"]`); }
    b.classList.toggle('hide', !vis);
    if (!b.closest('.mlbs')) tras = b;   // con el menú lateral, cada uno va en su bloque
  });
}


async function pagoLlamar(cuerpo, boton) {
  if (boton) { boton.disabled = true; boton.dataset.txt = boton.textContent; boton.textContent = 'Abriendo…'; }
  try {
    const { data, error } = await db.functions.invoke('pagos', { body: cuerpo });
    let d = data;
    if (error) { try { d = await error.context.json(); } catch (e) { d = { ok: false, error: error.message }; } }
    if (!d || !d.ok) { toast('No se ha podido: ' + ((d && d.error) || 'error del pago'), true); return null; }
    return d;
  } finally { if (boton) { boton.disabled = false; boton.textContent = boton.dataset.txt; } }
}

// Al volver de Stripe: se espera a que llegue el aviso y el plan quede activo
async function pagoEsperarActivo() {
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 3000));
    await pagoCargarEstado();
    const pl = PLAN_ACTUAL || {};
    if (pl.stripe_suscripcion && pl.estado === 'activo') { toast('Suscripción activa: plan ' + planDe(pl.plan).nombre); if (TAB === 'plan' || TAB === 'organizacion' || TAB === 'config') ir(TAB); return; }
  }
  toast('El pago está hecho; la suscripción aparecerá en unos minutos');
}

async function pagoEsperarBaja() {
  for (let i = 0; i < 15; i++) {
    await pagoCargarEstado();
    const pl = PLAN_ACTUAL || {};
    if (pl.baja_al_final || pl.estado === 'cancelada') {
      toast(`Baja registrada: puedes usar delcos hasta el ${fechaCorta(pl.periodo_fin)}`);
      if (TAB === 'plan' || TAB === 'organizacion' || TAB === 'config') ir(TAB); return;
    }
    await new Promise(r => setTimeout(r, 2000));
  }
  toast('Baja pedida: en unos minutos lo verás en Plan y suscripción');
}

// ---- Cobros y suscripciones: el estado de pago de cada empresa (de ajustes.plan, que mantiene el aviso de Stripe)
function pdCobroEstado(o) {
  const p = o.plan_datos || {};
  if (o.bloqueada) return ['Bloqueada', 'p-anu', o.bloqueada === 'desactivada' ? 'Desactivada' : 'Prueba terminada'];
  if (p.estado === 'cancelada') return ['Cancelada', 'p-anu', p.periodo_fin ? 'Acceso hasta el ' + pdFecha(p.periodo_fin) : ''];
  if (p.estado === 'impago') { const d = p.impago_desde ? Math.round((Date.now() - new Date(p.impago_desde + 'T12:00:00')) / 864e5) : 0;
    return ['Impago', 'p-urg', d >= 14 ? 'Solo lectura desde hace ' + (d - 14) + ' días' : 'Le quedan ' + (14 - d) + ' días de gracia']; }
  if (p.en_prueba || p.estado === 'prueba') return ['En prueba', 'p-warn', (p.prueba_hasta || p.periodo_fin) ? 'Hasta el ' + pdFecha(p.prueba_hasta || p.periodo_fin) : ''];
  if (!p.stripe_suscripcion) return [p.plan === 'medida' ? 'A medida' : 'Sin suscripción', 'p-per', p.plan === 'medida' ? 'Contrato con delcos' : 'Sin pago con tarjeta'];
  return ['Al día', 'p-est', p.periodo_fin ? 'Próximo recibo: ' + pdFecha(p.periodo_fin) : ''];
}

function pdMensual(p) {
  if (!p || !p.stripe_suscripcion || p.estado === 'cancelada' || p.plan === 'medida') return 0;
  const pl = planDe(p.plan), u = Math.max(+p.usuarios || 0, pl.minimo || 3);
  return (p.pago === 'anual' ? (pl.anual || pl.precio) : pl.precio) * u;
}

async function cargarDistribuidores(forzar) {
  if (DISTRIBUIDORES && !forzar) return DISTRIBUIDORES;
  const { data } = await db.from('distribuidores').select('id,nombre,email,telefono,activo').order('nombre');
  DISTRIBUIDORES = (data || []).filter(d => d.activo);
  return DISTRIBUIDORES;
}

function pintarBloqueDistribuidor() {
  const o = $('porig'), fila = o && o.closest('.g2');
  if (!fila || $('pdist') || !PED_DIST) return;
  const l = DISTRIBUIDORES || [], admin = puede('administrar');
  if (PED_DIST.on && !PED_DIST.id && l.length) PED_DIST.id = l[0].id;
  fila.insertAdjacentHTML('afterend', `<div class="pdist" id="pdist"><label>Lo sirve</label>
    <div class="segs" id="pdsirve" role="group" aria-label="Lo sirve"><button type="button" data-ds="0" class="${PED_DIST.on ? '' : 'on'}" aria-pressed="${!PED_DIST.on}">Nosotros</button>
      <button type="button" data-ds="1" class="${PED_DIST.on ? 'on' : ''}" aria-pressed="${PED_DIST.on}">Un distribuidor</button></div>
    <div id="pddat" class="${PED_DIST.on ? '' : 'hide'}">
      ${l.length ? `<div class="g2"><div><label for="pdsel">Distribuidor</label><select id="pdsel">${l.map(d => `<option value="${d.id}" ${d.id === PED_DIST.id ? 'selected' : ''}>${esc(d.nombre)}</option>`).join('')}</select></div>
        <div><label for="pdcod">Código del cliente en el distribuidor</label><input id="pdcod" value="${esc(PED_DIST.codigo)}" placeholder="Si lo tiene"></div></div>
        <label class="opt"><input type="checkbox" id="pdfac" ${PED_DIST.factura ? 'checked' : ''}> Lo factura el distribuidor <span class="sm">· no se emite factura nuestra</span></label>`
      : `<p class="sm">Todavía no hay distribuidores.${admin ? '' : ' Pide a administración que los añada.'}</p>`}
      ${admin ? '<button type="button" class="lnk" id="pdnuevo">+ Nuevo distribuidor</button>' : ''}
      <p class="sm">Un pedido que sirve el distribuidor no descuenta stock de vuestro almacén.</p></div></div>`);
  $('pdist').querySelectorAll('[data-ds]').forEach(b => b.onclick = () => {
    PED_DIST.on = b.dataset.ds === '1';
    if (PED_DIST.on && !PED_DIST.id && l.length) PED_DIST.id = l[0].id;
    $('pdist').querySelectorAll('[data-ds]').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
    $('pddat').classList.toggle('hide', !PED_DIST.on);
  });
  if ($('pdsel')) $('pdsel').onchange = e => { PED_DIST.id = e.target.value; };
  if ($('pdcod')) $('pdcod').oninput = e => { PED_DIST.codigo = e.target.value; };
  if ($('pdfac')) $('pdfac').onchange = e => { PED_DIST.factura = e.target.checked; };
  if ($('pdnuevo')) $('pdnuevo').onclick = () => nuevoDistribuidor();
}

async function nuevoDistribuidor() {
  $('dlg2body').innerHTML = `<div class="fh"><div><h2>Nuevo distribuidor</h2><div class="sm">Mayorista o depósito que sirve pedidos a vuestros clientes</div></div>
      <button class="x" data-cerrar2 aria-label="Cerrar">✕</button></div>
    <label for="dsn">Nombre</label><input id="dsn" placeholder="p. ej. Cofares">
    <div class="g2"><div><label for="dse">Correo para pedidos</label><input id="dse" type="email"></div><div><label for="dst">Teléfono</label><input id="dst" inputmode="tel"></div></div>
    <div class="acts" style="justify-content:flex-end"><button type="button" class="btn sec" data-cerrar2>Cancelar</button><button type="button" class="btn" id="dsok">Añadir</button></div>`;
  $('dlg2').showModal();
  $('dsok').onclick = async () => {
    const nombre = $('dsn').value.trim(); if (!nombre) { toast('Escribe el nombre', true); return; }
    const { data, error } = await db.from('distribuidores').insert({ nombre, email: $('dse').value.trim() || null, telefono: $('dst').value.trim() || null }).select('id').single();
    if (error) { toast('No se ha podido añadir: ' + error.message, true); return; }
    $('dlg2').close(); toast('Distribuidor añadido');
    await cargarDistribuidores(true);
    if (PED_DIST) { PED_DIST.on = true; PED_DIST.id = data.id; }
    const b = $('pdist'); if (b) { b.remove(); pintarBloqueDistribuidor(); }
  };
}

function pkMarcar() {
  const s = $('popf'), v = s ? s.value : '';
  document.querySelectorAll('#operativa [data-pk]').forEach(b => { b.classList.toggle('on', b.dataset.pk === v); b.setAttribute('aria-pressed', b.dataset.pk === v); });
}


/* ============================================================
   v2.314.0 · Pedido con pago por transferencia (aviso de Eric: el correo con los datos de pago solo salía con el pedido
   validado y, si el cliente no pagaba, había que hacer una rectificativa). En el pedido, con la forma de pago
   «Transferencia»: «Enviar los datos de pago» guarda el pedido en borrador y envía el correo; «Guardar y validar» pregunta si
   se guarda en borrador hasta que llegue el pago. En el borrador, el bloque «Pago por transferencia» con el estado del correo,
   «Enviar los datos de pago» y «Pago recibido · validar» (valida el pedido y anota el pago).
   ============================================================ */

function pkFestivo(iso) { return PK_FESTIVOS.includes(iso.slice(5)) || iso === isoMas(pkPascua(+iso.slice(0, 4)), -2); }

function pkLibre(iso) { const w = new Date(iso + 'T12:00:00').getDay(); return w === 0 || w === 6 || pkFestivo(iso); }

function pkDia(iso, n, hoy) {
  const f = new Date(iso + 'T12:00:00'), letra = 'DLMXJVS'[f.getDay()];
  const tit = `${f.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}${pkFestivo(iso) ? ' (festivo)' : ''} · ${num(n)}`;
  return `<span class="${pkLibre(iso) ? 'fin' : ''} ${hoy ? 'u' : ''}" title="${esc(tit)}"><b>${f.getDate()}</b>${letra}</span>`;
}

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

/* ============================================================
   v2.333.0 · Cobro con tarjeta o Bizum con el pedido en borrador hasta que se paga (decisión de Eric, 20/10/2026; SQL 172), como la
   transferencia: en el pedido, con tarjeta o Bizum, «Enviar enlace de pago» guarda el pedido en borrador y envía el SMS; «Guardar y
   validar» pregunta si se envía el enlace o se valida ya. Al pagar, el pedido se confirma solo y queda cobrado (lo hace la base con el aviso
   del banco). Si no paga, sigue en borrador: se reenvía o se elimina, sin rectificativa. Si se cambia un borrador con un enlace enviado y
   cambia el importe, se avisa de enviar uno nuevo (un enlace antiguo pagado no valida nada: avisa para revisarlo).
   ============================================================ */
async function tpvMovilDe(contacto) {
  if (!contacto || !contacto.id) return '';
  const { data: kc } = await db.from('contactos').select('movil,telefono').eq('id', contacto.id).maybeSingle();
  return tpvMovil((kc && (kc.movil || kc.telefono)) || '');
}

async function tpvTrasGuardar(id) {
  await tpvEnviar(id);
  verPedido(id);
  if (TAB === 'ventas') cargarVentas();
}

async function tpvAvisoImporte(id) {
  const [{ data: t }, { data: d }] = await Promise.all([
    db.from('pagos_tpv').select('importe').eq('pedido_id', id).eq('estado', 'Enviado').order('creado_en', { ascending: false }).limit(1).maybeSingle(),
    RPC_ORIG('pedido_detalle', { p_id: id })]);
  const tot = d && d.totales ? +d.totales.total : null;
  if (t && tot != null && Math.abs(+t.importe - tot) > 0.005)
    toast(`El enlace de pago enviado era de ${eurI(+t.importe)} y el pedido es ahora de ${eurI(tot)}: envía uno nuevo desde el pedido`, true);
}


function pedsecVista() { return PEDSEC_CARGA || PEDSEC; }

function abrirKpis() {
  let D = kpiConfig().slice();
  KPI_CAT.forEach(k => { if (!D.some(x => x.id === k.id)) D.push({ id: k.id, on: false, t: '' }); });
  const esAdmin = puede('administrar');
  const pinta = () => {
    $('dbody').innerHTML = `
      <div class="fh"><div><h2>Indicadores de Inicio</h2>
        <div class="sm">Pulsa el ojo para mostrar u ocultar. Ordénalos con las flechas y cambia el nombre si quieres.</div></div>
        <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
      <div class="kcards">${D.map((x, i) => {
        const k = KPI_CAT.find(y => y.id === x.id);
        if (!k && !x.filtro) return '';
        if (k && !kpiPermitido(k)) return '';
        const desc = x.filtro ? 'Filtro guardado del Directorio: ' + textoFiltro(x.filtro) + '.' : (AYUDA_KPI[x.id] || '');
        return `<div class="kcard ${x.on ? 'on' : ''}">
          <button type="button" class="kojo" data-kon="${i}" aria-pressed="${x.on}" title="${x.on ? 'Visible: pulsa para ocultar' : 'Oculto: pulsa para mostrar'}">${x.on ? ICO.ojo : ICO.ojoNo}</button>
          <div class="ktx"><input class="chico" data-kt="${i}" value="${esc(x.t)}" placeholder="${esc(k ? k.t.charAt(0).toUpperCase() + k.t.slice(1) : textoFiltro(x.filtro))}" aria-label="Nombre del indicador">
            <span class="sm">${esc(desc)}</span></div>
          <div class="kord">
            <button type="button" class="kmv" data-kmv="${i}|-1" aria-label="Subir" ${i === 0 ? 'disabled' : ''}>${ICO.arriba}</button>
            <button type="button" class="kmv" data-kmv="${i}|1" aria-label="Bajar" ${i === D.length - 1 ? 'disabled' : ''}>${ICO.abajo}</button>
            ${x.filtro ? `<button type="button" class="kmv" data-kdel="${i}" aria-label="Eliminar" title="Eliminar">✕</button>` : ''}</div>
        </div>`;
      }).join('')}</div>
      <div class="acts" style="justify-content:flex-end">
        <button class="btn sec" id="kres">Restaurar</button>
        <button class="btn" id="kok">Guardar</button></div>`;
    const leer = () => $('dbody').querySelectorAll('[data-kt]').forEach(i => D[+i.dataset.kt].t = i.value.trim());
    $('dbody').querySelectorAll('[data-kon]').forEach(b => b.onclick = () => { leer(); D[+b.dataset.kon].on = !D[+b.dataset.kon].on; $('dlg').dataset.sucio = '1'; pinta(); });
    $('dbody').querySelectorAll('[data-kmv]').forEach(b => b.onclick = () => {
      leer(); const [i, dir] = b.dataset.kmv.split('|').map(Number), j = i + dir;
      if (j < 0 || j >= D.length) return; [D[i], D[j]] = [D[j], D[i]]; $('dlg').dataset.sucio = '1'; pinta();
    });
    $('dbody').querySelectorAll('[data-kdel]').forEach(b => b.onclick = () => { leer(); D.splice(+b.dataset.kdel, 1); $('dlg').dataset.sucio = '1'; pinta(); });
    $('kres').onclick = () => { D = KPI_CAT.map(k => ({ id: k.id, on: KPI_DEF.includes(k.id), t: '' })); $('dlg').dataset.sucio = '1'; pinta(); };
    $('kok').onclick = async ev => {
      leer(); ev.target.disabled = true; ev.target.textContent = 'Guardando…';
      const ok = await guardarKpis(D.map(x => ({ id: x.id, on: x.on, t: x.t, ...(x.filtro ? { filtro: x.filtro } : {}) })));
      ev.target.disabled = false; ev.target.textContent = 'Guardar';
      if (!ok) return;
      $('dlg').close(); toast('Indicadores guardados'); cargarInicio();
    };
  };
  pinta();
  $('dlg').showModal();
}

function esPorcentajeIva(i) {
  // Una vez decidido, no cambia (evita que la comprobación y la conversión se contradigan en bucle)
  if (i.dataset.ivaok) return i.dataset.ivaok === '1';
  // La etiqueta puede apuntar ya a la lista de IVA (id + «_sel») si el campo se convirtió antes
  const lab = (((i.id && (document.querySelector(`label[for="${i.id}"]`) || document.querySelector(`label[for="${i.id}_sel"]`))) || i.closest('label') || {}).textContent || '').trim();
  const clave = i.id + ' ' + (i.dataset.f || '') + ' ' + (i.name || '');
  const r = !(ES_IMPORTE.test(clave) || /importe|precio|total|base|coste/i.test(lab))
    && (i.dataset.f === 'iva' || /(^|[_-])iva$/i.test(i.id) || /^[a-z]{0,3}iva$|^penvv$/i.test(i.id) || /^IVA(\s*\(%\)|\s+del servicio(\s*\(%\))?|\s+%)?$|tipo de iva/i.test(lab));
  i.dataset.ivaok = r ? '1' : '0';
  return r;
}


const veVentas = () => PERFIL && (puede('administrar') || ((PERFIL.areas || {}).V || 0) >= 1 || puede('cartera'));

let VSEC = 'pedidos';


const txtVentanas = v => v && v.length ? v.map(([a, b]) => `${txtMin(a)}–${txtMin(b)}`).join(' y ') : '';


let PEDPAG = 0;

let PEDF = {};   // v2.88.0: filtros por campos del pedido (Clasificadores)


// Pedidos, Oportunidades, Compras y Proveedores: cada uno su entrada en el menú (por dentro, el mismo módulo con su sección)
const ALIAS_PEDIDOS = { oportunidades: 'llamadas', compras: 'compras', proveedores: 'proveedores' };

const TITULO_PEDSEC = { ventas: ['Pedidos', 'Pedidos de tus clientes, con sus unidades e importes'], llamadas: ['Oportunidades', 'Cada venta, se cierre con pedido o no, y por qué'],
  compras: ['Compras', 'Pedidos a proveedores y mercancía en camino'], proveedores: ['Proveedores', 'A quién compras y en qué condiciones'] };


/* v2.162.0 · Suscripciones y pagos con Stripe (decisiones de Eric, 4/10/2026). «Plan y suscripción» ya no manda correos: «Contratar»
   abre el pago seguro de Stripe (tarjeta), «Cambiar a…» y «Añadir o quitar usuarios» cambian la suscripción con
   prorrateo y «Gestionar el pago» abre el portal de Stripe (tarjeta, recibos, cancelar). Todo pasa por la función de Supabase
   «pagos»; Stripe avisa a «stripe-webhook» y la base (aplicar_suscripcion, SQL 102) activa o cambia el plan. Si un cobro falla, aviso
   arriba durante 14 días y después la empresa queda en solo lectura (la base no deja crear, cambiar ni borrar) hasta que pague. */
const PAGO_PLANES = ['campo', 'comercial', 'empresa'];

let PAGO_ESTADO = null;   // la respuesta de plan_uso (plan, usuarios, solo_lectura)

const pagoAlPlan = () => {
  PAGO_IR_PLAN = false;
  try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
};

const pdHace = v => { if (!v) return '—'; const m = Math.round((Date.now() - new Date(v)) / 60000);
  return m < 60 ? `hace ${Math.max(1, m)} min` : m < 1440 ? `hace ${Math.round(m / 60)} h` : `hace ${Math.round(m / 1440)} días`; };

const pdKpis = l => `<div class="pdkpis">${l.map(([v, t, cls]) => `<div class="pdkpi${cls ? ' ' + cls : ''}"><b>${v}</b><span>${esc(t)}</span></div>`).join('')}</div>`;

const pdEsqueleto = () => `<div class="card cfgpanel"><div class="pdkpis">${'<div class="pdkpi"><div class="skel" style="width:50%"></div><div class="skel" style="width:70%"></div></div>'.repeat(4)}</div><div class="skel"></div><div class="skel" style="width:80%"></div></div>`;

/* v2.173.0 · El próximo recibo con IVA en «Plan y suscripción» (petición de Eric por la sesión de la web: que la web, Stripe y la app digan lo mismo).
   Durante la prueba: hoy 0 €, el primer recibo con IVA (con la puesta en marcha si el pago es mensual) y lo que viene después; fuera de ella, el
   próximo recibo y su fecha. Se pinta al momento con la misma cuenta que la web (IVA = redondeo de base × 21 / 100) y, si la función «pagos»
   devuelve el recibo de Stripe (acción datos, campo proximo), se cambia por ese (lleva descuentos y lo ya apuntado). */
let PAGO_PROXIMO = null;

// Pedidos: el precio del contrato en vigor de la ficha (editorPedido lo consulta en su sitio)
let PED_PRECIOS = { cuenta: null, precios: {} };

/* v2.230.0 · KPIs de Pedidos y Analítica (Eric eligió la A de https://claude.ai/artifact/PTBZBvZ3yZrQxpxXCNKyrs).
   - Pedidos: #operativa deja de ser el cartel con los avisos desplegables y pasa a tres tarjetas vivas (pagos por validar, paquetes por
     preparar y facturas por enviar) con su número que cuenta, una frase y la entrada de los últimos 10 días. Pulsar una pone el filtro
     «Operativa» (#popf) de la tabla; volver a pulsarla lo quita. Las cifras son las de la tabla (todos los pendientes). El engranaje
     (#opcfg) sigue eligiendo qué tarjetas se ven.
   - Analítica: cada indicador cuenta hasta su cifra y dibuja la línea de los últimos seis meses (analitica_kpis_periodo por mes, con
     el filtro propio del indicador). Sin línea los de «a día de hoy» y los de texto. */
const PK_TARJ = [['pago', 'pago', 'Pendientes de cobro', 'credit-card'], ['paquete', 'paquete', 'Paquetes por preparar', 'package'],
  ['email_factura', 'email', 'Facturas por enviar', 'mail']];

const pkMovimiento = () => !matchMedia('(prefers-reduced-motion: reduce)').matches;


const PK_FESTIVOS = ['01-01', '01-06', '05-01', '08-15', '10-12', '11-01', '12-06', '12-08', '12-25'];

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

const tpvActivo = () => !!(TPV_VISIBLE && tpvCfg().activo && puedeModulo('ventas'));

const esPagoTpv = fp => /tarjeta|bizum/i.test(fp || '');

const tpvMovil = t => { let m = String(t || '').replace(/\D/g, ''); m = m.replace(/^(0034|34)(?=[67]\d{8}$)/, ''); return /^[67]\d{8}$/.test(m) ? m : ''; };

const TPV_ERR = {
  permiso: 'No tienes permiso para enviar cobros', estado: 'El pedido tiene que estar confirmado', pagado: 'Este pedido ya está cobrado',
  sin_cargo: 'Una entrega sin cargo no se cobra', importe: 'El pedido no tiene importe', sesion: 'La sesión ha caducado: vuelve a entrar',
  sin_configurar: 'El cobro con tarjeta o Bizum no está configurado (Configuración → Facturación)', no_encontrado: 'No se encuentra el pedido'
};

const TPV_EST = { Enviado: ['Enviado', 'p-est'], Pagado: ['Pagado', 'p-trfok'], Fallido: ['No pagado', 'p-urg'], Caducado: ['Caducado', 'p-urg'], Preparado: ['Enviando…', 'p-warn'] };

let TPV_MIRA = null;

// Datos públicos del entorno de pruebas de Redsys (no cobran nada)
const TPV_PRUEBAS = { comercio: '999008881', terminal: '1', clave: 'sq7HjrUOBfKmC576ILgskD5srU870gJ7' };

async function editorPedidoBase(pedido) {
  if (!PRODUCTOS.length) await cargarProductos();
  const ped = pedido && pedido.pedido ? pedido.pedido : null;
  // v2.322.0: un pedido confirmado se edita entero mientras no tenga factura
  if (ped && (ped.estado === 'Anulado' || (ped.estado !== 'Borrador' && ped.factura_id))) { toast(ped.factura_id ? 'Ese pedido ya tiene factura: para cambiarlo, haz una rectificativa' : 'Un pedido anulado no se puede editar', true); return; }
  // v2.200.0: con un contrato en vigor de la ficha, el precio es el adjudicado
  await cargarPreciosContrato((pedido && ((pedido.medico && pedido.medico.id) || (pedido.lineas && pedido.lineas[0] && pedido.lineas[0].cuenta_id) || (pedido.contacto && pedido.contacto.cuenta_id))) || null);
  const prod = id => conPrecioContrato(PRODUCTOS.find(p => p.id === id) || {});
  let lineas = pedido && pedido.lineas && pedido.lineas.length
    ? pedido.lineas.map(l => ({ producto_id: l.producto_id, producto: l.producto, unidades: l.unidades, importe: l.importe,
        descuento: l.descuento || 0, iva: l.iva != null ? +l.iva : prod(l.producto_id).iva,
        // Solo es manual si el importe no coincide con precio × unidades
        manual: prod(l.producto_id).precio == null || r2(prod(l.producto_id).precio * l.unidades) !== r2(l.importe) }))
    : [{ producto_id: productoPorDefecto(), unidades: 1, descuento: 0 }];
  let medico = pedido && pedido.medico ? pedido.medico
    : (pedido && pedido.lineas && pedido.lineas[0] && pedido.lineas[0].cuenta_id ? { id: pedido.lineas[0].cuenta_id, nombre: pedido.lineas[0].medico } : null);
  let contacto = pedido && pedido.contacto ? pedido.contacto : null;
  if (!medico && contacto && contacto.cuenta_id) medico = { id: contacto.cuenta_id, nombre: contacto.medico || `${TT('medico', 's', '', 'l', 'C')} ${TT('paciente', 's', 'del', 'l', 'l')}`, codigo: contacto.medico_codigo || '' };
  const autoImporte = l => { const p = prod(l.producto_id); if (!l.manual && p.precio != null) l.importe = r2(p.precio * (+l.unidades || 0)); if (l.iva == null || !l.manualIva) l.iva = p.iva != null ? +p.iva : l.iva; };
  lineas.forEach(l => { if (l.importe == null) autoImporte(l); if (l.iva == null) l.iva = prod(l.producto_id).iva || 0; });
  // Datos del formulario que se conservan al repintar
  const form = { fecha: ped ? ped.fecha : hoyISO(), canal: ped ? ped.canal : 'paciente', forma_pago: ped ? ped.forma_pago : '',
    descuento: ped ? (ped.descuento || 0) : 0, descuento_tipo: ped ? ped.descuento_tipo : 'porcentaje', nota: ped ? ped.nota || '' : '',
    cuenta_texto: ped ? ped.cuenta_texto || '' : '',
    servicio_id: ped ? (ped.envio ? (ped.servicio_id || ((SERVICIOS[0] || {}).id) || '') : '') : ((SERVICIOS.find(x => x.por_defecto && x.activo) || {}).id || ''),
    envio: ped ? !!ped.envio : !!SERVICIOS.find(x => x.por_defecto && x.activo),
    envio_iva: ped && ped.envio ? +ped.envio_iva : +((SERVICIOS.find(x => x.por_defecto && x.activo) || {}).iva ?? 21),
    envio_con: ped && ped.envio ? r2(+ped.envio_base * (1 + (+ped.envio_iva || 0) / 100)) : +((SERVICIOS.find(x => x.por_defecto && x.activo) || {}).pvp || 0),
    // v2.115.0: origen (web o no) y referencia del pago
    origen: ['web', 'portal'].includes((ped || pedido || {}).origen) ? (ped || pedido).origen : 'manual', pago_referencia: ped ? ped.pago_referencia || '' : '',
    sin_cargo: ped ? !!ped.sin_cargo : false,   // v2.317.0
    reportar: ped ? !!ped.reportar_profesional : false };   // v2.328.0: por defecto no se reporta
  const justifs = [];   // v2.115.0: justificantes elegidos, se suben al guardar
  const leerForm = () => {
    if (!$('pfecha')) return;
    Object.assign(form, { fecha: $('pfecha').value, canal: $('pcan').value, forma_pago: $('ppago').value,
      descuento: $('pdto').value, descuento_tipo: $('pdtot').value, nota: $('pnota').value,
      envio: $('penv').checked, envio_con: +$('penvi').value || 0, envio_iva: +$('penvv').value || 0, servicio_id: $('pserv').value,
      cuenta_texto: $('pselmed') ? ($('pselmed').__texto || '') : form.cuenta_texto,
      origen: $('porig') ? $('porig').value : form.origen, pago_referencia: $('pref') ? $('pref').value : form.pago_referencia,
      sin_cargo: $('psincargo') ? $('psincargo').checked : form.sin_cargo, reportar: $('prepprof') ? $('prepprof').checked : form.reportar });
  };

  const pinta = () => {
    leerForm();
    $('dbody').innerHTML = `
      <div class="fh"><div><h2>${ped ? (ped.estado === 'Confirmado' ? 'Editar pedido' : 'Editar borrador') : 'Nuevo pedido'}</h2>
        <div class="sm">Escribe los importes con IVA: la base y el IVA se calculan solos.</div></div>
        <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
      <div class="g2">
        <div><label for="pfecha">Fecha</label><input id="pfecha" type="date" value="${esc(form.fecha)}"></div>
        <div><label for="pcan">Canal</label><select id="pcan">
          <option value="paciente" ${form.canal !== 'centro' ? 'selected' : ''}>Venta ${TT('paciente', 's', 'al', 'l', 'l')}</option>
          <option value="centro" ${form.canal === 'centro' ? 'selected' : ''}>Venta a centro (con descuento)</option></select></div>
      </div>
      <div class="g2"><div><label for="porig">Origen</label><select id="porig">
          <option value="manual">Comercial, teléfono o correo</option>
          <option value="web" ${form.origen === 'web' ? 'selected' : ''}>Pedido por la web</option>${form.origen === 'portal' ? '<option value="portal" selected>Portal del centro</option>' : ''}</select></div><div></div></div>
      <div id="zonapac" class="${form.canal === 'centro' ? 'escentro' : ''}">
        <label class="solopac">${TT('paciente', 's', '', 'l', 'C')}</label><div id="pselpac" class="solopac"></div>
        <label><span class="solopac">${TT('medico', 's', '', 'l', 'C')} de referencia</span><span class="solocen">Centro que compra</span></label><div id="pselmed"></div>
        <div class="sm" style="margin-top:4px"><span class="solopac">Si no lo encuentras, deja el nombre escrito: el pedido quedará pendiente de atribuir.</span><span class="solocen">Elige su ficha (de tipo centro): las unidades cuentan para el centro y su comercial.</span></div>
        <label class="opt solopac prepbox"><input type="checkbox" id="prepprof" ${form.reportar ? 'checked' : ''}> Reportar ${esc(TT('medico', 's', 'al', 'l', 'l'))}</label>
      </div>
      <label>Líneas</label>
      <div id="plineas">${lineas.map((l, i) => `<div class="lin" data-li="${i}">
        <div class="lrow">
          <div><label>Producto</label><select data-f="producto_id">${opcionesProducto(l.producto_id, l.producto)}</select></div>
          <div><label>Unidades</label><input data-f="unidades" type="number" min="1" value="${l.unidades}"></div>
          <div><label>Importe con IVA</label><input data-f="importeiva" type="number" step="0.01" min="0" value="${l.importe != null ? r2(l.importe * (1 + (+l.iva || 0) / 100)) : ''}"></div>
          <div><label>% dto.</label><input data-f="descuento" type="number" step="1" min="0" max="100" value="${l.descuento || 0}"></div>
          <div>${lineas.length > 1 ? `<button type="button" class="btn sec" data-lx="${i}" aria-label="Quitar línea">✕</button>` : ''}</div>
        </div>
        <div class="ldes" data-des="${i}"></div></div>`).join('')}</div>
      <div class="acts" style="margin-top:0"><button type="button" class="btn sec" id="plmas">+ Añadir línea</button></div>
      <div class="pscbox"><label class="opt"><input type="checkbox" id="psincargo" ${form.sin_cargo ? 'checked' : ''}> Entrega sin cargo (muestra)</label>
        <span class="sm">Las unidades cuentan ${esc(TT('medico', 's', 'al', 'l', 'l'))} de referencia y salen del stock, pero no es una venta: 0 €, sin factura, sin cobro y sin comisión.</span></div>
      <div class="g2 pscg2">
        <div><label for="ppago">Forma de pago</label><select id="ppago"><option value=""></option>
          ${(CAT.forma_pago || []).map(x => `<option ${form.forma_pago === x.valor ? 'selected' : ''}>${esc(x.valor)}</option>`).join('')}</select></div>
        <div><label for="pdto">Descuento general</label>
          <div style="display:flex;gap:6px"><input id="pdto" type="number" min="0" step="0.01" value="${esc(form.descuento)}">
            <select id="pdtot" style="max-width:110px"><option value="porcentaje">%</option>
              <option value="importe" ${form.descuento_tipo === 'importe' ? 'selected' : ''}>€</option></select></div></div>
      </div>
      <div id="ppagox" class="pagofila ${form.forma_pago ? '' : 'hide'}">
        <div class="pagoref"><label for="pref">Referencia del pago</label><input id="pref" value="${esc(form.pago_referencia)}" placeholder="Código de la transferencia, bizum…"></div>
        <span id="ptrfbox" class="pagoacc ${esTransferencia(form.forma_pago) && !(ped && ped.estado === 'Confirmado') ? '' : 'hide'}"><button type="button" class="btn sec" id="ptrfmail">Enviar los datos de pago</button>
          ${pmAyu('Pago por transferencia', 'Envía al cliente los datos de pago y el pedido se guarda en borrador. Cuando llegue el pago, lo confirmas desde el pedido.')}</span>
        <span id="ptpvbox" class="pagoacc ${tpvActivo() && esPagoTpv(form.forma_pago) && !(ped && ped.estado === 'Confirmado') ? '' : 'hide'}"><button type="button" class="btn sec" id="ptpvenv">Enviar enlace de pago</button>
          ${pmAyu('Pago con tarjeta o Bizum', 'Al cliente le llega por SMS el enlace y elige cómo pagar. El pedido espera en borrador y, cuando paga, se confirma solo y queda cobrado con la forma de pago que haya usado.')}</span>
        <div><label>Justificante (foto o PDF)</label><label class="btn sec" style="display:inline-flex">📎 Adjuntar<input id="pjus" type="file" accept="image/*,application/pdf" data-fp="1" hidden></label>
          <div class="sm" id="pjusl">${justifs.map((j, i) => `<span class="jusp">📎 ${esc(j.nombre)} <button type="button" class="lnk" data-jx="${i}" aria-label="Quitar ${esc(j.nombre)}">quitar</button></span>`).join(' ')}</div></div>
      </div>
      <div class="envbox">
        <label for="pserv" style="margin-top:0">Servicio</label>
        <select id="pserv"><option value="">Sin servicio</option>${SERVICIOS.filter(x => x.activo || x.id === form.servicio_id).map(x =>
          `<option value="${x.id}" ${form.servicio_id === x.id ? 'selected' : ''}>${esc(x.nombre)} · ${eurI(x.pvp || 0)} con IVA</option>`).join('')}</select>
        <input type="checkbox" id="penv" class="hide" ${form.envio ? 'checked' : ''}>
        <div class="g2 ${form.envio ? '' : 'hide'}" id="penvd">
          <div><label for="penvi">Importe del servicio con IVA (€)</label><input id="penvi" type="number" step="0.01" min="0" value="${esc(form.envio_con)}"></div>
          <div><label for="penvv">IVA del servicio (%)</label><input id="penvv" type="number" step="1" min="0" max="21" value="${esc(form.envio_iva)}"></div></div>
      </div>
      <div class="totbox" id="ptot"></div>
      <label for="pnota">Nota</label><input id="pnota" value="${esc(form.nota)}">
      <div class="acts" style="justify-content:flex-end">
        <button class="btn sec" data-cerrar>Cancelar</button>
        <button class="btn sec ${ped && ped.estado === 'Confirmado' ? 'hide' : ''}" id="pborr">Guardar borrador</button>
        <button class="btn" id="pvalid">${ped && ped.estado === 'Confirmado' ? 'Guardar cambios' : 'Guardar y confirmar'}</button></div>`;   // v2.322.0

    const desglose = () => {
      if ($('psincargo') && $('psincargo').checked) lineas.forEach(l => { l.descuento = 100; });   // v2.317.0
      lineas.forEach((l, i) => {
        const d = lineaDesglose(l), el = $('plineas').querySelector(`[data-des="${i}"]`);
        if (el) el.innerHTML = `<span>Base <b>${eurI(d.base)}</b></span><span>IVA ${num(l.iva || 0)}% <b>${eurI(d.iva)}</b></span><span>Total <b>${eurI(d.total)}</b></span>
          ${prod(l.producto_id).precio != null ? `<span>Precio unidad ${eurI(prod(l.producto_id).precio * (1 + (+prod(l.producto_id).iva || 0) / 100))} con IVA</span>` : ''}${prod(l.producto_id).contrato ? `<span class="pill p-est" title="${esc(prod(l.producto_id).contrato)}">Precio de concurso</span>` : ''}`;
      });
      $('penvd').classList.toggle('hide', !$('penv').checked);
      $('ptot').innerHTML = bloqueTotales(totalesPedido(lineas, +$('pdto').value || 0, $('pdtot').value,
        { on: $('penv').checked, con: +$('penvi').value || 0, iva: +$('penvv').value || 0,
          nombre: ((SERVICIOS.find(x => x.id === $('pserv').value) || {}).nombre) || 'Servicio' }));
    };

    $('plineas').oninput = $('plineas').onchange = e => {
      const box = e.target.closest('[data-li]'); if (!box) return;
      const l = lineas[+box.dataset.li], f = e.target.dataset.f;
      if (!f) return;
      l[f] = f === 'producto_id' ? e.target.value : (e.target.value === '' ? null : +e.target.value);
      if (f === 'importeiva') { l.importe = e.target.value === '' ? null : +e.target.value / (1 + (+l.iva || 0) / 100); delete l.importeiva; l.manual = true; }
      if (f === 'producto_id') { l.manual = false; l.iva = prod(l.producto_id).iva || 0; }
      if (f === 'producto_id' || f === 'unidades') {
        autoImporte(l);
        box.querySelector('[data-f="importeiva"]').value = l.importe != null ? r2(l.importe * (1 + (+l.iva || 0) / 100)) : '';
      }
      desglose();
    };
    $('plmas').onclick = () => { lineas.push({ producto_id: productoPorDefecto(), unidades: 1, descuento: 0 }); autoImporte(lineas[lineas.length - 1]); pinta(); };
    $('plineas').querySelectorAll('[data-lx]').forEach(b => b.onclick = () => { lineas.splice(+b.dataset.lx, 1); pinta(); });
    $('pcan').onchange = () => $('zonapac').classList.toggle('escentro', $('pcan').value === 'centro');
    $('ppago').onchange = () => { $('ppagox').classList.toggle('hide', !$('ppago').value); $('ptrfbox').classList.toggle('hide', !esTransferencia($('ppago').value) || !!(ped && ped.estado === 'Confirmado'));
      $('ptpvbox').classList.toggle('hide', !(tpvActivo() && esPagoTpv($('ppago').value)) || !!(ped && ped.estado === 'Confirmado')); };   // v2.314.0 y v2.333.0
    $('pjus').onchange = async e => {
      const f = e.target.files[0]; e.target.value = ''; if (!f) return;
      const j = await leerJustificante(f); if (!j) return;
      justifs.push(j); pinta();
    };
    $('dbody').querySelectorAll('[data-jx]').forEach(b => b.onclick = () => { justifs.splice(+b.dataset.jx, 1); pinta(); });
    ['pdto', 'pdtot', 'penv', 'penvi', 'penvv'].forEach(id => $(id).oninput = $(id).onchange = desglose);
    $('pserv').onchange = () => {
      const sv = SERVICIOS.find(x => x.id === $('pserv').value);
      $('penv').checked = !!sv;
      if (sv) { $('penvi').value = r2(sv.pvp || 0); $('penvv').value = sv.iva != null ? sv.iva : 21; }
      desglose();
    };
    desglose();

    // v2.200.0: al cambiar de ficha, los precios de su contrato (si lo hay) en las líneas que no se han tocado a mano
    const precios = () => cargarPreciosContrato(medico && medico.id).then(c => { if (c) { lineas.forEach(l => { if (!l.manual) autoImporte(l); }); pinta(); } });
    const montarMed = () => {
      $('pselmed').__texto = medico ? '' : form.cuenta_texto;
      selectorMedico($('pselmed'), { valor: medico, placeholder: 'Nombre, código, centro o municipio', alElegir: m => { medico = m; precios(); } });
    };
    selectorPaciente($('pselpac'), { valor: contacto, alElegir: c => {
      contacto = c;
      if (c && !medico && c.cuenta_id) { medico = { id: c.cuenta_id, nombre: c.medico, codigo: c.medico_codigo }; montarMed(); precios(); }
    } });
    montarMed();

    const guardar = async (estado, btn, o = {}) => {
      if (!lineas.some(l => l.producto_id)) { toast('Añade al menos un producto', true); return; }
      const cps = camposLeer($('dbody'));
      if (cps && cps.falta.length) { toast(`Rellena «${cps.falta[0]}»`, true); return; }
      let trfVal = false;   // v2.314.0: con transferencia, el pedido puede esperar al pago en borrador
      const sc = !!($('psincargo') && $('psincargo').checked);   // v2.317.0: entrega sin cargo
      const yaVal = !!(ped && ped.estado === 'Confirmado');   // v2.322.0: validado y sin factura: se guarda tal cual, sin volver a preguntar
      // v2.333.0: con tarjeta o Bizum (y el cobro activo) se elige: enviar el enlace (el pedido espera al pago en borrador y se confirma solo
      // al pagar) o validar ya (cobrado de otra forma). Sin móvil del cliente, se confirma como siempre y se avisa.
      let tpvSinMovil = false;
      if (!sc && !yaVal && estado === 'Confirmado' && !o.alGuardar && tpvActivo() && esPagoTpv($('ppago').value)) {
        if (!await tpvMovilDe(contacto)) tpvSinMovil = true;
        else {
          const v = await elegirOpcion('Pago con tarjeta o Bizum', `Se le puede enviar por SMS el enlace de pago: el pedido espera en borrador y, cuando paga, se confirma solo y queda cobrado. Si ya lo habéis cobrado de otra forma, valídalo ya.`,
            [{ k: 'no', t: 'Cancelar', cls: 'sec' }, { k: 'validar', t: 'Confirmar ya', cls: 'sec' }, { k: 'enlace', t: 'Enviar enlace de pago' }]);
          if (!v) return;
          if (v === 'enlace') { estado = 'Borrador'; o = Object.assign({}, o, { alGuardar: tpvTrasGuardar }); } else trfVal = true;
        }
      }
      if (!medico && contacto && contacto.id && !$('zonapac').classList.contains('escentro')) {   // v2.329.0
        const { data: kc } = await db.from('contactos').select('cuenta_id, cuenta_por_pedido').eq('id', contacto.id).maybeSingle();
        if (kc && kc.cuenta_id && !kc.cuenta_por_pedido) medico = { id: kc.cuenta_id, nombre: contacto.medico || '' };
      }
      if (sc && !medico && !await preguntar(`Sin ${TT('medico', 's', '', 'l', 'l')} de referencia, estas unidades no cuentan a nadie.`, { titulo: 'Entrega sin cargo', ok: 'Guardar igualmente' })) return;
      if (!sc && !yaVal && estado === 'Confirmado' && esTransferencia($('ppago').value)) {
        const v = await elegirOpcion('Pago por transferencia', 'Este pedido se puede guardar en borrador hasta que llegue el pago: no cuenta en métricas ni comisiones y aún se puede cambiar. Cuando llegue la transferencia, lo confirmas desde el pedido.',
          [{ k: 'no', t: 'Cancelar', cls: 'sec' }, { k: 'validar', t: 'Confirmar ya', cls: 'sec' }, { k: 'borrador', t: 'Guardar en borrador' }]);
        if (!v) return;
        if (v === 'borrador') estado = 'Borrador'; else trfVal = true;
      }
      if (estado === 'Confirmado' && !trfVal && !yaVal && !await preguntar('Una vez confirmado, el pedido cuenta en métricas y comisiones y ya no se puede editar ni eliminar: solo anular.',
        { titulo: '¿Confirmar el pedido?', ok: 'Confirmar' })) return;
      btn.disabled = true; const txt = btn.textContent; btn.textContent = 'Guardando…';
      const { data: r, error } = await db.rpc('guardar_pedido', { p: {
        id: ped ? ped.id : null, estado,
        fecha: $('pfecha').value, canal: $('pcan').value,
        cuenta_id: medico ? medico.id : null, cuenta_texto: medico ? '' : ($('pselmed').__texto || '').trim(),
        contacto_id: contacto ? contacto.id : null, nota: $('pnota').value.trim(),
        forma_pago: $('ppago').value || null, origen: $('porig').value, pago_referencia: $('ppago').value ? $('pref').value.trim() : '',
        descuento: +$('pdto').value || 0, descuento_tipo: $('pdtot').value,
        envio: $('penv').checked, envio_con_iva: +$('penvi').value || 0, envio_iva: +$('penvv').value || 0, servicio_id: $('pserv').value || null,
        sin_cargo: sc,
        lineas: lineas.filter(l => l.producto_id).map(l => ({ producto_id: l.producto_id, unidades: l.unidades || 1,
          importe: l.importe, descuento: l.descuento || 0, iva: l.iva })),
        op_id: 'p-' + Date.now()
      }});
      btn.disabled = false; btn.textContent = txt;
      if (error || (r && r.ok === false)) {
        toast(r && r.error === 'facturado' ? 'Ese pedido ya tiene factura: para cambiarlo, haz una rectificativa' : r && r.error === 'validado' ? 'Ese pedido ya no se puede editar'
          : 'No se ha podido guardar: ' + ((error && error.message) || 'sin permiso'), true);
        return;
      }
      if (cps && !(await camposGuardar(cps, (r && r.id) || (ped && ped.id)))) return;
      {   // v2.328.0: reportar al profesional solo si se marca (por defecto, no)
        const rid = (r && r.id) || (ped && ped.id), rep = !!($('prepprof') && $('prepprof').checked) && !$('zonapac').classList.contains('escentro');
        if (rid && (rep || (ped && ped.reportar_profesional))) {
          const { data: mr, error: me } = await db.rpc('marcar_reporte', { p_id: rid, p_valor: rep });
          if (me || (mr && mr.ok === false)) toast('El pedido se ha guardado, pero no se ha podido cambiar «Reportar»', true);
        }
      }
      if (justifs.length && !(await subirJustificantes((r && r.id) || (ped && ped.id), justifs))) return;
      $('dlg').close();
      if (o.alGuardar) { await o.alGuardar((r && r.id) || (ped && ped.id)); return; }   // v2.314.0
      toast(yaVal ? 'Pedido actualizado' : sc ? (estado === 'Borrador' ? 'Entrega sin cargo guardada en borrador' : 'Entrega sin cargo confirmada') : estado === 'Borrador' ? (esTransferencia($('ppago').value) ? 'Guardado en borrador hasta que llegue el pago' : 'Borrador guardado') : (medico ? 'Pedido confirmado y atribuido' : 'Pedido confirmado · pendiente de atribuir'));
      if (tpvSinMovil) toast(`Pedido confirmado. Sin móvil ${TT('paciente', 's', 'del', 'l', 'l')} no se puede enviar el enlace de pago: cóbralo como siempre`);   // v2.333.0
      if (estado === 'Borrador' && ped && ped.id) tpvAvisoImporte(ped.id);
      if (TAB === 'ventas') cargarVentas();
      if (TAB === 'pacientes') listaPacientes();
      if ($('ficha').open && FICHA_PAC) fichaPaciente(FICHA_PAC);
    };
    $('pborr').onclick = e => guardar('Borrador', e.target);
    $('psincargo').onchange = () => { leerForm(); lineas.forEach(l => { l.descuento = form.sin_cargo ? 100 : 0; }); pinta(); };   // v2.317.0
    $('ptrfmail').onclick = e => {   // v2.314.0: guarda en borrador y envía los datos de pago
      if (!contacto) { toast(`Elige ${TT('paciente', 's', 'el', 'l', 'l')} para enviarle los datos de pago`, true); return; }
      if (!((AJUSTES.empresa || {}).iban || '').trim()) { toast('Falta el IBAN: ponlo en Configuración → Facturación → Datos fiscales antes de enviar los datos de pago', true); return; }
      guardar('Borrador', e.target, { alGuardar: async id => { await enviarDatosPago(id); verPedido(id); if (TAB === 'ventas') cargarVentas(); } });
    };
    $('ptpvenv').onclick = async e => {   // v2.333.0: guarda en borrador y envía el enlace de pago
      if (!contacto) { toast(`Elige ${TT('paciente', 's', 'el', 'l', 'l')} para enviarle el enlace de pago`, true); return; }
      if (!await tpvMovilDe(contacto)) { toast(`${TT('paciente', 's', '', 'l', 'C')} no tiene móvil: añádelo en su ficha para enviarle el enlace de pago`, true); return; }
      guardar('Borrador', e.target, { alGuardar: tpvTrasGuardar });
    };
    $('pvalid').onclick = e => guardar('Confirmado', e.target);
    // Campos personalizados del pedido: se conservan al repintar
    if ((CAMPOS.pedido || []).some(c => c.en_ficha) && $('pnota')) {
      const poner = () => { if ($('dbody').querySelector('.cpersform')) return;
        $('pnota').insertAdjacentHTML('afterend', camposHTML('pedido', cpPed));
        $('dbody').querySelector('.cpersform').addEventListener('input', e => { const i = e.target.closest('[data-cpk]'); if (i) cpPed[i.dataset.cpk] = i.value; });
        $('dbody').querySelector('.cpersform').addEventListener('change', e => { const i = e.target.closest('[data-cpk]'); if (i) cpPed[i.dataset.cpk] = i.value; }); };
      if (cpPed) poner();
      else if (ped && ped.id) db.from('pedidos').select('clasificadores').eq('id', ped.id).maybeSingle().then(({ data }) => { cpPed = Object.assign({}, (data && data.clasificadores) || {}); poner(); });
      else { cpPed = {}; poner(); }
    }
  };
  let cpPed = null;
  pinta();
  $('dlg').showModal();
}


// Aviso arriba si hay un cobro pendiente o la cuenta está en solo lectura
function pagoAvisoBase() {
  const e = PAGO_ESTADO || {}, pl = e.plan || {}; let el = $('pagoaviso');
  const msg = e.solo_lectura ? 'Tu empresa está en <b>solo lectura</b> porque hay un pago pendiente. Puedes consultar y exportar; para volver a trabajar, actualiza el pago.'
    : pl.estado === 'impago' ? 'No hemos podido cobrar tu suscripción. Actualiza el método de pago antes de 14 días para no quedarte en solo lectura.' : '';
  if (!msg) { if (el) el.remove(); return; }
  const main = document.querySelector('main'); if (!main) return;
  if (!el) { main.insertAdjacentHTML('afterbegin', '<div id="pagoaviso" class="banda-peligro" role="alert"></div>'); el = $('pagoaviso'); }
  el.innerHTML = msg + (puedeOrganizacion() ? ' <button type="button" class="btn sec" id="pgavbtn">Gestionar el pago</button>' : ' Avisa a quien gestiona la cuenta de tu empresa.');
  if ($('pgavbtn')) $('pgavbtn').onclick = ev => pagoPortal(ev.target);
}

// En los 7 últimos días de la prueba, aviso arriba (no tapa los de impago o solo lectura)
function pagoAviso(...a) {
  const r = pagoAvisoBase.apply(this, a);
  const pl = (PAGO_ESTADO || {}).plan || PLAN_ACTUAL || {}, n = diasHasta(pl.periodo_fin);
  let el = $('pruebaaviso');
  const ver = pl.en_prueba && !pl.baja_al_final && n != null && n >= 0 && n <= 7 && !$('pagoaviso') && puedeOrganizacion();
  if (!ver) { if (el) el.remove(); return r; }
  const main = document.querySelector('main'); if (!main) return r;
  if (!el) { main.insertAdjacentHTML('afterbegin', '<div id="pruebaaviso" class="banda-info" role="status"></div>'); el = $('pruebaaviso'); }
  el.innerHTML = `Tu prueba termina ${n === 0 ? 'hoy' : n === 1 ? 'mañana' : `en ${n} días`} (${fechaCorta(pl.periodo_fin)}): ese día se pasa el primer recibo.
    Revisa que tus datos de facturación están bien. <button type="button" class="btn sec" id="pruebaver">Revisar mis datos</button>`;
  $('pruebaver').onclick = () => ir('plan');
  return r;
}

async function editorPedido(pedido, ...a) {
  const ped = pedido && pedido.pedido ? pedido.pedido : null;
  PED_DIST = { on: !!(ped && ped.distribuidor_id), id: (ped && ped.distribuidor_id) || '', codigo: (ped && ped.distribuidor_codigo) || '',
    factura: ped && ped.distribuidor_id ? !!ped.factura_distribuidor : true };
  await cargarDistribuidores().catch(() => []);
  return editorPedidoBase.call(this, pedido, ...a);
}

function pkContarBase(els, fmt) {
  if (!pkMovimiento()) { els.forEach(el => el.textContent = fmt(+el.dataset.v, el)); return; }
  const t0 = performance.now();
  const paso = t => { const p = Math.min(1, (t - t0) / 900), e = 1 - Math.pow(1 - p, 3); els.forEach(el => { if (el.isConnected) el.textContent = fmt(+el.dataset.v * e, el); }); if (p < 1) requestAnimationFrame(paso); };
  requestAnimationFrame(paso);
}

function pkContar(els, fmt) {
  if (plYaContado('pk' + els.length, els.map(e => e.dataset.v))) { els.forEach(el => el.textContent = fmt(+el.dataset.v, el)); return; }
  return pkContarBase(els, fmt);
}


async function pagoCargarEstadoBase() {
  const { data } = await RPC_ORIG('plan_uso', {});
  if (!data) return;
  PAGO_ESTADO = data; if (data.plan && data.plan.plan) PLAN_ACTUAL = data.plan;
  pagoAviso();
}

async function pagoCargarEstadoBase2(...a) { const r = await pagoCargarEstadoBase.apply(this, a); marcarFacPlan(); return r; }

// Se sabe al entrar (plan_uso): en la de plataforma, a Clientes
async function pagoCargarEstado(...a) {
  const antes = MODO_PLATAFORMA;
  const r = await pagoCargarEstadoBase2.apply(this, a);
  MODO_PLATAFORMA = !!(PAGO_ESTADO && PAGO_ESTADO.plataforma);
  if (MODO_PLATAFORMA !== antes) {
    aplicarModoPlataforma();
    if (MODO_PLATAFORMA && TAB !== 'delcos' && TAB !== 'config') ir('pd-orgs');
  }
  return r;
}


// Ventana de contratar o cambiar (la de la v2.162.0, con la bajada al final del periodo y lo que se pierde)
function elegirPago(planIni) {
  const pl = PLAN_ACTUAL || {}, conSus = !!pl.stripe_suscripcion, usados = +((PAGO_ESTADO || {}).usuarios || 0);
  if (pl.plan === 'medida') { toast('Con el plan A medida, los cambios se hacen con delcos'); return; }
  const est = { plan: PAGO_PLANES.includes(planIni) ? planIni : (PAGO_PLANES.includes(pl.plan) ? pl.plan : 'comercial'),
    pago: pl.pago === 'anual' ? 'anual' : 'mensual', usuarios: Math.max(3, usados, +pl.usuarios || 0) };
  const actual = { plan: pl.plan, pago: pl.pago === 'anual' ? 'anual' : 'mensual', usuarios: +pl.usuarios || 0 };
  const pinta = () => {
    const p = planDe(est.plan), anual = est.pago === 'anual';
    const base = anual ? p.precio * 10 * est.usuarios : p.precio * est.usuarios;
    const puesta = !anual && !conSus ? PUESTA_EN_MARCHA : 0;
    const iva = Math.round((base + puesta) * 21) / 100;
    const baja = conSus && esBajada(actual, est), fin = pl.periodo_fin ? fechaCorta(pl.periodo_fin) : 'el final del periodo pagado';
    const pierde = conSus ? perdidasPlan(pl.plan, est.plan, Object.assign({}, PAGO_ESTADO || {}, { extras: pl.extras })) : [];
    $('dbody').innerHTML = `<div class="fh"><div><h2>${conSus ? 'Cambiar la suscripción' : 'Contratar delcos'}</h2>
        <div class="sm">Precios por usuario, IVA no incluido. ${!conSus ? 'El pago se hace en la página segura de Stripe.' : baja ? '' : 'El cambio se aplica ya y se prorratea en el próximo recibo.'}</div></div>
        <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
      <label>Plan</label><div class="segs pgplan" role="group">${PAGO_PLANES.map(k => `<button type="button" data-pgp="${k}" class="${est.plan === k ? 'on' : ''}" aria-pressed="${est.plan === k}">${esc(planDe(k).nombre)} · ${eurI(planDe(k).precio)}</button>`).join('')}</div>
      <label style="margin-top:12px">Pago</label><div class="segs" role="group">
        <button type="button" data-pga="mensual" class="${anual ? '' : 'on'}" aria-pressed="${!anual}">Mensual</button>
        <button type="button" data-pga="anual" class="${anual ? 'on' : ''}" aria-pressed="${anual}">Anual · pagas 10 meses de 12</button></div>
      <label for="pgusu" style="margin-top:12px">Usuarios</label><input id="pgusu" type="number" min="${Math.max(3, usados)}" value="${est.usuarios}" class="numw">
      <span class="sm">${usados ? `Ahora usáis ${num(usados)}. ` : ''}Mínimo ${Math.max(3, usados)}.</span>
      ${baja ? `<div class="banda-aviso" id="pgbaja">El cambio se aplicará el <b>${esc(fin)}</b>, al acabar lo que ya has pagado. Hasta entonces sigues con
        ${esc(planDe(pl.plan).nombre)}${pierde.length ? ` y después dejarás de tener:<ul id="pgpierde">${pierde.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '.'}</div>` : ''}
      <div class="pgres">
        <div><span>${num(est.usuarios)} × ${eurI(anual ? p.precio * 10 : p.precio)} ${anual ? 'al año' : 'al mes'}</span><b>${eurI(base)}</b></div>
        ${puesta ? `<div><span>Puesta en marcha (una vez; incluida con pago anual)</span><b>${eurI(puesta)}</b></div>` : ''}
        <div><span>IVA 21 %</span><b>${eurI(iva)}</b></div>
        <div class="pgtot"><span>${!conSus ? 'Primer cobro' : baja ? 'Importe desde el ' + esc(fin) : 'Nuevo importe'}</span><b>${eurI(base + puesta + iva)}</b></div></div>
      <div class="acts" style="justify-content:flex-end"><button class="btn sec" data-cerrar>Cancelar</button>
        <button class="btn" id="pgok">${!conSus ? 'Ir al pago seguro' : baja ? 'Programar el cambio' : 'Confirmar el cambio'}</button></div>`;
    $('dbody').querySelectorAll('[data-pgp]').forEach(b => b.onclick = () => { est.plan = b.dataset.pgp; pinta(); });
    $('dbody').querySelectorAll('[data-pga]').forEach(b => b.onclick = () => { est.pago = b.dataset.pga; pinta(); });
    $('pgusu').onchange = () => { est.usuarios = Math.max(3, usados, Math.floor(+$('pgusu').value || 0)); pinta(); };
    $('pgok').onclick = async ev => {
      const d = await pagoLlamar({ accion: conSus ? 'cambiar' : 'checkout', plan: est.plan, pago: est.pago, usuarios: est.usuarios }, ev.target);
      if (!d) return;
      if (d.url) { location.href = d.url; return; }
      $('dlg').close();
      if (d.previsto) { toast(`Cambio programado para el ${fechaCorta(d.previsto)}`); await pagoCargarEstado(); if (TAB === 'plan' || TAB === 'organizacion' || TAB === 'config') ir(TAB); return; }
      toast('Cambio hecho: en unos segundos verás el plan nuevo'); pagoEsperarActivo();
    };
  };
  pinta(); $('dlg').showModal();
}

// Pedidos está en src/app/screens/orders (v2.414.0). Estos nombres se quedan: el editor del pedido y el cobro con tarjeta (aquí),
// otras pantallas, legado 001/034/057/058/073/082/089/105/139, «‹ Volver» y las pruebas los usan.
function cargarVentas() { return window.delcos.screens.orders.loadSales(); }
function listaPedidos() { return window.delcos.screens.orders.paintOrderList(); }
function verPedido(id) { return window.delcos.screens.orders.showOrder(id); }
function pintarDistribuidores() { return window.delcos.screens.orders.paintDistributors(); }
function configurarAvisosPedidos(oblig) { return window.delcos.screens.orders.configureAlerts(oblig || []); }
function enviarDatosPago(id) { return window.delcos.screens.orders.sendPaymentDetails(id); }
function totalesPedido(lineas, d, dt, env) { return window.delcos.screens.orders.orderTotals(lineas, d, dt, env); }
function lineaDesglose(l) { return window.delcos.screens.orders.lineBreakdown(l); }
function bloqueTotales(t) { return window.delcos.screens.orders.totalsHtml(t); }
function esTransferencia(fp) { return window.delcos.screens.orders.isBankTransfer(fp); }
function sinCargoP(p, total) { return window.delcos.screens.orders.isFree(p, total); }
function pasoPedido(p) { return window.delcos.screens.orders.orderStep(p); }
function pillPaso(p) { return window.delcos.screens.orders.stepPill(p); }
function pillEstado(e) { return window.delcos.screens.orders.statePill(e); }
function asuntoEmailPago(p, total, cliente) { return window.delcos.screens.orders.paymentSubject(p, total, cliente); }
function textoEmailPago(p, total, cliente) { return window.delcos.screens.orders.paymentText(p, total, cliente); }
