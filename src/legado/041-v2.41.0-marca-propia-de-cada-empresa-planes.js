/* ============================================================
   v2.41.0 · Marca propia de cada empresa, planes contratables,
   Usuarios renovado, Roles y permisos, configuración sin redundancias
   (Administración se integra en Configuración), acceso de médicos
   desde su ficha y menú «Más» como extensión de la barra
   ============================================================ */

Object.assign(RPC_TTL, { usuarios_resumen: 30, plan_uso: 60 });

/* ---------------- marca de la empresa ---------------- */

let MARCA = (() => { try { return JSON.parse(localStorage.getItem('app-marca')) || {}; } catch (e) { return {}; } })();
const nombreApp = () => MARCA.nombre || 'Mi empresa';
function aplicarMarca() {
  const n = nombreApp();
  document.title = n;
  document.querySelectorAll('meta[name="apple-mobile-web-app-title"]').forEach(m => m.content = n);
  const logo = MARCA.logo;
  document.querySelectorAll('header .logo, .lbox img, #bootsplash img').forEach(i => { if (logo) i.src = logo; i.alt = n; });
  const h = document.querySelector('.lbox h1'); if (h) h.textContent = n;
  const g = document.querySelector('#girar span:last-child'); if (g) g.textContent = n + ' se usa en vertical.';
}
aplicarMarca();
// v2.103.0: la marca del dominio desde el que se abre (con varias empresas, cada una la suya)
// v2.170.0: quien vuelve de darse de alta (?alta=ok) ve la marca de delcos, aunque la dirección sea la de otra empresa
Promise.resolve(RPC_ORIG('marca_publica', { p_dominio: /[?&]alta=ok/.test(location.search) ? null : location.hostname })).then(r => {
  if (r && r.data) { MARCA = Object.assign({}, MARCA, r.data); try { localStorage.setItem('app-marca', JSON.stringify(MARCA)); } catch (e) {} aplicarMarca(); }
}, () => {});
// El logo de la empresa también en las facturas

async function pintarMarca() {
  await cargarAjustes();
  const m = Object.assign({ nombre: nombreApp(), logo: null, logo_factura: true }, AJUSTES.marca || {});
  let logo = m.logo;
  $('cfgcuerpo').innerHTML = `<div class="card cfgpanel"><h2>Marca de la empresa</h2>
    <p class="sm">Así se ve la plataforma para todo tu equipo: en la pantalla de acceso, arriba en cada pantalla, en la app del móvil y en las facturas.</p>
    <div class="marcaed"><div class="marcaprev"><img id="mklogo" src="${esc(logo || 'logo-app.png')}" alt=""><b id="mknomp">${esc(m.nombre)}</b></div>
      <div><label for="mknom">Nombre de la plataforma</label><input id="mknom" value="${esc(m.nombre)}" placeholder="p. ej. Acme Comercial">
        <label>Logo o imagen de perfil ${pmAyu('Logo', 'Se adapta a un círculo. Mejor una imagen cuadrada, con el logo centrado.')}</label>
        <div class="acts" style="margin:0"><label class="btn sec" for="mkfile" style="margin:0">Subir imagen</label><input id="mkfile" type="file" accept="image/*" class="hide">
          ${logo ? '<button class="btn sec" id="mkquitar">Quitar</button>' : ''}</div>
        <label class="opt" style="margin-top:10px"><input type="checkbox" id="mkfac" ${m.logo_factura !== false ? 'checked' : ''}> Usar también en las facturas</label></div></div>
    <div class="acts" style="justify-content:flex-end"><button class="btn" id="mkok">Guardar</button></div></div>`;
  $('mknom').oninput = () => $('mknomp').textContent = $('mknom').value || 'Mi empresa';
  $('mkfile').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    const img = new Image(); img.src = URL.createObjectURL(f); await img.decode();
    const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
    const lado = Math.min(img.width, img.height); x.drawImage(img, (img.width - lado) / 2, (img.height - lado) / 2, lado, lado, 0, 0, 256, 256);
    logo = c.toDataURL('image/png'); $('mklogo').src = logo;
  };
  if ($('mkquitar')) $('mkquitar').onclick = () => { logo = null; $('mklogo').src = 'logo-app.png'; };
  $('mkok').onclick = async () => {
    const v = { nombre: $('mknom').value.trim() || 'Mi empresa', logo, logo_factura: $('mkfac').checked };
    const { error } = await db.rpc('guardar_ajuste', { p_clave: 'marca', p_valor: v });
    if (error) { toast('No se ha podido guardar', true); return; }
    AJUSTES.marca = v; MARCA = { nombre: v.nombre, logo: v.logo }; localStorage.setItem('app-marca', JSON.stringify(MARCA)); LOGO_DATA = null;
    aplicarMarca(); toast('Marca guardada');
  };
}

