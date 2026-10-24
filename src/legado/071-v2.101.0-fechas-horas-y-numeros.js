


// ---------- Valor visible de mes y de fecha con hora ----------
function valorVisible(inp) {
  const t = selTipo(inp);
  if (t !== 'mes' && t !== 'fechahora') return valorVisibleBase(inp);
  const w = inp.closest('.selw'), sp = w && w.querySelector('.selval'); if (!sp) return;
  const v = inp.value;
  if (!v) { sp.textContent = t === 'mes' ? 'Elige un mes' : 'Elige fecha y hora'; sp.classList.add('vacio'); return; }
  sp.classList.remove('vacio');
  if (t === 'mes') { const [y, mm] = v.split('-'); sp.textContent = `${MESES_L[+mm - 1] || ''} ${y}`; return; }
  sp.textContent = `${selFechaMedia(v.slice(0, 10))} · ${v.slice(11, 16)}`;
}

mejorarCamposNuevos(document);

// Números: mantener pulsado «+» o «−» repite; el último clic no suma otra vez
(function () {
  let t1 = 0, t2 = 0, repetido = false;
  const parar = () => { clearTimeout(t1); clearInterval(t2); t1 = t2 = 0; };
  document.addEventListener('pointerdown', e => {
    const nb = e.target.closest('.numw .nb'); if (!nb) return;
    repetido = false; parar();
    t1 = setTimeout(() => { t2 = setInterval(() => { repetido = true; nb.dispatchEvent(new MouseEvent('click', { bubbles: true })); }, 90); }, 450);
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => document.addEventListener(ev, parar, true));
  // En la ventana y en captura: va antes que el manejador de los botones, que está en el documento
  window.addEventListener('click', e => {
    if (e.isTrusted && repetido && e.target.closest && e.target.closest('.numw .nb')) { repetido = false; e.stopPropagation(); e.preventDefault(); }
  }, true);
})();
// La rueda del ratón no cambia un número sin querer
document.addEventListener('wheel', e => { const i = e.target; if (i && i.matches && i.matches('input[type=number]') && document.activeElement === i) i.blur(); }, { passive: true });
// Al escribir un número fuera de su mínimo o máximo, se corrige al salir del campo
document.addEventListener('change', e => {
  const i = e.target; if (!i.matches || !i.matches('input[type=number]') || i.value === '') return;
  let n = +i.value; if (isNaN(n)) return;
  if (i.min !== '' && n < +i.min) n = +i.min; if (i.max !== '' && n > +i.max) n = +i.max;
  if (n !== +i.value) { i.value = n; i.dispatchEvent(new Event('input', { bubbles: true })); }
}, true);

new MutationObserver(sinHistorialLuego).observe(document.body, { childList: true, subtree: true });
sinHistorial(document.body);



document.addEventListener('keydown', e => {
  if (!['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key) || e.altKey || e.ctrlKey || e.metaKey || !esBuscador(e.target)) return;
  const l = teclaLista(e.target); if (!l) return;
  const its = teclaItems(l); if (!its.length) return;
  let i = its.findIndex(x => x.classList.contains('activo'));
  if (e.key === 'Enter') {
    if (i < 0) return;
    e.preventDefault(); e.stopImmediatePropagation(); teclaActivar(its[i]); return;
  }
  e.preventDefault();
  its.forEach(x => { x.classList.remove('activo'); x.removeAttribute('aria-selected'); });
  i = e.key === 'ArrowDown' ? (i + 1) % its.length : (i <= 0 ? its.length - 1 : i - 1);
  its[i].classList.add('activo'); its[i].setAttribute('aria-selected', 'true'); its[i].scrollIntoView({ block: 'nearest' });
}, true);
// Al escribir de nuevo, la marca se quita (los resultados cambian); con el ratón, la marca sigue al puntero
document.addEventListener('input', e => {
  if (!esBuscador(e.target)) return;
  const l = teclaLista(e.target); if (l) l.querySelectorAll('.activo').forEach(x => { x.classList.remove('activo'); x.removeAttribute('aria-selected'); });
}, true);
document.addEventListener('mouseover', e => {
  const l = e.target.closest && e.target.closest('.gsug, .cpres'); if (!l) return;
  const x = teclaItems(l).find(y => y.contains(e.target)); if (!x || x.classList.contains('activo')) return;
  l.querySelectorAll('.activo').forEach(y => { y.classList.remove('activo'); y.removeAttribute('aria-selected'); });
  x.classList.add('activo');
});

// La clave va escrita en cada sitio: el arranque lee la pantalla guardada antes de que se evalúe el final de este archivo
document.addEventListener('keydown', e => {
  const f5 = e.key === 'F5', r = (e.ctrlKey || e.metaKey) && (e.key === 'r' || e.key === 'R');
  if (!f5 && !r) return;
  const completa = f5 ? (e.ctrlKey || e.shiftKey) : e.shiftKey;
  try {
    if (completa || !PERFIL) sessionStorage.removeItem('dlc-f5');
    else sessionStorage.setItem('dlc-f5', JSON.stringify({ t: TAB, c: CFG_SEC, s: CFG_SUB, p: PAG_TAB, h: Date.now() }));
  } catch (x) {}
  // La recarga la hace el navegador (en Ctrl+F5, sin caché)
});

// v2.112.0 · Ventanas: al abrir, el foco no se queda en la X (se veía un recuadro de foco sin haber usado el teclado)
// y, al desplazar una ventana larga, la cabecera muestra una línea de separación
(() => {
  const sinFocoX = d => {
    d.classList.remove('desplazada');
    const a = document.activeElement;
    if (a && a.classList && a.classList.contains('x') && d.contains(a)) {
      if (!d.hasAttribute('tabindex')) d.setAttribute('tabindex', '-1');
      d.focus({ preventScroll: true });
    }
  };
  const abrir = HTMLDialogElement.prototype.showModal;
  HTMLDialogElement.prototype.showModal = function () { abrir.apply(this, arguments); sinFocoX(this); };
  // #dlg tiene su propia apertura (paneles de Configuración): se envuelve también
  const dl = $('dlg'), propia = dl.showModal;
  dl.showModal = function () { propia.apply(this, arguments); if (this.open) sinFocoX(this); };
  document.addEventListener('scroll', e => {
    const d = e.target;
    if (d && d.tagName === 'DIALOG') d.classList.toggle('desplazada', d.scrollTop > 4);
  }, true);
})();





/* v2.117.0 · Planes por usuario: Campo, Comercial, Empresa y A medida (precio por usuario y mes, IVA no incluido; con pago anual
   se pagan 10 meses de 12). Mínimo 3 usuarios salvo A medida; se añaden o quitan cuando se quiera. El plan de cada empresa
   (ajustes.plan: plan, usuarios contratados, pago, estado y, en prueba, prueba_hasta) solo se cambia desde la plataforma. */
PLANES.splice(0, PLANES.length,
  { id: 'campo', nombre: 'Campo', precio: 29, anual: 24, minimo: 3, incluidos: 3, bloque: [1, 29], medicos: 0,
    para: `Equipos que salen a ver ${TT('medico', 'p', '', 'l', 'l')} cada día`,
    modulos: ['inicio', 'agenda', 'rutas', 'directorio', 'seguimiento'],
    ventajas: [`Cartera de ${TT('medico', 'p', '', 'l', 'l')} y centros`, `Agenda, «Tu día» y registro de ${TT('visita', 'p', '', 'l', 'l')}`,
      'Rutas y planificación semanal', 'Muestras y material', 'Calidad del dato y duplicados'] },
  // El nombre del plan va entre comillas dobles: no es el rol «Comercial» (la prueba de literales busca roles escritos a mano)
  { id: 'comercial', nombre: "Comercial", precio: 42, anual: 35, minimo: 3, incluidos: 3, bloque: [1, 42], medicos: 0,
    para: 'Equipos que venden y quieren medir resultados',
    modulos: ['inicio', 'agenda', 'rutas', 'directorio', 'seguimiento', 'ventas', 'pacientes', 'productos', 'analitica'],
    ventajas: ['Todo lo de Campo', 'Pedidos, televenta y clientes', 'Productos y stock por lotes', `Analítica de ventas y ${TT('visita', 'p', '', 'l', 'l')}`, 'Comisiones por tramos'] },
  { id: 'empresa', nombre: 'Empresa', precio: 59, anual: 49, minimo: 3, incluidos: 3, bloque: [1, 59], medicos: 50,
    para: 'Empresas con facturación propia y varios equipos',
    modulos: ['inicio', 'agenda', 'rutas', 'directorio', 'seguimiento', 'ventas', 'pacientes', 'productos', 'analitica', 'facturacion'],
    ventajas: ['Todo lo de Comercial', 'Facturación con VeriFactu y cobros', 'Compras, proveedores y trazabilidad', 'Zonas, supervisión del equipo y auditoría',
      `Espacio ${TT('medico', 's', 'del', 'l', 'l')} (hasta 50)`] },
  { id: 'medida', nombre: 'A medida', precio: null, anual: null, minimo: 50, incluidos: 50, bloque: [1, 0], medicos: null, presupuesto: true,
    para: 'Redes comerciales grandes, desde 50 usuarios',
    modulos: ['inicio', 'agenda', 'rutas', 'directorio', 'seguimiento', 'ventas', 'pacientes', 'productos', 'analitica', 'facturacion'],
    ventajas: ['Todo lo de Empresa', 'Migración de datos', 'Conexión con tu programa de gestión', `Espacio ${TT('medico', 's', 'del', 'l', 'l')} sin límite`,
      'Ver la plataforma como cada persona de tu equipo, para ayudarla', 'Soporte prioritario'] });




