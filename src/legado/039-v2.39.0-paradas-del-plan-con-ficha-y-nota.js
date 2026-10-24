/* ============================================================
   DLC OS 2.0 · v2.39.0 · Paradas del plan con ficha y nota,
   configuración completa en el panel (sin ventanas ni saltos),
   VeriFactu explicado, manual con explicación antes de ir,
   preferencias con contexto y limpieza para que no se acumule lentitud
   ============================================================ */

/* ---------------- rendimiento: memoria y mapas ---------------- */

// Caché del dispositivo con tope: se guardan las 60 consultas más recientes
(function limpiarCacheLocal() {
  try {
    const k = Object.keys(localStorage).filter(x => x.startsWith('dlc-rc-'));
    if (k.length > 60) {
      k.map(x => { let t = 0; try { t = JSON.parse(localStorage.getItem(x)).t || 0; } catch (e) {} return [x, t]; })
        .sort((a, b) => a[1] - b[1]).slice(0, k.length - 60).forEach(([x]) => localStorage.removeItem(x));
    }
  } catch (e) {}
  setTimeout(limpiarCacheLocal, 10 * 60 * 1000);
})();
// Cada mapa se libera cuando su pantalla desaparece (antes quedaban vivos en memoria)
if (window.L && L.map) {
  const MAPAS = new Set(), crear = L.map;
  L.map = function (el, o) {
    const c = typeof el === 'string' ? document.getElementById(el) : el;
    if (c && c.__mapa) { try { c.__mapa.remove(); } catch (e) {} MAPAS.delete(c.__mapa); }
    const m = crear.call(L, el, o); if (c) c.__mapa = m; MAPAS.add(m); return m;
  };
  setInterval(() => MAPAS.forEach(m => { const c = m.getContainer && m.getContainer(); if (!c || !c.isConnected) { try { m.remove(); } catch (e) {} MAPAS.delete(m); } }), 30000);
}

/* ---------------- plan: cada parada con la ficha y una nota ---------------- */


/* ---------------- Configuración: todo se muestra en el panel de la derecha ---------------- */

let PANEL_ACTIVO = null;
function salirPanel() {
  if (!PANEL_ACTIVO) return;
  if (PANEL_ACTIVO.tipo === 'dbody') { const p = document.querySelector('#cfgcuerpo [data-panel]#dbody'); if (p) p.id = ''; const r = $('dbody-modal'); if (r) r.id = 'dbody'; }
  if (PANEL_ACTIVO.tipo === 'admin') { const p = document.querySelector('#cfgcuerpo [data-panel]#v-admin'); if (p) p.id = ''; const r = $('v-admin-real'); if (r) r.id = 'v-admin'; }
  PANEL_ACTIVO = null;
}
// Las pantallas que se abrían en ventana se pintan dentro del panel
function panelDeVentana(fn) {
  salirPanel();
  const r = $('dbody'); r.id = 'dbody-modal';
  $('cfgcuerpo').innerHTML = '<div id="dbody" data-panel="1" class="cfgpanel card"></div>';
  PANEL_ACTIVO = { tipo: 'dbody', refrescar: () => panelDeVentana(fn) };
  fn();
}
function panelDeModulo(sec) {
  salirPanel();
  const r = $('v-admin'); r.id = 'v-admin-real';
  $('cfgcuerpo').innerHTML = '<div id="v-admin" data-panel="1" class="cfgpanel cfgmod"></div>';
  PANEL_ACTIVO = { tipo: 'admin' };
  ADM_SEC = sec; cargarAdmin();
}
(function () {
  const d = $('dlg'), abrir = d.showModal.bind(d), cerrar = d.close.bind(d);
  d.showModal = function () { if (PANEL_ACTIVO && PANEL_ACTIVO.tipo === 'dbody') return; abrir(); };
  d.close = function (v) {
    if (PANEL_ACTIVO && PANEL_ACTIVO.tipo === 'dbody' && !d.open) { const f = PANEL_ACTIVO.refrescar; setTimeout(() => PANEL_ACTIVO && f && f(), 60); return; }
    cerrar(v);
  };
})();


/* ---------------- Mi perfil: contexto de la persona ---------------- */


/* ---------------- VeriFactu: explicado y claro ---------------- */

