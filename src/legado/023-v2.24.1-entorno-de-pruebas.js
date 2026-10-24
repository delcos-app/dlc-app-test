/* ============================================================
   DLC OS 2.0 · v2.24.1 · Entorno de pruebas
   ============================================================ */

const EN_PRUEBAS = CFG.entorno === 'pruebas';

function pintarFranjaPruebas() {
  if (!EN_PRUEBAS) return;
  document.title = '[PRUEBAS] ' + document.title.replace(/^\[PRUEBAS\] /, '');
  const meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.content = '#B45309';
  let f = $('franjapruebas');
  if (!f) {
    document.body.insertAdjacentHTML('afterbegin', '<div id="franjapruebas"></div>');
    document.body.classList.add('enpruebas');
    f = $('franjapruebas');
  }
  if (CFG.sinConfigurar) {
    f.innerHTML = '<b>ENTORNO DE PRUEBAS SIN CONFIGURAR</b> · Falta pegar la Project URL y la clave anon de pruebas en config.js';
    return;
  }
  const admin = PERFIL && puede('administrar');
  f.innerHTML = `<span><b>ENTORNO DE PRUEBAS</b> · Nada de lo que hagas aquí afecta a los datos reales
      <button class="ai" data-ayuda="pruebas" aria-label="Qué es el entorno de pruebas">i</button>
      <span class="prpunto" id="prpunto"></span></span>
    ${admin ? `<span class="acts" style="margin:0">
      <button class="btn chico" id="prreset" title="Deshace todo lo hecho en pruebas y deja los datos como se cargaron de producción">↺ Volver a los datos de partida</button></span>` : ''}`;
  // Cuándo se guardó el punto de partida
  RPC_ORIG_FROM('entorno_pruebas').select('maestro_guardado_en, ultimo_reset').eq('id', 1).single().then(({ data }) => {
    const el = $('prpunto'); if (!el) return;
    const fmt = x => new Date(x).toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    el.textContent = data && data.maestro_guardado_en ? '· Datos de partida: copia de producción del ' + fmt(data.maestro_guardado_en)
      : '· Faltan los datos de partida (ejecuta pruebas_punto_fijo.sql)';
    if (!(data && data.maestro_guardado_en)) el.classList.add('falta');
  });
  if (!admin) return;
  $('prreset').onclick = async () => {
    const txt = await pedirTexto(`Se borrará todo lo que se haya creado o cambiado en pruebas (${TT('visita', 'p', '', 'l', 'l')}, citas, pedidos, ${TT('paciente', 'p', '', 'l', 'l')}, cambios en fichas…) y los datos quedarán exactamente como se copiaron de producción.\n\nNo afecta a producción. Escribe VOLVER para confirmar.`, '',
      { titulo: '¿Volver a los datos de partida?', ok: 'Volver a los datos de partida' });
    if (txt === null) return;
    if (txt.trim().toUpperCase() !== 'VOLVER') { toast('No se ha hecho nada: no coincide la palabra', true); return; }
    toast('Volviendo al punto de partida…');
    const { data: r, error } = await RPC_ORIG('pruebas_resetear', { p_confirmacion: 'RESTABLECER' });
    if (error || !r || !r.ok) {
      toast(r && r.error === 'sin_maestro' ? 'Faltan los datos de partida: hay que ejecutar pruebas_punto_fijo.sql' : 'No se ha podido: ' + ((error && error.message) || (r && r.error) || ''), true);
      return;
    }
    try { Object.keys(localStorage).filter(k => k.startsWith('dlc-rc-') || k.startsWith('dlc-jornada-')).forEach(k => localStorage.removeItem(k)); } catch (e) {}
    toast('Datos como al principio'); setTimeout(() => location.reload(), 600);
  };
}

AYUDA.pruebas = ['Entorno de pruebas', 'Una copia completa de la plataforma con su propia base de datos, para probar sin miedo.', [
  `Todo lo que hagas aquí (${TT('visita', 'p', '', 'l', 'l')}, citas, pedidos, cambios en fichas…) se queda aquí: <b>producción no se toca</b>.`,
  'Los <b>datos de partida</b> son una copia de producción. Son fijos: desde la app no se pueden cambiar, así que siempre se puede volver a ellos.',
  '<b>↺ Volver a los datos de partida</b> deshace todo lo hecho en pruebas y deja los datos exactamente como se copiaron. Úsalo al terminar una tanda de pruebas.',
  'Los usuarios son los mismos que en producción, con la contraseña común de pruebas.',
  'Para tener datos más recientes de producción se hace una nueva copia (lo preparo yo); esa copia pasa a ser los nuevos datos de partida.']];

if (EN_PRUEBAS) {
  pintarFranjaPruebas();
}


