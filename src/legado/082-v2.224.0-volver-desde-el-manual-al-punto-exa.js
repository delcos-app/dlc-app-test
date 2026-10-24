ir = (orig => function (t, ...r) {
  if (t === 'manual' && TAB !== 'manual') MANUAL_VUELTA = { tab: TAB, y: window.scrollY || 0 };
  return orig.call(this, t, ...r);
})(ir);
cargarManual = (orig => async function (...a) {
  const r = await orig.apply(this, a);
  const h = document.querySelector('#v-manual .saludo');
  if (h && MANUAL_VUELTA && !$('manvolver')) {
    h.insertAdjacentHTML('afterbegin', `<button type="button" class="manvuelta" id="manvolver"><b aria-hidden="true">‹</b> Volver a ${esc(nombrePantalla(MANUAL_VUELTA.tab))}</button>`);
    $('manvolver').onclick = () => volverDelManual();
  }
  return r;
})(cargarManual);



/* v2.226.0 · Arreglos de la lista de Eric (9/10/2026).
   1. Una sola ayuda por pantalla: fuera el «?» del manual (.manq); cada título lleva su «i» (las páginas nuevas también: Ciclo, Intervenciones,
      Eventos…) y la ventanita de la «i» termina con «Ver en el manual de uso», que abre el manual en el apartado de esa pantalla; desde allí,
      «‹ Volver a …» devuelve al mismo punto (v2.224.0).
   2. Agenda: el selector «Mi agenda» y el botón «Equipo» se reponen siempre que la cabecera se vuelve a pintar (al pulsar Día se pintaba dos
      veces seguidas y se perdían) y, dentro de Equipo, el botón pasa a «Mi agenda» para volver de un clic.
   3. Una tarea hecha se abre en modo lectura, con «Volver a pendiente» y «Borrar».
   4. Pedidos: fuera la tarjeta «Pedidos sin atribuir».
   5. Menú de la persona: sin «Organización» (está dentro de Configuración); «Manual de uso» y «Reportar un problema», aparte, como ayuda. */
ponerAyudaManual = function () {
  document.querySelectorAll('.manq').forEach(b => b.remove());
  if (ES_MEDICO() || TAB === 'manual' || TAB === 'delcos' || /^pd-/.test(TAB)) return;   // el Panel delcos es interno
  const v = $('v-' + TAB), h = v && v.querySelector('.saludo h1'); if (!h) return;
  const sal = h.closest('.saludo') || h;
  if (sal.querySelector('.ai')) return;
  if (AYUDA[TAB]) { h.insertAdjacentHTML('beforeend', `<button class="ai" data-ayuda="${TAB}" aria-label="Ayuda">i</button>`); return; }
  const P = (typeof PAGINAS !== 'undefined' && PAGINAS[TAB]) || {};
  h.insertAdjacentHTML('beforeend', `<button class="ai" data-ayuda-tit="${esc(P.t || h.textContent.trim())}" data-ayuda-txt="${esc(P.d || '')}" aria-label="Ayuda">i</button>`);
};
// La ventanita ya llevaba «Ver más en el manual de uso» (resumirAyuda), que abría el buscador del manual: ahora abre el apartado de esa pantalla
resumirAyuda = (orig => function (pop) {
  orig.call(this, pop);
  const l = pop.querySelector('.aiman'); if (!l) return;
  const b = pop.__de, ancla = b ? anclaAyuda(b) : (MANUAL_ANCLA[TAB] || '');
  l.innerHTML = 'Ver en el manual de uso <span aria-hidden="true">›</span>';
  l.onclick = ev => { ev.preventDefault(); ev.stopPropagation(); pop.remove(); abrirManual(ancla); };
})(resumirAyuda);

window.addEventListener('click', e => {
  const b = e.target.closest('[data-ag="equipo"]'); if (!b || AG_MODO !== 'equipo') return;
  e.stopImmediatePropagation(); e.preventDefault();
  AG_MODO = 'dia'; AG_VISTA = null; if ($('agvista')) $('agvista').value = '';
  cargarAgenda();
}, true);


