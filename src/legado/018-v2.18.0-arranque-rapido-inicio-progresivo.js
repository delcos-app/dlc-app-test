/* ============================================================
   DLC OS 2.0 · v2.18.0 · Arranque rápido, Inicio progresivo,
   pedidos con IVA y borrador, productos, pacientes y agenda
   ============================================================ */

Object.assign(RPC_TTL, { clientes_lista: 30, responsable_de_cuenta: 60 });

/* ---------------- arranque: la app aparece al momento ----------------
   Si hay sesión guardada, se muestra la app con el último perfil conocido y se comprueba
   después. En la consola del navegador queda el tiempo de cada paso: [DLC OS] … ms */

const T0 = performance.now();
const PKEY = 'dlc-perfil';

/* Entrada en la plataforma con el perfil de la persona.
   Reúne en una sola función lo que antes estaba repartido en 21 capas añadidas versión a versión,
   con el mismo orden de ejecución. */
function mostrarApp(perfil) {
  const p = perfil, pref = p.preferencias || {};

  // 1. Con el enlace de recuperación de contraseña no se abre la plataforma
  if (RECUPERANDO) { pantallaRecuperacion(); return; }

  // 2. Idioma del perfil (como mucho una recarga por sesión para aplicarlo)
  const idioma = pref.idioma || 'es';
  let guardado = 'es'; try { guardado = localStorage.getItem('app-idioma') || 'es'; } catch (e) {}
  if (idioma !== guardado) {
    let ya = false; try { ya = sessionStorage.getItem('app-idioma-recarga') === idioma; } catch (e) {}
    try { localStorage.setItem('app-idioma', idioma); sessionStorage.setItem('app-idioma-recarga', idioma); } catch (e) {}
    if (!ya) { location.reload(); return; }
  }
  prepararIdioma(idioma);

  const primera = !APP_VISIBLE;
  document.body.classList.remove('sin-sesion');

  // 3. Indicadores de Inicio guardados: se completan con los que se han añadido después
  if (Array.isArray(pref.kpis) && pref.kpis.length) {
    ['uds_mes', 'prescriptores', 'citas_7d', 'sin_visita_60'].forEach(id => { if (!pref.kpis.some(x => x.id === id)) pref.kpis.push({ id, on: true, t: '' }); });
    KPI_CAT.forEach(k => { if (!pref.kpis.some(x => x.id === k.id)) pref.kpis.push({ id: k.id, on: false, t: '' }); });
  }

  // 4. Datos de la persona y pantalla principal
  PERFIL = p;
  $('bootsplash').classList.add('hide');
  $('login').classList.add('hide');
  $('app').classList.remove('hide');
  $('av').textContent = iniciales(p.nombre);
  $('uname').textContent = nombrePila(p.nombre);
  $('umnom').textContent = p.nombre;
  $('umrol').textContent = p.rol + ' · ' + p.email;
  const h = new Date().getHours();
  $('hola').textContent = (h < 13 ? 'Buenos días' : h < 20 ? 'Buenas tardes' : 'Buenas noches') + ', ' + nombrePila(p.nombre);
  $('hoyfecha').textContent = fechaLarga(new Date()).replace(/^./, c => c.toUpperCase());
  $('nuevoBtn').classList.toggle('hide', !puedeCrear());
  $('dupBtn').classList.toggle('hide', !puede('administrar'));
  document.querySelectorAll('#nav [data-t="ventas"], #nav [data-t="pacientes"], #nav [data-t="productos"]').forEach(b => b.classList.toggle('hide', !veVentas()));
  if (!APP_VISIBLE) {
    APP_VISIBLE = true;
    cargarCatalogos();
    pintarRutaBarra();
    cargarInicio();
    cargarFiltros();
  }
  $('fcomwrap').classList.toggle('hide', !VE_TODO());
  if (VE_TODO()) cargarComerciales();
  cargarAjustes();
  if (EN_PRUEBAS) pintarFranjaPruebas();

  // 5. Barra inferior, «Entrar como», manual y módulos según permisos
  pintarBarraSuplantacion();
  pintarBnav();
  if (!$('manbtn')) {
    const ub = document.querySelector('[data-u="cfg"]');
    if (ub) ub.insertAdjacentHTML('beforebegin', '<button data-u="manual" id="manbtn">Manual de uso</button>');
  }
  document.querySelectorAll('[data-t="facturacion"]').forEach(b => b.classList.toggle('hide', !VE_TODO()));
  aplicarPermisosMenu();

  // 6. Médicos con acceso: solo ven su informe
  document.body.classList.toggle('modo-medico', puede('portal_prescriptor'));
  if (puede('portal_prescriptor')) {
    document.querySelectorAll('nav.main [data-t]').forEach(b => b.classList.add('hide'));
    let bi = document.querySelector('nav.main [data-t="informe"]');
    if (!bi) { document.querySelector('nav.main .in').insertAdjacentHTML('afterbegin', `<button data-t="informe" aria-selected="true">${puede('portal_centro') ? 'Mi centro' : 'Mi informe'}</button>`); bi = document.querySelector('nav.main [data-t="informe"]'); }
    bi.classList.remove('hide');
    if (!$('mdavisos')) $('ubtn').insertAdjacentHTML('beforebegin', '<button class="mdavisos" id="mdavisos" aria-label="Avisos"></button>');
    pintarAvisos();
    if ($('q')) $('q').closest('.gsearch').classList.add('hide');
    setTimeout(() => ir('informe'), 0);
  }

  // 7. Menú de usuario y marca de la empresa
  document.querySelectorAll('[data-u="adm"]').forEach(b => b.classList.add('hide'));
  aplicarMarca();
  const admin = puede('administrar');
  const pl = document.querySelector('[data-u="plan"]'); if (pl) pl.classList.toggle('hide', !admin);
  const em = document.querySelector('[data-u="empresa"]'); if (em) em.classList.toggle('hide', !admin);

  // 8. Notificaciones, módulo de inicio preferido y resumen del día
  setTimeout(refrescarCampana, 800);
  // v2.111.0: tras F5 se vuelve a la pantalla en la que se estaba (Ctrl+F5 entra de cero, por el inicio)
  const f5 = primera ? pantallaTrasF5() : null;
  if (f5) setTimeout(() => volverTrasF5(f5), 50);
  else if (primera && pref.inicio && pref.inicio !== 'inicio' && puedeModulo(pref.inicio)) setTimeout(() => ir(pref.inicio), 50);
  if (!puede('portal_prescriptor')) setTimeout(() => Promise.resolve(RPC_ORIG('avisos_del_dia', {})).then(r => { if (r && r.data && r.data.nuevo) refrescarCampana(); }, () => {}), 1500);

  // 9. Traducción, iconos y orden del menú
  if (MAPA_I18N) traducir(document.body);
  const m = $('manbtn'); if (m && !m.querySelector('svg')) m.insertAdjacentHTML('afterbegin', svgIco(ICON_NOM['book-open']) + ' ');
  setTimeout(iconosMenu, 0);
  setTimeout(() => { ordenarMenu(); botonCalidad(); }, 0);
}



