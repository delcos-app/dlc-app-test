// pantallas/analitica.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

async function pintarAnalitica() {
  cargando($('atabla'), 'Calculando…');
  $('atot').innerHTML = Array.from({ length: 4 }, () => '<div class="kpi ksk"><div class="skel" style="width:40%;height:24px;margin:2px 0 8px"></div><div class="skel" style="width:70%;margin:0"></div></div>').join('');
  const r = $('aper').__rango(), dim = $('adim').value, medida = $('amedida').value;
  const { data, error } = await db.rpc('analitica_v2', {
    p_dim: dim, p_desde: r.desde, p_hasta: r.hasta, p_canal: $('acanal').value || null,
    p_medico: AN_MED ? AN_MED.id : null, p_comercial: ($('acom') && $('acom').value) || null,
    p_producto: $('aprod').value || null, lim: 100, p_reporting: ($('arep') && $('arep').value) || null, p_reportado: ($('areprt') && $('areprt').value) || null });
  if (error) { $('atabla').innerHTML = `<div class="vacio">No se ha podido calcular: ${esc(error.message)}</div>`; $('atot').innerHTML = ''; return; }
  const t = data.totales || {}, filas = (data.filas || []).slice().sort((a, b) => (+b[medida] || 0) - (+a[medida] || 0));
  const quien = [AN_MED ? AN_MED.nombre : '', $('acom') && $('acom').value ? $('acom').selectedOptions[0].textContent : '',
    $('aprod').value ? $('aprod').selectedOptions[0].textContent : '', $('arep') && $('arep').value ? $('arep').selectedOptions[0].textContent : '',
    $('areprt') && $('areprt').value ? $('areprt').selectedOptions[0].textContent : ''].filter(Boolean).join(' · ');
  $('atot').innerHTML = `
    <div class="kpi"><b>${num(t.unidades)}</b><span>Unidades${quien ? ' · ' + esc(quien) : ''}</span></div>
    <div class="kpi ok"><b>${eurI(t.importe)}</b><span>Importe sin IVA</span></div>
    <div class="kpi"><b>${num(t.pedidos)}</b><span>Pedidos</span></div>
    <div class="kpi"><b>${num(t.medicos)}</b><span>${TT('medico', 'p', '', 'l', 'C')} con ventas</span></div>`;
  const pp = data.por_producto || [];
  $('aprods').innerHTML = pp.length > 1 || (pp.length === 1 && dim !== 'producto') ? `<div class="dgrid-wrap"><div class="dgrid aprod">
    <div class="dh"><span>Por producto</span><span class="num">Unidades</span><span class="num">% uds.</span><span class="num">Importe</span></div>
    ${pp.map(p => `<div class="dr" style="cursor:default"><span><b>${esc(p.nombre)}</b></span><span class="num">${num(p.unidades)}</span>
      <span class="num">${Math.round(p.unidades / (t.unidades || 1) * 100)}%</span><span class="num">${eurI(p.importe)}</span></div>`).join('')}
  </div></div>` : '';

  const serie = data.serie || [];
  if (serie.length > 1) {
    const max = Math.max(...serie.map(s => +s[medida] || 0)) || 1;
    $('aserie').innerHTML = `<div style="display:flex;gap:6px;align-items:flex-end;height:130px">${serie.map(s => `
      <div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:4px">
        <span class="sm">${medida === 'importe' ? eurI(s.importe).replace(',00', '') : num(s.unidades)}</span>
        <div style="width:100%;background:var(--sky);border-radius:6px 6px 0 0;height:${Math.round((+s[medida] || 0) / max * 84)}px"></div>
        <span class="sm">${esc(s.mes.slice(5))}/${esc(s.mes.slice(2, 4))}</span></div>`).join('')}</div>`;
  } else $('aserie').innerHTML = '';

  const tot = +t[medida] || 1;
  $('atabla').innerHTML = filas.length ? `<div class="dgrid-wrap"><div class="dgrid arank">
    <div class="dh"><span>#</span><span>${esc($('adim').selectedOptions[0].textContent)}</span><span class="num">Unidades</span>
      <span class="num">Importe</span><span class="num">Pedidos</span><span>Peso</span></div>
    ${filas.map((f, i) => `<div class="dr" style="cursor:default"><span class="sm">${i + 1}</span><span><b>${esc(f.nombre)}</b></span>
      <span class="num">${num(f.unidades)}</span><span class="num">${eurI(f.importe)}</span><span class="num">${num(f.pedidos)}</span>
      <span class="barra"><i style="width:${Math.round((+f[medida] || 0) / tot * 100)}%"></i><em>${Math.round((+f[medida] || 0) / tot * 100)}%</em></span></div>`).join('')}
    <div class="dr dtot"><span></span><span><b>Total</b></span><span class="num"><b>${num(t.unidades)}</b></span>
      <span class="num"><b>${eurI(t.importe)}</b></span><span class="num"><b>${num(t.pedidos)}</b></span><span></span></div>
  </div></div>` : '<div class="vacio">Sin pedidos completados con estos filtros.</div>';
}

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

