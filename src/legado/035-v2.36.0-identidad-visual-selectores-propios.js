/* ============================================================
   DLC OS 2.0 · v2.36.0 · Identidad visual, selectores propios de fecha,
   hora y número, espacio del médico con avisos, alertas en ventana,
   asignación de comisiones con fecha desde Comisiones y restablecer
   pruebas solo para la persona responsable
   ============================================================ */

Object.assign(RPC_TTL, { informe_cuenta: 60, mis_notificaciones: 20, asignaciones_esquema_lista: 30 });

/* ---------------- selectores propios: fecha, hora y número ---------------- */

const MESES_L = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
let SELPOP = null, LOGO_CIRC = false;
// Con una ventana abierta, solo se puede pulsar lo que está dentro: el selector se coloca en ella
const capaSelector = inp => inp.closest('dialog[open]') || [...document.querySelectorAll('dialog[open]')].pop() || document.body;
function emitir(inp) { inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true })); }

// (v2.183.0: aquí iba la primera versión de abrirCalendario; se redefine entera más abajo)

// (v2.183.0: aquí iba la primera versión de abrirReloj; se redefine entera más abajo)

function valorVisible(inp) {
  const w = inp.closest('.selw'), sp = w && w.querySelector('.selval'); if (!sp) return;
  const v = inp.value;
  if (!v) { sp.textContent = inp.type === 'date' ? 'Elige una fecha' : 'Elige una hora'; sp.classList.add('vacio'); return; }
  sp.classList.remove('vacio');
  if (inp.type === 'time') { sp.textContent = v.slice(0, 5); return; }
  const d = new Date(v + 'T12:00:00');
  sp.textContent = isNaN(d) ? v : d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}
// Cada campo de fecha, hora o número se mejora al aparecer en pantalla
function mejorarCampos(raiz) {
  (raiz || document).querySelectorAll('input[type=date]:not([data-sel]), input[type=time]:not([data-sel]), input[type=number]:not([data-sel])').forEach(inp => {
    inp.dataset.sel = '1';
    if (inp.closest('.selpop')) return;
    if (inp.type === 'number') {
      if (inp.closest('.lrow') && inp.offsetWidth && inp.offsetWidth < 70) return;
      const w = document.createElement('span'); w.className = 'numw';
      inp.parentNode.insertBefore(w, inp); w.appendChild(inp);
      w.insertAdjacentHTML('afterbegin', '<button type="button" class="nb" data-nd="-1" aria-label="Menos" tabindex="-1">−</button>');
      w.insertAdjacentHTML('beforeend', '<button type="button" class="nb" data-nd="1" aria-label="Más" tabindex="-1">+</button>');
      if (inp.disabled) w.classList.add('dis');
      return;
    }
    const w = document.createElement('span'); w.className = 'selw ' + (inp.type === 'date' ? 'fecha' : 'hora');
    inp.parentNode.insertBefore(w, inp); w.appendChild(inp);
    w.insertAdjacentHTML('beforeend', `<span class="selico" aria-hidden="true">${inp.type === 'date' ? '📅' : '🕒'}</span>`);
    inp.dataset.ro = inp.readOnly ? '1' : '';
    inp.readOnly = true; inp.setAttribute('inputmode', 'none');
    // Se muestra el valor en formato español, sin depender del idioma del navegador
    w.insertAdjacentHTML('afterbegin', '<span class="selval"></span>');
    const desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    Object.defineProperty(inp, 'value', { configurable: true, get() { return desc.get.call(this); }, set(v) { desc.set.call(this, v); valorVisible(this); } });
    inp.addEventListener('change', () => valorVisible(inp)); inp.addEventListener('input', () => valorVisible(inp));
    valorVisible(inp);
  });
}
document.addEventListener('click', e => {
  const nb = e.target.closest('.numw .nb');
  if (nb) {
    const inp = nb.parentNode.querySelector('input'); if (inp.disabled || inp.readOnly) return;
    const paso = +inp.step || 1, v = (+inp.value || 0) + paso * +nb.dataset.nd;
    let n = v; if (inp.min !== '' && n < +inp.min) n = +inp.min; if (inp.max !== '' && n > +inp.max) n = +inp.max;
    inp.value = paso < 1 ? n.toFixed(String(paso).split('.')[1].length) : n; emitir(inp); return;
  }
  const s = e.target.closest('.selw');
  if (s) {
    const inp = s.querySelector('input'); if (inp.disabled || inp.dataset.ro === '1') return;
    e.preventDefault(); inp.type === 'date' ? abrirCalendario(inp) : abrirReloj(inp); return;
  }
  // v2.343.0: el «clic fantasma» del móvil (justo tras abrir) no cierra el calendario: con las ventanas a pantalla completa caía fuera
  const sd = $('seldlg'); if (sd && sd.__abierto && Date.now() - sd.__abierto < 500) return;
  if (!e.target.closest('.selpop')) cerrarSelector();
}, true);
// El calendario del sistema no se abre: se usa el propio
document.addEventListener('mousedown', e => { const i = e.target.closest('.selw input'); if (i) e.preventDefault(); }, true);
document.addEventListener('keydown', e => {
  const i = e.target.closest && e.target.closest('.selw input');
  if (i && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); i.type === 'date' ? abrirCalendario(i) : abrirReloj(i); }
  if (e.key === 'Escape') cerrarSelector();
});
document.addEventListener('scroll', e => { if (SELPOP && Date.now() - (SELPOP.__t || 0) > 500 && !(e.target.closest && e.target.closest('.selpop'))) cerrarSelector(); }, true);
new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1) mejorarCampos(n); })
  .observe(document.body, { childList: true, subtree: true });
