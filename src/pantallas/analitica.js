// pantallas/analitica.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

// Configuración de cada uno: preferencias.analitica = { comp, kpis: [{ u, id, on, f, comp, t }] }
function anConfig() {
  const cat = anCatalogo(), p = (prefsActivas().analitica || {});
  let l = Array.isArray(p.kpis) ? p.kpis.filter(x => cat.some(k => k.id === x.id)) : [];
  cat.forEach(k => { if (!l.some(x => x.id === k.id)) l.push({ u: k.id, id: k.id, on: k.def, f: {}, comp: '', t: '' }); });
  return { comp: p.comp || 'anterior', kpis: l };
}

async function anGuardar(cfg) {
  const prefs = Object.assign({}, PERFIL.preferencias || {}, { analitica: cfg });
  const { data } = await db.rpc('guardar_preferencias', { p: prefs });
  PERFIL.preferencias = data || prefs;
}

function anFmt(v, fmt) {
  if (v == null || v === '') return '—';
  if (fmt === 'txt') return esc(v);
  if (fmt === 'eur') return eurI(v);
  if (fmt === 'pct') return String(Math.round(+v * 10) / 10).replace('.', ',') + ' %';
  if (fmt === 'dec') return String(Math.round(+v * 10) / 10).replace('.', ',');
  if (fmt === 'dias') return String(Math.round(+v)) + ' días';
  return num(v);
}

function anDelta(k, a, b, comp) {
  if (k.hoy) return '<span class="sm">a día de hoy</span>';
  if (k.fmt === 'txt') return '';
  const txt = comp === 'anio' ? 'vs el año pasado' : 'vs periodo anterior';
  if (a == null || b == null || (+b === 0 && k.fmt !== 'pct')) return `<span class="sm">sin datos ${comp === 'anio' ? 'del año pasado' : 'del periodo anterior'}</span>`;
  const dif = k.fmt === 'pct' ? +a - +b : (+a - +b) / Math.abs(+b) * 100;
  if (Math.abs(dif) < 0.05) return `<span class="ankdel igual">Igual que ${comp === 'anio' ? 'el año pasado' : 'el periodo anterior'}</span>`;
  const bien = k.sube == null ? null : (dif > 0) === k.sube;
  const val = k.fmt === 'pct' ? String(Math.round(Math.abs(dif) * 10) / 10).replace('.', ',') + ' pt' : Math.round(Math.abs(dif)) + ' %';
  return `<span class="ankdel ${bien == null ? 'neutro' : bien ? 'up' : 'down'}">${dif > 0 ? '▲' : '▼'} ${val} <span class="sm">${txt}</span></span>`;
}

function anFiltroTxt(f) {
  const out = [];
  if (f.comercial) { const u = (COMS || []).find(x => x.id === f.comercial); out.push(u ? u.nombre : 'Un comercial'); }
  if (f.producto) { const p = (PRODUCTOS || []).find(x => x.id === f.producto); out.push(p ? p.nombre : 'Un producto'); }
  if (f.canal) { const o = $('acanal') && [...$('acanal').options].find(x => x.value === f.canal); out.push(o ? o.textContent : f.canal); }
  if (f.municipio) out.push(rpTitulo(f.municipio));
  return out.join(' · ');
}

