


/* v2.214.0 · Visita del día, resultados que hacen avanzar y manual en el iPhone (peticiones de Eric; SQL 130).
   - Una visita se registra el día de la cita: «Registrar» sale en las citas de hoy; en las de días pasados, solo con el permiso
     visita_fecha_pasada (y entonces la visita lleva la fecha de la cita); en las futuras, nunca. En la ventana de la visita, la
     fecha no pasa de hoy y, sin el permiso, queda fija en hoy. La base lo comprueba también (registrar_actividad).
   - Lo guardado sin conexión lleva sin_conexion: al enviarlo otro día no se rechaza por la fecha.
   - Los resultados que no hacen avanzar la ficha los oculta la base (clasificadores_actividad).
   - Manual: en el iPhone y el iPad el libro dentro de un marco sale en blanco con la app instalada; allí se abre a pantalla
     completa, con «Volver a la app». */
var VISITA_FECHA = '';
const ES_IOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/* v2.215.0 · Configuración en un solo sitio (decisión de Eric: propuesta A con los avisos de B; https://claude.ai/artifact/HW1gHEaYPuG3kbCpd2RnzZ).
   - Mi perfil, Configuración, Organización y Usuarios y roles son una sola pantalla: índice a la izquierda (Tu cuenta, Equipo, Empresa,
     Facturación, Datos; los subapartados son entradas del índice, sin pestañas dentro) y el apartado a la derecha. Cada persona ve solo
     lo que le toca. ir('perfil' | 'organizacion' | 'usuarios' | 'empresa' | 'plan') y CFG_SEC/CFG_SUB de antes llevan a su entrada (CFG_KEY).
   - Buscador del índice por nombre y palabras clave (Intro abre el primero); se abre en el último apartado usado; punto naranja en lo
     pendiente (punto de salida, correo sin configurar, copia de seguridad antigua).
   - En el móvil, el índice es una lista y cada apartado se abre con «‹ Configuración».
   - Piezas de la marca en toda la app: casillas de 18 px con el marino, interruptores en marino.
   - Notificaciones: cada aviso con «Al momento · En el resumen · No», el resumen arriba y el silencio en una fila. */
var CFG_KEY = '';
function arbolCfgUnicoBase() {
  const admin = puede('administrar'), org = puedeOrganizacion();
  const cfg = arbolConfig(), todos = cfg.flatMap(g => g[1]), de = k => todos.find(x => x.k === k);
  const hojas = it => {
    if (!it) return [];
    if (!it.sub) return [{ k: it.k, t: it.t, ic: it.ic, d: it.d, r: it.r, mod: it.mod }];
    if (it.sub.length === 1) return [{ k: it.k + '.' + it.sub[0][0], t: it.k === 'inicio' ? 'Indicadores de Inicio' : it.t, ic: it.ic, d: it.d, r: it.sub[0][2], mod: it.mod }];
    return [{ k: it.k, t: it.t, ic: it.ic, d: it.d, mod: it.mod, hijos: it.sub.map(([s, t, r]) => ({ k: it.k + '.' + s, t, r })) }];
  };
  const ot = org && PAGINAS.organizacion ? Object.fromEntries(PAGINAS.organizacion.tabs.map(([k, t, r]) => [k, { t, r }])) : {};
  const o = (k, ic, d, t) => ot[k] ? [{ k: 'o.' + k, t: t || ot[k].t, ic, d, r: ot[k].r }] : [];
  const pt = Object.fromEntries((PAGINAS.perfil ? PAGINAS.perfil.tabs : []).map(([k, t, r]) => [k, r]));
  return [
    ['Tu cuenta', [
      { k: 'datos', t: 'Mis datos', ic: 'user', d: 'Nombre, teléfono, idioma, qué abrir al entrar y contraseña', r: pt.datos || (() => pintarPerfil()) },
      { k: 'notif', t: 'Notificaciones', ic: 'bell', d: 'Qué avisos te llegan y cuándo', r: () => pintarNotif() },
      ...hojas(de('rutas')), ...hojas(de('inicio'))]],
    ['Equipo', admin ? [
      { k: 'usuarios', t: 'Usuarios', ic: 'users', d: 'Personas del equipo, su rol, su cartera y su comisión', r: () => pintarUsuarios2() },
      { k: 'roles', t: 'Roles y permisos', ic: 'lock-keyhole', d: 'Qué puede ver y hacer cada rol', r: () => pintarRoles() },
      ...hojas(de('cartera')), ...hojas(de('comis')), ...hojas(de('seguridad'))] : []],
    ['Empresa', [...o('marca', 'palette', 'Nombre de la plataforma y logo', 'Marca y logo'), ...o('correo', 'mail', 'Cuenta de envío y firma de los correos'),
      ...o('plan', 'credit-card', 'Tu plan, los usuarios y los pagos'), ...o('copias', 'save', 'Descarga de todos los datos de la empresa'),
      ...o('orgs', 'building', 'Empresas de la plataforma')]],
    ['Facturación', [...o('fiscal', 'receipt', 'Razón social, NIF y dirección'), ...o('series', 'receipt', 'Numeración de las facturas'),
      ...o('vf', 'receipt', 'Huella y QR de cada factura'), ...o('pdf', 'receipt', 'Cómo se ve la factura en PDF')]],
    ['Datos', (cfg.find(g => g[0] === 'Datos') || [, []])[1].flatMap(hojas)]
  ].filter(g => g[1].length);
}
['scroll', 'resize'].forEach(ev => addEventListener(ev, () => { cancelAnimationFrame(CFU_RAF); CFU_RAF = requestAnimationFrame(cfuAjustarIndice); }, { passive: true }));
var IR_DESDE_MENU_CFG = false;
document.addEventListener('click', e => { if (e.target.closest('nav.main [data-t="config"], #bnav [data-t="config"], [data-u="cfg"]')) { CFG_SEC = '__cfg'; IR_DESDE_MENU_CFG = true; } }, true);
// El «?» del manual lleva al capítulo del apartado abierto
Object.defineProperty(MANUAL_ANCLA, 'config', { configurable: true, enumerable: true, get: () => {
  const k = CFG_KEY || '';
  return ['datos', 'notif'].includes(k) ? 'perfil' : k === 'o.plan' ? 'plan' : k.startsWith('o.') ? 'organizacion' : ['usuarios', 'roles'].includes(k) ? 'usuarios' : 'ajustes';
} });