['dlg', 'dlg2', 'ficha', 'mini'].forEach(id => { const d = $(id); if (d) d.addEventListener('close', cerrarSelector); });
mejorarCampos(document);

/* ---------------- alertas: el detalle se abre en una ventana ---------------- */

document.addEventListener('click', e => {
  const s = e.target.closest('#iniextra details.alerta2 > summary');
  if (!s) return;
  e.preventDefault(); e.stopPropagation();
  const det = s.parentElement, items = [...det.querySelectorAll(':scope > div > .item')];
  const titulo = s.textContent.replace(/\s+/g, ' ').trim();
  $('dbody').innerHTML = `<div class="fh"><div><h2>${esc(titulo.replace(/^\d+\s*/, ''))}</h2><div class="sm">${num(items.length)} ${items.length === 1 ? 'caso' : 'casos'}${det.querySelector('.sm:last-child') && /más/.test(det.lastElementChild.textContent) ? ' · ' + esc(det.lastElementChild.textContent) : ''}</div></div>
    <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <input id="alq" type="search" placeholder="Buscar en la lista" style="margin:6px 0 8px">
    <div class="lista alertlist" id="allista"></div><div id="alpag"></div>`;
  let pag = 0;
  const pinta = () => {
    const q = $('alq').value.trim().toLowerCase(), f = items.filter(x => !q || x.textContent.toLowerCase().includes(q)), tam = 12;
    $('allista').innerHTML = ''; f.slice(pag * tam, pag * tam + tam).forEach(x => $('allista').appendChild(x.cloneNode(true)));
    $('allista').querySelectorAll('[data-inificha]').forEach(b => b.onclick = () => { $('dlg').close(); abrirFicha(b.dataset.inificha); });
    $('allista').querySelectorAll('[data-iniped]').forEach(b => b.onclick = () => verPedido(b.dataset.iniped));
    $('allista').querySelectorAll('[data-inistock]').forEach(b => b.onclick = () => { $('dlg').close(); PSEC = 'stock'; ir('productos'); });
    $('allista').querySelectorAll('[data-inicomp]').forEach(b => b.onclick = () => editorCompra(b.dataset.inicomp));
    paginador($('alpag'), f.length, pag, p => { pag = p; pinta(); }, () => { pag = 0; pinta(); });
  };
  $('alq').oninput = () => { pag = 0; pinta(); };
  pinta(); $('dlg').showModal();
}, true);

/* ---------------- comisiones: asignar esquema con fecha desde Comisiones ---------------- */


/* ---------------- entorno de pruebas: solo restablece la persona responsable ---------------- */

if (EN_PRUEBAS) {
  pintarFranjaPruebas = (orig => async function () {
    orig();
    const b = $('prreset'); if (!b) return;
    const { data: permitido, error } = await RPC_ORIG('pruebas_puede_restablecer', {});
    if (error) return;               // proyecto sin el ajuste: se mantiene como estaba
    if (!permitido) { b.remove(); return; }
    b.onclick = async () => {
      const txt = await pedirTexto('Se borrará todo lo creado o cambiado en pruebas y los datos quedarán como se copiaron de producción.\n\nEscribe VOLVER para confirmar.', '', { titulo: '¿Volver a los datos de partida?', ok: 'Volver a los datos de partida' });
      if (txt === null) return;
      if (txt.trim().toUpperCase() !== 'VOLVER') { toast('No se ha hecho nada: no coincide la palabra', true); return; }
      pantallaCarga('Volviendo a los datos de partida…');
      const { data: r, error: e2 } = await RPC_ORIG('pruebas_resetear_responsable', { p_confirmacion: 'RESTABLECER' });
      if (e2 || !r || !r.ok) { quitarCarga(); toast('No se ha podido: ' + ((e2 && e2.message) || (r && r.error) || ''), true); return; }
      limpiarDatosLocales(); location.reload();
    };
  })(pintarFranjaPruebas);
}