// El engranaje: filtro propio del indicador, comparación, nombre, duplicar y ocultar
function anEngranaje(boton, u) {
  document.querySelectorAll('.ankpop').forEach(x => x.remove());
  const x = AN_CFG.kpis.find(y => y.u === u); if (!x) return;
  const k = anCatalogo().find(c => c.id === x.id), sirve = AN_FILTROS[k.fam] || [], f = x.f || {};
  const opt = (v, t, sel) => `<option value="${esc(v)}" ${sel ? 'selected' : ''}>${esc(t)}</option>`;
  const canales = $('acanal') ? [...$('acanal').options].map(o => opt(o.value, o.textContent, o.value === (f.canal || ''))).join('') : '';
  const p = document.createElement('div'); p.className = 'ankpop'; p.__t = Date.now();
  p.innerHTML = `<div class="agpoph"><b>${esc(x.t || k.t)}</b><button type="button" class="x" aria-label="Cerrar">✕</button></div>
    <label for="ankn">Nombre</label><input id="ankn" autocomplete="off" value="${esc(x.t || '')}" placeholder="${esc(k.t)}">
    ${sirve.includes('comercial') && VE_TODO() ? `<label for="ankc">Comercial</label><select id="ankc">${opt('', 'Todos', !f.comercial)}${(COMS || []).map(c => opt(c.id, c.nombre, c.id === f.comercial)).join('')}</select>` : ''}
    ${sirve.includes('producto') ? `<label for="ankp">Producto</label><select id="ankp">${opt('', 'Todos', !f.producto)}${(PRODUCTOS || []).map(c => opt(c.id, c.nombre, c.id === f.producto)).join('')}</select>` : ''}
    ${sirve.includes('canal') && canales ? `<label for="ankca">Canal</label><select id="ankca">${canales}</select>` : ''}
    ${sirve.includes('municipio') ? `<label for="ankm">Municipio</label><input id="ankm" autocomplete="off" value="${esc(f.municipio || '')}" placeholder="Todos">` : ''}
    ${!sirve.length ? `<p class="sm">Este indicador no se filtra por comercial ni por producto: cuenta lo de toda la empresa que puedes ver.</p>` : ''}
    ${k.hoy ? '' : `<label for="ankcmp">Comparar con</label><select id="ankcmp">${opt('', 'Lo mismo que el panel', !x.comp)}${opt('anterior', 'El periodo anterior', x.comp === 'anterior')}${opt('anio', 'El mismo periodo del año pasado', x.comp === 'anio')}</select>`}
    <div class="acts ankacts"><button type="button" class="btn sec" id="ankdup">Duplicar</button><button type="button" class="btn sec" id="ankoff">Ocultar</button>
      <button type="button" class="btn" id="ankok">Guardar</button></div>`;
  document.body.appendChild(p);
  const r = boton.getBoundingClientRect(), w = Math.min(320, innerWidth - 20);
  p.style.width = w + 'px';
  p.style.left = Math.max(10, Math.min(innerWidth - w - 10, r.right - w)) + 'px';
  p.style.top = Math.max(10, Math.min(innerHeight - p.offsetHeight - 10, r.bottom + 6)) + 'px';
  const leer = () => {
    const nf = {};
    if ($('ankc') && $('ankc').value) nf.comercial = $('ankc').value;
    if ($('ankp') && $('ankp').value) nf.producto = $('ankp').value;
    if ($('ankca') && $('ankca').value) nf.canal = $('ankca').value;
    if ($('ankm') && $('ankm').value.trim()) nf.municipio = $('ankm').value.trim();
    return { f: nf, t: $('ankn').value.trim(), comp: $('ankcmp') ? $('ankcmp').value : '' };
  };
  const listo = async () => { p.remove(); await anGuardar(AN_CFG); anCargarKpis(); };
  p.querySelector('.x').onclick = () => p.remove();
  $('ankok').onclick = () => { Object.assign(x, leer()); listo(); };
  $('ankoff').onclick = () => { x.on = false; listo(); toast('Indicador oculto: vuelve a mostrarlo desde «Personalizar»'); };
  $('ankdup').onclick = () => {
    const n = Object.assign({}, x, leer(), { u: x.id + '-' + Date.now().toString(36), on: true });
    if (!n.t) n.t = k.t + ' (copia)';
    AN_CFG.kpis.splice(AN_CFG.kpis.indexOf(x) + 1, 0, n); listo();
  };
}

// Personalizar: qué indicadores se ven (las copias se pueden borrar)
function anPersonalizar() {
  const cat = anCatalogo(), D = AN_CFG.kpis.map(x => Object.assign({}, x));
  const pinta = () => {
    $('dbody').innerHTML = `<div class="fh"><div><h2>Indicadores de Analítica</h2>
        <div class="sm">Elige cuáles ves. Con el engranaje de cada uno puedes filtrarlo, cambiarle el nombre o duplicarlo.</div></div>
        <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
      ${AN_FAM.filter(([f]) => anFamVisible(f)).map(([f]) => `<div class="blk anpers"><h3>${esc(anFamNombre(f))}</h3>
        ${D.map((x, i) => [x, i]).filter(([x]) => { const k = cat.find(c => c.id === x.id); return k && k.fam === f && anKpiVisible(k); }).map(([x, i]) => {
          const k = cat.find(c => c.id === x.id), ft = anFiltroTxt(x.f || {});
          return `<label class="anpf"><span class="vfswitch mini"><input type="checkbox" data-anon="${i}" ${x.on ? 'checked' : ''}><span class="sw"></span></span>
            <span class="tx"><b>${esc(x.t || k.t)}</b><span class="sm">${esc(ft || k.ayuda)}</span></span>
            ${x.u !== x.id ? `<button type="button" class="x" data-andel="${i}" title="Borrar la copia" aria-label="Borrar la copia">✕</button>` : ''}</label>`; }).join('')}</div>`).join('')}
      <div class="acts" style="justify-content:flex-end"><button class="btn sec" id="anres0">Volver a los de siempre</button><button class="btn" id="anpok">Guardar</button></div>`;
    $('dbody').querySelectorAll('[data-anon]').forEach(c => c.onchange = () => { D[+c.dataset.anon].on = c.checked; $('dlg').dataset.sucio = '1'; });
    $('dbody').querySelectorAll('[data-andel]').forEach(b => b.onclick = e => { e.preventDefault(); D.splice(+b.dataset.andel, 1); $('dlg').dataset.sucio = '1'; pinta(); });
    $('anres0').onclick = () => { D.length = 0; cat.forEach(k => D.push({ u: k.id, id: k.id, on: k.def, f: {}, comp: '', t: '' })); $('dlg').dataset.sucio = '1'; pinta(); };
    $('anpok').onclick = async ev => {
      ev.target.disabled = true;
      AN_CFG.kpis = D; await anGuardar(AN_CFG);
      delete $('dlg').dataset.sucio; $('dlg').close(); anCargarKpis();
    };
  };
  pinta(); $('dlg').showModal();
}

