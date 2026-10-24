/* ============================================================
   v2.57.0 · Auditoría visual completa: criterio único de pantallas,
   barras de tabla, ventanas y pila de ventanas, Mi perfil, Empresa,
   Plan, reporte de problemas guiado y un gráfico más en Analítica
   ============================================================ */

Object.assign(ICON_NOM, {"arrow-left": "<path d=\"m12 19-7-7 7-7\" /> <path d=\"M19 12H5\" />", "shield": "<path d=\"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z\" />", "log-out": "<path d=\"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4\" /> <polyline points=\"16 17 21 12 16 7\" /> <line x1=\"21\" x2=\"9\" y1=\"12\" y2=\"12\" />", "camera": "<path d=\"M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z\" /> <circle cx=\"12\" cy=\"13\" r=\"3\" />", "circle-help": "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <path d=\"M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3\" /> <path d=\"M12 17h.01\" />", "zap": "<path d=\"M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z\" />", "badge-check": "<path d=\"M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z\" /> <path d=\"m9 12 2 2 4-4\" />", "rocket": "<path d=\"M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z\" /> <path d=\"m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z\" /> <path d=\"M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0\" /> <path d=\"M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5\" />", "users": "<path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\" /> <circle cx=\"9\" cy=\"7\" r=\"4\" /> <path d=\"M22 21v-2a4 4 0 0 0-3-3.87\" /> <path d=\"M16 3.13a4 4 0 0 1 0 7.75\" />", "credit-card": "<rect width=\"20\" height=\"14\" x=\"2\" y=\"5\" rx=\"2\" /> <line x1=\"2\" x2=\"22\" y1=\"10\" y2=\"10\" />", "mouse-pointer-click": "<path d=\"M14 4.1 12 6\" /> <path d=\"m5.1 8-2.9-.8\" /> <path d=\"m6 12-1.9 2\" /> <path d=\"M7.2 2.2 8 5.1\" /> <path d=\"M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z\" />", "key-round": "<path d=\"M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z\" /> <circle cx=\"16.5\" cy=\"7.5\" r=\".5\" fill=\"currentColor\" />", "chevron-down": "<path d=\"m6 9 6 6 6-6\" />"});

/* ---------------- 1. Controles de vista en la barra de cada tabla ---------------- */

// La cabecera de la pantalla es para acciones (crear, registrar…). Buscar, filtros y columnas
// van en la barra de la propia tabla, a la derecha, como en Prescriptores
function barraTabla(sec) {
  const b = sec.querySelector('.htbtn'), g = sec.querySelector('.dgrid');
  if (!b || !g || b.closest('.tbarra, .filtros')) return;
  const caja = g.closest('.card, .panel') || g.parentElement;
  let barra = caja.querySelector(':scope > .filtros:not(.hide)') || caja.querySelector(':scope > .tbarra');
  if (!barra) { caja.insertAdjacentHTML('afterbegin', '<div class="tbarra"></div>'); barra = caja.querySelector(':scope > .tbarra'); }
  barra.classList.add('conbtn'); barra.appendChild(b); b.classList.add('aderecha');
}
ordenarBotones = function (sec) {
  // Cabecera: secundarios y la acción principal siempre la última
  sec.querySelectorAll('.saludo .acts').forEach(acts => {
    const bs = [...acts.children].filter(b => b.matches('button, a.btn, select'));
    // v2.75.0: los selectores de vista (Día, Semana, Mes, Equipo…) no son la acción principal aunque estén marcados: no se mueven
    const vista = b => b.dataset && b.dataset.ag && b.dataset.ag !== 'nueva';
    const peso = b => (b.matches('.btn:not(.sec)') && !b.classList.contains('icobtn') && !b.classList.contains('iniact') && !vista(b)) ? 3 : b.matches('select') ? 0 : 1;
    const orden = [...bs].sort((a, c) => peso(a) - peso(c));
    if (orden.some((b, i) => b !== bs[i])) orden.forEach(b => acts.appendChild(b));
  });
};

/* ---------------- 2. Inicio: actualizar como icono, igual que los de al lado ---------------- */

pintarActualizado = (orig => function () {
  orig();
  const b = $('iniact'); if (!b) return;
  b.classList.add('icoredondo', 'icoonly');   // v2.337.0: botón de icono del sistema delcos (con el relleno de un botón normal el icono quedaba 3 px a la derecha)
  const c = CACHE_MOD.inicio; const m = c ? Math.floor((Date.now() - c.t) / 60000) : 0;
  b.title = (m < 1 ? 'Datos actualizados ahora' : `Datos actualizados hace ${m} min`) + ' · Pulsa para actualizar';
  b.setAttribute('aria-label', b.title);
  const sp = b.querySelector('span'); if (sp) sp.textContent = '';
})(pintarActualizado);