function tvEmbudo(d) {
  const r = d.resumen || {}, a = r.anterior || {}, p = tvPct(r.con_venta, r.profesionales), pa = tvPct(a.con_venta, a.profesionales);
  const fil = [[`${TT('visita', 'p', '', 'l', 'C')} hechas`, r.visitas, r.visitas ? 1 : 0, ''], [TT('medico', 'p', '', 'l', 'C', 'visitado'), r.profesionales, r.visitas ? r.profesionales / r.visitas : 0, ''],
    ['Con pedido en ' + d.dias + ' días', r.con_venta, r.visitas ? r.con_venta / r.visitas : 0, 'c']];
  const dif = a.profesionales ? p - pa : null;
  return `<div class="tvgrid"><div class="tvizq"><div class="tvbig">${num(p)}<small> %</small></div>
      <div class="tvlbl">${TT('medico', 'p', 'del', 'l', 'l', 'visitado')} tienen un pedido en ${d.dias} días</div>
      <div class="tvrow"><div class="tvmini"><b>${num(r.unidades || 0)}</b><span class="tvlbl">unidades</span></div>
        <div class="tvmini"><b>${r.dias_media != null ? num(r.dias_media) + ' días' : '—'}</b><span class="tvlbl">hasta el primer pedido</span></div></div></div>
    <div class="tvfun">${fil.map(([t, n, f, c]) => `<div class="tvst"><span>${esc(t)}</span>
      <svg class="tvbar" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true"><rect class="tvbg" width="100" height="10" rx="3"/><rect class="tvfg ${c}" width="${Math.max(f * 100, n ? 3 : 0).toFixed(1)}" height="10" rx="3"/></svg>
      <b>${num(n || 0)}</b></div>`).join('')}
      ${dif != null ? `<div class="tvlbl"><span class="${dif >= 0 ? 'tvok' : 'tvmal'}">${dif >= 0 ? '▲ +' : '▼ '}${num(dif)} puntos</span> frente al periodo anterior</div>` : ''}</div></div>`;
}