/* ---------------- planes ---------------- */

const PLANES = [
  { id: 'esencial', nombre: 'Esencial', precio: 149, incluidos: 5, bloque: [5, 99], medicos: 0,
    para: `Equipos pequeños que quieren ordenar sus ${TT('visita', 'p', '', 'l', 'l')}`,
    modulos: ['inicio', 'agenda', 'rutas', 'directorio', 'seguimiento'],
    ventajas: [`Directorio de ${TT('medico', 'p', '', 'l', 'l')} y centros`, `Agenda, «Tu día» y registro de ${TT('visita', 'p', '', 'l', 'l')}`, 'Rutas optimizadas y planificación semanal', 'Calidad del dato y duplicados', 'App móvil instalable'] },
  { id: 'profesional', nombre: 'Profesional', precio: 349, incluidos: 10, bloque: [5, 149], medicos: 0,
    para: 'Equipos que venden y quieren medir resultados',
    modulos: ['inicio', 'agenda', 'rutas', 'directorio', 'seguimiento', 'ventas', 'pacientes', 'productos', 'analitica'],
    ventajas: ['Todo lo de Esencial', 'Pedidos, clientes y registro de llamadas', 'Productos y stock por lotes', `Analítica y ranking de ${TT('medico', 'p', '', 'l', 'l')}`, 'Comisiones por tramos'] },
  { id: 'avanzado', nombre: 'Avanzado', precio: 649, incluidos: 20, bloque: [10, 249], medicos: 50,
    para: 'Empresas con facturación propia y varios equipos',
    modulos: ['inicio', 'agenda', 'rutas', 'directorio', 'seguimiento', 'ventas', 'pacientes', 'productos', 'analitica', 'facturacion'],
    ventajas: ['Todo lo de Profesional', 'Facturación con VeriFactu y cobros', 'Compras, proveedores y trazabilidad', 'Zonas, supervisión del equipo y alertas', `Espacio ${TT('medico', 's', 'del', 'l', 'l')} (hasta 50 ${TT('medico', 'p', '', 'l', 'l')})`] },
  { id: 'premium', nombre: 'Premium', precio: 1190, incluidos: 40, bloque: [10, 249], medicos: null,
    para: 'Redes comerciales grandes que lo quieren todo',
    modulos: ['inicio', 'agenda', 'rutas', 'directorio', 'seguimiento', 'ventas', 'pacientes', 'productos', 'analitica', 'facturacion'],
    ventajas: ['Todo lo de Avanzado', `Espacio ${TT('medico', 's', 'del', 'l', 'l')} sin límite`, 'Impersonalización de usuarios y auditoría completa', 'Puesta en marcha y migración de datos incluidas', 'Soporte prioritario'] }
];
let PLAN_ACTUAL = { plan: 'medida' };   // v2.117.0: hasta que llega el de la base, el completo
const planDe = id => PLANES.find(p => p.id === id) || PLANES[3];
// v2.165.0: sin Facturación en el plan pero con facturas, se entra en solo consulta (facConsulta, al final)
const planIncluye = mod => !(mod in MODULO_AREA) || planDe(PLAN_ACTUAL.plan).modulos.includes(mod) || (mod === 'facturacion' && facConsulta());
const planMinimo = mod => PLANES.find(p => p.modulos.includes(mod));
Promise.resolve(RPC_ORIG('plan_uso', {})).then(r => { if (r && r.data && r.data.plan) { PLAN_ACTUAL = r.data.plan; if (PERFIL) aplicarPermisosMenu(); } }, () => {});