pintarVerifactu = async function () {
  await cargarAjustes();
  const v = Object.assign({ activo: false, modalidad: 'verifactu', entorno: 'pruebas' }, AJUSTES.verifactu || {});
  const [{ data: cad }, { data: evs }] = await Promise.all([RPC_ORIG('verificar_cadena', {}), RPC_ORIG('eventos_facturacion_lista', { lim: 1 })]);
  const c = cad || {}, ok = !c.rotas;
  $('fcuerpo').innerHTML = `
    <div class="vfhero ${v.activo ? 'on' : ''}">
      <div class="vfico">🛡️</div>
      <div><h2>VeriFactu ${v.activo ? '<span class="pill p-est">Activado</span>' : '<span class="pill p-per">Preparado · desactivado</span>'}</h2>
        <p>Sistema de la Agencia Tributaria para que las facturas no se puedan alterar y se puedan verificar. La plataforma ya emite cada factura cumpliendo sus requisitos; solo falta conectar el envío cuando decidáis activarlo.</p></div></div>
    <div class="vfpasos">
      <div class="vfpaso hecho"><span>✓</span><b>1 · Facturas preparadas</b><em>Numeración sin huecos, facturas inalterables y rectificativas.</em></div>
      <div class="vfpaso hecho"><span>✓</span><b>2 · Registro encadenado</b><em>${num(c.facturas || 0)} facturas con huella · ${ok ? 'cadena íntegra' : 'revisar desde ' + esc(c.primera_rota || '')}.</em></div>
      <div class="vfpaso ${v.activo ? 'hecho' : ''}"><span>${v.activo ? '✓' : '3'}</span><b>3 · QR y leyenda</b><em>${v.activo ? 'Las facturas nuevas llevan QR y «VERI*FACTU».' : 'Se añaden al activarlo.'}</em></div>
      <div class="vfpaso pend"><span>🔒</span><b>4 · Envío a Hacienda</b><em>Requiere el certificado digital de la empresa. Se configura al activarlo.</em></div>
    </div>
    <div class="vfgrid">
      <div class="card vfcard"><h3>Qué hace cada factura</h3><ul class="manlist">
        <li><span>🔢</span><span>Recibe el siguiente número de su serie: no puede haber huecos ni repetidos.</span></li>
        <li><span>🔗</span><span>Guarda una <b>huella</b> que la encadena con la anterior: si alguien cambiara una factura, la cadena lo delataría.</span></li>
        <li><span>🧾</span><span>No se puede modificar ni borrar: los errores se corrigen con una <b>rectificativa</b>.</span></li>
        <li><span>📋</span><span>Todo queda en el <b>registro de eventos</b>: emisiones, cobros, envíos y cambios de configuración${evs && evs[0] ? ` (último: ${esc(evs[0].tipo)} el ${new Date(evs[0].fecha).toLocaleDateString('es-ES')})` : ''}.</span></li></ul></div>
      <div class="card vfcard"><h3>Configuración</h3>
        <label class="vfswitch"><input type="checkbox" id="vfa" ${v.activo ? 'checked' : ''}><span class="sw"></span>
          <span><b>Activar VeriFactu</b><br><span class="sm">Las facturas nuevas llevarán el QR y la leyenda. Las ya emitidas no cambian.</span></span></label>
        <label>Modalidad</label>
        <div class="vfmodos">
          <label class="vfmodo"><input type="radio" name="vfm" value="verifactu" ${v.modalidad === 'verifactu' ? 'checked' : ''}><b>VeriFactu</b><span>Cada factura se envía a Hacienda al emitirla. La más sencilla de mantener.</span></label>
          <label class="vfmodo"><input type="radio" name="vfm" value="no_verifactu" ${v.modalidad === 'no_verifactu' ? 'checked' : ''}><b>No VeriFactu</b><span>Las facturas se firman y se guardan; Hacienda puede pedirlas cuando quiera.</span></label></div>
        <label for="vfe">Entorno</label><select id="vfe"><option value="pruebas" ${v.entorno === 'pruebas' ? 'selected' : ''}>Pruebas de la Agencia Tributaria</option><option value="produccion" ${v.entorno === 'produccion' ? 'selected' : ''}>Producción</option></select>
        <div class="acts" style="justify-content:flex-end"><button class="btn" id="vfok">Guardar</button></div></div>
    </div>`;
  $('vfok').onclick = async () => {
    const nuevo = { activo: $('vfa').checked, modalidad: document.querySelector('[name=vfm]:checked').value, entorno: $('vfe').value };
    if (nuevo.activo !== v.activo && !await preguntar(nuevo.activo ? 'Las facturas que se emitan a partir de ahora llevarán el QR y la leyenda VERI*FACTU. El envío a Hacienda necesitará el certificado de la empresa.' : 'Las facturas nuevas dejarán de llevar el QR. Las ya emitidas no cambian.',
      { titulo: nuevo.activo ? '¿Activar VeriFactu?' : '¿Desactivar VeriFactu?', ok: nuevo.activo ? 'Activar' : 'Desactivar' })) return;
    const { error } = await db.rpc('guardar_ajuste', { p_clave: 'verifactu', p_valor: nuevo });
    if (error) { toast('No se ha podido guardar', true); return; }
    AJUSTES.verifactu = nuevo; toast('Guardado · queda anotado en el registro'); pintarVerifactu();
  };
};

