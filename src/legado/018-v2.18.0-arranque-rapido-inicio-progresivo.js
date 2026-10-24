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





/* ---------------- pacientes ---------------- */






/* ---------------- productos ---------------- */



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