/* ---------------- espacio del médico ---------------- */

const ES_MEDICO = () => puede('portal_prescriptor');

async function cargarInforme() {
  if (puede('portal_centro')) return cargarCentro();   // v2.128.0: el portal del centro
  // v2.271.0: página nueva (al final del archivo); al arrancar se espera a que esté leída
  if (!window.PM_LISTO) { const v0 = $('v-informe'); if (v0 && !v0.innerHTML.trim()) v0.innerHTML = '<div class="card">' + skelCard('Cargando tu informe…') + '</div>'; setTimeout(cargarInforme, 30); return; }
  return cargarInforme2271();
  const v = $('v-informe');
  v.innerHTML = `<div class="medhero"><div><div class="sm" style="color:rgba(255,255,255,.8)">Tu portal</div><h1 id="mdnom">…</h1><div id="mdesp" class="sm" style="color:rgba(255,255,255,.85)"></div></div>
      <div class="medper"><div id="mdper"></div></div></div>
    <div id="mdcuerpo"><div class="card">${skelCard('Cargando tu informe…')}</div></div>`;
  const pinta = async () => {
    const r = $('mdper').__rango();
    const { data: d } = await RPC_ORIG('informe_cuenta', { p_desde: r.desde, p_hasta: r.hasta });
    if (!d || !d.ok) {
      // v2.291: sin ficha vinculada, las dos pestañas lo dicen (antes «Mi ficha» se quedaba cargando) y la cabecera lleva su nombre
      const sin = `<div class="card"><div class="vacio">Tu usuario todavía no está vinculado a tu ficha de ${TT('medico', 's', '', 'l', 'l')}. Avisa a la empresa para activarlo.</div></div>`;
      $('mdcuerpo').innerHTML = sin; if ($('pmficha')) $('pmficha').innerHTML = sin;
      $('mdnom').textContent = (PERFIL && PERFIL.nombre) || ''; return;
    }
    $('mdnom').textContent = d.medico.nombre; $('mdesp').textContent = d.medico.especialidad || '';
    const top = d.posicion && d.posicion <= 3 ? 'Top 3' : d.posicion && d.posicion <= 5 ? 'Top 5' : d.posicion && d.posicion <= 10 ? 'Top 10' : null;
    const ll = d.llamadas || {}, conv = ll.total ? Math.round(ll.con_pedido / ll.total * 100) : null;
    const meses = mesesEntre(d.desde, d.hasta), serie = {}; (d.serie || []).forEach(s => serie[s.mes] = s);
    $('mdcuerpo').innerHTML = `
      <div class="kpis vtot mdk">
        <div class="kpi"><b>${num(d.unidades)}</b><span>unidades atribuidas</span></div>
        <div class="kpi"><b>${num(d.pautas)}</b><span>${TT('pauta', 'p', '', 'l', 'l')} (pedidos)</span></div>
        <div class="kpi"><b>${num(d.pacientes)}</b><span>${TT('paciente', 'p', '', 'l', 'l')}</span></div>
        <div class="kpi"><b>${num(d.repiten)}</b><span>${TT('paciente', 'p', '', 'l', 'l')} que repiten</span></div>
        <div class="kpi ${top ? 'ok' : ''}"><b>${top ? '🏆 ' + top : d.posicion ? 'Nº ' + d.posicion : '—'}</b><span>${d.posicion ? `de ${num(d.prescriptores)} ${TT('medico', 'p', '', 'l', 'l')}` : 'sin ventas en el periodo'}</span></div>
      </div>
      <div class="angrid">
        <div class="card ancard ancha"><h2>Tus ${TT('pauta', 'p', '', 'l', 'l')} mes a mes</h2>
          ${d.unidades ? svgBarras(meses, meses.map(m => (serie[m] || {}).unidades || 0), meses.map(m => (serie[m] || {}).pautas || 0), ['Unidades', TT('pauta', 'p', '', 'l', 'C')])
            : vacioGrafico(`Cuando tus ${TT('paciente', 'p', '', 'l', 'l')} hagan su pedido, verás aquí la evolución.`)}
          <p class="leer">Cada barra son las unidades atribuidas en el mes y la línea, el número de ventas.${d.ultima_pauta ? ' Última venta: ' + fechaCorta(d.ultima_pauta) + '.' : ''}</p></div>
        <div class="card ancard"><h2>Qué ${TT('pauta', 'p', '', 'l', 'l')}</h2>
          ${(d.productos || []).length ? svgDonut(d.productos.map(x => ({ n: x.nombre, v: x.unidades }))) : vacioGrafico('Aparecerá el reparto por producto.')}</div>
        <div class="card ancard"><h2>Llamadas de tus ${TT('paciente', 'p', '', 'l', 'l')}</h2>
          <div class="minis"><div><b>${num(ll.total || 0)}</b><span>llamadas</span></div><div><b>${conv == null ? '—' : conv + '%'}</b><span>acaban en pedido</span></div></div>
          ${(ll.por_resultado || []).length ? barrasH(ll.por_resultado.map(x => ({ n: x.resultado, v: x.n })), num) : `<p class="sm" style="padding:0 16px">Todavía no hay llamadas registradas en el periodo.</p>`}
          <p class="leer">${TT('paciente', 'p', '', 'l', 'C')} que llaman a la empresa. Si muchos llaman por dudas o por precio, podemos darte material para explicarlo.</p></div>
      </div>
      <p class="sm" style="text-align:center;margin:18px 0">Por confidencialidad no se muestran datos de tus ${TT('paciente', 'p', '', 'l', 'l')} ni importes.</p>`;
  };
  montarPeriodo($('mdper'), { id: 'informe', valor: 'anio', alCambiar: pinta });
  pinta();
  portalMedico();   // v2.126.0
}