/* ---------------- Manual: se explica antes de llevarte a ningún sitio ---------------- */

const CFG_DE_MODULO = { agenda: 'horario', rutas: 'horario', admin: 'usuarios', facturacion: 'fiscal', inicio: 'kpis', config: 'prefs', directorio: 'cat', ventas: 'cat', permisos: 'usuarios', medico: 'usuarios', roles: 'usuarios' };
function infoManual(id, paso) {
  const s = MANUAL.find(x => x.id === id);
  if (!s && !paso) return;
  if (paso) {
    const [ic, t, d, m] = paso;
    $('dbody').innerHTML = `<div class="fh"><div><h2>${ic} ${esc(t)}</h2><div class="sm">Primeros pasos</div></div><button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
      <p>${esc(d)}</p>${(MANUAL.find(x => x.id === m) || {}).para ? `<p class="sm">${esc(MANUAL.find(x => x.id === m).para)}</p>` : ''}
      <div class="acts" style="justify-content:flex-end"><button class="btn sec" data-cerrar>Ahora no</button>
        ${m === 'config' || puedeModulo(m) ? `<button class="btn" id="mangoir">Llévame</button>` : ''}</div>`;
    $('dlg').showModal();
    if ($('mangoir')) $('mangoir').onclick = () => { $('dlg').close(); if (m === 'config') CFG_SEC = 'prefs'; ir(m); };
    return;
  }
  const n = s.a ? nivelDe2(s.a) : (puede('administrar') ? 3 : 1);
  const ay = AYUDA[id === 'visitas' ? 'agenda' : id === 'centros' ? 'directorio' : id] || null;
  const destino = MODULO_AREA[id] || ['manual', 'config'].includes(id) ? id : null;
  const cfg = CFG_DE_MODULO[id];
  $('dbody').innerHTML = `<div class="fh"><div><h2>${ICONOS_MANUAL[id] || '📘'} ${esc(s.t)}</h2><div class="sm">${esc(s.para)}</div></div><button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <h3 class="mansub">Qué puedes hacer</h3><ul class="manlist">${s.hacer.map(([req, txt]) => `<li class="${n >= req ? 'si' : 'no'}"><span>${n >= req ? '✓' : '🔒'}</span><span>${esc(txt)}</span></li>`).join('')}</ul>
    ${ay && ay[2] && ay[2].length ? `<h3 class="mansub">Cómo funciona</h3><ul class="manlist">${ay[2].map(x => `<li><span>•</span><span>${x}</span></li>`).join('')}</ul>` : ''}
    ${s.config.length ? `<h3 class="mansub">Dónde se configura</h3><div class="mancfg">${s.config.map(x => `<span>⚙ ${esc(x)}</span>`).join('')}</div>` : ''}
    <div class="acts" style="justify-content:flex-end;flex-wrap:wrap;margin-top:14px"><button class="btn sec" data-cerrar>Cerrar</button>
      ${cfg && (puede('administrar') || ['horario', 'kpis', 'prefs'].includes(cfg)) ? `<button class="btn sec" id="manircfg">Ir a su configuración</button>` : ''}
      ${destino && destino !== 'manual' && (destino === 'config' || puedeModulo(destino)) ? `<button class="btn" id="manirmod">Abrir ${esc(s.t)}</button>` : ''}</div>`;
  $('dlg').showModal();
  if ($('manirmod')) $('manirmod').onclick = () => { $('dlg').close(); ir(destino); };
  if ($('manircfg')) $('manircfg').onclick = () => { $('dlg').close(); CFG_SEC = cfg; ir('config'); };
}
document.addEventListener('click', e => { const r = $('manres'); if (r && !e.target.closest('.manbusca')) r.classList.add('hide'); });


