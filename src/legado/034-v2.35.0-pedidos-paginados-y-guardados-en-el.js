/* ============================================================
   DLC OS 2.0 · v2.35.0 · Pedidos paginados y guardados en el dispositivo,
   factura en PDF como la de Holded y envío por email con el PDF adjunto,
   manual renovado y punto de salida sin valor por defecto
   ============================================================ */

Object.assign(RPC_TTL, { pedidos_pagina: 30 });

/* ---------------- punto de salida: cada persona configura el suyo ---------------- */

function avisoSinSalida(el) {
  if (prefsActivas().salida || !el || el.querySelector('.sinsalida')) return;
  el.insertAdjacentHTML('afterbegin', `<div class="avisoh sinsalida"><span>📍 <b>Aún no has configurado tu punto de salida.</b> Las horas se calculan desde la ${TT('visita', 's', 'primer', 'l', 'l')}, sin el desplazamiento inicial.</span>
    <button class="btn sec chico" data-irprefs>Configurarlo</button></div>`);
}
document.addEventListener('click', e => { if (e.target.closest('[data-irprefs]')) { CFG_SEC = 'prefs'; ir('config'); } });

/* ---------------- Pedidos → Ventas: por páginas y guardado en el dispositivo ---------------- */

let PEDPAG = 0;
let PEDF = {};   // v2.88.0: filtros por campos del pedido (Clasificadores)
async function listaPedidos() {
  if (!$('pedlista') || !$('pper') || !$('pcanal')) return;
  const r = $('pper').__rango();
  if (!$('popf') && $('pestado')) {
    $('pestado').closest('div').insertAdjacentHTML('afterend', `<div><label for="popf">Operativa</label><select id="popf">
      <option value="">Todo</option><option value="pago">Pendiente de cobro</option><option value="paquete">Paquete por preparar</option><option value="email">Factura por enviar</option></select></div>`);
    $('popf').onchange = () => { PEDPAG = 0; listaPedidos(); };
  }
  // v2.115.0: origen del pedido (web o el resto)
  if (!$('porigf') && $('popf')) {
    $('popf').closest('div').insertAdjacentHTML('afterend', `<div><label for="porigf">Origen</label><select id="porigf">
      <option value="">Todos</option><option value="web">Por la web</option><option value="portal">Portal del centro</option><option value="otros">Comercial, teléfono o correo</option></select></div>`);
    $('porigf').onchange = () => { PEDPAG = 0; listaPedidos(); };
  }
  // v2.329.0: reportados o no al profesional (interno: solo quien ve todo)
  if (!$('prepf') && $('porigf') && VE_TODO()) {
    $('porigf').closest('div').insertAdjacentHTML('afterend', `<div><label for="prepf">Reporte</label><select id="prepf">
      <option value="">Todos</option><option value="si">Reportados</option><option value="no">Sin reportar</option></select></div>`);
    $('prepf').onchange = () => { PEDPAG = 0; listaPedidos(); };
  }
  filtrosRestaurar($('v-ventas'));   // v2.269.0: los filtros que tenías
  const params = { p_desde: r.desde, p_hasta: r.hasta, p_canal: $('pcanal').value || null, q: ($('pq') && $('pq').value.trim()) || null,
    p_estado: $('pestado').value || null, p_operativa: ($('popf') && $('popf').value) || null, lim: tamPagina(), desplaz: PEDPAG * tamPagina(),
    ...(($('porigf') && $('porigf').value) ? { p_origen: $('porigf').value } : {}),
    ...(($('prepf') && $('prepf').value) ? { p_reportado: $('prepf').value } : {}),
    ...(Object.keys(PEDF).length ? { f_campos: PEDF } : {}) };
  const clave = 'pedidos-' + JSON.stringify(params);
  if (!$('pedlista').querySelector('.dgrid')) cargando($('pedlista'), 'Cargando pedidos…');
  const res = await rpcCache('pedidos_pagina', params, clave);
  if (!$('pedlista') || !$('pestado')) return;
  if (!res.data) { $('pedlista').innerHTML = `<div class="vacio">No se ha podido cargar${res.error ? ': ' + esc(res.error.message) : ''}.</div>`; return; }
  const d = res.data, s = d.resumen || {}, imp = verImportes();
  PEDIDOS = d.filas || [];
  $('ptotales').innerHTML = `
    <div class="kpi"><b>${num(s.pedidos || 0)}</b><span>Pedidos completados${s.borradores ? ` · ${s.borradores} en borrador` : ''}</span></div>
    <div class="kpi"><b>${num(s.unidades || 0)}</b><span>Unidades</span></div>
    ${s.web_pedidos != null ? `<div class="kpi" id="pkweb"><b>${num(s.web_pedidos || 0)}</b><span>Por la web${imp && s.web_base != null ? ` · ${eurI(s.web_base || 0)} sin IVA` : ''}</span></div>` : ''}
    ${imp ? `<div class="kpi"><b>${eurI(s.base || 0)}</b><span>Base sin IVA</span></div>
    <div class="kpi"><b>${eurI(s.iva || 0)}</b><span>IVA</span></div>
    <div class="kpi ok"><b>${eurI(s.total || 0)}</b><span>Total con IVA</span></div>` : ''}`;
  const ico = p => p.estado !== 'Confirmado' ? '' : p.sin_cargo ? `<span class="opico" title="Paquete ${p.paquete_en ? 'preparado' : 'por preparar'}"><i class="${p.paquete_en ? 'ok' : 'no'}">📦</i></span>` : `<span class="opico" title="Pago ${p.pago_estado === 'Cobrado' ? 'recibido' : 'pendiente'} · Paquete ${p.paquete_en ? 'preparado' : 'por preparar'}${p.factura ? ' · Factura ' + (p.email_factura_en ? 'enviada' : 'por enviar') : ''}">
      <i class="${p.pago_estado === 'Cobrado' ? 'ok' : 'no'}">💳</i><i class="${p.paquete_en ? 'ok' : 'no'}">📦</i>${p.factura ? `<i class="${p.email_factura_en ? 'ok' : 'no'}">🧾</i>` : ''}</span>`;
  const cpCols = clasVisibles('pedido');
  $('pedlista').innerHTML = PEDIDOS.length ? `<div class="dgrid-wrap"><div class="dgrid peds2 ${imp ? '' : 'sinimp'}">
    <div class="dh"><span>Fecha</span><span>Cliente</span><span>${TT('medico', 's', '', 'l', 'C')}</span><span>Comercial</span><span>Productos</span>
      <span class="num">Uds.</span>${imp ? '<span class="num">Base</span><span class="num">Total</span>' : ''}<span>Estado</span><span>Operativa</span><span>Notas</span>${clasCabeceras(cpCols)}</div>
    ${PEDIDOS.map(p => `<button class="dr" data-ped="${p.id}" style="${p.estado === 'Anulado' ? 'opacity:.55' : ''}">
      <span>${fechaCorta(p.fecha)}${p.factura || p.numero ? `<span class="sm">${esc(p.factura || p.numero)}</span>` : ''}</span>
      <span><b>${esc(p.contacto || p.centro || p.cuenta_texto || '—')}</b><span class="sm">${etiquetaCanal(p, p.total)}${p.origen === 'web' ? ' · <span class="pweb">Web</span>' : p.origen === 'portal' ? ' · <span class="pweb">Portal</span>' : ''}${p.forma_pago ? ' · ' + esc(p.forma_pago) : ''}${p.justificante ? ' · <span title="Con justificante de pago">📎</span>' : ''}</span></span>
      <span class="corta">${p.medico ? esc(p.medico) : '<span class="vac">Sin atribuir</span>'}</span>
      <span>${p.comercial ? esc(p.comercial) : '<span class="vac">—</span>'}</span>
      <span class="sm corta">${esc(p.productos || '')}</span><span class="num">${num(p.unidades)}</span>
      ${imp ? `<span class="num">${eurI(p.base)}</span><span class="num"><b>${eurI(p.total)}</b></span>` : ''}
      <span>${pillPaso(p)}</span><span>${ico(p)}</span><span class="sm corta pednota" title="${esc(p.nota || '')}">${esc(p.nota || '')}</span>${clasCeldas(cpCols, p.clasificadores)}</button>`).join('')}
  </div></div>` : '<div class="vacio">No hay pedidos con estos filtros.</div>';
  clasRejilla($('pedlista').querySelector('.dgrid.peds2'), cpCols.length);
  if (!$('pedpag')) $('pedlista').insertAdjacentHTML('afterend', '<div id="pedpag"></div>');
  paginador($('pedpag'), d.total, PEDPAG, p => { PEDPAG = p; listaPedidos(); $('pedlista').scrollIntoView({ block: 'start' }); }, () => { PEDPAG = 0; listaPedidos(); });
  if (res.cache) avisoCache($('pedlista'), res.fecha);
  $('pedlista').querySelectorAll('[data-ped]').forEach(b => b.onclick = () => verPedido(b.dataset.ped));
}
// Cualquier cambio de filtro vuelve a la primera página
document.addEventListener('change', e => { if (e.target.closest('#pper, #pcanal, #pestado')) PEDPAG = 0; }, true);
document.addEventListener('input', e => { if (e.target.id === 'pq') PEDPAG = 0; }, true);