async function pintarAvisos() {
  const b = $('mdavisos'); if (!b) return;
  const { data } = await RPC_ORIG('mis_notificaciones', { lim: 30 });
  const n = (data && data.sin_leer) || 0;
  b.innerHTML = `🔔${n ? `<span class="nb2">${n > 9 ? '9+' : n}</span>` : ''}`;
  b.onclick = async () => {
    const l = (data && data.lista) || [];
    $('dbody').innerHTML = `<div class="fh"><div><h2>Avisos</h2><div class="sm">Cada vez que se registra ${TT('pauta', 's', 'un', 'l', 'l')}</div></div><button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
      <div class="lista">${l.map(x => `<div class="item ${x.leida_en ? '' : 'nuevo'}" style="cursor:default"><span class="ic">💊</span>
        <span class="tx"><b>${esc(x.titulo)}</b><span class="sm">${esc(x.cuerpo || '')} · ${new Date(x.creado_en).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}</span></span></div>`).join('') || '<div class="vacio">Sin avisos todavía.</div>'}</div>`;
    $('dlg').showModal();
    if (n) { await db.rpc('leer_notificaciones'); pintarAvisos(); }
  };
}

if (typeof pintarBnav === 'function') pintarBnav = (orig => function () {
  if (ES_MEDICO()) { const b = $('bnav'); if (b) b.innerHTML = `<button data-t="informe" aria-selected="true"><span>◉</span>${puede('portal_centro') ? 'Mi centro' : 'Mi informe'}</button>`; if (b) b.firstChild.onclick = () => ir('informe'); return; }
  orig();
})(pintarBnav);

// Vincular un usuario de tipo Médico con su ficha (Administración → Usuarios → Editar)

MANUAL.push({ id: 'medico', t: `Espacio ${TT('medico', 's', 'del', 'l', 'l')}`, a: null, para: `${TT('medico', 'p', 'el', 'C', 'l')} con usuario ven su portal: cifras agregadas, sin importes ni datos de personas.`,
  hacer: [[3, 'Crear el usuario con un rol de portal y vincularlo a su ficha (Configuración → Usuarios → Editar)']],
  config: [`${TT('medico', 's', 'el', 'C', 'l')} ve unidades, ventas, ${TT('paciente', 'p', '', 'l', 'l')} (solo el número) y las llamadas de sus ${TT('paciente', 'p', '', 'l', 'l')}. Nunca importes ni nombres.`] });
ICONOS_MANUAL.medico = '🩺';

/* ---------------- factura en PDF con el logo circular ---------------- */