function tvEfecto(d) {
  const e = d.efecto || {}, nv = e.visitas || 0, dd = d.dias || 30;
  if (!nv) return `<div class="vacio">Sin ${TT('visita', 'p', '', 'l', 'l')} en este periodo.</div>`;
  const raw = (e.dias || []).map(x => ({ k: x.k, v: (+x.u || 0) / nv }));
  const suav = raw.map((x, i) => { const w = raw.slice(Math.max(0, i - 3), i + 4).filter(y => (y.k < 0) === (x.k < 0)); return { k: x.k, v: w.reduce((s, y) => s + y.v, 0) / w.length }; });
  const ant = raw.filter(x => x.k < 0), des = raw.filter(x => x.k >= 0);
  const ma = ant.reduce((s, x) => s + x.v, 0) / (ant.length || 1), md = des.reduce((s, x) => s + x.v, 0) / (des.length || 1);
  const pico = suav.filter(x => x.k >= 0).reduce((m, x) => x.v > m.v ? x : m, { k: 0, v: -1 });
  const mov = ES_MOVIL(), W = mov ? 360 : 640, H = mov ? 170 : 200, P = 22, mx = Math.max(...suav.map(x => x.v), 0.001) * 1.2;
  const x = k => P + (k + dd) / (2 * dd) * (W - 2 * P), y = v => H - 24 - v / mx * (H - 52);
  const lin = suav.map((s, i) => (i ? 'L' : 'M') + x(s.k).toFixed(1) + ' ' + y(s.v).toFixed(1)).join(' ');
  const area = (f, k0, k1) => suav.filter(f).map((s, i) => (i ? 'L' : 'M') + x(s.k).toFixed(1) + ' ' + y(s.v).toFixed(1)).join(' ') + ` L${x(k1)} ${H - 24} L${x(k0)} ${H - 24} Z`;
  const fmt = v => v.toLocaleString('es-ES', { maximumFractionDigits: v < 10 ? 2 : 1 });
  const big = ma > 0 ? `${md >= ma ? '+' : ''}${num(Math.round((md / ma - 1) * 100))}<small> %</small>` : (md > 0 ? '—' : '0');
  return `<div class="tvgrid tvgb"><div class="tvizq"><div class="tvbig">${big}</div>
      <div class="tvlbl">${ma > 0 ? `${md >= ma ? 'más' : 'menos'} unidades en los ${dd} días siguientes ${TT('visita', 's', 'al', 'l', 'l')}` : md > 0 ? `antes ${TT('visita', 's', 'del', 'l', 'l')} no había pedidos` : 'sin pedidos en esas fechas'}</div>
      <div class="tvrow"><div class="tvmini"><b>${fmt(ma)}</b><span class="tvlbl">uds./día antes</span></div><div class="tvmini"><b>${fmt(md)}</b><span class="tvlbl">uds./día después</span></div></div></div>
    <div><svg class="tvsvg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Unidades por día antes y después">
      <defs><linearGradient id="tvgrad" x1="0" x2="0" y1="0" y2="1"><stop offset="0" class="tvs1"/><stop offset="1" class="tvs2"/></linearGradient></defs>
      <path d="${area(s => s.k <= 0, -dd, 0)}" class="tvantes"/><path d="${area(s => s.k >= 0, 0, dd)}" fill="url(#tvgrad)"/>
      <path d="${lin}" class="tvlin"/>
      <line x1="${x(0)}" x2="${x(0)}" y1="14" y2="${H - 24}" class="tvhoy"/>
      <text x="${x(0) + 6}" y="20" class="tvtxt tvtxthoy">Día ${TT('visita', 's', 'del', 'l', 'l')}</text>
      ${pico.k > 0 && pico.v > 0 ? `<text x="${Math.min(x(pico.k), W - 60)}" y="${Math.max(y(pico.v) - 8, 34)}" class="tvtxt tvtxtpico" text-anchor="middle">pico al ${pico.k}.º día</text>` : ''}
      ${[-dd, -dd / 2, 0, dd / 2, dd].map(k => `<text x="${x(k)}" y="${H - 6}" class="tvtxt tvtxteje" text-anchor="middle">${k > 0 ? '+' : ''}${Math.round(k)} d</text>`).join('')}
    </svg><div class="tvley"><span><i class="tvl1"></i>Antes</span><span><i class="tvl2"></i>Después</span></div></div></div>`;
}