/* ---------------- paginación también en facturas y llamadas ---------------- */

function paginarRejilla(cont, filas, pagKey, pintaFila, cabecera, clase) {
  const tam = tamPagina(), pag = Math.min(window[pagKey] || 0, Math.max(0, Math.ceil(filas.length / tam) - 1));
  window[pagKey] = pag;
  cont.innerHTML = `<div class="dgrid-wrap"><div class="dgrid ${clase}">${cabecera}${filas.slice(pag * tam, pag * tam + tam).map(pintaFila).join('')}</div></div><div class="pagz"></div>`;
  paginador(cont.querySelector('.pagz'), filas.length, pag, p => { window[pagKey] = p; paginarRejilla(cont, filas, pagKey, pintaFila, cabecera, clase); }, () => { window[pagKey] = 0; paginarRejilla(cont, filas, pagKey, pintaFila, cabecera, clase); });
}
let FACPAG = 0, LLPAG = 0;

/* ---------------- factura en PDF (mismo formato que Holded) ---------------- */

let LOGO_DATA = null;
async function imagenData(url) {
  try { const b = await (await fetch(url)).blob(); return await new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); }); }
  catch (e) { return null; }
}
async function cargarJsPDF() {
  if (window.jspdf) return window.jspdf.jsPDF;
  await new Promise((ok, ko) => { const s = document.createElement('script'); s.src = new URL('jspdf.umd.min.js', location.href).href; s.onload = ok; s.onerror = ko; document.head.appendChild(s); });
  return window.jspdf.jsPDF;
}
async function cargarQR() {
  if (window.qrcode) return window.qrcode;
  await new Promise((ok, ko) => { const s = document.createElement('script'); s.src = new URL('qrcode.js', location.href).href; s.onload = ok; s.onerror = ko; document.head.appendChild(s); });
  return window.qrcode;
}