// Gráficos del Resumen (los de antes, con el periodo del panel)
async function anGraficos(desde, hasta) {
  if (!$('angraf')) return;
  $('angraf').innerHTML = Array.from({ length: 4 }, () => `<div class="card">${skelCard('Cargando…')}</div>`).join('');
  const [act, med, actv, emb] = await Promise.all([
    db.rpc('analitica_v2', { p_dim: 'producto', p_desde: desde, p_hasta: hasta, lim: 20 }).then(x => x.data || {}),
    db.rpc('analitica_v2', { p_dim: 'medico', p_desde: desde, p_hasta: hasta, lim: 10 }).then(x => (x.data || {}).filas || []),
    db.rpc('actividad_mensual', { p_desde: desde, p_hasta: hasta }).then(x => x.data || []),
    db.rpc('embudo_comercial').then(x => x.data || {})
  ]);
  if (!$('angraf')) return;
  const t = act.totales || {}, meses = mesesEntre(desde, hasta);
  const serie = {}; (act.serie || []).forEach(s => serie[s.mes] = s);
  const vis = {}; actv.forEach(s => vis[s.mes] = s);
  const orden = ESTADOS_DEF.filter(x => x.papel !== 'negativo').map(x => x.valor), negEst = estadoPapel('negativo');
  const embTot = orden.reduce((n, k) => n + (+emb[k] || 0), 0);
  $('angraf').innerHTML = `
    ${puedeModulo('ventas') ? `<div class="card ancard ancha"><h2>Evolución de las ventas</h2>
      ${(t.unidades || 0) ? svgBarras(meses, meses.map(m => (serie[m] || {}).unidades || 0), verImportes() ? meses.map(m => +((serie[m] || {}).importe || 0)) : null, ['Unidades', 'Importe sin IVA'])
        : vacioGrafico('Cuando haya pedidos completados verás aquí las unidades (barras) y el importe (línea) de cada mes.')}
      <p class="leer"><b>Cómo leerlo:</b> arriba, las unidades vendidas cada mes; abajo, el importe, con los mismos meses alineados. Si el importe crece más que las unidades, se vende a mejor precio (menos descuento o productos de más valor).</p></div>
    <div class="card ancard"><h2>Reparto por producto</h2>
      ${(act.por_producto || []).length ? barrasReparto((act.por_producto || []).map(x => ({ n: x.nombre, v: +x.unidades || 0 }))) : vacioGrafico('Verás qué parte de las unidades corresponde a cada producto.')}
      <p class="leer"><b>Cómo leerlo:</b> el porcentaje de unidades de cada producto en el periodo. Sirve para ver de qué depende la facturación.</p></div>
    <div class="card ancard"><h2>${TT('medico', 'p', '', 'l', 'C')} con más ventas</h2>
      ${med.filter(x => x.clave !== 'sin').length ? barrasH(med.filter(x => x.clave !== 'sin').map(x => ({ n: x.nombre, v: x.unidades })), num) : vacioGrafico(`Aparecerán los 10 ${TT('medico', 'p', '', 'l', 'l')} con más unidades atribuidas.`)}
      <p class="leer"><b>Cómo leerlo:</b> los diez ${TT('medico', 'p', '', 'l', 'l')} con más unidades atribuidas. Son los que conviene cuidar: ${TT('visita', 'p', '', 'l', 'l')} frecuentes, material y seguimiento.</p></div>` : ''}
    <div class="card ancard"><h2>Embudo comercial</h2>
      ${embTot ? `<div class="embudo">${orden.map((k, i) => { const v = +emb[k] || 0, ant2 = i ? (+emb[orden[i - 1]] || 0) : 0;
        return `<div class="emb"><span class="embn">${esc(k)}</span><span class="embb"><i style="width:${Math.max(3, v / embTot * 100)}%"></i></span><b>${num(v)}</b>
          ${i ? `<span class="sm">${ant2 ? pct(v, ant2 + v) + '% avanza' : ''}</span>` : '<span class="sm"></span>'}</div>`; }).join('')}
        ${negEst && emb[negEst] ? `<div class="sm" style="margin-top:6px">${esc(negEst)}: ${num(emb[negEst])}</div>` : ''}</div>`
        : vacioGrafico(`Verás cuántos ${TT('medico', 'p', '', 'l', 'l')} hay en cada estado comercial.`)}
      <p class="leer"><b>Cómo leerlo:</b> cuántos ${TT('medico', 'p', '', 'l', 'l')} hay en cada estado. El porcentaje indica qué parte ha pasado a ese estado respecto al anterior.</p></div>
    <div class="card ancard ancha"><h2>Actividad y resultados</h2>
      ${actv.length || (t.unidades || 0) ? svgBarras(meses, meses.map(m => (vis[m] || {}).visitas || 0), meses.map(m => (serie[m] || {}).unidades || 0), [`${TT('visita', 'p', '', 'l', 'C')}`, 'Unidades vendidas'])
        : vacioGrafico(`Verás ${TT('visita', 'p', 'el', 'l', 'l')} de cada mes junto a las unidades vendidas.`)}
      <p class="leer"><b>Cómo leerlo:</b> las barras son ${TT('visita', 'p', 'el', 'l', 'l', 'registrado')} y la línea, las unidades vendidas. Si ${TT('visita', 'p', 'el', 'l', 'l')} suben y las ventas no, conviene revisar el mensaje y a quién se va a ver.</p></div>`;
}

