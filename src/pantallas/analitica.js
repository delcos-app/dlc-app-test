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