// (v2.183.0: aquí iba la primera versión de facturaPDF; se redefine entera más abajo)
const nombrePDF = f => `${f.numero}_${String((f.cliente || {}).nombre || 'cliente').replace(/[^\p{L}\p{N} ]/gu, '').trim().replace(/\s+/g, '_')}.pdf`;

async function descargarFacturaPDF(f, rn) {
  const doc = await facturaPDF(f, rn); doc.save(nombrePDF(f));
  await db.from('eventos_facturacion').insert({ tipo: 'PDF descargado', factura_id: f.id, detalle: {} }).then(() => {}, () => {});
}

async function enviarFacturaEmail(f, rn) {
  await cargarAjustes();
  const e = AJUSTES.empresa || {}, c = f.cliente || {};
  const saludo = c.nombre ? nombrePila(c.nombre) : '';
  $('dlg2body').innerHTML = `
    <div class="fh"><div><h2>Enviar ${esc(f.numero)} por email</h2><div class="sm">La factura va adjunta en PDF</div></div>
      <button class="x" data-cerrar2 aria-label="Cerrar">✕</button></div>
    <label for="efp">Para</label><input id="efp" type="email" value="${esc(c.email || '')}" placeholder="email del cliente">
    <label for="efa">Asunto</label><input id="efa" value="${esc(plantillaCorreo('factura', 'asunto', varsCorreo({ documento: 'factura', numero: f.numero, importe: f.total, nombre: c.nombre })))}">
    <label for="eft">Mensaje</label><textarea id="eft" rows="12">${esc(plantillaCorreo('factura', 'texto', varsCorreo({ documento: 'factura', numero: f.numero, importe: f.total, nombre: c.nombre })))}</textarea>
    <div class="adjunto">📎 ${esc(nombrePDF(f))}</div>
    <div class="acts" style="justify-content:flex-end;flex-wrap:wrap"><button class="btn sec" data-cerrar2>Cancelar</button>
      <button class="btn" id="efok">Enviar</button></div>`;
  $('dlg2').showModal();
  $('efok').onclick = async ev => {
    const para = $('efp').value.trim(); if (!/\S+@\S+\.\S+/.test(para)) { toast('Escribe un email válido', true); return; }
    ev.target.disabled = true; ev.target.textContent = 'Preparando el PDF…';
    const doc = await facturaPDF(f, rn), b64 = doc.output('datauristring').split(',')[1];
    ev.target.textContent = 'Enviando…';
    let { data, error } = await db.functions.invoke('enviar_email', { body: { para, asunto: $('efa').value.trim(), texto: $('eft').value,
      adjuntos: [{ nombre: nombrePDF(f), base64: b64, tipo: 'application/pdf' }], factura_id: f.id, pedido_id: f.pedido_id, marca: 'email_factura' } });
    // Si la función responde con error, su motivo viene en el cuerpo de la respuesta
    if (error && error.context && typeof error.context.json === 'function') { try { data = await error.context.json(); } catch (x) {} }
    ev.target.disabled = false; ev.target.textContent = 'Enviar';
    if (!error && data && data.ok) { $('dlg2').close(); toast('Factura enviada a ' + para); return; }
    // Sin envío directo configurado: se ofrece compartir el PDF o descargarlo y adjuntarlo
    const sinSmtp = data && data.error === 'sin_smtp';
    const archivo = new File([doc.output('blob')], nombrePDF(f), { type: 'application/pdf' });
    const compartir = navigator.canShare && navigator.canShare({ files: [archivo] });
    $('dlg2body').innerHTML = `<div class="fh"><div><h2>${sinSmtp ? 'El envío directo aún no está configurado' : 'No se ha podido enviar'}</h2>
      <div class="sm">${sinSmtp ? 'Falta conectar el correo de la empresa (lo prepara administración).' : esc((error && error.message) || (data && data.error) || '')}</div></div>
      <button class="x" data-cerrar2 aria-label="Cerrar">✕</button></div>
      <p>Puedes enviarla desde tu correo con el PDF adjunto:</p>
      <div class="acts" style="flex-wrap:wrap">${compartir ? '<button class="btn" id="efsh">Compartir el PDF (correo, WhatsApp…)</button>' : ''}
        <button class="btn ${compartir ? 'sec' : ''}" id="efdl">⬇ Descargar el PDF</button>
        <a class="btn sec" href="mailto:${esc(para)}?subject=${encodeURIComponent($('efa') ? $('efa').value : f.numero)}&body=${encodeURIComponent('Adjuntamos la factura ' + f.numero + '.')}">Abrir mi correo</a></div>
      <label class="opt" style="margin-top:12px"><input type="checkbox" id="efmarca"> Ya la he enviado: marcar el pedido como «Email con la factura enviado»</label>
      <div class="acts" style="justify-content:flex-end"><button class="btn sec" data-cerrar2>Cerrar</button></div>`;
    if ($('efsh')) $('efsh').onclick = () => navigator.share({ files: [archivo], title: f.numero, text: 'Factura ' + f.numero }).catch(() => {});
    $('efdl').onclick = () => doc.save(nombrePDF(f));
    $('efmarca').onchange = async ev2 => { if (ev2.target.checked && f.pedido_id) { await db.rpc('marcar_operativa', { p_pedido: f.pedido_id, p_campo: 'email_factura', p_hecho: true }); toast('Marcado como enviado'); } };
  };
}