pintarSinAtribuir = async function () { const c = $('cardsinatr'); if (c) c.remove(); };

try { Object.assign(HT_ORDEN, JSON.parse(localStorage.getItem('delcos-orden') || '{}')); } catch (e) {}
// Pulsar una cabecera: asc → desc → sin orden
document.addEventListener('click', e => {
  const c = e.target.closest('.dgrid > .dh > *'); if (!c || e.target.closest('input, button, select, .res')) return;
  const g = c.closest('.dgrid'), tipo = htTipo(g), i = [...c.parentElement.children].indexOf(c), n = c.textContent.trim();
  const srv = ORD_SRV[tipo]; const k = srv ? srv(i, n) : null;
  if (srv ? !k : htCeldaNoOrdenable(n)) return;
  const o = HT_ORDEN[tipo];
  if (!o || o.i !== i) HT_ORDEN[tipo] = { i, dir: 1, k }; else if (o.dir === 1) o.dir = -1; else delete HT_ORDEN[tipo];
  htGuardarOrden();
  if (srv) {
    if (tipo === 'peds2' && typeof listaPedidos === 'function') { PEDPAG = 0; listaPedidos(); }
    if (tipo === 'pacs' && typeof listaPacientes === 'function') { PAC.pagina = 0; listaPacientes(); }
    htMarcarCabecera(g); return;
  }
  if (HT_ORDEN[tipo]) htOrdenarFilas(g); else { htQuitarOrden(g); htMarcarCabecera(g); }
});
// El orden de las tablas de la base viaja con la consulta
db.rpc = (orig => function (fn, args, ...r) {
  const o = fn === 'pedidos_pagina' ? HT_ORDEN.peds2 : fn === 'clientes_lista' ? HT_ORDEN.pacs : null;
  if (o && o.k && args && !('p_orden' in args) && (fn !== 'clientes_lista' || args.lim > 5)) args = Object.assign({}, args, { p_orden: o.k + (o.dir === -1 ? ':desc' : ':asc') });
  return orig.call(this, fn, args, ...r);
})(db.rpc);
// La memoria de resultados de Pedidos distingue el orden
rpcCache = (orig => function (fn, params, clave, ...r) {
  const o = fn === 'pedidos_pagina' ? HT_ORDEN.peds2 : null;
  return orig.call(this, fn, params, o && clave ? clave + '|orden:' + o.k + o.dir : clave, ...r);
})(rpcCache);
// Profesionales: su cabecera es propia y el orden va en F.orden (buscar_cuentas)
function cabeceraTabla(...a) {
  const r = cabeceraTablaBase.apply(this, a);
  const cfg = colsConfig().filter(c => c.on), cab = $('thead'); if (!cab) return r;
  const [k, dir] = String(F.orden || '').split(':');
  [...cab.querySelectorAll('.th')].forEach((th, i) => {
    const c = cfg[i]; if (!c || !ORD_DIR[c.k]) return;
    th.dataset.ordk = c.k; th.classList.add('htord'); th.title = 'Ordenar por esta columna';
    const actual = ORD_DIR[c.k] === k && !(k === 'nombre' && !dir) && !(k === 'reciente' && !dir);
    th.classList.toggle('ord-asc', actual && dir !== 'desc');
    th.classList.toggle('ord-desc', actual && dir === 'desc');
  });
  return r;
}
document.addEventListener('click', e => {
  const th = e.target.closest('#thead .th[data-ordk]'); if (!th || e.target.closest('.res')) return;
  const k = ORD_DIR[th.dataset.ordk], [ak, ad] = String(F.orden || '').split(':');
  F.orden = ak === k && ad === 'asc' ? k + ':desc' : ak === k && ad === 'desc' ? 'nombre' : k + ':asc';
  if ($('forden') && [...$('forden').options].some(x => x.value === F.orden)) $('forden').value = F.orden;
  buscar(true); cabeceraTabla();
});