// Los filtros de las dos pestañas pasan al panel (cada vez: el Resumen se puede volver a pintar); la búsqueda por texto sigue a la vista
function anMoverFiltros() {
  const v = $('v-analitica'); if (!v) return;
  htPreparar(v);
  const dest = v.querySelector('.htpanel .htpropios'); if (!dest) return;
  [['#anfil', 'resumen'], ['#v-analitica .panel > .filtros', 'explorar']].forEach(([sel, k]) => {
    const src = document.querySelector(sel); if (!src) return;
    [...src.children].forEach(ch => {
      if (ch.matches('input[type=search],input[type=text]') || ch.querySelector('input[type=search],input[type=text], #adim, #amedida')) return;   // «Ver por» y «Ordenar por» van a la vista
      ch.dataset.anp = k; dest.appendChild(ch);
    });
    src.dataset.ht = '1'; if (!src.children.length) src.classList.add('hide');
  });
  dest.querySelectorAll('select').forEach(x => { if (!x.dataset.anht) { x.dataset.anht = '1'; x.addEventListener('change', () => htContador(v)); } });
}

function anPestana() {
  const v = $('v-analitica'); if (!v) return;
  v.classList.toggle('an-exp', ANSEC === 'explorar'); v.classList.toggle('an-res', ANSEC !== 'explorar');
  $('tools').dataset.ansec = ANSEC === 'explorar' ? 'explorar' : 'resumen';   // el panel lateral de «Filtros y columnas» está fuera de la pantalla
  anMoverFiltros();
  const per = $('anpers'); if (per) per.hidden = ANSEC === 'explorar';
}

function anMeses(hasta) {
  return [...Array(6)].map((_, i) => {
    const d = new Date(hasta + 'T12:00:00'); d.setDate(1); d.setMonth(d.getMonth() - 5 + i);
    const a = isoLocal(d); d.setMonth(d.getMonth() + 1); d.setDate(0); const b = isoLocal(d);
    return [a, b > hasta ? hasta : b];
  });
}

async function anSerie(meses, f, fams) {
  const clave = JSON.stringify([meses[0][0], meses[5][1], f, fams, AN_REP]);
  if (!AN_SERIE.has(clave)) AN_SERIE.set(clave, Promise.all(meses.map(([a, b]) =>
    db.rpc('analitica_kpis_periodo', { p_desde: a, p_hasta: b, p_filtro: f, p_familias: fams, p_estado: false }).then(r => r.error ? {} : (r.data || {}), () => ({})))));
  const r = await AN_SERIE.get(clave);
  if (r.every(x => !Object.keys(x).length)) AN_SERIE.delete(clave);
  return r;
}

const AN = { dim: 'medico', desde: '', hasta: '', canal: '', producto: '' };

let AN_MED = null;

let ANSEC = 'resumen';

/* v2.148.0 · Analítica: panel de indicadores por áreas (decisión de Eric, 3/10/2026: «Panel por áreas + Explorar», engranaje con
   filtro propio que se guarda y las cuatro familias nuevas). Resumen: indicadores de Ventas, Clientes, Equipo, Oportunidades, Cobros y
   Stock (cada uno según su módulo y permisos) con la comparación elegida; cada tarjeta tiene su engranaje (comercial, producto, canal,
   municipio, comparación y nombre; se puede duplicar con otro filtro) y «Personalizar» elige cuáles se ven. El periodo y la comparación
   van en «Filtros y columnas»; en Explorar, también todos sus filtros (a la vista quedan «Ver por», «Ordenar por» y la búsqueda).
   Las cifras salen de analitica_kpis (SQL 96), una llamada por filtro distinto. */
const AN_FAM = [
  ['ventas', 'Ventas', () => puedeModulo('ventas')],
  ['clientes', 'Clientes', () => puedeModulo('ventas')],
  ['equipo', () => 'Equipo y ' + TT('visita', 'p', '', 'l', 'l'), () => puedeModulo('agenda')],
  ['oportunidades', 'Oportunidades', () => puedeModulo('ventas') && hayOportunidades()],
  ['cobros', 'Cobros', () => puedeModulo('facturacion')],
  ['stock', 'Stock y compras', () => puedeModulo('productos') && nivelDe2('P') >= 1]
];

// Qué filtros tienen sentido en cada área
const AN_FILTROS = { ventas: ['comercial', 'producto', 'canal', 'municipio'], clientes: ['comercial', 'producto', 'canal', 'municipio'],
  equipo: ['comercial', 'municipio'], oportunidades: ['comercial', 'producto'], cobros: [], stock: ['producto'] };

const anFamNombre = f => { const x = AN_FAM.find(a => a[0] === f); return x ? (typeof x[1] === 'function' ? x[1]() : x[1]) : f; };

const anFamVisible = f => { const x = AN_FAM.find(a => a[0] === f); return !!x && x[2](); };

const anKpiVisible = k => anFamVisible(k.fam) && (!k.imp || verImportes());

const AN_MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/* ============================================================
   v2.320.0 · Ventas tras la visita (petición de Eric, 16/10/2026; SQL 163). En Analítica → Resumen, arriba, una tarjeta con
   flechas ‹ › que enseña el mismo dato de tres maneras (le gustaban las tres propuestas por igual):
     1. Embudo: visitas, profesionales visitados y los que tienen una venta en los 30 días siguientes; % grande, unidades y días.
     2. El efecto de la visita: unidades por visita y día, 30 días antes y después (media de 7 días), con el día de la visita.
     3. Mes a mes: visitas y visitas con venta de los 6 últimos meses, con la línea del %.
   Usa el periodo de Analítica y lo compara con el anterior. La vista elegida se recuerda (localStorage delcos-tvvista).
   Solo para el equipo: nunca en el portal del profesional.
   ============================================================ */