/* ---------------- email con los datos de pago: envío directo si está configurado ---------------- */

document.addEventListener('click', async e => {
  const a = e.target.closest('#pdmailpago');
  if (!a) return;
  e.preventDefault(); e.stopImmediatePropagation();
  if (!((AJUSTES.empresa || {}).iban || '').trim()) { toast('Falta el IBAN: ponlo en Configuración → Facturación → Datos fiscales antes de enviar los datos de pago', true); return; }   // v2.306.0
  const href = new URL(a.href.replace(/^mailto:/, 'http://x/?to=').replace('?subject', '&subject'));
  const para = decodeURIComponent(href.searchParams.get('to') || ''), asunto = href.searchParams.get('subject') || '', texto = href.searchParams.get('body') || '';
  const { data, error } = await db.functions.invoke('enviar_email', { body: { para, asunto, texto, pedido_id: a.dataset.ped || null, marca: 'email_pago' } });
  if (!error && data && data.ok) { toast('Email con los datos de pago enviado'); return; }
  location.href = a.href;   // sin envío directo: se abre el correo del dispositivo
}, true);

/* ---------------- datos fiscales: web de la empresa para el pie de la factura ---------------- */

pintarEmpresa = (orig => async function () {
  await orig();
  if ($('em_web')) return;
  const e = AJUSTES.empresa || {};
  $('em_email').closest('.g2').insertAdjacentHTML('afterend', `<div class="g2"><div><label for="em_web">Web</label><input id="em_web" value="${esc(e.web || '')}" placeholder="www.tuempresa.com"></div><div></div></div>`);
  const ok = $('emok').onclick;
  $('emok').onclick = async () => { await ok(); AJUSTES.empresa = Object.assign({}, AJUSTES.empresa, { web: $('em_web').value.trim() });
    await db.rpc('guardar_ajuste', { p_clave: 'empresa', p_valor: AJUSTES.empresa }); };
})(pintarEmpresa);

