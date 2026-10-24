// v2.117.0 · Al ir a una pantalla que no es una página propia (Perfil, Empresa, Plan), esas páginas se vacían: así nunca hay dos
// contenedores #cfgcuerpo a la vez (pasaba al ir de «Plan y suscripción» a Configuración)
const IR_V2117 = ir;
ir = function (t, ...a) {
  if (!(t in PAGINAS)) Object.keys(PAGINAS).forEach(o => { const v = $('v-' + o); if (v) v.innerHTML = ''; });
  return IR_V2117(t, ...a);
};




PAGINAS.organizacion = {
  t: 'Organización', d: 'Marca, correo, copias de seguridad, plan y facturación de la empresa', permiso: puedeOrganizacion,
  get tabs() {
    const fact = planIncluye('facturacion');
    return [['marca', 'Marca y logo', () => pintarMarca()], ['correo', 'Correo y firma', () => pintarCorreo()], ['copias', 'Copias de seguridad', () => pintarCopias()],
      ['plan', 'Plan y suscripción', () => pintarPaginaPlan()],
      ...(fact ? [['fiscal', 'Datos fiscales', facOrg(pintarEmpresa)], ['series', 'Series', facOrg(pintarSeries)], ['vf', 'VeriFactu', facOrg(pintarVerifactu)], ['pdf', 'Diseño del PDF', () => disenoPDF()]] : []),
      ...(puede('gestionar_plataforma') ? [['orgs', 'Organizaciones', () => pintarOrganizaciones()]] : [])];
  }
};
const IR_V2121 = ir;
ir = function (t, ...a) {
  if (t === 'empresa') { PAG_TAB.organizacion = PAG_TAB.empresa || 'marca'; t = 'organizacion'; }
  else if (t === 'plan') { PAG_TAB.organizacion = 'plan'; t = 'organizacion'; }
  else if (t === 'config' && ORG_DESDE[CFG_SEC]) { PAG_TAB.organizacion = ORG_DESDE[CFG_SUB] || ORG_DESDE[CFG_SEC]; CFG_SEC = 'rutas'; t = 'organizacion'; }
  if (t === 'organizacion' && !puedeOrganizacion()) t = 'inicio';
  return IR_V2121(t, ...a);
};
function mostrarApp(...a) { const r = mostrarAppBase(...a); menuOrganizacion(); return r; }
document.addEventListener('click', e => {
  const b = e.target.closest('[data-u="organizacion"]'); if (!b) return;
  e.stopImmediatePropagation(); e.preventDefault();
  document.querySelectorAll('.umenu, #umenu').forEach(m => m.classList.add('hide'));
  ir('organizacion');
}, true);

['dlg', 'dlg2'].forEach(id => {
  const d = $(id); if (!d) return;
  const modal = d.showModal.bind(d);
  d.showModal = function () {
    const area = areaEncaje();
    if (!area) return modal();
    // v2.129.0: los apartados que se pintan en la propia página (#dbody como panel) no abren ventana: antes quedaba abierta una
    // ventana vacía de 46 px (la barra blanca) que seguía abierta al cambiar de pantalla
    if (d.id === 'dlg' && typeof PANEL_ACTIVO !== 'undefined' && PANEL_ACTIVO && PANEL_ACTIVO.tipo === 'dbody') return;
    if (d.open) return;
    d.classList.add('encajada'); d.__area = area; d.__casa = d.__casa || d.parentNode;
    area.parentNode.insertBefore(d, area);
    area.classList.add('con-ventana');
    d.show(); colocarEncajada(d, area);
    // Al abrir, el navegador lleva la vista al primer campo: se vuelve arriba del área para ver su cabecera
    const tapa = () => Math.max(0, ...['body > header', 'header', '.top', 'nav.main'].map(q => { const e = document.querySelector(q); return e && getComputedStyle(e).position.match(/fixed|sticky/) ? e.getBoundingClientRect().bottom : 0; }));
    // v2.122.0: la ventana ocupa el sitio del apartado; solo se desplaza la página si su cabecera queda por encima de la vista
    const arriba = () => { const t = d.getBoundingClientRect().top; if (t < tapa()) scrollTo({ top: Math.max(0, t + scrollY - tapa() - 12) }); };
    arriba(); requestAnimationFrame(arriba);
    const f = d.querySelector('input:not([type=hidden]), select, textarea'); if (f) setTimeout(() => { f.focus({ preventScroll: true }); arriba(); }, 30);
  };
  const cerrar = d.close;
  d.close = function () { devolverEncajada(d); return cerrar.apply(this, arguments); };
  // Si un repintado borra el apartado con la ventana dentro, se recupera (cerrada) en <body>
  new MutationObserver(() => { if (d.__casa && !d.isConnected) { d.__casa.appendChild(d); if (d.open) d.close(); } }).observe(document.body, { childList: true, subtree: true });
  d.addEventListener('close', () => {
    // v2.275.0: si la ventana ya se ha vuelto a abrir (cerrar y abrir otra seguida, como «Borrar usuario» desde su ficha), el aviso
    // de cierre llega tarde y deshacía su sitio: quedaba suelta al final de la página, fuera de la vista
    if (d.open) return;
    devolverEncajada(d); delete d.dataset.fija;
    if (!d.classList.contains('encajada')) return;
    d.classList.remove('encajada'); d.removeAttribute('style');
    const area = d.__area; d.__area = null;
    // El apartado vuelve a verse si ya no queda ninguna otra ventana encajada encima de él
    if (area && !document.querySelector('dialog.encajada[open]')) { area.classList.remove('con-ventana'); area.style.minHeight = ''; }
  });
});
// Escape cierra la de arriba; cambiar de apartado, de pestaña o de pantalla las cierra
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const d = ['dlg2', 'dlg'].map(id => $(id)).find(x => x && x.open && x.classList.contains('encajada'));
  // v2.124.0: lo que forma parte de la página (el diseño del PDF en su pestaña) no se cierra con Escape
  if (d && !d.dataset.fija) { e.preventDefault(); d.close(); }
});
document.addEventListener('click', e => { if (e.target.closest('.cfgnav [data-cfg], .cfuidx [data-ck], .pagtabs [data-ptab], #cfgsubs button, nav.main [data-t], #bnav [data-t], [data-u]')) cerrarEncajadas(); }, true);
const IR_ENCAJE = ir;
ir = function (...a) { cerrarEncajadas(); return IR_ENCAJE(...a); };
addEventListener('resize', () => ['dlg', 'dlg2'].forEach(id => { const d = $(id); if (d && d.open && d.__area) { if (innerWidth < ENCAJE_MIN) d.close(); else colocarEncajada(d, d.__area); } }));


const CAMPO_TXT = { nombre: 'Nombre', estado_comercial: 'Estado', get especialidad() { return TT('especialidad', 's', '', 'l', 'C'); }, area: 'Área', telefono: 'Teléfono', movil: 'Móvil', email: 'Email',
  direccion: 'Dirección', cp: 'Código postal', municipio: 'Población', provincia: 'Provincia', nota: 'Nota', urgente: 'Urgente', centro_nombre: 'Centro',
  dias: 'Horario', principal: 'Principal', nif: 'DNI / CIF', cuenta_id: TT('medico', 's', '', 'l', 'C'), codigo: 'Código', precio: 'Precio', estado: 'Estado',
  sin_reporting: 'Sin reporting', clasificadores: 'Campos propios', planta: 'Planta', sala: 'Sala', indicaciones: 'Cómo llegar', lat: 'Latitud', lon: 'Longitud' };













