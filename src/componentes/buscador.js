// @ts-check
// componentes/buscador.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

/* ============================================================
   v2.94.0 · Buscador inteligente
   La base de datos busca palabra a palabra (sin acentos, en cualquier orden,
   por el principio de cada palabra y con una letra de margen) y ordena por
   relevancia. Aquí se resalta en los resultados la parte que coincide.
   ============================================================ */
function resaltarBusqueda(texto, q) {
  const s = String(texto == null ? '' : texto);
  // Las más largas primero: si «pe» y «pedro» coinciden, se marca «pedro»
  const tks = [...new Set(clasNorm(q).split(/[^\p{L}\p{N}]+/u).filter(Boolean))].sort((a, b) => b.length - a.length);
  if (!tks.length) return esc(s);
  let html = '', ult = 0;
  for (const m of s.matchAll(/[\p{L}\p{N}]+/gu)) {
    const w = clasNorm(m[0]);
    if (w.length !== m[0].length) continue;   // si al quitar acentos cambia el largo, no se marca (no se descuadra)
    let ini = -1, largo = 0;
    for (const tk of tks) {
      if (w.startsWith(tk)) { ini = 0; largo = tk.length; break; }
      if (ini < 0 && tk.length >= 3 && w.indexOf(tk) > 0) { ini = w.indexOf(tk); largo = tk.length; }
    }
    if (ini < 0) continue;
    const a = m.index + ini;
    html += esc(s.slice(ult, a)) + '<mark>' + esc(s.slice(a, a + largo)) + '</mark>';
    ult = a + largo;
  }
  return html + esc(s.slice(ult));
}

let BUSQ_N = 0;   // solo cuenta la última búsqueda: las anteriores se descartan aunque respondan después

// Solo los buscadores: los de tipo búsqueda y los campos con su lista de resultados justo debajo
const esBuscador = i => i && i.matches && i.matches('input') && !i.list && (i.type === 'search' || (!!i.nextElementSibling && i.nextElementSibling.matches('.gsug, .cpres, .lista, [role=listbox]')));

async function buscarBase(reiniciar) {
  if (typeof MODO_MAPA !== 'undefined' && MODO_MAPA && reiniciar) setTimeout(() => pintarMapa(), 10);
  if (reiniciar) F.pagina = 0;
  const yo = ++BUSQ_N;
  cargando($('lista'), 'Buscando ' + etiquetaContactos().toLowerCase() + '…');
  $('cuenta').textContent = 'Buscando…';
  const t0 = performance.now();
  const params = {
    q: F.q || null, f_provincia: F.prov || null, f_municipio: F.muni || null,
    f_estado: F.est || null, f_especialidad: F.esp || null, f_area: null,
    f_urgentes: F.urg, f_mios: !!F.mios, f_sin_visitar: !!F.sin, f_comercial: F.com || null, f_reporting: F.rep || null,
    ...(F.tipo ? { f_tipo: F.tipo } : {}),
    orden: F.orden, lim: tamPagina(), desplaz: F.pagina * tamPagina(),
    ...(Object.keys(F.campos || {}).length ? { f_campos: F.campos } : {})
  };
  let { data, error } = await db.rpc('buscar_cuentas', params);
  if (yo !== BUSQ_N) return;   // ya hay una búsqueda más reciente
  // Si falla (móvil que vuelve del segundo plano, cobertura), se reintenta una vez al momento antes de avisar
  if (error || !data) {
    ({ data, error } = await db.rpc('buscar_cuentas', params));
    if (yo !== BUSQ_N) return;
  }

  if (error || !data) {
    $('cuenta').textContent = '';
    $('lista').innerHTML = `<div class="vacio">No se ha podido cargar la lista${error && /abort/i.test(error.message || '') ? ' (la conexión no responde)' : ''}.<br><button class="btn sec" type="button" id="dirreint" style="margin-top:10px">Reintentar</button></div>`;
    $('dirreint').onclick = () => buscar(true);
    return;
  }

  F.total = data.total;
  const ms = Math.round(performance.now() - t0);
  $('cuenta').innerHTML = `<b>${num(data.total)}</b> ${esc(etiquetaContactos().toLowerCase())} <span class="sm">· ${ms} ms</span>`;
  pintarChips();

  const filas = data.filas || [];
  if (!filas.length) { $('lista').innerHTML = `<div class="vacio">Ningún registro cumple estos filtros.</div>`; $('thead').innerHTML = ''; }
  else { cabeceraTabla(); $('lista').innerHTML = filas.map(filaTabla).join(''); }

  paginador($('dirpag'), data.total, F.pagina, p => {
    F.pagina = p; buscar(false);
    $('tabla').scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, () => buscar(true));
}