/* ---------------- manual de uso renovado ---------------- */

const ICONOS_MANUAL = { roles: '👥', inicio: '🏠', agenda: '📅', rutas: '🧭', directorio: '🩺', centros: '🏥', visitas: '📝', ventas: '🛒',
  config: '⚙️', admin: '🛡️', facturacion: '🧾', permisos: '🔐' };
const PRIMEROS_PASOS = {
  cartera: [['📍', 'Configura tu punto de salida', 'Configuración → Preferencias. Con él se calculan las horas de tus rutas.', 'config'],
    ['📅', 'Planifica tu semana', `Agenda → Semana → «Planificar la semana». Reparte a tus ${TT('medico', 'p', '', 'l', 'l')} por días.`, 'agenda'],
    ['▶', 'Empieza la jornada', `Agenda → Tu día → «Empezar jornada» y registra cada ${TT('visita', 's', '', 'l', 'l')} al terminarla.`, 'agenda']],
  televenta: [['🛒', 'Crea y confirma pedidos', 'Pedidos → Ventas → «+ Nueva venta»: cliente, qué quiere y pedido. Al confirmarlo sale del stock.', 'ventas'],
    ['📞', 'Cierra cada venta', '«+ Nueva venta» queda en Pedidos → Oportunidades aunque no acabe en pedido: así se ve por qué.', 'ventas'],
    ['✅', 'Cierra la operativa', 'Anota el cobro, prepara el paquete y envía la factura desde el pedido.', 'ventas']],
  default: [['🏠', 'Revisa Inicio', 'Indicadores, alertas y tu semana de un vistazo.', 'inicio'],
    ['👥', 'Mira el equipo', 'Agenda → Equipo: cumplimiento de cada persona.', 'agenda'],
    ['📊', 'Analiza los resultados', 'Analítica → Resumen, con gráficos explicados.', 'analitica']]
};

/* cargarManual: la parte base y, en orden, cada paso que se le añade (antes eran 3 capas separadas). */
async function cargarManual() {
  await cargarManualBase();
  await cargarManualPaso1();
  await cargarManualPaso2();
  await cargarManualPaso3();
}