/* ============================================================
   v2.326.0 · Pedidos tras la visita, por tipo (petición de Eric, 16/10/2026; SQL 168). La tarjeta de Analítica se llama ya
   «Pedidos tras la visita» y no habla de ventas (regla de Eric: nunca «venta» al hablar de pedidos y profesionales). Cuarta
   vista «Por tipo»: visitas de captación (la primera a cada profesional), de presentación (resultado que avanza la ficha o un
   producto nuevo presentado) y de seguimiento, cuántas acaban en pedido, y lo mismo por persona del equipo.
   ============================================================ */

// [id, área, título, formato, mejor si sube (true/false/null), ayuda, a hoy, solo con importes, por defecto]
function anCatalogoBase() {
  const med = TT('medico', 'p', '', 'l', 'l'), vis = TT('visita', 'p', '', 'l', 'l'), vis1 = TT('visita', 's', '', 'l', 'l');
  return [
    ['importe', 'ventas', 'Ventas sin IVA', 'eur', true, 'Importe sin IVA de los pedidos completados, con el descuento de cada línea.', false, true, true],
    ['unidades', 'ventas', 'Unidades vendidas', 'num', true, 'Unidades de los pedidos completados.', false, false, true],
    ['pedidos', 'ventas', 'Pedidos', 'num', true, 'Pedidos completados en el periodo.', false, false, false],
    ['ticket', 'ventas', 'Ticket medio', 'eur', true, 'Importe medio de cada pedido.', false, true, true],
    ['web_pct', 'ventas', 'Ventas por la web', 'pct', true, 'Parte del importe que llega en pedidos marcados como «por la web».', false, true, true],
    ['margen', 'ventas', 'Margen bruto', 'eur', true, 'Ventas menos el coste de los productos vendidos. Solo cuenta los productos con coste: ponlo en cada producto.', false, true, false],
    ['margen_pct', 'ventas', 'Margen bruto (%)', 'pct', true, 'Margen bruto sobre las ventas de los productos con coste.', false, true, false],
    ['top10_pct', 'ventas', `Peso de los 10 primeros ${med}`, 'pct', false, `Qué parte de las ventas atribuidas hacen los 10 ${med} que más venden. Cuanto más alto, más depende el negocio de pocos.`, false, true, false],
    ['clientes', 'clientes', 'Clientes que compran', 'num', true, 'Clientes distintos con algún pedido confirmado en el periodo.', false, false, true],
    ['clientes_nuevos', 'clientes', 'Clientes nuevos', 'num', true, 'Clientes cuyo primer pedido es de este periodo.', false, false, false],
    ['repiten_pct', 'clientes', 'Clientes que repiten', 'pct', true, 'De los que compran en el periodo, cuántos ya habían comprado antes.', false, false, true],
    ['perdidos', 'clientes', 'Clientes perdidos', 'num', false, 'Compraron en el último año y llevan más de 90 días sin comprar (al final del periodo).', false, false, true],
    ['valor_cliente', 'clientes', 'Valor por cliente', 'eur', true, 'Importe medio comprado por cada cliente en el periodo.', false, true, false],
    ['visitas', 'equipo', `${TT('visita', 'p', '', 'l', 'C')}`, 'num', true, `${TT('visita', 'p', '', 'l', 'C', 'registrado')} en el periodo.`, false, false, false],
    ['visitas_dia', 'equipo', `${TT('visita', 'p', '', 'l', 'C')} por día`, 'dec', true, `Media de ${vis} de cada persona en los días que trabaja en la calle.`, false, false, true],
    ['citas_pct', 'equipo', 'Citas cumplidas', 'pct', true, `De las citas del periodo hasta hoy (sin contar las aplazadas), cuántas acabaron en ${vis1}.`, false, false, false],
    ['cobertura_pct', 'equipo', 'Cobertura de la cartera', 'pct', true, `Parte de la cartera con alguna ${vis1} en los 60 días anteriores al final del periodo.`, false, false, true],
    ['conversion_pct', 'equipo', `Conversión ${vis1} → venta`, 'pct', true, `De ${TT('medico', 'p', 'el', 'l', 'l', 'visitado')} en el periodo, cuántos tienen ventas atribuidas en los 30 días siguientes a la primera ${vis1}.`, false, false, true],
    ['activados', 'equipo', `${TT('medico', 'p', '', 'l', 'C')} activados`, 'num', true, `${TT('medico', 'p', '', 'l', 'C')} cuya primera venta atribuida es de este periodo.`, false, false, false],
    ['op_abiertas', 'oportunidades', 'Oportunidades abiertas', 'num', null, 'Oportunidades del periodo que aún no se han cerrado.', false, false, false],
    ['cierre_pct', 'oportunidades', 'Tasa de cierre', 'pct', true, 'De las oportunidades cerradas, cuántas acabaron en pedido.', false, false, true],
    ['ganado', 'oportunidades', 'Importe ganado', 'eur', true, 'Importe estimado de las oportunidades que acabaron en pedido.', false, true, true],
    ['perdido', 'oportunidades', 'Importe perdido', 'eur', false, 'Importe estimado de las oportunidades que no compraron.', false, true, false],
    ['motivo_perdida', 'oportunidades', 'Motivo principal de pérdida', 'txt', null, 'El resultado más repetido entre las oportunidades que no compraron.', false, false, false],
    ['facturado', 'cobros', 'Facturado', 'eur', true, 'Total de las facturas emitidas en el periodo (las rectificativas restan).', false, true, false],
    ['pendiente', 'cobros', 'Pendiente de cobro', 'eur', null, 'Lo que falta por cobrar de todas las facturas, a día de hoy.', true, true, true],
    ['vencido', 'cobros', 'Vencido', 'eur', false, 'Lo pendiente de cobro con el vencimiento ya pasado, a día de hoy.', true, true, true],
    ['dias_cobro', 'cobros', 'Días medios de cobro', 'dias', false, 'Días entre la factura y su cobro, de las cobradas en el periodo.', false, true, false],
    ['valor_stock', 'stock', 'Valor del stock', 'eur', null, 'Unidades en almacén por el coste de cada producto, a día de hoy.', true, true, true],
    ['bajo_minimo', 'stock', 'Productos bajo mínimo', 'num', false, 'Productos activos con menos stock que su mínimo, a día de hoy.', true, false, true],
    ['caducan', 'stock', 'Lotes que caducan en 90 días', 'num', false, 'Lotes con unidades que caducan en los próximos 90 días.', true, false, false],
    ['compras', 'stock', 'Compras del periodo', 'eur', null, 'Importe de los pedidos de compra del periodo (sin los cancelados).', false, true, false]
  ].map(([id, fam, t, fmt, sube, ayuda, hoy, imp, def]) => ({ id, fam, t, fmt, sube, ayuda, hoy, imp, def }));
}

