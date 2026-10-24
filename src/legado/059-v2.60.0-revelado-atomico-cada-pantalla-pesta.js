/* ============================================================
   v2.60.0 · Revelado atómico: cada pantalla, pestaña y ventana se
   muestra entera de una vez, cuando han llegado todos sus datos y ha
   dejado de cambiar (sin estados intermedios a la vista)
   ============================================================ */

// 1. Todas las consultas a la base de datos, cuenten desde donde se hagan (también las que no pasan por los atajos)
let RED_PEND = 0;
// Contador en la salida a la red (lo llama el envío de peticiones del cliente de la base de datos)
window.__redIni = () => { RED_PEND++; const m = performance.now() + Math.random() / 1000; RED_EN_CURSO.add(m); return m; };
window.__redFin = m => { if (RED_EN_CURSO.delete(m)) { RED_PEND--; RED_ULTIMO_FIN = performance.now(); } };
const RED_EN_CURSO = new Set();   // momento de inicio de cada consulta en curso
let RED_ULTIMO_FIN = 0;   // cuándo terminó la última consulta
// Cuentan todas las consultas en curso, también las precargas lanzadas poco antes de entrar (Analítica las aprovecha);
// solo se ignoran las que llevan más de 3 s en marcha (un refresco de fondo colgado no debe bloquear la pantalla)
const pendientesDesde = t0 => { const lim = performance.now() - (Date.now() - t0) - 3000; let n = 0; RED_EN_CURSO.forEach(t => { if (t >= lim) n++; }); return n; };
(function () {
  let p = Object.getPrototypeOf(db.from('perfiles').select('id'));
  while (p && !Object.prototype.hasOwnProperty.call(p, 'then')) p = Object.getPrototypeOf(p);
  if (!p) return;
  const thenOrig = p.then;
  // Cada consulta se ejecuta UNA sola vez, aunque varias partes esperen su resultado
  // (la librería la volvía a enviar cada vez que alguien la esperaba: lecturas duplicadas)
  p.then = function (ok, ko) {
    if (!this.__unaVez) this.__unaVez = thenOrig.call(this, v => v, e => { throw e; });
    return this.__unaVez.then(ok, ko);
  };
})();

// 2. «Estable»: sin consultas pendientes y sin cambios en el elemento durante 120 ms (como mucho, el tiempo indicado)
function estable(el, max = 4000, desde) {
  return new Promise(res => {
    // Las esperas se miden con el cronómetro interno del navegador (siempre avanza; el reloj puede saltar)
    const t0 = desde || Date.now() - 5, p0 = performance.now(); let ultimo = p0 - 5, fin = false;
    // Cuentan los cambios dentro del elemento (no los de su propia clase, que son los del mecanismo de carga)
    const mo = new MutationObserver(ms => { if (ms.some(m => m.target !== el && !cambioDeCifra(m))) ultimo = performance.now(); });   // v2.269.0
    mo.observe(el, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
    const listo = () => { if (fin) return; fin = true; mo.disconnect(); res(); };
    // Pantalla ya cargada: si al terminar la tarea actual no hay consultas ni cambios, se muestra al momento
    // Una pantalla con esqueletos de carga (recuadros «Cargando…») todavía no está lista
    const conEsqueletos = () => !!el.querySelector('.skel, .ksk, .cargandolocal');
    setTimeout(() => { if (pendientesDesde(t0) === 0 && ultimo <= p0 && !conEsqueletos()) listo(); }, 0);
    const w = setInterval(() => {
      if (fin) { clearInterval(w); return; }
      // Solo las consultas lanzadas desde que empezó (las que ya estaban en curso, como la campana, no cuentan)
      // …y con un respiro de 120 ms desde el último cambio y desde la última consulta terminada (las encadenadas no se toman por el final)
      const ya = performance.now();
      if ((pendientesDesde(t0) === 0 && ya - Math.max(ultimo, RED_ULTIMO_FIN) >= 50 && !conEsqueletos()) || ya - p0 > max) { clearInterval(w); listo(); }   // v2.269.0: 50 ms (antes 120)
    }, 15);
  });
}

// 3. Pantallas: se preparan ocultas y se muestran de golpe
let REVELADO = 0;
function revelar(el, max, desde) {
  if (!el) return; const turno = ++REVELADO;
  el.classList.add('preparando');
  estable(el, max, desde).then(() => { if (turno === REVELADO || !el.matches('main > section')) { el.classList.remove('preparando'); llegar(el); } });
}
// v2.92.0: la pantalla recién revelada llega con un fundido corto (las repintadas posteriores no se animan)
function llegar(el) {
  if (!el || !el.matches('main > section')) return;
  el.classList.remove('llega'); void el.offsetWidth; el.classList.add('llega');
  clearTimeout(el._llega); el._llega = setTimeout(() => el.classList.remove('llega'), 700);
}
ir = (orig => function (t) {
  const t0 = Date.now() - 2;
  const r = orig(t);
  const sec = $('v-' + TAB); if (sec) { sec.classList.remove('cargando', 'cargando-pend'); revelar(sec, 4000, t0); }
  document.querySelectorAll('main > section.preparando').forEach(x => { if (x !== sec) x.classList.remove('preparando'); });
  return r;
})(ir);

// 4. Pestañas y cambios de vista dentro de una pantalla: la vista anterior se queda fija hasta que la nueva está entera
congelar = function (sec) {
  if (!sec || sec.classList.contains('hide') || document.querySelector('.congelada')) return;
  const r = sec.getBoundingClientRect(); if (r.height < 40) return;
  const t0 = Date.now() - 2;   // el momento del clic: cuentan todas las consultas que lance
  const c = sec.cloneNode(true); c.removeAttribute('id'); c.querySelectorAll('[id]').forEach(e => e.removeAttribute('id'));
  c.classList.add('congelada'); c.classList.remove('cargando', 'cargando-pend', 'preparando');
  Object.assign(c.style, { position: 'absolute', left: (r.left + scrollX) + 'px', top: (r.top + scrollY) + 'px', width: r.width + 'px', margin: 0, pointerEvents: 'none', zIndex: 40, background: 'var(--bg, #F3F8FC)' });
  document.body.appendChild(c); sec.style.minHeight = r.height + 'px';
  // Se espera a que empiece el cambio (el clic lanza la carga justo después) y a que termine
  setTimeout(() => estable(sec, 3000, t0).then(() => { c.remove(); requestAnimationFrame(() => { sec.style.minHeight = ''; }); }), 0);
};

// 5. Ventanas: su contenido aparece entero, no bloque a bloque
['dlg', 'ficha', 'dlg2'].forEach(id => {
  const d = $(id); if (!d) return;
  new MutationObserver(() => { if (d.open) { const cont = d.firstElementChild; if (cont) revelar(cont, 1500, Date.now() - 50); } })
    .observe(d, { attributes: true, attributeFilter: ['open'] });
});


