// @ts-check
// nucleo/errores.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función y constantes de valor puro: su sitio no cambia lo que hace la app. Normas: docs/normas_codigo.md.

let ERR_ENVIADOS = new Set();

function registrarErrorBase(tipo, mensaje, detalle) {
  try {
    const m = String(mensaje || '').slice(0, 500);
    ERRORES_SESION.push({ t: new Date().toISOString(), tipo, m, pantalla: TAB }); if (ERRORES_SESION.length > 20) ERRORES_SESION.shift();
    const clave = tipo + '|' + m; if (ERR_ENVIADOS.has(clave) || !PERFIL) return; ERR_ENVIADOS.add(clave);
    // La consulta solo se envía cuando se espera su resultado
    Promise.resolve(RPC_ORIG('registrar_error', { p: { tipo, mensaje: m, detalle: detalle || null, pantalla: TAB, version: VERSION_APP, navegador: navigator.userAgent } })).then(() => {}, () => {});
  } catch (e) {}
}

function registrarErrorBase2(tipo, mensaje, detalle) {
  if (tipo === 'api' && esErrorRed(mensaje)) return;
  return registrarErrorBase.call(this, tipo, mensaje, detalle);
}

// En solo lectura, los fallos al guardar se explican (toast, en componentes/aviso.js) y no cuentan como errores de la plataforma
function registrarError(tipo, mensaje, detalle) {
  if (PAGO_ESTADO && PAGO_ESTADO.solo_lectura && /row-level security|violates row-level/i.test(String(mensaje))) return;
  return registrarErrorBase2.call(this, tipo, mensaje, detalle);
}

function reportarProblema() {
  const mods = [...document.querySelectorAll('nav.main [data-t]')].filter(b => !b.classList.contains('hide') && getComputedStyle(b).display !== 'none').map(b => [/** @type {HTMLElement} */ (b).dataset.t, b.textContent.trim()]);
  const chips = (nombre, ops, sel) => `<div class="rpchips" data-rp="${nombre}">${ops.map(([v, t]) => `<button type="button" data-v="${esc(v)}" class="${v === sel ? 'on' : ''}">${esc(t)}</button>`).join('')}</div>`;
  $('dbody').innerHTML = `<div class="fh"><div><h2>Reportar un problema</h2><div class="sm">Cuantos más detalles, antes se soluciona. Todo lo técnico se adjunta solo.</div></div>
    <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="rpgrid">
      <div><label>¿Qué ha pasado?</label>${chips('tipo', [['error', 'Algo falla o da error'], ['no_esperado', 'No hace lo que esperaba'], ['lento', 'Va lento'], ['visual', 'Se ve mal'], ['datos', 'Datos incorrectos'], ['idea', 'Idea de mejora']], 'error')}</div>
      <div><label>¿Dónde?</label>${chips('modulo', mods.concat([['config', 'Configuración'], ['otro', 'Otro sitio']]), mods.some(m => m[0] === TAB) ? TAB : (TAB === 'config' ? 'config' : 'otro'))}</div>
      <div><label>¿Cuánto te afecta?</label>${chips('gravedad', [['bloquea', 'No puedo seguir trabajando'], ['molesta', 'Puedo seguir, pero molesta'], ['menor', 'Es un detalle']], 'molesta')}</div>
      <div><label>¿Pasa siempre?</label>${chips('frecuencia', [['siempre', 'Siempre'], ['aveces', 'A veces'], ['una', 'Solo una vez']], 'siempre')}</div>
    </div>
    <label for="rpque">Cuéntalo con tus palabras</label><textarea id="rpque" rows="4" placeholder="Qué intentabas hacer, qué esperabas y qué ha pasado. Por ejemplo: «Al guardar ${TT('visita', 's', 'un', 'l', 'l')} de ${TT('medico', 's', 'un', 'l', 'l', 'nuevo')}, sale un error y no se guarda»."></textarea>
    <label>Captura de pantalla (opcional)</label><input type="file" id="rpcap" accept="image/*">
    <details class="rptec"><summary>Datos técnicos que se adjuntan</summary><div class="sm">Pantalla: ${esc(TAB)} · versión ${esc(VERSION_APP)} · ${innerWidth}×${innerHeight} · ${ERRORES_SESION.length} errores en esta sesión · tus últimas ${RASTRO.length} acciones</div></details>
    <div class="acts" style="justify-content:flex-end"><button class="btn sec" data-cerrar>Cancelar</button><button class="btn" id="rptok" disabled>Enviar el reporte</button></div>`;
  $('dlg').classList.add('amplia'); $('dlg').showModal();
  const val = {};
  $('dbody').querySelectorAll('.rpchips').forEach(g => { val[g.dataset.rp] = (g.querySelector('.on') || {}).dataset ? g.querySelector('.on').dataset.v : ''; g.querySelectorAll('button').forEach(b => b.onclick = () => { g.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); val[g.dataset.rp] = b.dataset.v; }); });
  $('rpque').oninput = () => { $('rptok').disabled = $('rpque').value.trim().length < 5; };
  let captura = null;
  $('rpcap').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    const img = new Image(); img.src = URL.createObjectURL(f); await img.decode();
    const k = Math.min(1, 1280 / img.width), c = document.createElement('canvas'); c.width = img.width * k; c.height = img.height * k;
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); captura = c.toDataURL('image/jpeg', 0.7);
  };
  $('rptok').onclick = () => conCarga($('rptok'), 'Enviando…', async () => {
    const nombres = { tipo: 'Tipo', modulo: 'Dónde', gravedad: 'Gravedad', frecuencia: 'Frecuencia' };
    const resumen = Object.entries(val).map(([k, v]) => `${nombres[k]}: ${($('dbody').querySelector(`[data-rp="${k}"] [data-v="${v}"]`) || {}).textContent || v}`).join(' · ');
    const { data, error } = await RPC_ORIG('registrar_error', { p: { tipo: 'reporte', mensaje: `[${resumen}] ${$('rpque').value.trim()}`, pantalla: val.modulo || TAB, version: VERSION_APP, navegador: navigator.userAgent,
      detalle: Object.assign({}, val, { errores_sesion: ERRORES_SESION, ultimas_acciones: RASTRO, ancho: innerWidth, alto: innerHeight, captura }) } });
    if (error || !data || !data.ok) { toast('No se ha podido enviar', true); return; }
    delete $('dlg').dataset.sucio; $('dlg').close(); toast('Gracias: el problema queda registrado con todos los detalles');
  });
}

// Producción (3/10/2026): en el iPhone, sin cobertura, Safari da «Load failed» o «Fetch is aborted». Eso no es un fallo de la plataforma:
// no se apunta en el registro de errores, y la visita (registrar_actividad, que no se duplica gracias a su op_id) se guarda en la cola
// del dispositivo y se envía al recuperar la conexión, en lugar de pedir que se repita.
function esErrorRedBase(e) { return /failed to fetch|load failed|networkerror|network request failed|aborterror|fetch is aborted|internet connection|err_internet|err_network/i.test(String((e && (e.message || e)) || '')); }

function esErrorRed(e) {
  return esErrorRedBase(e) || /ha tardado demasiado|tiempo agotado|timeout|timed out/i.test(String((e && (e.message || e)) || ''));
}