// v2.320.0 · Fuera el indicador «Conversión visita → venta» (decisión de Eric): lo mide, más completo, la tarjeta «Ventas tras la visita»
function anCatalogo(...a) { return anCatalogoBase.apply(this, a).filter(k => k.id !== 'conversion_pct'); }

async function cargarAnaliticaBase() {
  if (!COMS.length && VE_TODO()) await cargarComerciales();
  await cargarProductos();
  $('v-analitica').innerHTML = `
    <div class="saludo"><div><h1>Analítica</h1><div class="fecha">Unidades e importes por ${TT('medico', 's', '', 'l', 'l')}, comercial, producto o zona</div></div></div>
    <div class="panel">
      <div class="filtros">
        <div id="aper"></div>
        <div><label for="adim">Ver por</label><select id="adim">
          <option value="medico">${TT('medico', 's', '', 'l', 'C')}</option><option value="comercial">Comercial</option>
          <option value="producto">Producto</option><option value="municipio">Municipio</option>
          <option value="mes">Mes</option><option value="canal">Canal</option></select></div>
        <div><label for="amedida">Ordenar por</label><select id="amedida">
          <option value="unidades">Unidades</option><option value="importe">Importe</option></select></div>
        <div><label for="acanal">Canal</label><select id="acanal">
          <option value="">Todos</option><option value="paciente">Venta ${TT('paciente', 's', 'al', 'l', 'l')}</option>
          <option value="centro">Venta a centro</option></select></div>
        <div><label for="aprod">Producto</label><select id="aprod"><option value="">Todos</option>
          ${PRODUCTOS.map(p => `<option value="${p.id}">${esc(p.nombre)}</option>`).join('')}</select></div>
        <div><label for="arep">Reporting</label><select id="arep"><option value="">Todos ${TT('medico', 'p', 'el', 'l', 'l')}</option>
          <option value="con">Con reporting</option><option value="sin">Sin reporting</option></select></div>
        ${VE_TODO() ? `<div><label for="areprt">Reporte</label><select id="areprt"><option value="">Todos</option><option value="si">Reportados</option><option value="no">Sin reportar</option></select></div>` : ''}
        ${VE_TODO() ? `<div><label for="acom">Comercial</label><select id="acom"><option value="">Todos</option>
          ${COMS.map(u => `<option value="${u.id}">${esc(u.nombre)}</option>`).join('')}</select></div>` : ''}
        <div style="grid-column:span 2"><label>${TT('medico', 's', '', 'l', 'C')}</label><div id="amed"></div></div>
        <input type="hidden" id="adesde"><input type="hidden" id="ahasta">
      </div>
      <div class="kpis vtot" id="atot"></div>
      <div id="aprods"></div>
      <div class="subnav"><button data-avista="rank" aria-pressed="true">Ranking</button>
        <button data-avista="tabla" aria-pressed="false">Tabla por meses</button></div>
      <div id="aserie" style="padding:14px"></div>
      <div id="atabla"></div>
      <div id="atabla2" class="hide"></div>
    </div>`;
  const sinc = () => { const r = $('aper').__rango(); $('adesde').value = r.desde || ''; $('ahasta').value = r.hasta || ''; };
  montarPeriodo($('aper'), { id: 'analitica', valor: 'anio', alCambiar: () => { sinc(); refrescarAnalitica(); } });
  sinc();
  selectorMedico($('amed'), { valor: AN_MED, placeholder: `Todos · busca ${TT('medico', 's', 'un', 'l', 'l')} para ver sus ventas`, alElegir: m => { AN_MED = m; refrescarAnalitica(); } });
  ['adim', 'acanal', 'amedida', 'aprod', 'acom', 'arep', 'areprt'].forEach(id => { if ($(id)) $(id).onchange = refrescarAnalitica; });
  $('v-analitica').querySelectorAll('[data-avista]').forEach(b => b.onclick = () => {
    const tabla = b.dataset.avista === 'tabla';
    $('v-analitica').querySelectorAll('[data-avista]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    $('atabla').classList.toggle('hide', tabla); $('aserie').classList.toggle('hide', tabla);
    $('atabla2').classList.toggle('hide', !tabla);
    if (tabla) pintarTablaAnalitica();
  });
  pintarAnalitica();
}

async function cargarAnaliticaBase2() {
  await cargarAnaliticaBase();
  const v = $('v-analitica'), panel = v.querySelector('.panel');
  if (!panel) return;
  v.querySelector('.saludo').insertAdjacentHTML('afterend', `<div class="subnav" id="ansub">
    <button data-ansec="resumen" aria-pressed="${ANSEC === 'resumen'}">Resumen</button>
    <button data-ansec="explorar" aria-pressed="${ANSEC === 'explorar'}">Explorar datos</button></div>
    <div id="anres" class="${ANSEC === 'resumen' ? '' : 'hide'}"></div>`);
  panel.classList.toggle('hide', ANSEC === 'resumen');
  v.querySelectorAll('[data-ansec]').forEach(b => b.onclick = () => {
    ANSEC = b.dataset.ansec;
    v.querySelectorAll('[data-ansec]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    $('anres').classList.toggle('hide', ANSEC !== 'resumen'); panel.classList.toggle('hide', ANSEC === 'resumen');
    if (ANSEC === 'resumen' && !$('ankpis')) pintarResumenAnalitica();
  });
  if (ANSEC === 'resumen') pintarResumenAnalitica();
}

// Las cifras: una llamada por cada combinación distinta de filtro y comparación
async function anCargarKpisBase() {
  const caja = $('anareas'); if (!caja || !AN_CFG) return;
  const cat = anCatalogo(), r = $('anper').__rango();
  const hasta = r.hasta || hoyISO(), desde = r.desde || isoMas(hasta, -364);
  const vis = AN_CFG.kpis.filter(x => x.on).map(x => Object.assign({}, x, { k: cat.find(c => c.id === x.id) })).filter(x => x.k && anKpiVisible(x.k));
  const grupos = {};
  vis.forEach(x => {
    const comp = x.comp || AN_CFG.comp, f = {}; (AN_FILTROS[x.k.fam] || []).forEach(c => { if (x.f && x.f[c]) f[c] = x.f[c]; });
    const clave = JSON.stringify([f, comp]);
    (grupos[clave] = grupos[clave] || { f, comp, fams: new Set(), items: [] }).fams.add(x.k.fam);
    grupos[clave].items.push(x);
    x.clave = clave;
  });
  const pedido = Date.now(); caja.dataset.pedido = pedido;
  const res = await Promise.all(Object.entries(grupos).map(async ([clave, g]) => {
    const { data, error } = await db.rpc('analitica_kpis', { p_desde: desde, p_hasta: hasta, p_filtro: g.f, p_familias: [...g.fams], p_comp: g.comp });
    return [clave, error ? { error: error.message } : data];
  }));
  if (!$('anareas') || $('anareas').dataset.pedido !== String(pedido)) return;
  AN_DATOS = Object.fromEntries(res);
  const porFam = {};
  vis.forEach(x => (porFam[x.k.fam] = porFam[x.k.fam] || []).push(x));
  caja.innerHTML = AN_FAM.filter(([f]) => porFam[f]).map(([f]) => `<section class="anarea" data-fam="${f}"><h3>${esc(anFamNombre(f))}</h3>
    <div class="ankgrid">${porFam[f].map(x => {
      const d = AN_DATOS[x.clave] || {}, a = (d.act || {})[x.id], b = (d.ant || {})[x.id], ft = anFiltroTxt(x.f || {});
      return `<div class="ankpi" data-anu="${esc(x.u)}">
        <div class="ankcab"><span class="anktit">${esc(x.t || x.k.t)}</span>
          <button type="button" class="ai" data-ayuda-txt="${esc(x.k.ayuda)}" data-ayuda-tit="${esc(x.k.t)}" aria-label="Qué es">i</button>
          <button type="button" class="ankcfg" data-ancfg="${esc(x.u)}" title="Filtrar y ajustar" aria-label="Filtrar y ajustar ${esc(x.t || x.k.t)}">${svgIco(ICON_NOM.settings)}</button></div>
        <b class="ankval ${x.k.fmt === 'txt' ? 'txt' : ''}">${d.error ? '—' : anFmt(a, x.k.fmt)}</b>
        ${d.error ? `<span class="sm">No se ha podido calcular</span>` : anDelta(x.k, a, b, x.comp || AN_CFG.comp)}
        ${ft ? `<span class="ankfil">${esc(ft)}</span>` : ''}</div>`; }).join('')}</div></section>`).join('')
    || `<div class="vacio">No tienes indicadores a la vista. Elige cuáles quieres ver con <b>Personalizar</b>.</div>`;
  caja.querySelectorAll('[data-ancfg]').forEach(b => b.onclick = e => { e.stopPropagation(); anEngranaje(b, b.dataset.ancfg); });
  const cmp = AN_CFG.comp === 'anio' ? 'el mismo periodo del año pasado' : 'el periodo anterior';
  if ($('anresumen')) $('anresumen').innerHTML = `Del ${fechaCorta(desde)} al ${fechaCorta(hasta)}, comparado con ${cmp} · <button type="button" class="kcfg" id="ancambiar">Cambiar</button>`;
  if ($('ancambiar')) $('ancambiar').onclick = () => { const b = document.querySelector('#v-analitica .htbtn'); if (b) { b.click(); b.scrollIntoView({ block: 'nearest' }); } };
}

async function cargarAnalitica() {
  await cargarAnaliticaBase2();
  const v = $('v-analitica'); if (!v) return;
  // Explorar: «Ver por» y «Ordenar por» quedan a la vista, encima de Ranking / Tabla; el resto, a «Filtros y columnas»
  const panel = v.querySelector('.panel'), fil = panel && panel.querySelector(':scope > .filtros');
  if (fil && !$('anvista')) {
    fil.insertAdjacentHTML('afterend', '<div class="anvista" id="anvista"></div>');
    ['adim', 'amedida'].forEach(id => { const c = $(id) && ($(id).closest('.filtros > div') || $(id).closest('.htpropios > div')); if (c) { delete c.dataset.anp; $('anvista').appendChild(c); } });
    [...fil.children].forEach(c => c.dataset.anp = 'explorar');
  }
  // Personalizar, en la cabecera (solo en el Resumen)
  const sal = v.querySelector('.saludo');
  const sub = sal && sal.querySelector('.fecha'); if (sub) sub.textContent = 'Cómo va cada área frente al periodo anterior, y los datos para explorar';
  if (sal && !$('anpers')) {
    let acts = sal.querySelector(':scope > .acts');
    if (!acts) { sal.insertAdjacentHTML('beforeend', '<div class="acts"></div>'); acts = sal.querySelector(':scope > .acts'); }
    acts.insertAdjacentHTML('afterbegin', '<button type="button" class="btn sec" id="anpers">Personalizar</button>');
    $('anpers').onclick = () => { if (!AN_CFG) AN_CFG = anConfig(); anPersonalizar(); };
  }
  v.querySelectorAll('[data-ansec]').forEach(b => b.addEventListener('click', () => setTimeout(anPestana, 0)));
  anPestana();
}

async function anCargarKpisBase2() {
  await anCargarKpisBase.apply(this, arguments);
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
}

async function anCargarKpis(...a) {
  const r = $('anper') && $('anper').__rango ? $('anper').__rango() : null;
  const p = r ? Promise.resolve(RPC_ORIG('ventas_tras_visita', { p_desde: r.desde || null, p_hasta: r.hasta || null, p_dias: 30 })).then(x => (x && x.data) || null, () => null) : null;
  const res = await anCargarKpisBase2.apply(this, a);
  const d = p ? await p : null;
  if (TAB === 'analitica') tvTarjeta(d);
  return res;
}

async function pintarResumenAnalitica() {
  const cuerpo = $('anres'); if (!cuerpo) return;
  if (!COMS.length && VE_TODO()) await cargarComerciales();
  AN_CFG = anConfig();
  document.querySelectorAll('#v-analitica .htpropios [data-anp="resumen"]').forEach(x => x.remove());   // los de un pintado anterior
  cuerpo.innerHTML = `<div class="filtros" id="anfil"><div id="anper" data-anp="resumen"></div>
      <div data-anp="resumen"><label for="ancomp">Comparar con</label><select id="ancomp">
        <option value="anterior" ${AN_CFG.comp === 'anterior' ? 'selected' : ''}>El periodo anterior</option>
        <option value="anio" ${AN_CFG.comp === 'anio' ? 'selected' : ''}>El mismo periodo del año pasado</option></select></div>
      ${VE_TODO() ? `<div data-anp="resumen"><label for="anrep">Reporte</label><select id="anrep"><option value="">Todos</option><option value="si" ${AN_REP === 'si' ? 'selected' : ''}>Reportados</option><option value="no" ${AN_REP === 'no' ? 'selected' : ''}>Sin reportar</option></select></div>` : ''}</div>
    <p class="sm anresumen" id="anresumen"></p>
    <div id="ankpis" hidden></div>
    <div id="anareas"><div class="ankgrid">${Array.from({ length: 4 }, () => '<div class="ankpi"><div class="skel" style="width:60%"></div><div class="skel" style="width:40%;height:24px"></div></div>').join('')}</div></div>
    <div class="angrid" id="angraf"></div>`;
  const pinta = () => {
    const r = $('anper').__rango(), hasta = r.hasta || hoyISO(), desde = r.desde || isoMas(hasta, -364);
    anCargarKpis(); anGraficos(desde, hasta);
  };
  montarPeriodo($('anper'), { id: 'analitica-resumen', valor: 'anio', alCambiar: pinta });
  $('ancomp').onchange = async () => { AN_CFG.comp = $('ancomp').value; await anGuardar(AN_CFG); anCargarKpis(); };
  if ($('anrep')) $('anrep').onchange = () => { AN_REP = $('anrep').value; anCargarKpis(); };   // v2.329.0
  pinta();
  anMoverFiltros();
}

// «Pedidos tras la visita» y «Explorar datos» están en src/app/screens/analytics (v2.412.0). Estos nombres se quedan: la página
// (cargarAnaliticaBase) y el panel de indicadores (anCargarKpis) los llaman.
function pintarAnalitica() { return window.delcos.screens.analytics.paintRanking(); }
function pintarTablaAnalitica() { return window.delcos.screens.analytics.paintMonthlyTable(); }
function refrescarAnalitica() { return window.delcos.screens.analytics.refreshExplore(); }
function tvTarjeta(d) { return window.delcos.screens.analytics.showVisitOrders(d); }