/* ---------------- inicio: esqueleto y carga por partes ---------------- */


/* pintarInicio: la parte base y, en orden, cada paso que se le añade (antes eran 5 capas separadas). */
async function pintarInicio() {
  await pintarInicioBase();
  await inicioResumenSemanaYVentas();
  await inicioOperativaPedidos();
  await inicioVistazoEIndicadores();
  await inicioLlamadasHoy();
  await inicioFiltrarAlertas();
}







/* ---------------- cálculos de IVA ---------------- */


/** Mismo cálculo que la base de datos: descuento de línea, descuento general y luego IVA. */



/* ---------------- ventas: pedidos, pacientes y productos ---------------- */




/* ---------------- editor de pedido ---------------- */


/* ---------------- detalle de pedido ---------------- */

// (v2.183.0: aquí iba la primera versión de ventanaCargando; se redefine entera más abajo)
/* Ver pedido: la ventana base, sus facturas (o emitirla) y la operativa (antes eran 4 capas). */
async function verPedido(id) {
  return ventanaCargando(async () => {
    await verPedidoBase(id);
    await pedidoFacturas(id);
    await pedidoOperativa(id);
    await pedidoPago(id);
  });
}




/* ---------------- pacientes ---------------- */





async function fichaPaciente(id) {
  FICHA_PAC = id; FICHA_ID = null;
  $('fbody').innerHTML = '<div class="skel" style="width:50%"></div><div class="skel"></div><div class="skel" style="width:80%"></div>';
  if (!$('ficha').open) $('ficha').showModal();
  const { data } = await RPC_ORIG('contacto_detalle', { p_id: id });
  if (FICHA_PAC !== id) return;
  if (!data || !data.contacto) { $('fbody').innerHTML = `<div class="vacio">No se ha encontrado ${TT('paciente', 's', 'el', 'l', 'l')}.</div>`; return; }
  const c = data.contacto, m = data.medico, ped = data.pedidos || [];
  const validos = ped.filter(p => p.estado !== 'Anulado' && p.estado !== 'Borrador');
  const permitido = puedeVentas();

  $('fbody').innerHTML = `
    <div class="fh"><div><h2>${esc(c.nombre)}</h2><div class="sm">${TT('paciente', 's', '', 'l', 'C')}${c.nif ? ' · NIF ' + esc(c.nif) : ''}</div></div>
      <button class="x" id="fpx" aria-label="Cerrar">✕</button></div>
    ${permitido ? `<div class="acts"><button class="btn" id="fpnped">+ Nuevo pedido</button>
      <button class="btn sec" id="fpedit">Editar datos</button></div>` : ''}
    <div class="kpis" style="margin:10px 0 0;grid-template-columns:repeat(3,minmax(0,1fr))">
      <div class="kpi"><b>${num(validos.length)}</b><span>pedidos</span></div>
      <div class="kpi"><b>${num(data.total_unidades)}</b><span>unidades</span></div>
      <div class="kpi"><b>${eurI(validos.reduce((n, p) => n + (+p.total || 0), 0))}</b><span>con IVA</span></div></div>
    <div class="blk"><h3>${TT('medico', 's', '', 'l', 'C')} que lo trata</h3>
      ${m ? `<div><button class="kcfg" data-fpmed="${m.id}" style="font-size:15px">${esc(m.nombre)}</button>
          <span class="sm"> · código ${esc(m.codigo)}${m.especialidad ? ' · ' + esc(m.especialidad) : ''}</span></div>
        <div class="sm">${m.comercial ? 'Comercial: ' + esc(m.comercial) : 'Sin comercial asignado'}</div>`
        : `<div class="sm">Sin ${TT('medico', 's', '', 'l', 'l', 'asignado')}. Las unidades de ${TT('paciente', 's', 'este', 'l', 'l')} no se atribuyen a nadie hasta que lo asignes.</div>`}
      ${permitido ? `<label>${m ? `Cambiar de ${TT('medico', 's', '', 'l', 'l')}` : `Asignar ${TT('medico', 's', '', 'l', 'l')}`}</label><div id="fpsel"></div>
        ${m ? `<div class="acts"><button class="btn sec" id="fpmedquitar">Quitar ${TT('medico', 's', '', 'l', 'l')}</button></div>` : ''}` : ''}
    </div>
    <div class="blk"><h3>Contacto</h3>
      ${[['Teléfono', c.telefono], ['Móvil', c.movil], ['Email', c.email],
         ['Dirección', [c.direccion, c.cp, c.municipio, c.provincia].filter(Boolean).join(', ')], ['Nota', c.nota]]
        .filter(x => x[1]).map(([k, v]) => `<div class="sm"><b style="color:var(--ink)">${k}:</b> ${esc(v)}</div>`).join('')
        || '<div class="sm">Sin datos de contacto.</div>'}</div>
    <div class="blk"><h3>Pedidos</h3>
      ${ped.map(p => `<button class="item" data-fpped="${p.id}" style="padding:8px 4px">
        <span class="tx"><b>${fechaCorta(p.fecha)} · ${esc(p.productos || 'Sin productos')}</b>
          <span class="sm">${num(p.unidades)} uds. · ${eurI(p.total)} con IVA${p.medico ? ' · ' + esc(p.medico) : ''}</span></span>
        ${pillEstado(p.estado)}</button>`).join('') || '<div class="sm">Todavía no tiene pedidos.</div>'}</div>`;

  $('fpx').onclick = () => { FICHA_PAC = null; $('ficha').close(); };
  $('fbody').querySelectorAll('[data-fpped]').forEach(b => b.onclick = () => verPedido(b.dataset.fpped));
  const bm = $('fbody').querySelector('[data-fpmed]');
  if (bm) bm.onclick = () => { FICHA_PAC = null; abrirFicha(bm.dataset.fpmed); };
  if ($('fpnped')) $('fpnped').onclick = () => nuevaVenta({ contacto: Object.assign({}, c, m ? { medico: m.nombre, medico_codigo: m.codigo } : {}), medico: m ? { id: m.id, nombre: m.nombre } : null });
  if ($('fpedit')) $('fpedit').onclick = () => editorContacto(c, () => fichaPaciente(id));
  const asignar = async medicoId => {
    const { data: r, error } = await db.rpc('asignar_cuenta_cliente', { p_contacto: id, p_medico: medicoId });
    if (error || (r && r.ok === false)) { toast('No se ha podido guardar', true); return; }
    toast(medicoId ? `${TT('medico', 's', '', 'l', 'C', 'asignado')}` : `${TT('medico', 's', '', 'l', 'C', 'quitado')}`); fichaPaciente(id);
    if (TAB === 'pacientes') listaPacientes();
  };
  if ($('fpmedquitar')) $('fpmedquitar').onclick = () => asignar(null);
  if ($('fpsel')) selectorMedico($('fpsel'), { valor: null, placeholder: `Busca ${TT('medico', 's', 'el', 'l', 'l')} por nombre, centro o municipio`, alElegir: x => { if (x) asignar(x.id); } });
}