/* ---------------- 3. Cuentas: una sola ayuda junto al título; nombre configurable en Calidad ---------------- */

barraCuentas = (orig => function () {
  const t = $('dirtools'), h = document.querySelector('#dircab h1');
  // Solo la ayuda de la barra (no las de la tabla) y una sola vez
  if (t && h && !h.querySelector('.ai')) { const ai = t.parentElement.querySelector(':scope > .ai'); if (ai) h.appendChild(ai); }
  const ai0 = document.querySelector('#v-directorio .panel .ai'); const guard = ai0; // no se mueve nada más
  const m = $('mapaBtn');
  if (m) {
    const lista = /lista/i.test(m.textContent) || m.dataset.modo === 'true' && !m.querySelector('svg');
    if (!m.querySelector('svg')) { m.dataset.modo = String(lista); m.innerHTML = svgIco(ICON_NOM[lista ? 'list' : 'map']); m.title = lista ? 'Ver la lista' : 'Ver en el mapa'; m.setAttribute('aria-label', m.title); }
    m.classList.add('icobtn');
  }
  if (t) t.classList.add('aderecha');
})(barraCuentas);
// Si antes se subieron varias ayudas al título, se deja solo una
new MutationObserver(() => { const h = document.querySelector('#dircab h1'); if (h) h.querySelectorAll('.ai').forEach((a, i) => { if (i) a.remove(); }); }).observe(document.querySelector('main'), { childList: true, subtree: true });
cargarSeguimiento = (orig => async function (...a) { await orig(...a); const v = $('calvolver'); if (v) v.textContent = '‹ ' + etiquetaContactos(); })(cargarSeguimiento);

/* ---------------- 4. IVA: solo los porcentajes (nunca un importe «con IVA») ---------------- */

const ES_IMPORTE = /imp|importe|total|base|precio|pvp|coste|cobro|con_iva|conIva|sin_iva/i;
// Se deshace cualquier conversión errónea (un importe convertido en lista de IVA)
new MutationObserver(() => {
  document.querySelectorAll('select.ivasel').forEach(sel => {
    const inp = sel.previousElementSibling; if (!inp || inp.tagName !== 'INPUT' || esPorcentajeIva(inp)) return;
    inp.classList.remove('hide'); delete inp.dataset.ivasel; delete inp.dataset.sel; sel.remove();
    if (inp.id) { const l = document.querySelector(`label[for="${inp.id}_sel"]`); if (l) l.setAttribute('for', inp.id); }
  });
}).observe(document.body, { childList: true, subtree: true });
ivaSelector = (orig => function (inp) { if (!inp || !esPorcentajeIva(inp)) return; return orig(inp); })(ivaSelector);

/* ---------------- 5. Archivos: sin el recuadro antiguo; notas de varias líneas ---------------- */

selectorArchivo = (orig => function (inp) {
  orig(inp);
  const w = inp && inp.closest('.filepick'); if (!w) return;
  // El recuadro de vista previa antiguo (al lado) se oculta: la miniatura ya está en el selector
  const cont = w.parentElement, prev = cont && cont.parentElement && [...cont.parentElement.children].find(x => x !== cont && !x.contains(w) && x.querySelector && (x.querySelector('img') || /foto|prev/i.test(x.className + x.id)) && x.getBoundingClientRect().width < 120);
  if (prev) { const im = prev.querySelector('img'); if (im && im.src) w.querySelector('.fpmini').innerHTML = `<img src="${im.src}" alt="">`; prev.classList.add('hide'); }
  const lab = cont.querySelector(`label[for="${inp.id}"]`); if (lab) lab.classList.add('hide');
})(selectorArchivo);
new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1)
  (n.matches && n.matches('input[type=text]') ? [n] : [...n.querySelectorAll('input[type=text]')]).forEach(notaAmplia);
}).observe(document.body, { childList: true, subtree: true });

/* ---------------- 6. Ventanas: tres tamaños según su contenido ---------------- */

// Pequeña (confirmaciones y citas), normal (fichas y formularios) y amplia (pedidos, compras y facturas)
const VENT_AMPLIA = ['editorPedido', 'verPedido', 'editorCompra', 'verFactura'];
VENT_AMPLIA.forEach(fn => {
  const orig = eval(fn);
  const nueva = function (...a) { $('dlg').classList.add('amplia'); return orig.apply(this, a); };
  eval(`${fn} = nueva`);
});
new MutationObserver(() => { if (!$('dlg').open) $('dlg').classList.remove('amplia'); }).observe($('dlg'), { attributes: true, attributeFilter: ['open'] });
nuevaCita = (orig => function (...a) { const r = orig.apply(this, a); $('dlg').classList.add('pequena'); return r; })(nuevaCita);
new MutationObserver(() => { if (!$('dlg').open) $('dlg').classList.remove('pequena'); }).observe($('dlg'), { attributes: true, attributeFilter: ['open'] });