function pulirCfgBase() {
  const c = $('cfgcuerpo'); if (!c || TAB !== 'config' || !CFG_PULIR.includes(CFG_KEY)) return;
  const cab = document.querySelector('.cfucab'), titulo = impNorm((cab && cab.querySelector('h2') || {}).textContent || '');
  // Tarjetas que solo presentan el apartado (título y texto): el texto pasa a la cabecera
  c.querySelectorAll(':scope > .card:not([data-pul])').forEach(card => {
    card.dataset.pul = '1';
    const h = card.querySelector(':scope > h2');
    if (h && impNorm(h.textContent) === titulo) h.classList.add('cfudup');
    const kids = [...card.children];
    if (kids.length && kids.every(k => k.matches('h2, p'))) {
      const txt = [...card.querySelectorAll(':scope > p')].map(p => p.textContent.trim()).join(' ');
      if (cab && txt) { let p = cab.querySelector('p'); if (!p) { p = document.createElement('p'); cab.appendChild(p); } p.textContent = txt; }
      card.remove();
    }
  });
  // El primer título que repite el del apartado, fuera (esté donde esté)
  const rep = [...c.querySelectorAll('h2:not(.cfudup)')].find(h => impNorm(h.textContent) === titulo); if (rep) rep.classList.add('cfudup');
  // Tiempos de visita y aviso de visita reciente: filas de ajuste con el número a la derecha
  if (['rutas.horario', 'rutas.salida'].includes(CFG_KEY)) {
    c.querySelectorAll('.g2 > div:not([data-pul])').forEach(d => {
      const n = d.querySelector(':scope > .numw'); if (!n) return;
      d.dataset.pul = '1'; d.classList.add('ajfila', 'ajnum');
      const izq = document.createElement('div'); izq.className = 'ajtxt';
      [...d.children].filter(x => x !== n).forEach(x => izq.appendChild(x));
      d.prepend(izq);
      d.parentElement.classList.add('ajlista');
    });
    const av = $('pfaviso');
    if (av && !av.dataset.pul) { av.dataset.pul = '1'; av.classList.add('card', 'cfgpanel'); }
  }
  // Marca y vocabulario: el vocabulario en su tarjeta, como tabla
  if (CFG_KEY === 'o.marca') {
    const voc = c.querySelector('.mkvoc'), etq = c.querySelector('.mketqbox');
    if (voc && !$('mkvoccard')) {
      c.insertAdjacentHTML('beforeend', `<div class="card cfgpanel" id="mkvoccard"><h2 style="padding:0 0 4px">Cómo se llama cada cosa</h2>
        <p class="sm">El nombre del módulo y las palabras de todos los textos de la plataforma. En blanco, se usa el nombre de siempre.</p>
        <div id="mkvochueco"></div><div class="acts" style="justify-content:flex-end"><button type="button" class="btn" id="mkvocok">Guardar</button></div></div>`);
      const hueco = $('mkvochueco');
      if (etq) hueco.appendChild(etq);
      hueco.appendChild(voc);
      voc.querySelectorAll(':scope > label, :scope > .sm').forEach(x => x.remove());
      voc.insertAdjacentHTML('afterbegin', '<div class="mkvocf mkvoccab" aria-hidden="true"><span></span><span>Singular</span><span>Plural</span><span>Género</span></div>');
      voc.querySelectorAll('.mkvocf[data-term]').forEach(f => {
        const l = f.querySelector('label'); const nom = l ? l.textContent.replace(/\s*·\s*singular\s*$/i, '').trim() : f.dataset.term;
        f.insertAdjacentHTML('afterbegin', `<b class="mkvocn">${esc(nom)}</b>`);
        f.querySelectorAll('[data-tf]').forEach(i => { const lb = { s: 'singular', p: 'plural', g: 'género' }[i.dataset.tf]; i.setAttribute('aria-label', nom + ' · ' + lb); });
      });
      $('mkvocok').onclick = () => $('mkok') && $('mkok').click();
    }
  }
  // Correo y firma: estado y prueba arriba
  if (CFG_KEY === 'o.correo' && $('coprueba') && !$('costado')) {
    const host = (($('cohost') || {}).value || '').trim();
    const prim = c.querySelector(':scope > .card');
    if (prim) prim.insertAdjacentHTML('beforebegin', `<div class="card cfgpanel" id="costado"><div class="ajfila"><div><b>${host ? 'Correo conectado' : 'Correo sin configurar'}</b>
      <span class="sm">${host ? 'Las facturas, los datos de pago y los resúmenes salen desde ' + esc((($('coemail') || {}).value || host).trim()) + '.' : 'Rellena la cuenta de envío: hasta entonces, los correos de la empresa no salen.'}</span></div>
      <div class="ajctl"><button type="button" class="btn sec" id="copruebaarriba">Enviar un correo de prueba</button></div></div></div>`);
    if ($('copruebaarriba')) $('copruebaarriba').onclick = () => { $('coprueba').scrollIntoView({ block: 'center', behavior: 'smooth' }); $('coprueba').click(); };
  }
  // Correo y Copias enseñan su propio estado: fuera el aviso de arriba, que diría lo mismo
  if (['o.correo', 'o.copias'].includes(CFG_KEY) && $('cfupend')) $('cfupend').classList.add('hide');
  // Copias: estado y botón en la misma fila
  if (CFG_KEY === 'o.copias') {
    const est = c.querySelector('.copiaest'), b = $('copok');
    if (est && b && !est.contains(b)) { const acts = b.closest('.acts'); est.classList.add('copiafila'); const t = document.createElement('div'); [...est.children].forEach(x => t.appendChild(x)); est.append(t, b); if (acts && !acts.children.length) acts.remove(); }
  }
}
new MutationObserver(() => { if (TAB === 'config') requestAnimationFrame(pulirCfg); })
  .observe(document.getElementById('v-config'), { childList: true, subtree: true });