async function cargarManualPaso1() {
  const q = $('manq'); if (!q) return;
  q.insertAdjacentHTML('afterend', '<div class="manres hide" id="manres"></div>');
  const quitar = s => String(s).replace(/<[^>]+>/g, '');
  const norm = s => quitar(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const indice = [];
  MANUAL.forEach(s => {
    indice.push({ sec: s.id, mod: s.t, txt: s.para });
    s.hacer.forEach(h => indice.push({ sec: s.id, mod: s.t, txt: h[1] }));
    (s.config || []).forEach(c => indice.push({ sec: s.id, mod: s.t, txt: 'Dónde se configura: ' + c }));
    const ay = AYUDA[s.id]; if (ay && ay[2]) ay[2].forEach(x => indice.push({ sec: s.id, mod: s.t, txt: quitar(x) }));
  });
  FAQ.forEach(([p, r]) => indice.push({ sec: null, mod: 'Pregunta frecuente', txt: p + ' — ' + r }));
  q.oninput = () => {
    const t = norm(q.value.trim()), res = $('manres');
    document.querySelectorAll('.mancard').forEach(c => c.classList.remove('hide'));
    if (t.length < 2) { res.classList.add('hide'); return; }
    const palabras = t.split(/\s+/);
    const hits = indice.filter(x => palabras.every(p => norm(x.txt + ' ' + x.mod).includes(p))).slice(0, 12);
    res.classList.remove('hide');
    res.innerHTML = hits.length ? hits.map(h => {
      let txt = esc(quitar(h.txt)); palabras.forEach(p => { txt = txt.replace(new RegExp('(' + p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>'); });
      return `<button class="manhit" ${h.sec ? `data-mansec2="${h.sec}"` : ''}><span class="mhm">${esc(h.mod)}</span><span>${txt}</span></button>`;
    }).join('') : `<div class="manhit">No hay resultados para «${esc(q.value)}». Prueba con otra palabra: cita, ruta, pedido, factura…</div>`;
    res.querySelectorAll('[data-mansec2]').forEach(b => b.onclick = () => { res.classList.add('hide'); const c = document.querySelector(`.mancard[data-mansec="${b.dataset.mansec2}"]`); if (c) c.click(); });
  };
}

async function cargarManualPaso2() {
  const v = $('v-manual');
  v.onclick = e => {
    const m = e.target.closest('[data-mira]'); if (!m) return;
    const i = [...v.querySelectorAll('.manpaso')].indexOf(m.closest('.manpaso'));
    const pasos = PRIMEROS_PASOS[['cartera', 'televenta'].find(c => puede(c))] || PRIMEROS_PASOS.default;
    if (i >= 0 && pasos[i]) infoManual(null, pasos[i]);
  };
  v.querySelectorAll('.mancard').forEach(c => c.onclick = () => infoManual(c.dataset.mansec));
  if ($('mandet')) $('mandet').remove();
  const res = $('manres');
  if (res) res.addEventListener('click', e => { const b = e.target.closest('[data-mansec2]'); if (b) { e.stopImmediatePropagation(); res.classList.add('hide'); infoManual(b.dataset.mansec2); } }, true);
}

async function cargarManualPaso3() {
  document.querySelectorAll('.mancard').forEach(c => {
    const mod = MOD_DE_MANUAL[c.dataset.mansec]; if (!mod || planIncluye(mod)) return;
    const p = planMinimo(mod), pill = c.querySelector('.pill');
    if (pill) { pill.className = 'pill p-plan'; pill.innerHTML = `${svgIco(ICON_NOM.lock)} Incluido en el plan ${esc(p ? p.nombre : 'Premium')}`; }
    c.classList.add('bloq'); c.onclick = () => avisoPlan(mod);
  });
}

async function cargarManualBase() {
  const v = $('v-manual');
  const accesoTxt = s => s.a ? NIVEL_TXT[nivelDe2(s.a)] : (puede('administrar') ? 'Completo' : '—');
  const nivelSec = s => s.a ? nivelDe2(s.a) : (puede('administrar') ? 3 : (s.id === 'roles' || s.id === 'permisos') ? 1 : 0);
  const modulos = Object.keys(MODULO_AREA).filter(puedeModulo).length;
  const pasos = PRIMEROS_PASOS[['cartera', 'televenta'].find(c => puede(c))] || PRIMEROS_PASOS.default;
  v.innerHTML = `
    <div class="manhero">
      <div><h1>Manual de uso</h1><p>Todo lo que puedes hacer en la plataforma, explicado para tu perfil.</p>
        <div class="manchips"><span>👤 ${esc(PERFIL.nombre)}</span><span>🎫 ${esc(PERFIL.rol)}</span><span>🧩 ${num(modulos)} módulos disponibles</span></div></div>
      <div class="manbusca"><input id="manq" type="search" placeholder="¿Qué quieres hacer? Aplazar una cita, bloquear un día, emitir una factura…" aria-label="Buscar en el manual"></div>
    </div>
    <h2 class="mantit">Primeros pasos</h2>
    <div class="manpasos">${pasos.map(([ic, t, d, m], i) => `<button class="manpaso" data-mira="${m}"><span class="mpn">${i + 1}</span><span class="mpi">${ic}</span><b>${esc(t)}</b><span>${esc(d)}</span></button>`).join('')}</div>
    <h2 class="mantit">Por módulo</h2>
    <div class="mangrid">${MANUAL.map(s => {
      const n = nivelSec(s);
      return `<button class="mancard ${n ? '' : 'bloq'}" data-mansec="${s.id}"><span class="mci">${ICONOS_MANUAL[s.id] || '📘'}</span>
        <b>${esc(s.t)}</b><span class="mcd">${esc(s.para)}</span><span class="pill ${n >= 2 ? 'p-est' : n === 1 ? 'p-per' : 'p-anu'}">${n ? 'Tu acceso: ' + accesoTxt(s) : 'Sin acceso'}</span></button>`;
    }).join('')}</div>
    <div id="mandet"></div>
    <h2 class="mantit">Preguntas frecuentes</h2>
    <div class="card manfaqs">${FAQ.map(([q, r]) => `<details class="manfaq"><summary>${esc(q)}</summary><p>${esc(r)}</p></details>`).join('')}</div>`;
  const abrir = id => {
    const s = MANUAL.find(x => x.id === id); if (!s) return;
    const n = nivelSec(s), ay = AYUDA[id === 'visitas' ? 'agenda' : id === 'centros' ? 'directorio' : id] || null;
    v.querySelectorAll('.mancard').forEach(c => c.classList.toggle('on', c.dataset.mansec === id));
    $('mandet').innerHTML = `<div class="card mandet"><div class="manh"><h2 style="padding:0">${ICONOS_MANUAL[id] || '📘'} ${esc(s.t)}</h2>
        ${MODULO_AREA[id] && puedeModulo(id) ? `<button class="btn sec" data-mira="${id}">Abrir ${esc(s.t)}</button>` : ''}</div>
      <p>${esc(s.para)}</p>
      <div class="mancols"><div><h3>Qué se puede hacer</h3><ul class="manlist">${s.hacer.map(([req, txt]) => `<li class="${n >= req ? 'si' : 'no'}"><span>${n >= req ? '✓' : '🔒'}</span><span>${esc(txt)}${n >= req ? '' : ` <em>· requiere ${esc(s.a ? (AREAS.find(x => x[0] === s.a) || [])[1] || s.t : 'Administración')} en «${NIVEL_TXT[req]}»</em>`}</span></li>`).join('')}</ul></div>
        ${ay && ay[2] && ay[2].length ? `<div><h3>Cómo funciona</h3><ul class="manlist">${ay[2].map(x => `<li><span>•</span><span>${x}</span></li>`).join('')}</ul></div>` : ''}</div>
      ${s.config.length ? `<h3>Dónde se configura</h3><div class="mancfg">${s.config.map(x => `<span>⚙ ${esc(x)}</span>`).join('')}</div>` : ''}</div>`;
    $('mandet').scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  v.querySelectorAll('[data-mansec]').forEach(b => b.onclick = () => abrir(b.dataset.mansec));
  v.onclick = e => { const m = e.target.closest('[data-mira]'); if (m && puedeModulo(m.dataset.mira)) { if (m.dataset.mira === 'config') CFG_SEC = 'prefs'; ir(m.dataset.mira); } };
  $('manq').oninput = e => {
    const q = e.target.value.trim().toLowerCase();
    if (!q) { v.querySelectorAll('.mancard').forEach(c => c.classList.remove('hide')); return; }
    let primera = null;
    v.querySelectorAll('.mancard').forEach(c => {
      const s = MANUAL.find(x => x.id === c.dataset.mansec), ay = AYUDA[s.id] || [];
      const txt = [s.t, s.para, ...s.hacer.map(h => h[1]), ...s.config, ...(ay[2] || [])].join(' ').toLowerCase();
      const ok = txt.includes(q); c.classList.toggle('hide', !ok); if (ok && !primera) primera = s.id;
    });
    v.querySelectorAll('.manfaq').forEach(d => { const ok = d.textContent.toLowerCase().includes(q); d.open = ok; });
    if (primera) abrir(primera);
  };
}

/* ---------------- ayudas ---------------- */

AYUDA.facturacion[2].push('<b>⬇ PDF</b> descarga la factura en PDF, lista para enviar. <b>✉️ Enviar por email</b> la manda al cliente con el PDF adjunto desde el correo de la empresa.');
AYUDA.ventas[2].push('El listado va por páginas y se guarda en el dispositivo: si vuelves a él, aparece al momento mientras se actualiza. Filtra por operativa para ver los pendientes de cobro, paquetes por preparar o facturas por enviar.');

// Aviso de punto de salida en el plan y en «Tu día»