/* ---------------- 7. Pila de ventanas: abrir una encima de otra sin perder la anterior ---------------- */

const PILA_VENT = []; let APILANDO = false;
$('dlg').addEventListener('close', () => {
  if (APILANDO || !PILA_VENT.length) return;
  const prev = PILA_VENT.pop(), d = $('dlg'), b = $('dbody');
  b.replaceChildren(...prev.nodos); d.className = prev.clases;
  setTimeout(() => { if (!d.open) d.showModal(); }, 0);
});
// Desde el pedido: la factura se abre encima y al cerrarla vuelve el pedido tal como estaba
pedidoFacturas = (orig => async function (id) {
  await orig(id);
  $('dbody').querySelectorAll('[data-pvfac]').forEach(b => b.onclick = () => abrirApilada(() => verFactura(b.dataset.pvfac), 'Volver al pedido'));
})(pedidoFacturas);
// Desde el pedido: la ficha del cliente se abre como panel encima, sin cerrar el pedido
verPedidoBase = (orig => async function (...a) {
  const r = await orig.apply(this, a);
  const vp = $('dbody').querySelector('[data-vpac]');
  if (vp) vp.onclick = () => fichaPaciente(vp.dataset.vpac);
  return r;
})(verPedidoBase);

/* ---------------- 8. Mi perfil y Empresa: pantallas completas ---------------- */

pintarPerfil = (orig => function () {
  orig();
  // El contenedor de la página (no el provisional que se usa mientras se prepara la tarjeta de la persona)
  const c = document.querySelector('#v-perfil .pagcuerpo') || (TAB === 'config' ? document.querySelector('#v-config #cfgcuerpo-real, #v-config #cfgcuerpo') : null); if (!c || c.querySelector('.perfseg')) return;
  c.classList.add('perfil2');
  c.insertAdjacentHTML('beforeend', `<div class="card cfgpanel perfseg"><h2 style="padding:0 0 4px">${svgIco(ICON_NOM.shield)} Seguridad y sesión</h2>
    <p class="sm">Para cambiar la contraseña te enviamos un enlace a tu correo. Así nadie puede cambiarla desde un dispositivo que hayas dejado abierto.</p>
    <div class="perfsegf"><div><span class="sm">Correo de acceso</span><b>${esc(PERFIL.email || '')}</b></div><div><span class="sm">Rol</span><b>${esc(PERFIL.rol)}</b></div></div>
    <div class="acts" style="justify-content:flex-start;flex-wrap:wrap"><button class="btn sec" id="perfclave">${svgIco(ICON_NOM['key-round'])} Enviarme el enlace para cambiar la contraseña</button>
      <button class="btn sec" id="perfsalir">${svgIco(ICON_NOM['log-out'])} Cerrar sesión</button></div></div>`);
  $('perfclave').onclick = () => conCarga($('perfclave'), 'Enviando…', async () => {
    const { error } = await db.auth.resetPasswordForEmail(PERFIL.email, { redirectTo: location.origin + location.pathname });
    toast(error ? 'No se ha podido enviar: ' + error.message : 'Te hemos enviado el enlace a ' + PERFIL.email, !!error);
  });
  $('perfsalir').onclick = () => { const s = document.querySelector('[data-u="salir"]'); if (s) s.click(); };
  // (el nombre configurado del módulo de contactos lo aplica el componente general, antes de pintar)
})(pintarPerfil);

/* ---------------- 9. Plan: «Cómo funciona» explicado paso a paso ---------------- */