// Los módulos que no entran en el plan se ven con candado y explican cómo conseguirlos
const puedeModuloV2400 = puedeModulo;
function avisoPlan(mod) {
  const p = planMinimo(mod), n = (document.querySelector(`nav.main [data-t="${mod}"]`) || {}).textContent || mod;
  $('dbody').innerHTML = `<div class="fh"><div><h2>🔒 ${esc(n.replace('🔒', '').trim())}</h2><div class="sm">No está incluido en tu plan ${esc(planDe(PLAN_ACTUAL.plan).nombre)}</div></div>
    <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <p>Está disponible desde el plan <b>${esc(p ? p.nombre : 'A medida')}</b>${p ? ` (${precioPlan(p)})` : ''}.</p>
    ${p ? `<ul class="manlist">${p.ventajas.map(v => `<li><span>✓</span><span>${esc(v)}</span></li>`).join('')}</ul>` : ''}
    <div class="acts" style="justify-content:flex-end"><button class="btn sec" data-cerrar>Ahora no</button>${puede('administrar') ? '<button class="btn" id="vplan">Ver planes</button>' : ''}</div>`;
  $('dlg').showModal();
  if ($('vplan')) $('vplan').onclick = () => { $('dlg').close(); CFG_SEC = 'plan'; ir('config'); };
}

async function pintarPlan2() {
  const { data } = await RPC_ORIG('plan_uso', {});
  const d = data || {}, act = planDe((d.plan || {}).plan), bloques = +((d.plan || {}).bloques_extra || 0);
  const maxU = act.incluidos + bloques * act.bloque[0], enlaces = ((d.pagos || {}).enlaces) || {};
  const pct = Math.min(100, Math.round((d.usuarios || 0) / maxU * 100));
  $('cfgcuerpo').innerHTML = `<div class="card cfgpanel">
    <div class="planact"><div><div class="sm">Tu plan</div><h2 style="padding:0;margin:2px 0">${esc(act.nombre)} <span class="pill ${(d.plan || {}).estado === 'activo' ? 'p-est' : 'p-per'}">${esc((d.plan || {}).estado || 'activo')}</span></h2>
      <div class="sm">${eurI(act.precio)}/mes · ${act.incluidos} usuarios incluidos${bloques ? ` + ${bloques} ${bloques === 1 ? 'bloque' : 'bloques'} de ${act.bloque[0]}` : ''}</div></div>
      <div class="planuso"><b>${num(d.usuarios || 0)} / ${num(maxU)}</b><span>usuarios activos</span><div class="barra"><i style="width:${pct}%"></i></div>
        ${act.medicos !== 0 ? `<span class="sm">${num(d.medicos || 0)}${act.medicos ? ' / ' + act.medicos : ''} ${TT('medico', 'p', '', 'l', 'l')} con acceso</span>` : ''}</div></div></div>
    <div class="planes">${PLANES.map(p => `<div class="plan ${p.id === act.id ? 'actual' : ''} ${p.id === 'avanzado' ? 'dest' : ''}">
      ${p.id === 'avanzado' ? '<span class="plancinta">El más elegido</span>' : ''}
      <h3>${esc(p.nombre)}</h3><div class="sm">${esc(p.para)}</div>
      <div class="planprecio"><b>${eurI(p.precio)}</b><span>/mes</span></div>
      <div class="sm">${p.incluidos} usuarios incluidos · +${p.bloque[0]} usuarios por ${eurI(p.bloque[1])}/mes</div>
      <ul class="manlist">${p.ventajas.map(v => `<li><span>✓</span><span>${esc(v)}</span></li>`).join('')}</ul>
      ${p.id === act.id ? '<button class="btn sec" disabled>Tu plan actual</button>'
        : `<button class="btn ${p.id === 'avanzado' ? '' : 'sec'}" data-contratar="${p.id}">${PLANES.indexOf(p) > PLANES.indexOf(act) ? 'Mejorar a ' : 'Cambiar a '}${esc(p.nombre)}</button>`}
    </div>`).join('')}</div>
    <div class="card cfgpanel"><h3 style="margin-top:0">Cómo funciona</h3><ul class="manlist">
      <li><span>💳</span><span>Pago mensual con tarjeta. Con pago anual, dos meses gratis.</span></li>
      <li><span>👥</span><span>Cada plan incluye un número de usuarios; si el equipo crece, se añaden bloques de usuarios sin cambiar de plan.</span></li>
      <li><span>🩺</span><span>${TT('medico', 'p', 'el', 'C', 'l')} con acceso a su informe no cuentan como usuarios.</span></li>
      <li><span>🔄</span><span>Se puede cambiar de plan en cualquier momento; el cambio se aplica al confirmarse el pago.</span></li></ul>
      <div class="acts"><button class="btn sec" id="plbloque">+ Añadir un bloque de ${act.bloque[0]} usuarios (${eurI(act.bloque[1])}/mes)</button></div></div>`;
  const contratar = clave => {
    if (enlaces[clave]) { window.open(enlaces[clave], '_blank', 'noopener'); return; }
    location.href = `mailto:${encodeURIComponent((d.pagos || {}).contacto || '')}?subject=${encodeURIComponent('Contratación: ' + clave)}&body=${encodeURIComponent('Empresa: ' + nombreApp() + '\nQuiero: ' + clave)}`;
  };
  $('cfgcuerpo').querySelectorAll('[data-contratar]').forEach(b => b.onclick = () => contratar(b.dataset.contratar));
  $('plbloque').onclick = () => contratar('bloque-' + act.id);
}