htPintarPanel = (orig => function (sec) {
  orig.call(this, sec);
  // El panel se abre al lado (#tools) y allí van también los filtros propios de la pantalla
  const lateral = typeof htLateralAbierto === 'function' && htLateralAbierto(), panel = lateral ? $('tools') : sec.querySelector('.htpanel'), g = sec.querySelector('.dgrid');
  if (!panel || !g || !panel.querySelector('.htauto')) return;
  const tipo = htTipo(g), st = HT_ESTADO[tipo] = HT_ESTADO[tipo] || { texto: '', facetas: {} };
  st.rangos = st.rangos || {};
  const zona = panel.querySelector('.htauto'), bloque = zona.querySelector('.htfacetas') && zona.querySelector('.htfacetas').closest('.htbloque');
  const propias = [...panel.querySelectorAll('.htpropios label, .htpropios h4, .htpropios .lab')].map(x => htNorm(x.textContent));
  const hayPeriodo = propias.some(t => /periodo|fecha/.test(t));
  const cab = [...(g.querySelector(':scope > .dh') || { children: [] }).children].map(c => c.textContent.trim());
  const filas = [...g.querySelectorAll(':scope > .dr')];
  const cols = cab.map((nombre, i) => {
    if (htNoFiltrable(nombre) || propias.includes(htNorm(nombre))) return null;
    const t = htTipoColumna(filas.map(f => (f.children[i] || {}).textContent || ''));
    if (t === 'fecha' && hayPeriodo) return null;
    return { i, nombre, t };
  }).filter(Boolean);
  const html = cols.length ? `<div class="htbloque htcolf"><h4>Filtrar por columna</h4><div class="htfacetas">${cols.map(c => c.t === 'texto'
      ? `<label><span>${esc(c.nombre)}</span><input type="search" class="chico" data-htt="${c.i}" value="${esc(st.facetas[c.i] || '')}" placeholder="Contiene…"></label>`
      : `<div class="htrango"><span>${esc(c.nombre)}</span><div><input type="${c.t === 'fecha' ? 'date' : 'number'}" class="chico" data-htd="${c.i}" data-htk="${c.t}" value="${esc((st.rangos[c.i] || {}).d || '')}" aria-label="${esc(c.nombre)} desde" placeholder="Desde">
          <input type="${c.t === 'fecha' ? 'date' : 'number'}" class="chico" data-hth="${c.i}" data-htk="${c.t}" value="${esc((st.rangos[c.i] || {}).h || '')}" aria-label="${esc(c.nombre)} hasta" placeholder="Hasta"></div></div>`).join('')}</div></div>` : '';
  const antesDe = [...zona.querySelectorAll('.htbloque')].find(b => b.querySelector('[data-htc], .t2abrir')) || zona.querySelector('.acts');
  if (bloque) bloque.outerHTML = html; else if (html) { if (antesDe) antesDe.insertAdjacentHTML('beforebegin', html); else zona.insertAdjacentHTML('beforeend', html); }
  // Los filtros de antes (desplegable con un valor exacto) pasan a «contiene»
  Object.keys(st.facetas).forEach(i => { if (!cols.some(c => c.i === +i && c.t === 'texto')) delete st.facetas[i]; });
  zona.querySelectorAll('[data-htt]').forEach(inp => inp.oninput = () => { st.facetas[inp.dataset.htt] = inp.value; htAplicarFiltros(g); htContador(sec); });
  zona.querySelectorAll('[data-htd], [data-hth]').forEach(inp => inp.oninput = inp.onchange = () => {
    const i = inp.dataset.htd || inp.dataset.hth, r = st.rangos[i] = st.rangos[i] || {};
    r.k = inp.dataset.htk; if (inp.dataset.htd) r.d = inp.value; else r.h = inp.value;
    htAplicarFiltros(g); htContador(sec);
  });
  const limpiar = zona.querySelector('[data-htlimpiar]');
  if (limpiar) { const v = limpiar.onclick; limpiar.onclick = () => { st.rangos = {}; v && v(); }; }
  if (typeof mejorarCampos === 'function') try { mejorarCampos(zona); } catch (e) {}
})(htPintarPanel);
htAplicarFiltros = function (g) {
  const st = HT_ESTADO[htTipo(g)] || { texto: '', facetas: {} };
  const t = htNorm(st.texto || ''), fac = Object.entries(st.facetas || {}).filter(([, v]) => v), ran = Object.entries(st.rangos || {}).filter(([, r]) => r.d || r.h);
  g.querySelectorAll(':scope > .dr').forEach(f => {
    const celdas = [...f.children];
    const ok = (!t || htNorm(f.textContent).includes(t))
      && fac.every(([i, v]) => celdas[i] && htNorm(celdas[i].textContent).includes(htNorm(v)))
      && ran.every(([i, r]) => {
        const v = htValor(celdas[i] && celdas[i].textContent), x = r.k === 'fecha' ? v.f : v.n;
        if (x == null) return false;
        const d = r.k === 'fecha' ? r.d : (r.d === '' || r.d == null ? null : +r.d), h = r.k === 'fecha' ? r.h : (r.h === '' || r.h == null ? null : +r.h);
        return (d == null || d === '' || x >= d) && (h == null || h === '' || x <= h);
      });
    f.classList.toggle('htfuera', !ok);
  });
};
htActivos = (orig => function (sec) {
  const g = sec.querySelector('.dgrid'), st = g ? HT_ESTADO[htTipo(g)] || {} : {};
  return orig.call(this, sec) + Object.values(st.rangos || {}).filter(r => r.d || r.h).length;
})(htActivos);
// Al pintarse una tabla (datos nuevos o «Ver más»), se aplica su orden y se marcan las cabeceras
htPreparar = (orig => function (sec, ...r) {
  const x = orig.call(this, sec, ...r);
  sec.querySelectorAll('.dgrid').forEach(g => { const n = g.querySelectorAll(':scope > .dr').length; if (g.dataset.htn != n) { g.dataset.htn = n; htOrdenarFilas(g); } });
  return x;
})(htPreparar);