/* v2.217.0 · Equipo, Facturación y Datos (tercera versión del rediseño de Configuración).
   - pulirCfg se aplica ya a todos los apartados: fuera las tarjetas que solo presentan y los títulos repetidos.
   - Usuarios: las cifras (plan, cada rol, sin actividad, con acceso al portal) en una línea; pulsar un rol filtra la lista por él.
   - Las casillas sueltas (Cartera exclusiva, Emitir la factura al validar…) sin el recuadro de más. */
function pulirCfg() {
  if (TAB !== 'config' || !CFG_KEY) return;
  if (!CFG_PULIR.includes(CFG_KEY)) CFG_PULIR.push(CFG_KEY);
  pulirCfgBase();
  const c = $('cfgcuerpo'); if (!c) return;
  if (CFG_KEY === 'usuarios') {
    const k = c.querySelector('.cfgpanel > .kpis.vtot:not([data-pul])');
    if (k) {
      k.dataset.pul = '1'; k.classList.add('usrres');
      const roles = rolesNombres();
      k.querySelectorAll('.kpi').forEach(x => {
        const r = (x.querySelector('span') || {}).textContent || '';
        if (!roles.includes(r.trim())) return;
        x.classList.add('usrresrol'); x.setAttribute('role', 'button'); x.tabIndex = 0; x.title = 'Ver solo ' + r.trim();
        const filtra = () => { const s = $('usrrol'); if (!s) return; s.value = s.value === r.trim() ? '' : r.trim(); s.dispatchEvent(new Event('change', { bubbles: true }));
          k.querySelectorAll('.usrresrol').forEach(y => y.classList.toggle('on', y === x && !!s.value)); };
        x.onclick = filtra; x.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); filtra(); } };
      });
      // v2.297: «Cuentas con acceso» (profesionales y centros con portal) lleva a la tarjeta de invitados
      const inv = k.querySelector('[data-usrinvk]');
      if (inv) {
        inv.classList.add('usrresrol'); inv.setAttribute('role', 'button'); inv.tabIndex = 0; inv.title = 'Ver las cuentas con acceso a su portal';
        const ir2 = () => { const w = c.querySelector('.usrinvw'); if (!w) return; w.scrollIntoView({ behavior: 'smooth', block: 'start' }); w.classList.remove('usrinvluz'); void w.offsetWidth; w.classList.add('usrinvluz'); };
        inv.onclick = ir2; inv.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ir2(); } };
      }
    }
  }
}