// No se puede superar el número de usuarios del plan

// Desde la ficha del médico: darle acceso a su espacio

/* ---------------- Usuarios renovado ---------------- */

let USR_F = { q: '', rol: '', est: 'activos' };
async function pintarUsuarios2() {
  const [{ data }, rAcc] = await Promise.all([RPC_ORIG('usuarios_resumen', {}), RPC_ORIG('invitados_accesos', {})]);   // v2.270.0: cuándo entró cada uno
  const ACC = {}; ((rAcc && rAcc.data) || []).forEach(x => ACC[x.id] = x);
  USR_ACC = ACC;   // v2.335.0: última conexión de cada uno
  const todos = data || []; USUARIOS = todos.map(u => Object.assign({ medicos: u.cartera, visitas: u.visitas_mes }, u));
  const act = planDe(PLAN_ACTUAL.plan), maxU = usuariosContratados();
  const activos = todos.filter(u => u.activo && !rolPuede(u.rol, 'portal_prescriptor'));
  const hace30 = Date.now() - 30 * 864e5;
  const inactivos = activos.filter(u => !u.ultima_actividad || new Date(u.ultima_actividad).getTime() < hace30).length;
  const porRol = {}; activos.forEach(u => porRol[u.rol] = (porRol[u.rol] || 0) + 1);
  const pinta = () => {
    const q = USR_F.q.toLowerCase();
    const l0 = todos.filter(u => (!q || (u.nombre + ' ' + (u.email || '') + ' ' + (u.medico || u.cuenta || '')).toLowerCase().includes(q)) && (!USR_F.rol || u.rol === USR_F.rol)
      && (USR_F.est === 'todos' || (USR_F.est === 'activos' ? u.activo : !u.activo)));
    const l = l0.filter(u => !esInvitado(u));   // v2.270.0: los invitados, en su grupo
    pintarInvitados(l0.filter(esInvitado), ACC);
    $('usrl').innerHTML = l.map(u => {
      const mods = Object.keys(MODULO_AREA).filter(m => rolPuede(u.rol, 'administrar') || +((u.areas || {})[MODULO_AREA[m]] || 0) >= 1);
      const reciente = u.ultima_actividad ? new Date(u.ultima_actividad) : null;
      return `<button class="usrcard ${u.activo ? '' : 'off'}" data-usr="${u.id}">
        <span class="usrav" style="background:${esc((rolDef(u.rol) || {}).color || '#17457A')}">${esc(iniciales(u.nombre))}</span>
        <span class="usrtx"><b>${esc(u.nombre)}</b><span class="sm">${esc(u.email || '')}</span>
          <span class="usrchips"><span class="pill p-est">${esc(u.rol)}</span>${u.activo ? '' : '<span class="pill p-anu">Desactivado</span>'}
            ${rolPuede(u.rol, 'portal_prescriptor') ? `<span class="pill p-per">${esc(u.medico || 'Sin ficha')}</span>` : `<span class="sm">${mods.length} módulos</span>`}</span></span>
        <span class="usrdat">${!rolPuede(u.rol, 'portal_prescriptor') ? `<span><b>${num(u.cartera)}</b> en cartera</span><span><b>${num(u.visitas_mes)}</b> ${TT('visita', 'p', '', 'l', 'l')} mes</span>` : ''}
          <span class="sm usrcon" title="${reciente ? 'Última actividad registrada: ' + fechaCorta(isoLocal(reciente)) : 'Sin actividad registrada'}">${esc(conexionTxt(ACC[u.id]))}</span></span></button>`;
    }).join('') || '<div class="vacio">Nadie con estos filtros.</div>';
    $('usrl').querySelectorAll('[data-usr]').forEach(b => b.onclick = () => detalleUsuario(todos.find(u => u.id === b.dataset.usr)));
  };
  $('cfgcuerpo').innerHTML = `<div class="cfgpanel">
    <div class="kpis vtot">
      <div class="kpi"><b>${num(activos.length)} / ${num(maxU)}</b><span>usuarios del plan ${esc(act.nombre)}</span></div>
      ${Object.entries(porRol).map(([r, n]) => `<div class="kpi"><b>${num(n)}</b><span>${esc(r)}</span></div>`).join('')}
      <div class="kpi ${inactivos ? 'warn' : 'ok'}"><b>${num(inactivos)}</b><span>sin actividad en 30 días</span></div>
      <div class="kpi" data-usrinvk><b>${num(todos.filter(u => (rolPuede(u.rol, 'portal_prescriptor') || rolPuede(u.rol, 'portal_centro')) && u.activo).length)}</b><span>Cuentas con acceso</span></div></div>
    <div class="card" style="padding-top:14px;padding-bottom:14px">
      <div class="usrbar"><input id="usrq" type="search" placeholder="Buscar por nombre o email" value="${esc(USR_F.q)}">
        <select id="usrrol"><option value="">Todos los roles</option>${rolesNombres().map(r => `<option ${USR_F.rol === r ? 'selected' : ''}>${esc(r)}</option>`).join('')}</select>
        <select id="usrest"><option value="activos" ${USR_F.est === 'activos' ? 'selected' : ''}>Activos</option><option value="inactivos" ${USR_F.est === 'inactivos' ? 'selected' : ''}>Desactivados</option><option value="todos" ${USR_F.est === 'todos' ? 'selected' : ''}>Todos</option></select>
        <button class="btn" id="usrnuevo">+ Nuevo usuario</button></div>
      <div id="usrl" class="usrlista"></div></div>
    <div class="card usrinvw" style="padding-top:14px;padding-bottom:14px"><h3>Invitados <span id="usrinvn" class="sm"></span></h3>
      <p class="sm">${TT('medico', 'p', '', 'l', 'C')} y centros a los que has dado acceso a su portal. No cuentan como usuarios del plan. Con «Impersonalizar» abres una sesión con su usuario y ves su portal tal como lo verá.</p>
      <div id="usrinv" class="usrinvl"></div></div></div>`;
  $('usrq').oninput = () => { USR_F.q = $('usrq').value; pinta(); };
  $('usrrol').onchange = () => { USR_F.rol = $('usrrol').value; pinta(); };
  $('usrest').onchange = () => { USR_F.est = $('usrest').value; pinta(); };
  $('usrnuevo').onclick = () => nuevoUsuario();
  pinta();
}

