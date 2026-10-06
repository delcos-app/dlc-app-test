/* Manual de delcos: carga los capítulos, pone las palabras de la empresa (médico, visita, paciente…), monta el índice y el buscador,
   reproduce los vídeos al llegar a ellos y amplía las fotos. Lo abre la app desde «Manual de uso» y desde el «?» de cada pantalla. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const CAPS = (window.MANUAL && window.MANUAL.capitulos) || [];
  const HTML = {};   // id del capítulo → HTML ya con el vocabulario

  // ---------- Vocabulario de la empresa (lo deja la app en el navegador al abrir el manual) ----------
  const BASE = { medico: { s: 'médico', p: 'médicos', g: 'm' }, visita: { s: 'visita', p: 'visitas', g: 'f' }, paciente: { s: 'paciente', p: 'pacientes', g: 'm' } };
  let TER = BASE, EMPRESA = '';
  try {
    const d = JSON.parse(localStorage.getItem('delcos-manual') || '{}');
    TER = Object.assign({}, BASE, d.terminos || {}); EMPRESA = d.empresa || '';
    Object.keys(BASE).forEach(k => { TER[k] = Object.assign({}, BASE[k], TER[k] || {}); });
  } catch (e) { TER = BASE; }
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  // {medico} {medicos} {Medico} {un medico} {al medico} {el medico} {los medicos}… y lo mismo con visita y paciente
  const vocab = html => html.replace(/\{(un |una |el |la |al |a la |los |las |del |de la )?([MmVvPp])(edico|isita|aciente)(s?)\}/g, (m, art, ini, resto, pl) => {
    const clave = (ini.toLowerCase() + resto), t = TER[clave] || BASE[clave]; if (!t) return m;
    let w = pl ? t.p : t.s; const f = t.g === 'f';
    let a = '';
    if (art) {
      const x = art.trim();
      a = ({ un: f ? 'una ' : 'un ', una: f ? 'una ' : 'un ', el: f ? 'la ' : 'el ', la: f ? 'la ' : 'el ', al: f ? 'a la ' : 'al ', 'a la': f ? 'a la ' : 'al ',
             los: f ? 'las ' : 'los ', las: f ? 'las ' : 'los ', del: f ? 'de la ' : 'del ', 'de la': f ? 'de la ' : 'del ' })[x] || art;
    }
    const txt = a + w;
    return ini === ini.toUpperCase() ? cap(txt) : txt;
  });

  // ---------- Carga ----------
  async function cargar() {
    await Promise.all(CAPS.filter(c => c.archivo).map(async c => {
      try { const r = await fetch(c.archivo + '?v=' + (window.MANUAL.version || 1)); HTML[c.id] = vocab(await r.text()); } catch (e) { HTML[c.id] = '<p>No se ha podido cargar este capítulo. Revisa la conexión.</p>'; }
    }));
    indiceBusqueda(); ir(location.hash.slice(1));
  }

  // ---------- Portada ----------
  function portada() {
    const listos = CAPS.filter(c => c.archivo), pronto = CAPS.filter(c => !c.archivo);
    return `<div class="portada"><span class="eti">Manual de uso${EMPRESA ? ' · ' + esc(EMPRESA) : ''}</span>
      <h1>Todo lo que puedes hacer con delcos, paso a paso</h1>
      <p class="entrada">Cada pantalla explicada: qué ves, para qué sirve y cómo se usa, con fotos y vídeos de la app de verdad. Usa el buscador de arriba o elige un capítulo.</p>
      <div class="mapa">${listos.map(c => `<a href="#${c.id}"><b>${esc(c.t)}</b><span>${esc(c.d)}</span></a>`).join('')}</div>
      ${pronto.length ? `<h2 style="border:0;margin-top:30px">En preparación</h2><p>Estos capítulos llegan en las próximas versiones del manual:</p>
        <ul>${pronto.map(c => `<li><b>${esc(c.t)}</b>: ${esc(c.d)}</li>`).join('')}</ul>` : ''}
      <div class="nota"><p>Las palabras del manual son las de tu empresa: si en tu empresa se habla de «${esc(TER.medico.p)}» y de «${esc(TER.visita.p)}», aquí también. Las fotos y los vídeos son de una empresa de demostración con datos inventados.</p></div></div>`;
  }

  // ---------- Navegación ----------
  let ACTUAL = null;
  function ir(ancla) {
    ancla = decodeURIComponent(ancla || '');
    let c = CAPS.find(x => x.id === ancla && x.archivo);
    if (!c && ancla) c = CAPS.find(x => x.archivo && HTML[x.id] && HTML[x.id].includes(`id="${ancla}"`));
    const main = $('lectura');
    if (!c) { if (ACTUAL !== 'portada') { main.innerHTML = portada(); ACTUAL = 'portada'; pintarIndice(null); } window.scrollTo(0, 0); return; }
    if (ACTUAL !== c.id) {
      const i = CAPS.filter(x => x.archivo).indexOf(c), lis = CAPS.filter(x => x.archivo), ant = lis[i - 1], sig = lis[i + 1];
      main.innerHTML = `<article class="cap" id="cap-${c.id}">${HTML[c.id]}
        <div class="siguiente">${ant ? `<a href="#${ant.id}"><span>Anterior</span>${esc(ant.t)}</a>` : '<span></span>'}${sig ? `<a href="#${sig.id}"><span>Siguiente</span>${esc(sig.t)}</a>` : '<a href="#portada"><span>Volver</span>Índice del manual</a>'}</div></article>`;
      ACTUAL = c.id; pintarIndice(c); medios();
    }
    const destino = ancla && ancla !== c.id ? document.getElementById(ancla) : null;
    if (destino) destino.scrollIntoView(); else window.scrollTo(0, 0);
    marcar(ancla || c.id);
  }
  window.addEventListener('hashchange', () => { ir(location.hash.slice(1)); cerrarIndice(); });

  // ---------- Índice ----------
  function pintarIndice(c) {
    const n = $('indice');
    let h = '<h2>Capítulos</h2><a href="#portada">Portada</a>';
    CAPS.forEach(x => {
      if (!x.archivo) { h += `<span class="pronto">${esc(x.t)}<small>pronto</small></span>`; return; }
      h += `<a href="#${x.id}" data-a="${x.id}">${esc(x.t)}</a>`;
      if (c && x.id === c.id) document.querySelectorAll('#lectura h2[id], #lectura h3[id]').forEach(e => {
        h += `<a class="${e.tagName === 'H3' ? 'sub' : 'sec'}" href="#${e.id}" data-a="${e.id}">${esc(e.textContent)}</a>`; });
    });
    n.innerHTML = h;
    if ('IntersectionObserver' in window && c) {
      if (window.__obsI) window.__obsI.disconnect();
      window.__obsI = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) marcar(e.target.id); }), { rootMargin: '-15% 0px -75% 0px' });
      document.querySelectorAll('#lectura h2[id], #lectura h3[id]').forEach(e => window.__obsI.observe(e));
    }
  }
  function marcar(id) { document.querySelectorAll('#indice a[data-a]').forEach(a => a.classList.toggle('on', a.dataset.a === id)); }
  const cerrarIndice = () => { $('indice').classList.remove('abierto'); $('abrirIndice').setAttribute('aria-expanded', 'false'); };
  $('abrirIndice').onclick = () => { const a = $('indice').classList.toggle('abierto'); $('abrirIndice').setAttribute('aria-expanded', String(a)); };
  $('indice').addEventListener('click', e => { if (e.target.closest('a')) cerrarIndice(); });

  // ---------- Fotos y vídeos ----------
  const QUIETO = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function medios() {
    document.querySelectorAll('#lectura figure img').forEach(img => img.onclick = () => {
      $('visorImg').src = img.src; $('visorImg').alt = img.alt; $('visorPie').textContent = (img.closest('figure').querySelector('figcaption') || {}).textContent || ''; $('visor').hidden = false; $('cerrarVisor').focus(); });
    const vs = document.querySelectorAll('#lectura figure video');
    vs.forEach(v => { v.muted = true; v.playsInline = true; v.loop = true; v.preload = 'metadata'; if (QUIETO) v.controls = true;
      if (!v.parentElement.querySelector('.play')) v.insertAdjacentHTML('afterend', '<span class="play" aria-hidden="true">Vídeo</span>'); });
    if (QUIETO || !('IntersectionObserver' in window)) { vs.forEach(v => v.controls = true); return; }
    if (window.__obsV) window.__obsV.disconnect();
    window.__obsV = new IntersectionObserver(es => es.forEach(e => { const v = e.target; if (e.isIntersecting) { const p = v.play(); if (p && p.catch) p.catch(() => { v.controls = true; }); } else v.pause(); }), { threshold: .45 });
    vs.forEach(v => { window.__obsV.observe(v); v.onclick = () => { v.controls = true; }; });
  }
  const cerrarVisor = () => { $('visor').hidden = true; };
  $('cerrarVisor').onclick = cerrarVisor; $('visor').onclick = e => { if (e.target === $('visor')) cerrarVisor(); };
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { cerrarVisor(); cerrarIndice(); $('resultados').hidden = true; } });

  // ---------- Buscador ----------
  let IDX = [];
  const norm = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  function indiceBusqueda() {
    IDX = [];
    CAPS.filter(c => HTML[c.id]).forEach(c => {
      const d = document.createElement('div'); d.innerHTML = HTML[c.id];
      let actual = { id: c.id, t: c.t, cap: c.t, texto: '' };
      [...d.querySelectorAll('h1, h2, h3, h4, p, li, dt, dd, figcaption, td')].forEach(n => {
        if (/^H[23]$/.test(n.tagName) && n.id) { IDX.push(actual); actual = { id: n.id, t: n.textContent.trim(), cap: c.t, texto: '' }; }
        else actual.texto += ' ' + n.textContent.trim();
      });
      IDX.push(actual);
    });
  }
  const buscar = $('buscar'), res = $('resultados');
  let sel = -1;
  buscar.addEventListener('input', () => {
    const v = norm(buscar.value.trim()); sel = -1;
    if (v.length < 2) { res.hidden = true; return; }
    const pal = v.split(/\s+/).filter(Boolean);
    const r = IDX.map(x => { const t = norm(x.t), b = norm(x.texto); let p = 0;
        for (const w of pal) { if (t.includes(w)) p += 5; else if (b.includes(w)) p += 1; else return null; } return { x, p }; })
      .filter(Boolean).sort((a, b) => b.p - a.p).slice(0, 12);
    res.innerHTML = r.length ? r.map(({ x }) => {
      const b = x.texto, i = norm(b).indexOf(pal[0]), trozo = i < 0 ? b.slice(0, 110) : (i > 40 ? '…' : '') + b.slice(Math.max(0, i - 40), i + 90) + '…';
      return `<a href="#${x.id}"><b>${esc(x.t)}</b><span>${esc(x.cap)} · ${resaltar(esc(trozo), pal)}</span></a>`; }).join('')
      : '<a href="#portada"><b>Sin resultados</b><span>Prueba con otra palabra, por ejemplo «cita», «ruta» o «indicador».</span></a>';
    res.hidden = false;
  });
  buscar.addEventListener('keydown', e => {
    const as = [...res.querySelectorAll('a')]; if (!as.length || res.hidden) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + as.length) % as.length; as.forEach((a, i) => a.classList.toggle('on', i === sel)); }
    if (e.key === 'Enter') { e.preventDefault(); (as[sel] || as[0]).click(); }
  });
  res.addEventListener('click', e => { if (e.target.closest('a')) { res.hidden = true; buscar.blur(); } });
  document.addEventListener('click', e => { if (!e.target.closest('.buscar')) res.hidden = true; });
  function resaltar(t, pal) { pal.forEach(w => { if (w.length < 2) return; t = t.replace(new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi'), '<mark>$1</mark>'); }); return t; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  // Volver a la app: si el manual se abrió desde la app en otra pestaña, la cierra y vuelve a ella
  $('volverApp').addEventListener('click', e => { if (window.opener && !window.opener.closed) { e.preventDefault(); try { window.opener.focus(); } catch (x) {} window.close(); } });

  window.__manual = { vocab, ir, IDX: () => IDX };
  cargar();
})();
