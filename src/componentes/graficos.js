// componentes/graficos.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

function svgBarras(meses, a, b, etiquetas) {
  // v2.108.0: con dos series ya no se mezclan dos escalas en un mismo eje: se dibujan dos gráficos pequeños,
  // uno encima del otro, con los mismos meses alineados (arriba barras, abajo línea), cada uno con su escala y su título.
  const caja = $('angraf'), W = Math.max(420, Math.min(1400, ((caja && caja.clientWidth) || 700) - 40)), P = 34, n = meses.length || 1;
  const salta = typeof ES_MOVIL === 'function' && ES_MOVIL() && n > 6, labOk = i => !salta || (n - 1 - i) % 2 === 0;   // v2.338.0: en el móvil, un mes sí y otro no (se pisaban)
  const x = i => P + (W - P * 2) * (i + .5) / n;
  const esEur = t => /importe|euros|€/i.test(t || '');
  const fmt = (v, t) => esEur(t) ? eurI(v) : num(v);
  const barras = (serie, etq, H, conMeses) => {
    const max = Math.max(1, ...serie), base = H - (conMeses ? 26 : 10), y = v => base - (base - 22) * v / max, bw = Math.max(6, (W - P * 2) / n * .62);
    return `<svg viewBox="0 0 ${W} ${H}" class="grafico" role="img" aria-label="${esc(etq)} por mes">
      <line x1="${P}" y1="${base}" x2="${W - P}" y2="${base}" class="eje"/>
      ${serie.map((v, i) => `<g><rect x="${x(i) - bw / 2}" y="${y(v)}" width="${bw}" height="${base - y(v)}" rx="4" class="barra1"><title>${mesTxt(meses[i])}: ${fmt(v, etq)} ${esEur(etq) ? '' : esc(etq.toLowerCase())}</title></rect>
        ${v ? `<text x="${x(i)}" y="${y(v) - 5}" class="val">${fmt(v, etq)}</text>` : ''}
        ${conMeses && labOk(i) ? `<text x="${x(i)}" y="${H - 8}" class="lab">${mesTxt(meses[i])}</text>` : ''}</g>`).join('')}
    </svg>`;
  };
  if (!b) return barras(a, etiquetas[0], 230, true);
  const linea = (serie, etq, H) => {
    const max = Math.max(1, ...serie), base = H - 26, y = v => base - (base - 22) * v / max;
    // Etiqueta solo en el máximo y en el último mes con dato
    const ultimo = serie.reduce((k, v, i) => v ? i : k, -1), imax = serie.indexOf(Math.max(...serie));
    return `<svg viewBox="0 0 ${W} ${H}" class="grafico" role="img" aria-label="${esc(etq)} por mes">
      <line x1="${P}" y1="${base}" x2="${W - P}" y2="${base}" class="eje"/>
      <polyline points="${serie.map((v, i) => `${x(i)},${y(v)}`).join(' ')}" class="linea2"/>
      ${serie.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="4" class="punto2"><title>${mesTxt(meses[i])}: ${fmt(v, etq)}</title></circle>
        ${v && (i === imax || i === ultimo) ? `<text x="${x(i)}" y="${y(v) - 9}" class="val">${fmt(v, etq)}</text>` : ''}
        ${labOk(i) ? `<text x="${x(i)}" y="${H - 8}" class="lab">${mesTxt(meses[i])}</text>` : ''}`).join('')}
    </svg>`;
  };
  return `<div class="grafdos">
    <div class="grafuno"><div class="graftit"><i class="c1"></i>${esc(etiquetas[0])}</div>${barras(a, etiquetas[0], 150, false)}</div>
    <div class="grafuno"><div class="graftit"><i class="c2"></i>${esc(etiquetas[1])}</div>${linea(b, etiquetas[1], 170)}</div>
  </div>`;
}

function barrasH(items, fmt) {
  const max = Math.max(1, ...items.map(x => x.v));
  return `<div class="barrash">${items.map((x, i) => `<div class="bh"><span class="bhn">${i + 1}. ${esc(x.n)}</span>
    <span class="bhb"><i style="width:${Math.max(2, x.v / max * 100)}%"></i></span><b>${fmt(x.v)}</b></div>`).join('')}</div>`;
}

function anLinea(vals, meses) {
  const mx = Math.max(...vals), mn = Math.min(...vals, 0), W = 200, H = 40, rg = (mx - mn) || 1;
  const pts = vals.map((x, i) => [i * W / 5, H - 4 - (H - 8) * (x - mn) / rg]);
  const dl = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  return `<svg class="avsp" viewBox="0 0 200 46" preserveAspectRatio="none" aria-hidden="true"><path class="a" d="${dl} L200 46 L0 46 Z"/><path class="l" pathLength="100" d="${dl}"/></svg>
    <span class="avpt" style="left:${(pts[5][0] / 2).toFixed(1)}%;top:${(pts[5][1] / 46 * 100).toFixed(1)}%"></span>
    <div class="avm">${meses.map(([a]) => `<span>${AN_MES[+a.slice(5, 7) - 1]}</span>`).join('')}</div>`;
}

/* v2.339.0 · «Reparto por producto» en barras (Eric: el anillo dejaba media tarjeta vacía): total arriba y, por producto, barra con
   unidades y porcentaje, hasta 10 (los demás juntos en «Otros»), con el mismo ritmo que la tarjeta de al lado. */
function barrasReparto(items) {
  const l = [...items].sort((a, b) => b.v - a.v), tot = l.reduce((n, x) => n + x.v, 0) || 1;
  const vis = l.length > 10 ? [...l.slice(0, 9), { n: 'Otros (' + (l.length - 9) + ')', v: l.slice(9).reduce((n, x) => n + x.v, 0) }] : l;
  const pc = v => { const p = v / tot * 100; return (p > 0 && p < 1 ? '<1' : Math.round(p)) + ' %'; };
  return `<div class="reptot"><b>${num(tot)}</b> unidades · ${num(l.length)} ${l.length === 1 ? 'producto' : 'productos'}</div>
    <div class="barrash reparto">${vis.map(x => `<div class="bh"><span class="bhn" title="${esc(x.n)}">${esc(x.n)}</span>
      <svg class="bhsvg" viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden="true"><rect class="f" width="100" height="12" rx="6"/><rect class="v" width="${Math.max(2, x.v / tot * 100).toFixed(1)}" height="12" rx="6"/></svg><b>${num(x.v)}</b><span class="sm bhp">${pc(x.v)}</span></div>`).join('')}</div>`;
}

function sparkUnidades(u, k) {
  const s = k === 'semana' ? (u.semanas || []).map(x => [x.unidades, 'Semana del ' + fechaCorta(x.semana), fechaCorta(x.semana)])
    : k === 'anio' ? (u.anios || []).map(x => [x.unidades, x.anio, x.anio])
    : (u.meses || []).map(x => [x.unidades, periodoTxt(x.mes), periodoTxt(x.mes)]);
  const max = Math.max(1, ...s.map(x => x[0]));
  // v2.118.0: barra vacía como línea de base, la del periodo actual resaltada y las fechas de los extremos debajo
  // (las fechas van como atributo de la primera y la última barra: el gráfico solo tiene barras)
  return s.map(([n, t, c], i) => `<i class="${n ? '' : 'cero'}${i === s.length - 1 ? ' actual' : ''}" style="height:${Math.round(n / max * 100)}%" title="${esc(t)}: ${num(n)}"${i === 0 ? ` data-ini="${esc(c)}"` : ''}${i === s.length - 1 ? ` data-fin="${esc(c)}"` : ''}></i>`).join('');
}

function svgDonut(items) {
  const tot = items.reduce((n, x) => n + x.v, 0) || 1, R = 70, C = 2 * Math.PI * R;
  // v2.107.0: paleta de gráficos de la marca (validada para daltonismo); el gris, para el resto
  const col = ['#3F82C0', '#E0762B', '#1BAF7A', '#6E5BC4', '#E0A400', '#D9618C', '#94A3B8'];
  let acc = 0;
  return `<div class="donutw"><svg viewBox="0 0 200 200" class="donut" role="img" aria-label="Reparto por producto">
    <circle cx="100" cy="100" r="${R}" class="fondo"/>
    ${items.map((x, i) => { const l = C * x.v / tot, s = `<circle cx="100" cy="100" r="${R}" stroke="${col[i % col.length]}" stroke-dasharray="${l} ${C - l}" stroke-dashoffset="${-acc}" class="arco"><title>${esc(x.n)}: ${num(x.v)} (${Math.round(x.v / tot * 100)}%)</title></circle>`; acc += l; return s; }).join('')}
    <text x="100" y="96" class="dn1">${num(tot)}</text><text x="100" y="116" class="dn2">unidades</text></svg>
    <div class="donutley">${items.map((x, i) => `<span><i style="background:${col[i % col.length]}"></i>${esc(x.n)} <b>${Math.round(x.v / tot * 100)}%</b></span>`).join('')}</div></div>`;
}

async function graficoCanal() {
  const emb = [...document.querySelectorAll('#v-analitica .ancard')].find(c => /Embudo comercial/.test(c.querySelector('h2') ? c.querySelector('h2').textContent : ''));
  if (!emb || $('ancanal')) return;
  emb.insertAdjacentHTML('afterend', `<div class="card ancard" id="ancanal"><h2>Ventas por canal</h2><div class="cargandolocal" style="min-height:160px"></div>
    <p class="leer"><b>Cómo leerlo:</b> qué parte de las unidades llega con ${TT('medico', 's', 'un', 'l', 'l')} de referencia y qué parte por venta directa a un centro.</p></div>`);
  const { data } = await RPC_ORIG('analitica_tabla', { p_dim: 'canal', p_medida: 'unidades' });
  const filas = (data && data.filas) || [], tot = filas.reduce((s, f) => s + (+f.total || 0), 0);
  const cols = ['#3F82C0', '#E0762B', '#1BAF7A', '#6E5BC4'];   // v2.107.0: paleta de gráficos de la marca
  let ang = 0;
  const arcos = filas.map((f, i) => { const v = (+f.total || 0) / (tot || 1), a0 = ang, a1 = ang + v * 2 * Math.PI; ang = a1;
    const p = t => [80 + 60 * Math.sin(t), 80 - 60 * Math.cos(t)], [x0, y0] = p(a0), [x1, y1] = p(a1 - 0.0001);
    return `<path d="M80 80 L${x0} ${y0} A60 60 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1} ${y1} Z" fill="${cols[i % 4]}"/>`; }).join('');
  $('ancanal').querySelector('.cargandolocal').outerHTML = tot ? `<div class="donut"><svg viewBox="0 0 160 160" width="160" height="160">${arcos}<circle cx="80" cy="80" r="36" fill="#fff"/><text x="80" y="86" text-anchor="middle" font-size="18" font-weight="700" fill="#0B3A66">${num(tot)}</text></svg>
      <div class="donutley">${filas.map((f, i) => `<div><i style="background:${cols[i % 4]}"></i><span>${esc(f.nombre)}</span><b>${num(f.total)}</b><span class="sm">${Math.round((+f.total || 0) / tot * 100)}%</span></div>`).join('')}</div></div>`
    : vacioGrafico('Verás qué parte de las ventas llega por cada canal.');
}

const KPI_DEF = ['citas', 'urgentes', 'visitas_sem', 'visitas_mes', 'interesados', 'sin_contactar', 'cartera', 'dups'];

const kpiConfig = () => {
  const p = (PERFIL.preferencias || {}).kpis;
  if (Array.isArray(p) && p.length) return p;
  return KPI_CAT.map(k => ({ id: k.id, on: KPI_DEF.includes(k.id), t: '' }));
};

const vacioGrafico = t => `<div class="gvacio"><span>📊</span><b>Aún no hay datos para este gráfico</b><span class="sm">${esc(t)}</span></div>`;

const KPI_CATEGORIA = {
  citas: 'Agenda', citas_7d: 'Agenda', urgentes: 'Cartera', interesados: 'Cartera', sin_contactar: 'Cartera', cartera: 'Cartera',
  sin_visita_60: 'Cartera', sin_horario: 'Calidad del dato', dups: 'Calidad del dato', visitas_sem: 'Actividad', visitas_mes: 'Actividad',
  visitas_7d: 'Actividad', muestras_mes: 'Actividad', material_mes: 'Actividad', uds_mes: 'Ventas (unidades)', prescriptores: 'Ventas (unidades)',
  nuevos_presc: 'Ventas (unidades)', activos_90: 'Ventas (unidades)', conversion: 'Cartera', importe_mes: 'Ventas (importes)', borradores: 'Pedidos'
};

const KPI_PERMISO = { importe_mes: ['E', 1], borradores: ['V', 1], dups: ['Q', 1], sin_horario: ['M', 1] };

/* v2.87.0 · Cada indicador pertenece a un módulo: solo lo ve quien tiene acceso a ese módulo */
const KPI_MOD = {
  citas: 'agenda', visitas_sem: 'agenda', visitas_mes: 'agenda', visitas_7d: 'agenda', citas_7d: 'agenda', muestras_mes: 'agenda', material_mes: 'agenda',
  urgentes: 'directorio', interesados: 'directorio', sin_contactar: 'directorio', cartera: 'directorio', dups: 'directorio', sin_visita_60: 'directorio', sin_horario: 'directorio',
  uds_mes: 'ventas', importe_mes: 'ventas', prescriptores: 'ventas', nuevos_presc: 'ventas', activos_90: 'ventas', borradores: 'ventas',
  conversion: 'analitica'
};

// Indicadores con icono, explicación breve y, cuando se puede, comparación
const KPI_ICO = { citas: '📅', urgentes: '⚠️', visitas_sem: '📝', visitas_mes: '🗓️', interesados: '✨', sin_contactar: '📇', cartera: '🩺', dups: '🧩',
  sin_visita_60: '⏳', sin_horario: '🕘', uds_mes: '📦', prescriptores: '👥', nuevos_presc: '🌱', activos_90: '🔁', conversion: '📈',
  importe_mes: '€', borradores: '✏️', muestras_mes: '🎁', material_mes: '📚', citas_7d: '📆', visitas_7d: '🧭' };