/* ---------------- Roles y permisos ---------------- */

const QUE_ABRE = { H: 'Inicio: indicadores, alertas y resumen', G: 'Agenda, citas y «Tu día»', R: 'Rutas y planificador', M: `${TT('medico', 'p', '', 'l', 'C')}, centros y sus fichas`,
  C: 'Centros y sus datos', S: `Registro de ${TT('visita', 'p', '', 'l', 'l')}`, V: 'Pedidos: ventas, compras y llamadas', L: `Clientes (${TT('paciente', 'p', '', 'l', 'l')} y empresas)`, P: 'Productos, servicios y stock',
  F: 'Facturación, cobros y rectificativas', A: 'Analítica y rankings', E: 'Importes en euros (si no, solo unidades)', Q: 'Calidad del dato y duplicados',
  K: 'Clasificadores y listas de valores', U: 'Impersonalizar a otros usuarios' };
const plantillaRol = r => Object.assign({}, (rolDef(r) || {}).plantilla || {}, (AJUSTES.roles || {})[r] || {});
async function pintarRoles() {
  await cargarAjustes();
  const roles = rolesNombres().filter(r => !rolPuede(r, 'portal_prescriptor'));
  $('cfgcuerpo').innerHTML = `<div class="card cfgpanel"><h2>Roles y permisos</h2>
    <p class="sm">Cada rol tiene una plantilla de permisos que se aplica al dar de alta a una persona o al cambiarle el rol. Después se puede ajustar persona a persona en Usuarios. ${TT('medico', 'p', 'el', 'C', 'l')} con acceso solo ven su informe.</p>
    <div class="nivleg">${NIVEL_TXT.map((t, i) => `<span class="nv${i}"><b>${esc(t)}</b>${['No ve el módulo ni aparece en el menú', 'Lo ve, pero no cambia nada', 'Crea y edita lo suyo', 'Todo, incluido borrar y configurar'][i]}</span>`).join('')}</div>
    <div class="dgrid-wrap"><table class="rolmat"><thead><tr><th>Permiso</th>${roles.map(r => `<th>${esc(r)}</th>`).join('')}</tr></thead>
      <tbody>${AREAS.map(([k, n]) => `<tr><td><b>${esc(n)}</b><span class="sm">${esc(QUE_ABRE[k] || '')}</span></td>
        ${roles.map(r => `<td><select data-rol="${esc(r)}" data-ar="${k}" class="nvsel chico" ${rolPuede(r, 'administrar') ? 'disabled' : ''}>${NIVEL_TXT.map((t, i) => `<option value="${i}" ${+(plantillaRol(r)[k] || 0) === i ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></td>`).join('')}</tr>`).join('')}</tbody></table></div>
    <div class="acts" style="justify-content:flex-end;flex-wrap:wrap"><button class="btn sec" id="rolrest">Volver a los valores de partida</button><button class="btn" id="rolok">Guardar plantillas</button></div></div>`;
  const colorea = () => $('cfgcuerpo').querySelectorAll('.nvsel').forEach(s => s.className = 'nvsel chico nv' + s.value);
  $('cfgcuerpo').addEventListener('change', colorea); colorea();
  const leer = () => { const o = {}; $('cfgcuerpo').querySelectorAll('[data-rol]:not([disabled])').forEach(s => { (o[s.dataset.rol] = o[s.dataset.rol] || {})[s.dataset.ar] = +s.value; }); return o; };
  $('rolrest').onclick = async () => { await db.rpc('guardar_ajuste', { p_clave: 'roles', p_valor: {} }); AJUSTES.roles = {}; toast('Valores de partida'); pintarRoles(); };
  $('rolok').onclick = async () => {
    const v = leer(); const { error } = await db.rpc('guardar_ajuste', { p_clave: 'roles', p_valor: v });
    if (error) { toast('No se ha podido guardar', true); return; }
    AJUSTES.roles = v;
    if (await preguntar('Las plantillas se usan en las altas y cambios de rol. ¿Quieres aplicarlas también ahora a todas las personas que ya tienen esos roles? Se sustituirán sus permisos actuales.', { titulo: '¿Aplicar a las personas actuales?', ok: 'Aplicar a todos' })) {
      let n = 0; for (const [r, a] of Object.entries(v)) { const { data: x } = await db.rpc('aplicar_plantilla_rol', { p_rol: r, p_areas: a }); n += (x && x.personas) || 0; }
      toast(`Plantillas guardadas y aplicadas a ${n} personas`);
    } else toast('Plantillas guardadas');
  };
}

/* ---------------- Configuración única (Administración queda integrada) ---------------- */

const CFG_ADMIN = { usuarios: 'usuarios', comisiones: 'comis', accesos: 'accesos', auditoria: 'auditoria' };
document.querySelectorAll('[data-u="adm"]').forEach(b => b.classList.add('hide'));
// Dentro de Configuración no se repiten menús interiores
panelDeModulo = (orig => function (sec) {
  orig(sec);
  const quitar = () => { const p = document.querySelector('#cfgcuerpo .cfgmod'); if (p) p.querySelectorAll('.subnav').forEach(s => s.remove()); };
  quitar(); setTimeout(quitar, 300); setTimeout(quitar, 1200);
})(panelDeModulo);

/* ---------------- menú «Más» del móvil: continuación de la barra ---------------- */

abrirMasMovil = (orig => function () {
  orig();
  const s = $('bmas'); if (!s) return;
  s.querySelectorAll('.bmasbox > .sm').forEach(x => x.remove());
  s.querySelectorAll('[data-bm]').forEach(b => { const t = b.dataset.bm; if (!planIncluye(t)) { b.classList.add('bloq'); b.onclick = () => { s.classList.add('hide'); avisoPlan(t); }; } });
  document.body.classList.add('masabierto');
  const obs = new MutationObserver(() => { if (s.classList.contains('hide')) { document.body.classList.remove('masabierto'); obs.disconnect(); } });
  obs.observe(s, { attributes: true, attributeFilter: ['class'] });
})(abrirMasMovil);

// Intentar entrar en un módulo que no incluye el plan