pintarPaginaPlan = (orig => async function () {
  await orig();
  const cont = $('cfgcuerpo'); const viejo = [...cont.querySelectorAll('.card.cfgpanel')].find(c => /Cómo funciona/.test(c.textContent)); if (!viejo) return;
  const act = planDe(PLAN_ACTUAL.plan);
  viejo.outerHTML = `<h2 class="plantit">Cómo funciona</h2>
    <div class="pasosplan">
      ${[['mouse-pointer-click', 'Eliges tu plan', 'Según los módulos que necesitas. Puedes empezar por uno pequeño y crecer después.'],
         ['credit-card', 'Pagas de forma segura', 'Con tarjeta, cada mes y sin permanencia. Recibes la factura por correo.'],
         ['zap', 'Se activa al momento', 'En cuanto se confirma el pago, los módulos del plan se desbloquean para todo tu equipo.'],
         ['users', 'Creces cuando quieras', `Añade usuarios sueltos (${eurI(act.bloque[1])}/mes cada uno) o cambia de plan. ${TT('medico', 'p', 'el', 'C', 'l')} con acceso a su informe no cuentan.`]]
        .map(([ic, t, d], i) => `<div class="pasoplan"><span class="pasonum">${i + 1}</span><span class="pasoico">${svgIco(ICON_NOM[ic])}</span><b>${t}</b><p>${d}</p></div>`).join('')}
    </div>
    <h2 class="plantit">Preguntas frecuentes</h2>
    <div class="card faqplan">${[
      ['¿Puedo cambiar de plan en cualquier momento?', 'Sí. Al mejorar, los módulos nuevos se activan en cuanto se confirma el pago. Al bajar de plan, el cambio se aplica al siguiente mes y tus datos se conservan.'],
      ['¿Qué pasa con mis datos si dejo de pagar o me doy de baja?', 'Tus datos son tuyos: antes de la baja puedes descargar una copia completa desde Empresa → Copias de seguridad.'],
      ['¿Cómo se cuentan los usuarios?', `Cuenta cada persona activa del equipo. ${TT('medico', 'p', 'el', 'C', 'l')} que solo ven su informe no cuentan, y las personas desactivadas tampoco.`],
      ['¿Los precios incluyen IVA?', 'No. Los precios son sin IVA; en la factura se añade el IVA que corresponda.'],
      ['¿Hay permanencia?', 'No. El pago es mensual y puedes cancelar cuando quieras.']]
      .map(([q, a]) => `<details><summary>${esc(q)}${svgIco(ICON_NOM['chevron-down'])}</summary><p>${esc(a)}</p></details>`).join('')}</div>
    <div class="acts" style="justify-content:flex-start"><button class="btn sec" id="pextra">+ Añadir un usuario (${eurI(act.bloque[1])}/mes)</button></div>`;
  const b = $('pextra'); if (b) b.onclick = () => { const d = document.querySelector('[data-pcontratar]'); location.href = 'mailto:?subject=' + encodeURIComponent('Añadir un usuario · ' + nombreApp()); };
})(pintarPaginaPlan);

/* ---------------- 10. Reportar un problema: guiado y útil para quien lo resuelve ---------------- */

const RASTRO = [];   // últimas acciones de la persona (para reproducir el problema)
document.addEventListener('click', e => {
  const b = e.target.closest('button, a, [data-t], [data-cfg], .dr, .trow'); if (!b) return;
  RASTRO.push({ t: new Date().toISOString().slice(11, 19), pantalla: TAB, que: (b.getAttribute('aria-label') || b.title || b.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 50) });
  if (RASTRO.length > 25) RASTRO.shift();
}, true);
reportarProblema = function () {
  const mods = [...document.querySelectorAll('nav.main [data-t]')].filter(b => !b.classList.contains('hide') && getComputedStyle(b).display !== 'none').map(b => [b.dataset.t, b.textContent.trim()]);
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
};

/* ---------------- 11. Analítica: «Ventas por canal» junto al embudo ---------------- */

new MutationObserver(() => { if (TAB === 'analitica' && !$('ancanal')) graficoCanal(); }).observe($('v-analitica'), { childList: true, subtree: true });

/* ---------------- se aplica en cada pantalla ---------------- */

let V257_PEND = false;
new MutationObserver(() => {
  if (V257_PEND) return; V257_PEND = true;
  queueMicrotask(() => { V257_PEND = false; const sec = $('v-' + TAB); if (sec) { barraTabla(sec); ordenarBotones(sec); } });
}).observe(document.querySelector('main'), { childList: true, subtree: true });


/* ---------------- v2.58.0 · la configuración de Facturación solo vive en su módulo ---------------- */

// Configuración ya no repite Facturación (datos fiscales, series y VeriFactu): están en Facturación → Configuración.
// Además, tenerlo en los dos sitios creaba dos contenedores con el mismo identificador.
arbolConfig = (orig => function () { return orig().map(([g, l]) => [g, l.filter(x => x.k !== 'fact')]).filter(g => g[1].length); })(arbolConfig);
const IR_V258 = ir;
ir = function (t) {
  const mapa = { fiscal: 'empresa', series: 'series', vf: 'verifactu', fact: FAC_ULTIMA || 'empresa' };
  if (t === 'config' && (mapa[CFG_SEC] || (CFG_SEC === 'fact' && mapa[CFG_SUB]))) {
    FSEC = mapa[CFG_SEC === 'fact' ? (CFG_SUB || 'fact') : CFG_SEC] || 'empresa'; CFG_SEC = 'rutas'; t = 'facturacion';
  }
  IR_V258(t);
};


/* ---------------- v2.59.0 · nombre configurado en todos los textos; sin ayuda en la tabla de Cuentas ---------------- */

new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) nombreEnTextos(n.nodeType === 1 ? n : n.parentElement); })
  .observe(document.body, { childList: true, subtree: true });
nombreEnTextos(document.body);
// Cuentas: sin ayudas dentro de la barra ni de la tabla
// (se ocultan con estilo: quitarlas hacía que otro componente las volviera a poner, en bucle)