/* ---------------- productos ---------------- */


function editorProducto(p) {
  const esAdmin = puede('administrar');
  p = p || { iva: 10, activo: true, unidades_envase: 1 };
  const ro = esAdmin ? '' : 'disabled';
  $('dbody').innerHTML = `
    <div class="fh"><div><h2>${p.id ? esc(p.nombre) : 'Nuevo producto'}</h2>
      <div class="sm">${esAdmin ? 'Escribe el precio sin IVA o con IVA: el otro se calcula solo.' : 'Solo administración puede cambiar productos.'}</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <div style="display:flex;gap:14px;align-items:center;margin-top:8px">
      <span class="pfoto" id="prfprev" style="width:72px;height:72px;${p.foto_url ? `background-image:url('${esc(p.foto_url)}')` : ''}">${p.foto_url ? '' : '◧'}</span>
      ${esAdmin ? '<div style="flex:1"><label for="prfoto" style="margin-top:0">Foto</label><input id="prfoto" type="file" accept="image/*"></div>' : ''}</div>
    <div class="g2">
      <div><label for="prn">Nombre</label><input id="prn" value="${esc(p.nombre || '')}" ${ro}></div>
      <div><label for="prp">Presentación</label><input id="prp" value="${esc(p.presentacion || '')}" placeholder="Caja de 30 sobres" ${ro}></div></div>
    <div class="pvp">
      <div><label for="prpr">Precio sin IVA (€)</label><input id="prpr" type="number" step="0.01" min="0" value="${p.precio != null ? +(+p.precio).toFixed(4) : ''}" ${ro}></div>
      <div><label for="priva">IVA (%)</label><input id="priva" type="number" step="1" min="0" max="21" value="${p.iva != null ? p.iva : 10}" ${ro}></div>
      <div><label for="prpvp">Precio con IVA (€)</label><input id="prpvp" type="number" step="0.01" min="0" value="${p.precio != null ? r2(p.precio * (1 + (+p.iva || 0) / 100)) : ''}" ${ro}></div></div>
    <div class="g2">
      <div><label for="prref">Referencia</label><input id="prref" value="${esc(p.referencia || '')}" ${ro}></div>
      <div><label for="prcb">Código de barras</label><input id="prcb" value="${esc(p.codigo_barras || '')}" ${ro}></div></div>
    <div class="g2">
      <div><label for="prue">Unidades por envase</label><input id="prue" type="number" min="1" value="${p.unidades_envase || 1}" ${ro}></div>
      <div><label for="prco">Coste (€, sin IVA)</label><input id="prco" type="number" step="0.01" min="0" value="${p.coste != null ? p.coste : ''}" ${ro}></div></div>
    ${esAdmin && p.id ? `<label class="opt" style="margin-top:12px"><input type="checkbox" id="pract" ${p.activo ? 'checked' : ''}> Activo: aparece al crear pedidos</label>` : ''}
    <div class="acts" style="justify-content:flex-end">
      <button class="btn sec" data-cerrar>${esAdmin ? 'Cancelar' : 'Cerrar'}</button>
      ${esAdmin ? `<button class="btn" id="prok">${p.id ? 'Guardar' : 'Crear producto'}</button>` : ''}</div>`;
  $('dlg').showModal();
  if (!esAdmin) return;

  const iva = () => (+$('priva').value || 0) / 100;
  $('prpr').oninput = () => { $('prpvp').value = $('prpr').value === '' ? '' : r2(+$('prpr').value * (1 + iva())); };
  $('prpvp').oninput = () => { $('prpr').value = $('prpvp').value === '' ? '' : +(+$('prpvp').value / (1 + iva())).toFixed(4); };
  $('priva').oninput = () => { if ($('prpr').value !== '') $('prpvp').value = r2(+$('prpr').value * (1 + iva())); };
  $('prfoto').onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    $('prfprev').style.backgroundImage = `url('${URL.createObjectURL(f)}')`; $('prfprev').textContent = '';
  };
  camposInsertar($('dbody'), 'producto', p.id, $('prok') && $('prok').closest('.acts'));
  $('prok').onclick = async ev => {
    if (!$('prn').value.trim()) { toast('Escribe el nombre', true); return; }
    const cps = camposLeer($('dbody'));
    if (cps && cps.falta.length) { toast(`Rellena «${cps.falta[0]}»`, true); return; }
    ev.target.disabled = true; ev.target.textContent = 'Guardando…';
    let foto_url;
    const f = $('prfoto').files && $('prfoto').files[0];
    if (f) {
      const ruta = 'p-' + Date.now() + '-' + f.name.replace(/[^a-zA-Z0-9.]/g, '');
      const { error: eu } = await db.storage.from('productos').upload(ruta, f, { upsert: true });
      if (!eu) foto_url = db.storage.from('productos').getPublicUrl(ruta).data.publicUrl;
      else toast('La foto no se ha podido subir: ' + eu.message, true);
    }
    const { data: r, error } = await db.rpc('guardar_producto', { p: {
      id: p.id || null, nombre: $('prn').value.trim(), presentacion: $('prp').value.trim(),
      precio: $('prpr').value, iva: $('priva').value, referencia: $('prref').value.trim(),
      codigo_barras: $('prcb').value.trim(), unidades_envase: $('prue').value, coste: $('prco').value,
      ...(foto_url ? { foto_url } : {}), ...($('pract') ? { activo: $('pract').checked } : {}) } });
    ev.target.disabled = false; ev.target.textContent = p.id ? 'Guardar' : 'Crear producto';
    if (error || (r && r.ok === false)) { toast('No se ha podido guardar: ' + ((error && error.message) || (r && r.error) || ''), true); return; }
    if (cps && !(await camposGuardar(cps, (r && r.id) || p.id))) return;
    $('dlg').close(); toast(p.id ? 'Producto guardado' : 'Producto creado');
    await cargarProductos(); if (TAB === 'productos') pintarProductos();
  };
}