const MOS_MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'], MOS_DS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
cargarInicio = (orig => function (...a) {
  const r = orig.apply(this, a);
  Promise.resolve(r).then(() => pintarMosaico()).catch(() => {});
  return r;
})(cargarInicio);

// La semana de siempre, pintada debajo de la cinta (se cambia el id un momento para que pintarSemanaAgenda pinte allí)
async function agPintarSemanaExp() {
  const cin = $('agcinta'); if (!cin || !AG_SEM_ABIERTA) { const x = $('agsemexp'); if (x) x.remove(); return; }
  let cont = $('agsemexp'); if (!cont) { cin.insertAdjacentHTML('beforeend', '<div id="agsemexp" class="agsemexp"></div>'); cont = $('agsemexp'); }
  const real = $('agcuerpo'), modo = AG_MODO;
  if (!real) return;
  real.id = 'agcuerpo-dia'; cont.id = 'agcuerpo'; AG_MODO = 'semana';
  try { await pintarSemanaAgenda(); } finally { cont.id = 'agsemexp'; real.id = 'agcuerpo'; AG_MODO = modo; }
  const h = cont.querySelector('.semhead h2'); if (h) h.remove();
  const p = cont.querySelector('#semplan'); if (p) p.textContent = 'Repartir la semana';
  const head = cont.querySelector('.semhead'); if (head) head.insertAdjacentHTML('afterbegin', '<span class="sm">Arrastra una cita a otro día para moverla · «⋯» en un día para bloquearlo o añadir una cita</span>');
}
// Sugerencias dentro de tu día y bandejas