const SVA = d => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
const ICU = {
  toca: '<path d="M4 22V4a1 1 0 0 1 1-1h12l-2.5 4.5L17 12H5"/>',
  reloj: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  puerta: '<path d="M3 21h18"/><path d="M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17"/><path d="M14 12h.01"/>',
  aviso: '<path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
  nota: '<path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/>',
  mas: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
  plan: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M12 14v4M10 16h4"/>'
};

// Pastillas con las cifras (de #agmet, que se sigue pintando igual)

document.addEventListener('click', e => { const m = $('agmes'); if (m && m.classList.contains('pop') && !e.target.closest('#agmes, #cmesb, .agmpop, .agpop')) cerrarMesCinta(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarMesCinta(); });


// Las tarjetas de Tu día, desde la lista de siempre
// Pulsar la tarjeta (fuera de sus botones) abre la cita, como la fila de antes
document.addEventListener('click', e => {
  const t = e.target.closest('.tdu'); if (!t || e.target.closest('button, a, input, select, .agtamb[data-agtc]')) return;
  const c = (TD_CITAS || []).find(x => x.id === t.dataset.tdu); if (c) verCita(c);
});
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter' || !e.target.matches || !e.target.matches('.tdu')) return;
  const c = (TD_CITAS || []).find(x => x.id === e.target.dataset.tdu); if (c) verCita(c);
});

/* v2.221.0 · El «+» flotante del móvil no tapa el contenido (aviso de Eric: tapaba el final de las tarjetas y de la jornada).
   - Al desplazarse hacia abajo se aparta (baja y se desvanece); al subir, al pararse arriba del todo o al llegar al final, vuelve.
   - Con «+» en la pantalla, el contenido deja sitio debajo para que lo último no quede bajo el botón (estilo). */
(() => {
  let y0 = scrollY, fuera = false, pend = false;
  const poner = v => { if (v === fuera) return; fuera = v; document.body.classList.toggle('fabfuera', v); };
  addEventListener('scroll', () => {
    if (pend) return; pend = true;
    requestAnimationFrame(() => {
      pend = false;
      const y = scrollY, dy = y - y0, alFinal = innerHeight + y >= document.documentElement.scrollHeight - 8;
      if (y < 40 || alFinal) poner(false);
      else if (dy > 6) poner(true);
      else if (dy < -6) poner(false);
      y0 = y;
    });
  }, { passive: true });
  // Al cambiar de pantalla vuelve a estar a la vista (evento de la navegación, src/app/core/navigation)
  document.addEventListener('delcos:navigation-start', () => { poner(false); y0 = 0; });
})();

/* v2.222.0 · KPIs vivos de Inicio (decisión de Eric: variante A «Instrumentos» del prototipo https://claude.ai/artifact/5sCrtXHiW1RvCZ5GLSDDdZ).
   - Cada KPI de Inicio cuenta su información con su propia gráfica: citas de hoy (un punto por cita con su hora; la siguiente late),
     urgentes (radar o «todo al día»), semana (barras por día), mes (línea acumulada frente al mes pasado), interesados (escalera de
     estados), sin contactar (una casilla por ficha), cartera (anillo por estados), próximos 7 días (columnas), sin visita en 60 días
     (proporción) y unidades del mes (frente al mes pasado). Los demás, el número con la misma tarjeta.
   - Los datos de las gráficas: inicio_graficas() (SQL 132), pedida a la vez que panel_inicio para que Inicio aparezca entero de una vez.
   - Al llegar, los números cuentan desde cero y las gráficas crecen, todo a la vez (sin cascadas); la siguiente cita, el radar y el
     punto final de la línea siguen vivos. Sin animación con «reducir movimiento».
   - Las tarjetas se transforman en cuanto se pintan (MutationObserver de #kpis: va antes de que se vean). */
let KV_INI = null, KV_GRAF = null;

(() => {
  const ob = new MutationObserver(() => { if ($('kpis')) kpisVivos(); });
  const enganchar = () => { const c = $('kpis'); if (c && !c.__kv) { c.__kv = true; ob.observe(c, { childList: true }); kpisVivos(); } };
  enganchar();   // #kpis está en index.html desde el arranque: basta con vigilarlo a él
})();