/* ---------------- ficha del médico: comercial y pacientes ---------------- */


/* ---------------- agenda: sugerencias para el día ---------------- */



/* ---------------- ayudas nuevas ---------------- */

Object.assign(AYUDA, {
  ventas: ['Ventas', `Pedidos, ${TT('paciente', 'p', '', 'l', 'l')} y productos.`, [
    'Los pedidos se guardan como <b>borrador</b> (editable y se puede eliminar; no cuenta en métricas) o se <b>confirman</b> (cuenta en métricas y comisiones; solo se puede anular).',
    'Los importes van sin IVA; el IVA de cada producto se suma aparte y se ve el total.',
    `La venta a ${TT('paciente', 's', '', 'l', 'l')} se atribuye ${TT('medico', 's', 'al', 'l', 'l', 'indicado')} y al comercial que lo tenía asignado en ese momento.`,
    'La venta a centro se atribuye a la ficha del centro, si la tiene; si no, a nadie.',
    `Si un pedido no tiene ${TT('medico', 's', '', 'l', 'l', 'reconocido')}, se puede encontrar filtrando la lista de pedidos para asignarlo a mano.`]],
  pacientes: [`${TT('paciente', 'p', '', 'l', 'C')}`, `Las personas que compran con ${TT('medico', 's', 'un', 'l', 'l')} de referencia.`, [
    `Cada ${TT('paciente', 's', '', 'l', 'l')} puede tener un <b>${TT('medico', 's', '', 'l', 'l')} que lo trata</b>: se asigna solo con su primer pedido o a mano desde su ficha.`,
    `Desde la ficha ves sus pedidos, unidades e importe, y creas un pedido nuevo con ${TT('medico', 's', 'el', 'l', 'l')} ya puesto.`,
    `En la ficha de ${TT('medico', 's', 'un', 'l', 'l')} verás sus ${TT('paciente', 'p', '', 'l', 'l')}.`]],
  productos: ['Productos', 'El catálogo que se usa en pedidos, muestras y analítica.', [
    'Escribe el precio sin IVA o con IVA: el otro se calcula con el IVA del producto.',
    'Un producto inactivo no aparece al crear pedidos, pero se conserva en el histórico.']],
  agenda: ['Agenda', 'Tus citas por día, semana o mes.', [
    `«+ Nueva cita» crea una cita con ${TT('medico', 's', 'un', 'l', 'l')}.`,
    'En cada cita puedes cambiar la hora, moverla o descartarla.',
    `Al registrar ${TT('visita', 's', 'el', 'l', 'l')} desde la ficha, la cita pasa a «Visitada».`,
    'En la vista de día verás <b>sugerencias</b>: quién atiende ese día, acciones pendientes, urgentes e interesados.']]
});