document.addEventListener('change', e => { if (e.target && e.target.id === 'popf') pkMarcar(); });
pintarOperativa = async function () {
  let c = $('operativa');
  if (!c) { const ref = $('vcuerpo'); if (!ref) return; ref.insertAdjacentHTML('beforebegin', '<div id="operativa"></div>'); c = $('operativa'); }
  const [{ data }, { data: aj }] = await Promise.all([RPC_ORIG('operativa_pendiente', {}),
    db.from('ajustes').select('valor').eq('clave', 'avisos_pedidos').maybeSingle()]);
  c = $('operativa'); if (!c) return;
  c.className = 'pkop';
  document.querySelectorAll('#opcfg').forEach(x => x.remove());
  const d = data || {}, oblig = (((aj && aj.valor) || {}).obligatorios || {})[PERFIL.rol] || [];
  const pref = ((PERFIL.preferencias || {}).avisos_pedidos) || {};
  const vis = PK_TARJ.filter(([k]) => oblig.includes(k) || pref[k] !== false);
  const hoy = hoyISO(), dia = x => String(x.fecha || '').slice(0, 10);
  const barras = l => { const m = {}; l.forEach(x => { m[dia(x)] = (m[dia(x)] || 0) + 1; }); return [...Array(10)].map((_, i) => m[isoMas(hoy, i - 9)] || 0); };
  const antig = l => l.length ? Math.max(0, ...l.map(x => Math.round((new Date(hoy) - new Date(dia(x))) / 864e5))) : 0;
  const hace = n => n === 0 ? 'de hoy' : n === 1 ? 'de ayer' : `de hace ${num(n)} días`;
  const frase = (k, l) => {
    if (!l.length) return k === 'pago' ? 'Todo cobrado' : k === 'paquete' ? 'Todo preparado' : 'Todas enviadas';
    const ant = `el más antiguo, ${hace(antig(l))}`;
    if (k === 'pago' && verImportes()) return `<b>${eurI(l.reduce((a, x) => a + (+x.total || 0), 0))}</b> por cobrar · ${ant}`;
    return ant.charAt(0).toUpperCase() + ant.slice(1);
  };
  const gear = `<button type="button" class="pkcfg" id="opcfg" aria-label="Elegir qué avisos ver" title="Elegir qué avisos ver">${svgIco(ICON_NOM.settings || '')}</button>`;
  c.innerHTML = !vis.length
    ? `<div class="pkvacio">Has ocultado los avisos de pedidos. Vuelve a elegirlos con el engranaje. ${gear}</div>`
    : `<div class="pk">${vis.map(([k, f, t, ic]) => {
        const l = d[k] || [], b = barras(l), mx = Math.max(1, ...b), alta = k === 'pago' && l.length;
        return `<button type="button" class="pkt ${alta ? 'alta' : ''}" data-pk="${f}" aria-pressed="false" ${l.length ? '' : 'data-cero'}>
          <span class="pkfil">Filtrando</span><span class="pktt">${svgIco(ICON_NOM[ic] || ICON_NOM.info || '')} ${t}</span>
          <span class="pkn" data-v="${l.length}">${num(l.length)}</span><span class="pks">${frase(k, l)}</span>
          <span class="pkbars" aria-hidden="true">${b.map((n, i) => `<i class="${i === 9 ? 'u' : pkLibre(isoMas(hoy, i - 9)) ? 'fin' : ''}" style="height:${n ? Math.max(14, 100 * n / mx) : 6}%"></i>`).join('')}</span>
          <span class="pkdias">${b.map((n, i) => pkDia(isoMas(hoy, i - 9), n, i === 9)).join('')}</span>
          <span class="pklg">Entrada de los últimos 10 días</span></button>`; }).join('')}${gear}</div>`;
  c.querySelectorAll('[data-pk]').forEach(b => b.onclick = () => {
    const s = $('popf'); if (!s) return;
    s.value = s.value === b.dataset.pk ? '' : b.dataset.pk; s.dispatchEvent(new Event('change', { bubbles: true }));
    pkMarcar();
  });
  // El engranaje, junto a «Filtros y columnas» de la cabecera (si está a la vista)
  const hb = document.querySelector('#v-ventas .htbtn'), g = $('opcfg');
  if (hb && hb.offsetParent && g && vis.length) { g.className = 'btn sec pkcfg pkcfgcab'; hb.insertAdjacentElement('beforebegin', g); }
  $('opcfg').onclick = () => configurarAvisosPedidos(oblig);
  pkMarcar();
  pkContar([...c.querySelectorAll('.pkn[data-v]')], n => num(Math.round(n)));
};