function tvMeses(d) {
  const ms = d.meses || [], mov = ES_MOVIL();
  if (!ms.some(m => m.visitas)) return `<div class="vacio">Sin ${TT('visita', 'p', '', 'l', 'l')} en los últimos meses.</div>`;
  const W = mov ? 360 : 680, H = mov ? 190 : 210, PL = 14, PR = 14, mxv = Math.max(...ms.map(m => m.visitas), 1) * 1.15;
  const bw = (W - PL - PR) / ms.length, yv = v => H - 26 - v / mxv * (H - 54), yp = p => H - 26 - p / 100 * (H - 54);
  const nom = m => new Date(m + 'T12:00:00').toLocaleDateString('es-ES', { month: 'short' }).replace('.', '');
  const pts = ms.map((m, i) => [PL + bw * i + bw / 2, yp(tvPct(m.con_venta, m.visitas)), tvPct(m.con_venta, m.visitas), m.visitas]);
  const ult = ms[ms.length - 1], pen = ms[ms.length - 2];
  const pu = tvPct(ult.con_venta, ult.visitas), pp = pen ? tvPct(pen.con_venta, pen.visitas) : null;
  return `<div class="tvrow tvrowc"><div class="tvmini"><b>${num(pu)} %</b><span class="tvlbl">${esc(nom(ult.mes))}, acaban en pedido</span></div>
      ${pp != null && pen.visitas ? `<div class="tvmini"><b class="${pu >= pp ? 'tvok' : 'tvmal'}">${pu >= pp ? '+' : ''}${num(pu - pp)} pts</b><span class="tvlbl">frente a ${esc(nom(pen.mes))}</span></div>` : ''}</div>
    <svg class="tvsvg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Por mes, con pedido y sin él">
    ${ms.map((m, i) => { const x0 = PL + bw * i + bw * 0.2, w = bw * 0.6; return `<rect x="${x0}" y="${yv(m.visitas)}" width="${w}" height="${H - 26 - yv(m.visitas)}" rx="6" class="tvbv"/>
      <rect x="${x0}" y="${yv(m.con_venta)}" width="${w}" height="${H - 26 - yv(m.con_venta)}" rx="6" class="tvbc"/>
      <text x="${x0 + w / 2}" y="${H - 8}" class="tvtxt tvtxteje" text-anchor="middle">${esc(nom(m.mes))}</text>`; }).join('')}
    <path d="${pts.filter(p => p[3]).map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ')}" class="tvlinp"/>
    ${pts.filter(p => p[3]).map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="4.5" class="tvpt"/><text x="${p[0]}" y="${p[1] - 10}" class="tvtxt tvtxtpct" text-anchor="middle">${p[2]}%</text>`).join('')}
    </svg><div class="tvley"><span><i class="tvl3"></i>${TT('visita', 'p', '', 'l', 'C')}</span><span><i class="tvl4"></i>Con pedido en ${d.dias} días</span><span><i class="tvl5"></i>% que acaba en pedido</span></div>`;
}

function tvPintar() {
  const c = $('tvcuerpo'); if (!c || !TV_DATOS) return;
  c.innerHTML = [tvEmbudo, tvEfecto, tvMeses, tvTipos][TV_I](TV_DATOS);
  $('tvsub').textContent = tvSub();
  $('tvpos').textContent = `${TV_I + 1} de ${TV_VISTAS.length} · ${TV_VISTAS[TV_I][1]}`;
}

function tvTarjeta(d) {
  const caja = $('anareas'); if (!caja) return;
  const vieja = $('tvvis'); if (vieja) vieja.remove();
  TV_DATOS = d; if (!d || !d.resumen) return;
  caja.insertAdjacentHTML('afterbegin', `<section class="card tvcard" id="tvvis"><div class="tvcab">
      <div class="tvtit"><h2>Pedidos tras ${TT('visita', 's', 'el', 'l', 'l')} <button type="button" class="ai" data-ayuda-tit="Pedidos tras ${TT('visita', 's', 'el', 'l', 'l')}" data-ayuda-txt="${esc(`${TT('visita', 's', 'un', 'C', 'l')} a ${TT('medico', 's', 'un', 'l', 'l')} cuenta como con pedido si hay un pedido confirmado atribuido ${TT('medico', 's', 'al', 'l', 'l')} el mismo día o en los ${d.dias} días siguientes. No cuentan las entregas sin cargo. ${TT('visita', 'p', 'el', 'C', 'l')} de los últimos ${d.dias} días todavía pueden sumar pedidos. Por tipo: captación es la primera ${TT('visita', 's', '', 'l', 'l')} que se registra a ${TT('medico', 's', 'un', 'l', 'l')}; presentación, la que lleva la ficha a un estado de avance o interés o presenta un producto que no se le había presentado; seguimiento, las demás.`)}" aria-label="Qué es">i</button></h2>
        <div class="sm" id="tvsub"></div></div>
      <div class="tvnav"><button type="button" class="btn sec chico" data-tvn="-1" aria-label="Vista anterior">‹</button><span class="sm" id="tvpos"></span><button type="button" class="btn sec chico" data-tvn="1" aria-label="Vista siguiente">›</button></div>
    </div><div id="tvcuerpo"></div></section>`);
  tvPintar();
}

function tvTipos(d) {
  const ts = d.tipos || [], eq = d.equipo || [];
  if (!ts.some(t => t.visitas)) return `<div class="vacio">Sin ${TT('visita', 'p', '', 'l', 'l')} en este periodo.</div>`;
  const tot = ts.reduce((a, t) => a + (+t.con_pedido || 0), 0);
  const nuevas = ts.filter(t => t.tipo !== 'seguimiento').reduce((a, t) => a + (+t.con_pedido || 0), 0);
  const nom = k => (TV_TIPOS.find(x => x[0] === k) || [k, k])[1];
  const par = o => o && o.visitas ? `${num(o.con_pedido)} de ${num(o.visitas)}` : '—';
  return `<div class="tvgrid"><div class="tvizq"><div class="tvbig">${num(tvPct(nuevas, tot))}<small> %</small></div>
      <div class="tvlbl">de ${TT('visita', 'p', 'el', 'l', 'l')} con pedido son de captación o de presentación</div>
      <div class="tvrow"><div class="tvmini"><b>${num(nuevas)}</b><span class="tvlbl">de captación o presentación</span></div>
        <div class="tvmini"><b>${num(tot - nuevas)}</b><span class="tvlbl">de seguimiento</span></div></div></div>
    <div class="tvfun">${ts.map(t => `<div class="tvst"><span>${esc(nom(t.tipo))} · ${num(t.con_pedido)} de ${num(t.visitas)}</span>
      <svg class="tvbar" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true"><rect class="tvbg" width="100" height="10" rx="3"/><rect class="tvfg${t.tipo === 'seguimiento' ? '' : ' c'}" width="${Math.max(tvPct(t.con_pedido, t.visitas), t.con_pedido ? 3 : 0)}" height="10" rx="3"/></svg>
      <b>${num(tvPct(t.con_pedido, t.visitas))} %</b></div>`).join('')}
      <div class="tvlbl">${ts.map(t => `${esc(nom(t.tipo))}: ${num(t.unidades || 0)} uds.`).join(' · ')}</div></div></div>
    ${eq.length ? `<div class="tveq"><table class="trtabla"><thead><tr><th>Persona</th>${TV_TIPOS.map(x => `<th>${x[1]}</th>`).join('')}</tr></thead>
      <tbody>${eq.map(u => `<tr><td>${esc(u.nombre)}</td>${TV_TIPOS.map(x => `<td>${par(u[x[0]])}</td>`).join('')}</tr>`).join('')}</tbody></table>
      <div class="tvlbl">Con pedido de cada tipo, de las ${TT('visita', 'p', '', 'l', 'l')} que registró cada persona</div></div>` : ''}`;
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
const TV_VISTAS = [['embudo', 'Embudo'], ['efecto', 'El efecto'], ['meses', 'Mes a mes'], ['tipos', 'Por tipo']];

const tvPct = (a, b) => b ? Math.round(a / b * 100) : 0;

const tvSub = () => {
  const d = TV_DATOS || {};
  return [`${TT('visita', 'p', '', 'l', 'C')} del ${fechaCorta(d.desde)} al ${fechaCorta(d.hasta)} y pedidos atribuidos ${TT('medico', 's', 'al', 'l', 'l')} en los ${d.dias || 30} días siguientes`,
    `Unidades pedidas por ${TT('visita', 's', '', 'l', 'l')}, de media, en los ${d.dias || 30} días antes y después de ella`,
    `Por mes: ${TT('visita', 'p', '', 'l', 'l')} hechas y cuántas tienen un pedido atribuido ${TT('medico', 's', 'al', 'l', 'l')} en los ${d.dias || 30} días siguientes`,
    `${TT('visita', 'p', 'el', 'C', 'l')} de captación, de presentación y de seguimiento, y cuántas tienen un pedido en los ${d.dias || 30} días siguientes`][TV_I];
};

/* ============================================================
   v2.326.0 · Pedidos tras la visita, por tipo (petición de Eric, 16/10/2026; SQL 168). La tarjeta de Analítica se llama ya
   «Pedidos tras la visita» y no habla de ventas (regla de Eric: nunca «venta» al hablar de pedidos y profesionales). Cuarta
   vista «Por tipo»: visitas de captación (la primera a cada profesional), de presentación (resultado que avanza la ficha o un
   producto nuevo presentado) y de seguimiento, cuántas acaban en pedido, y lo mismo por persona del equipo.
   ============================================================ */
const TV_TIPOS = [['captacion', 'Captación'], ['presentacion', 'Presentación'], ['seguimiento', 'Seguimiento']];

async function pintarTablaAnaliticaBase() {
  const caja = $('atabla2');
  cargando(caja, 'Calculando la tabla…');
  const { data, error } = await db.rpc('analitica_tabla', {
    p_dim: $('adim').value === 'mes' ? 'producto' : $('adim').value,
    p_desde: $('adesde').value || null, p_hasta: $('ahasta').value || null,
    p_canal: $('acanal').value || null, p_medida: $('amedida') ? $('amedida').value : 'unidades', lim: 30
  });
  if (error) { caja.innerHTML = `<div class="vacio">${esc(error.message)}</div>`; return; }
  const meses = data.meses || [], filas = data.filas || [];
  if (!filas.length) { caja.innerHTML = '<div class="vacio">Sin datos en este periodo.</div>'; return; }
  const fmt = v => data.medida === 'importe' ? eur(v) : num(v);
  const totMes = {};
  filas.forEach(f => meses.forEach(m => totMes[m] = (totMes[m] || 0) + (+(f.meses || {})[m] || 0)));

  caja.innerHTML = `<div class="tabla"><div style="min-width:${180 + meses.length * 110}px">
    <div class="thead"><span class="tcell th" style="width:220px;min-width:220px">Concepto</span>
      ${meses.map(m => `<span class="tcell th" style="width:110px;min-width:110px;text-align:right">${esc(m.slice(5))}/${esc(m.slice(2, 4))}</span>`).join('')}
      <span class="tcell th" style="width:120px;min-width:120px;text-align:right">Total</span></div>
    ${filas.map(f => `<div class="trow" style="cursor:default">
      <span class="tcell" style="width:220px;min-width:220px"><b>${esc(f.nombre)}</b></span>
      ${meses.map(m => `<span class="tcell" style="width:110px;min-width:110px;text-align:right">${
        (f.meses || {})[m] ? fmt((f.meses || {})[m]) : '<span class="sm">·</span>'}</span>`).join('')}
      <span class="tcell" style="width:120px;min-width:120px;text-align:right"><b>${fmt(f.total)}</b></span></div>`).join('')}
    <div class="trow" data-fijo style="cursor:default;background:var(--bg)">
      <span class="tcell" style="width:220px;min-width:220px"><b>Total</b></span>
      ${meses.map(m => `<span class="tcell" style="width:110px;min-width:110px;text-align:right"><b>${fmt(totMes[m] || 0)}</b></span>`).join('')}
      <span class="tcell" style="width:120px;min-width:120px;text-align:right"><b>${fmt(filas.reduce((n, f) => n + (+f.total || 0), 0))}</b></span></div>
  </div></div>`;

  window.__ANTABLA = filas.map(f => {
    const o = { concepto: f.nombre };
    meses.forEach(m => o[m] = (f.meses || {})[m] || 0);
    o.total = f.total;
    return o;
  });
}

function refrescarAnaliticaBase() {
  pintarAnalitica();
  if (!$('atabla2').classList.contains('hide')) pintarTablaAnalitica();
}

async function pintarTablaAnalitica() {
  await pintarTablaAnaliticaBase();
  const caja = $('atabla2'); if (!caja || !caja.querySelector('.thead')) return;
  const dim = $('adim') ? $('adim').selectedOptions[0].textContent.toLowerCase() : 'concepto';
  const med = $('amedida') && $('amedida').value === 'importe' ? 'importe sin IVA' : 'unidades vendidas';
  caja.insertAdjacentHTML('afterbegin', `<div class="tabinfo"><b>Tabla mensual de ${esc(med)} por ${esc(dim.replace(/^por /, ''))}</b>
    <span>Cada fila es un ${esc(dim.replace(/^por /, ''))} y cada columna un mes del periodo elegido. La última columna suma la fila y la última fila suma cada mes. «·» = sin ventas ese mes. Cuanto más intenso el azul, más alto el valor.</span></div>`);
  caja.querySelectorAll('.thead .tcell.th').forEach(c => { const m = c.textContent.match(/^(\d{2})\/(\d{2})$/); if (m) c.textContent = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][+m[1] - 1] + ' ' + m[2]; });
  const filas = [...caja.querySelectorAll('.trow:not([data-fijo])')], vals = [];
  filas.forEach(f => [...f.children].slice(1, -1).forEach(c => vals.push(parseFloat(c.textContent.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '')) || 0)));
  const max = Math.max(1, ...vals);
  filas.forEach(f => [...f.children].slice(1, -1).forEach(c => {
    const v = parseFloat(c.textContent.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '')) || 0;
    if (v) c.style.background = `rgba(46,134,201,${(0.08 + v / max * 0.42).toFixed(2)})`;
  }));
}

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

function refrescarAnalitica(...a) {
  if (TAB !== 'analitica' || !$('atabla') || !$('atabla2')) return;
  return refrescarAnaliticaBase.apply(this, a);
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