var AN_REP = '';   // v2.329.0: Analítica → Resumen, «Reporte»
anCargarKpis = (orig => async function () {
  await orig.apply(this, arguments);
  const caja = $('anareas'); if (!caja || !AN_CFG || !$('anper')) return;
  const pedido = caja.dataset.pedido, cat = anCatalogo(), r = $('anper').__rango(), hoy = hoyISO();
  const hasta = !r.hasta || r.hasta > hoy ? hoy : r.hasta, meses = anMeses(hasta);
  const tarjetas = [...caja.querySelectorAll('.ankpi[data-anu]')].map(el => {
    const x = AN_CFG.kpis.find(y => y.u === el.dataset.anu), k = x && cat.find(c => c.id === x.id);
    return { el, x, k };
  }).filter(t => t.x && t.k);
  // Las cifras cuentan desde cero (con su mismo formato)
  const nums = [];
  tarjetas.forEach(({ el, k }) => {
    el.classList.add('anv');
    const n = el.querySelector('.ankval'); if (!n || k.fmt === 'txt') return;
    const t = n.textContent, m = t.match(/-?[\d.]+(,\d+)?/); if (!m) return;
    n.dataset.v = parseFloat(m[0].replace(/\./g, '').replace(',', '.')); n.dataset.f = t; n.dataset.dec = m[1] ? m[1].length - 1 : 0; nums.push(n);
  });
  pkContar(nums, (v, el) => el.dataset.f.replace(/-?[\d.]+(,\d+)?/, v.toLocaleString('es-ES', { minimumFractionDigits: +el.dataset.dec, maximumFractionDigits: +el.dataset.dec })));
  // La línea: hueco reservado ya (sin saltos) y se dibuja al llegar
  const conLinea = tarjetas.filter(({ k }) => !k.hoy && k.fmt !== 'txt');
  conLinea.forEach(({ el }) => el.insertAdjacentHTML('beforeend', '<div class="avz" aria-hidden="true"></div>'));
  const grupos = {};
  conLinea.forEach(t => {
    const f = {}; (AN_FILTROS[t.k.fam] || []).forEach(c => { if (t.x.f && t.x.f[c]) f[c] = t.x.f[c]; });
    const g = JSON.stringify(f); (grupos[g] = grupos[g] || { f, fams: new Set(), ts: [] }).fams.add(t.k.fam); grupos[g].ts.push(t);
  });
  await Promise.all(Object.values(grupos).map(async g => {
    const serie = await anSerie(meses, g.f, [...g.fams].sort());
    if (!$('anareas') || $('anareas').dataset.pedido !== pedido) return;
    g.ts.forEach(({ el, x, k }) => {
      const z = el.querySelector('.avz'); if (!z) return;
      const vals = serie.map(s => +s[x.id] || 0);
      if (vals.every(v => !v)) { z.classList.add('avcero'); z.innerHTML = anLinea(vals, meses); z.title = 'Sin datos en estos seis meses'; return; }   // v2.343.0: línea plana (antes se escondía y la tarjeta quedaba descuadrada y vacía)
      z.innerHTML = anLinea(vals, meses); z.title = meses.map(([a], i) => `${AN_MES[+a.slice(5, 7) - 1]}: ${anFmt(vals[i], k.fmt).replace(/<[^>]+>/g, '')}`).join(' · ');
    });
  }));
})(anCargarKpis);

