// v2.140.0 · Botones de solo icono (Actualizar de Inicio): al pulsarlos gira el icono y no aparece ningún texto (antes salía
// «Actualizando…» dentro del botón redondo)
conCarga = (orig => async function (btn, texto, fn) {
  if (!btn || !(btn.id === 'iniact' || btn.classList.contains('icoredondo') || btn.classList.contains('icobtn'))) return orig(btn, texto, fn);
  if (btn.dataset.cargando) return;
  btn.dataset.cargando = '1'; btn.disabled = true; btn.classList.add('icogira'); btn.setAttribute('aria-busy', 'true');
  try { return await fn(); } finally { btn.disabled = false; btn.classList.remove('icogira'); btn.removeAttribute('aria-busy'); delete btn.dataset.cargando; }
})(conCarga);

/* v2.140.0 · «Personalizar menú» rehecho (petición de Eric: la selección se veía «de 2010»). Cada bloque y cada sección se arrastran
   por su asa para ordenarlos (también con el teclado: asa con el foco y flechas ↑ ↓); cada sección tiene un interruptor como los de
   Notificaciones; el menú de la izquierda cambia en vivo mientras se toca y solo se guarda con «Guardar» (cerrar o Escape lo deja
   como estaba). */
Object.assign(ICON_NOM, {
  'grip-vertical': '<circle cx="9" cy="5" r="1" /> <circle cx="9" cy="12" r="1" /> <circle cx="9" cy="19" r="1" /> <circle cx="15" cy="5" r="1" /> <circle cx="15" cy="12" r="1" /> <circle cx="15" cy="19" r="1" />',
  'rotate-ccw': '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /> <path d="M3 3v5h5" />'
});
menuPersonalizar = function () {
  let caja = $('mlpanel'); if (caja) { if (caja.__cerrar) caja.__cerrar(); else caja.remove(); return; }
  const prefs0 = PERFIL.preferencias, p = menuPrefs();
  const estado = { orden: menuGrupos().filter(g => g.id !== 'otros').map(g => g.id), items: {}, ocultos: [...(p.ocultos || [])] };
  menuGrupos().forEach(g => { estado.items[g.id] = [...g.items]; });
  const boton = k => document.querySelector(`#nav button[data-t="${k}"]`);
  const nombre = k => { const b = boton(k); return b ? (b.dataset.tip || (b.querySelector('.mllab') || b).textContent.trim()) : ''; };
  const icono = k => { const b = boton(k), s = b && b.querySelector('svg'); return s ? s.outerHTML : ''; };
  const disponible = k => { const b = boton(k); return !!b && k !== 'seguimiento' && k !== 'inicio' && !b.classList.contains('hide') && (b.classList.contains('mloculto') || getComputedStyle(b).display !== 'none'); };
  const tit = id => (MENU_GRUPOS.find(x => x.id === id) || { t: 'Otros' }).t;
  const bloques = () => estado.orden.filter(id => (estado.items[id] || []).some(disponible));
  // Vista previa: el menú se monta con lo que hay en el panel; al cerrar sin guardar vuelve a lo guardado
  const previa = () => {
    PERFIL.preferencias = Object.assign({}, prefs0 || {}, { menu: Object.assign({}, ((prefs0 || {}).menu) || {}, { orden: [...estado.orden], items: JSON.parse(JSON.stringify(estado.items)), ocultos: [...estado.ocultos] }) });
    MENU_FIRMA = ''; montarMenuLateral();
  };
  let guardado = false;
  const fuera = ev => { if (!ev.target.closest('#mlpanel, #mlpers')) cerrar(); };
  const tecla = ev => { if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); cerrar(); } };
  const cerrar = () => {
    const c = $('mlpanel'); if (!c) return;
    c.remove(); document.removeEventListener('click', fuera, true); document.removeEventListener('keydown', tecla, true);
    if (!guardado) { PERFIL.preferencias = prefs0; MENU_FIRMA = ''; montarMenuLateral(); }
    const b = $('mlpers'); if (b) b.focus();
  };
  document.body.insertAdjacentHTML('beforeend', '<div id="mlpanel" class="mlp2" role="dialog" aria-label="Personalizar menú"></div>');
  caja = $('mlpanel'); caja.__cerrar = cerrar;
  const asa = (txt, attrs) => `<button type="button" class="mlpasa" ${attrs} aria-label="Mover ${esc(txt)} (flechas arriba y abajo)" title="Arrastra para ordenar">${svgIco(ICON_NOM['grip-vertical'])}</button>`;
  const pinta = foco => {
    caja.innerHTML = `<div class="mlph"><div><b>Personalizar menú</b><span class="sm">Arrastra para ordenar y elige qué secciones ves. Solo cambia tu menú.</span></div>
        <button type="button" class="x" id="mlpx" aria-label="Cerrar">✕</button></div>
      ${boton('inicio') ? `<div class="mlpi mlpfijo"><span class="mlpico">${icono('inicio')}</span><span class="mlpn">${esc(nombre('inicio'))}</span><span class="sm">Siempre el primero</span></div>` : ''}
      <div class="mlpl">${bloques().map(id => {
        const its = estado.items[id].filter(disponible), vis = its.filter(k => !estado.ocultos.includes(k)).length;
        return `<section class="mlpg" data-g="${id}">
          <div class="mlpgh">${asa('el bloque ' + tit(id), `data-ag="${id}"`)}<b>${esc(tit(id))}</b><span class="mlpcnt">${vis} de ${its.length}</span></div>
          <div class="mlpis">${its.map(k => { const on = !estado.ocultos.includes(k);
            return `<div class="mlpi${on ? '' : ' off'}" data-k="${k}" data-g="${id}">${asa(nombre(k), `data-ak="${k}" data-g="${id}"`)}
              <span class="mlpico">${icono(k)}</span><span class="mlpn">${esc(nombre(k))}</span>
              <label class="vfswitch mini"><input type="checkbox" role="switch" data-vk="${k}" ${on ? 'checked' : ''} aria-label="Ver ${esc(nombre(k))} en el menú"><span class="sw"></span></label></div>`; }).join('')}</div></section>`; }).join('')}</div>
      <div class="mlpacts"><button type="button" class="btn sec mlpdef" id="mlpdef">${svgIco(ICON_NOM['rotate-ccw'])} Restablecer</button><button type="button" class="btn" id="mlpok">Guardar</button></div>`;
    if (foco) { const f = caja.querySelector(foco); if (f) f.focus(); }
  };
  // Mover un bloque entre bloques, o una sección dentro de su bloque
  const moverBloque = (id, destino, antes) => {
    if (id === destino) return; const o = estado.orden.filter(x => x !== id), i = o.indexOf(destino); o.splice(antes ? i : i + 1, 0, id); estado.orden = o;
  };
  const moverItem = (g, k, destino, antes) => {
    if (k === destino) return; const l = estado.items[g].filter(x => x !== k), i = l.indexOf(destino); l.splice(antes ? i : i + 1, 0, k); estado.items[g] = l;
  };
  pinta(); previa();
  caja.addEventListener('click', async e => {
    if (e.target.closest('#mlpx')) { cerrar(); return; }
    if (e.target.closest('#mlpdef')) { estado.orden = MENU_GRUPOS.map(x => x.id); MENU_GRUPOS.forEach(x => { estado.items[x.id] = [...x.items]; }); estado.ocultos = []; pinta(); previa(); return; }
    const ok = e.target.closest('#mlpok');
    if (ok) {
      const prefs = Object.assign({}, prefs0 || {}, { menu: Object.assign({}, ((prefs0 || {}).menu) || {}, { orden: estado.orden, items: estado.items, ocultos: estado.ocultos }) });   // v2.336.0: conserva la barra del móvil
      ok.disabled = true;
      const { data, error } = await db.rpc('guardar_preferencias', { p: prefs });
      ok.disabled = false;
      if (error) { toast('No se ha podido guardar el menú', true); return; }
      PERFIL.preferencias = data || prefs; guardado = true; cerrar(); MENU_FIRMA = ''; montarMenuLateral(); toast('Menú guardado');
    }
  });
  caja.addEventListener('change', e => {
    const v = e.target.closest('[data-vk]'); if (!v) return; const k = v.dataset.vk;
    estado.ocultos = v.checked ? estado.ocultos.filter(x => x !== k) : [...new Set([...estado.ocultos, k])];
    const fila = v.closest('.mlpi'); fila.classList.toggle('off', !v.checked);
    const g = fila.closest('.mlpg'), its = estado.items[g.dataset.g].filter(disponible);
    g.querySelector('.mlpcnt').textContent = `${its.filter(x => !estado.ocultos.includes(x)).length} de ${its.length}`;
    previa();
  });
  // Teclado: con el foco en un asa, ↑ ↓ mueven
  caja.addEventListener('keydown', e => {
    const a = e.target.closest('.mlpasa'); if (!a || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
    e.preventDefault(); const d = e.key === 'ArrowUp' ? -1 : 1;
    if (a.dataset.ag) { const bs = bloques(), i = bs.indexOf(a.dataset.ag), o = bs[i + d]; if (!o) return; moverBloque(a.dataset.ag, o, d < 0); pinta(`[data-ag="${a.dataset.ag}"]`); }
    else { const g = a.dataset.g, its = estado.items[g].filter(disponible), i = its.indexOf(a.dataset.ak), o = its[i + d]; if (!o) return; moverItem(g, a.dataset.ak, o, d < 0); pinta(`[data-ak="${a.dataset.ak}"]`); }
    previa();
  });
  // Arrastrar y soltar, solo desde el asa: al pulsarla, su fila (o su bloque) pasa a ser arrastrable
  let arr = null;
  caja.addEventListener('pointerdown', e => {
    caja.querySelectorAll('[draggable="true"]').forEach(x => x.removeAttribute('draggable'));
    const a = e.target.closest('.mlpasa'); if (!a) return;
    const el = a.dataset.ag ? a.closest('.mlpg') : a.closest('.mlpi'); if (el) el.setAttribute('draggable', 'true');
  });
  caja.addEventListener('dragstart', e => {
    const el = e.target.closest('[draggable="true"]'); if (!el) { e.preventDefault(); return; }
    arr = el.classList.contains('mlpi') ? { tipo: 'i', k: el.dataset.k, g: el.dataset.g, el } : { tipo: 'g', g: el.dataset.g, el };
    e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', arr.k || arr.g); } catch (er) {}
    requestAnimationFrame(() => { if (arr) arr.el.classList.add('arrastrando'); });
  });
  const limpiar = () => caja.querySelectorAll('.soltar-antes, .soltar-despues').forEach(x => x.classList.remove('soltar-antes', 'soltar-despues'));
  caja.addEventListener('dragover', e => {
    if (!arr) return;
    const dest = arr.tipo === 'i' ? e.target.closest(`.mlpi[data-g="${arr.g}"]`) : e.target.closest('.mlpg');
    limpiar(); if (!dest || dest === arr.el) return;
    e.preventDefault(); const r = dest.getBoundingClientRect();
    dest.classList.add(e.clientY < r.top + r.height / 2 ? 'soltar-antes' : 'soltar-despues');
  });
  caja.addEventListener('drop', e => {
    if (!arr) return; e.preventDefault();
    const dest = caja.querySelector('.soltar-antes, .soltar-despues'); if (!dest) return;
    const antes = dest.classList.contains('soltar-antes');
    if (arr.tipo === 'i') moverItem(arr.g, arr.k, dest.dataset.k, antes); else moverBloque(arr.g, dest.dataset.g, antes);
    arr = null; pinta(); previa();
  });
  caja.addEventListener('dragend', () => { arr = null; limpiar(); caja.querySelectorAll('.arrastrando').forEach(x => x.classList.remove('arrastrando')); });
  setTimeout(() => { document.addEventListener('click', fuera, true); document.addEventListener('keydown', tecla, true); }, 0);
  const f = caja.querySelector('.mlpasa'); if (f) f.focus();
};


/* v2.143.0 · Agenda en una sola pantalla (decisión de Eric, 3/10/2026): sin flechas ni Día/Semana/Mes. Arriba, una línea fina con
   cuatro métricas; luego Hoy («Tu día») con las sugerencias al lado; debajo, la semana en curso en 7 columnas y el mes con puntos.
   Al pulsar un día se ven sus citas ahí mismo (sin cambiar de pantalla). La semana detallada (arrastrar, planificar, bloquear días)
   sigue a un clic con «Planificar la semana», y vuelve con «Agenda de hoy». */
const AG_DIAS_TXT = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const agUnida = () => TAB === 'agenda' && AG_MODO === 'dia';   // v2.146.0: también con otro día elegido (antes solo hoy)
ir = (orig => function (t, ...a) {
  if (t === 'agenda' && IR_DESDE_MENU) { AG_MODO = 'dia'; AG_FECHA = hoyISO(); }   // la Agenda del menú abre siempre hoy
  return orig.call(this, t, ...a);
})(ir);



// (v2.183.0: aquí iba la primera versión de agVerDia; se redefine entera más abajo)
document.addEventListener('pointerdown', e => { if (!e.target.closest('.agpop, [data-agdia]')) document.querySelectorAll('.agpop').forEach(x => x.remove()); }, true);

// v2.143.0: en Pedidos y Oportunidades los filtros pasan dentro de «Filtros y columnas» (a la vista queda solo el buscador)
HT_FILTROS.ventas = "#v-ventas .filtros";
/* v2.144.0 · Páginas propias: la acción principal («+ Nuevo usuario», «+ Nueva organización») sube a la derecha de la cabecera, como
   «+ Nueva venta» en el resto de pantallas (regla de Eric: misma posición en todas). Antes iba dentro de la tarjeta, junto al buscador. */
const ACCION_PAGINA = ['usrnuevo', 'orgnueva'];
function subirAccionPagina() {
  if (typeof PAGINAS === 'undefined' || !PAGINAS[TAB]) return;
  const sec = $('v-' + TAB), sal = sec && sec.querySelector(':scope > .saludo'); if (!sal) return;
  ACCION_PAGINA.forEach(id => {
    const b = $(id); if (!b || !sec.contains(b) || b.closest('.saludo')) return;
    let acts = sal.querySelector(':scope > .acts');
    if (!acts) { sal.insertAdjacentHTML('beforeend', '<div class="acts htacts"></div>'); acts = sal.querySelector(':scope > .acts'); }
    acts.appendChild(b);
  });
}
let ACCION_PAG_PEND = false;
new MutationObserver(() => {
  if (ACCION_PAG_PEND) return; ACCION_PAG_PEND = true;
  queueMicrotask(() => { ACCION_PAG_PEND = false; subirAccionPagina(); });
}).observe(document.querySelector('main'), { childList: true, subtree: true });


/* v2.145.0 · Rutas en una sola pantalla (decisión de Eric, 3/10/2026: «Propuestas del día y mis rutas al lado» y propuestas que
   aprenden de lo que hace). Sin pestañas: a la izquierda 2 o 3 rutas ya armadas para el día (por zona y llenas hasta la jornada,
   con sus motivos y un croquis), a la derecha las rutas guardadas, y el plan se abre debajo al pulsar. Los candidatos y su
   puntuación vienen de rutas_candidatos (SQL 95): urgentes, consulta ese día, interesados que se enfrían, pendientes, buenos
   clientes sin visita y nunca visitados, más las zonas y días en que sueles visitar y quién más compra. */
let RPROP = null;   // { manana, fecha, datos, lista: [{ sel, ini, fin, km, zona }] }
const RP_JORNADA = 300;   // minutos de una jornada de propuestas (5 h) si la ruta no dice otra cosa
const RP_DIAS = { L: 'lunes', M: 'martes', X: 'miércoles', J: 'jueves', V: 'viernes' };
function rpMotivos() {
  const g = terminoDe('medico').g === 'f' ? 'a' : 'o';
  return {
    urgente: ['urgente', 'urgentes', 'p-urg'],
    consulta: ['atiende', 'atienden', 'p-est'],
    interes: [TT('medico', 's', '', 'l', 'l', 'interesado'), TT('medico', 'p', '', 'l', 'l', 'interesado'), 'p-warn'],
    pendiente: ['pendiente de otra ruta', 'pendientes de otras rutas', 'p-per'],
    cliente: ['buen cliente sin ' + TT('visita', 's', '', 'l', 'l'), 'buenos clientes sin ' + TT('visita', 's', '', 'l', 'l'), 'p-est'],
    nuevo: ['nunca visitad' + g, 'nunca visitad' + g + 's', 'p-anu']
  };
}
function rpObjetivo(manana) {
  const d = new Date(), finde = d.getDay() === 0 || d.getDay() === 6;
  if (manana === undefined) manana = finde || d.getHours() * 60 + d.getMinutes() >= 13 * 60;
  if (finde) manana = true;
  return { manana, finde, fecha: manana ? siguienteLaborable() : hoyISO() };
}
const rpNombreDia = f => {
  const man = new Date(); man.setDate(man.getDate() + 1);
  return f === hoyISO() ? 'hoy' : f === isoLocal(man) ? 'mañana' : 'el ' + fechaLarga(new Date(f + 'T00:00:00')).replace(/,.*/, '');
};

// Tiempos de una propuesta con los minutos por visita y por parada de cada uno
function rpTiempos(sel, t0) {
  const cfg = PLANCFG(), sal = salidaUsuario();
  let pos = sal.lat != null ? [+sal.lat, +sal.lon] : null, t = t0, kms = 0, paradas = 0;
  sel.forEach(c => {
    const xy = [+c.lat, +c.lon], mismo = pos && km(pos, xy) < 0.05;
    if (!mismo) { if (pos) { t += minutosEntre(pos, xy); kms += km(pos, xy); } t += cfg.parada; paradas++; }
    t += cfg.visita; pos = xy;
  });
  return { fin: t, km: kms, paradas };
}

// Arma hasta 3 rutas de un día: la zona con más puntos, y desde su mejor candidato se va sumando el que más vale a cada paso
// (puntos menos 4 por km), sin salir de 25 km ni pasar de la jornada.
function rpArmar(cand, obj) {
  const cfg = PLANCFG(), sal = salidaUsuario();
  const ahora = new Date(), minAhora = ahora.getHours() * 60 + ahora.getMinutes();
  const t0 = obj.manana ? minHora(cfg.salida) : Math.max(minHora(cfg.salida), Math.ceil(minAhora / 5) * 5);
  const tfin = Math.min(t0 + RP_JORNADA, 20 * 60);
  const libres = new Set(cand.map(c => c.id)), lista = [];
  for (let k = 0; k < 3; k++) {
    const disp = cand.filter(c => libres.has(c.id));
    if (!disp.length) break;
    const porZona = {};
    disp.forEach(c => { const z = c.municipio || '—'; (porZona[z] = porZona[z] || []).push(c); });
    const zona = Object.entries(porZona).map(([z, l]) => [z, l.slice(0, 8).reduce((s, c) => s + +c.puntos, 0)]).sort((a, b) => b[1] - a[1])[0][0];
    const sel = [porZona[zona][0]]; libres.delete(sel[0].id);
    let pos = [+sel[0].lat, +sel[0].lon];
    let t = t0 + (sal.lat != null ? minutosEntre([+sal.lat, +sal.lon], pos) : 0) + cfg.parada + cfg.visita;
    for (;;) {
      let mejor = null, mv = -Infinity, mt = 0;
      cand.forEach(c => {
        if (!libres.has(c.id)) return;
        const xy = [+c.lat, +c.lon], d = km(pos, xy);
        if (d > 25) return;
        const dt = (d < 0.05 ? 0 : minutosEntre(pos, xy) + cfg.parada) + cfg.visita;
        if (t + dt > tfin) return;
        const v = +c.puntos - d * 4;
        if (v > mv) { mv = v; mejor = c; mt = dt; }
      });
      if (!mejor) break;
      sel.push(mejor); libres.delete(mejor.id); pos = [+mejor.lat, +mejor.lon]; t += mt;
    }
    if (sel.length < 2 && lista.length) break;
    lista.push({ sel, ini: t0 });
  }
  return lista;
}

function rpZona(sel) {
  const n = {};
  sel.forEach(c => { if (c.municipio) n[c.municipio] = (n[c.municipio] || 0) + 1; });
  const z = Object.entries(n).sort((a, b) => b[1] - a[1]).map(([m]) => rpTitulo(m));
  return !z.length ? 'Sin municipio' : z.length === 1 ? z[0] : z.length === 2 ? z.join(' y ') : `${z[0]}, ${z[1]} y ${z.length - 2} más`;
}
function rpTitulo(s) { return String(s || '').toLowerCase().replace(/(^|[\s\-'·])(\p{L})/gu, (a, b, c) => b + c.toUpperCase()); }

// Por qué esta propuesta: lo aprendido de las visitas y las compras
function rpPorque(sel, dia) {
  const media = k => sel.reduce((s, c) => s + (+c[k] || 0), 0) / sel.length;
  const z = rpZona(sel), out = [];
  if (dia && media('h_dia') >= 0.5) out.push(`Sueles ir a ${z} los ${RP_DIAS[dia]}`);
  else if (media('h_zona') >= 0.5) out.push('Es una de tus zonas habituales');
  const top = sel.filter(c => +c.h_venta >= 0.5).length;
  if (top) out.push(top === 1 ? 'Incluye a uno de tus mejores clientes' : `Incluye a ${top} de tus mejores clientes`);
  return out.join(' · ');
}

// Croquis: los puntos en orden y la línea que los une (sin cargar un mapa por tarjeta)
function rpCroquis(sel) {
  const W = 132, H = 92, P = 10, xs = sel.map(c => +c.lon), ys = sel.map(c => +c.lat);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const esc2 = Math.min((W - 2 * P) / Math.max(x1 - x0, 1e-4), (H - 2 * P) / Math.max(y1 - y0, 1e-4));
  const pt = c => [P + (+c.lon - x0) * esc2 + ((W - 2 * P) - (x1 - x0) * esc2) / 2, H - P - (+c.lat - y0) * esc2 - ((H - 2 * P) - (y1 - y0) * esc2) / 2];
  const pts = sel.map(pt);
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true">
    <polyline points="${pts.map(p => p.map(v => v.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="#17457A" stroke-opacity=".45" stroke-width="2" stroke-linejoin="round"/>
    ${pts.map((p, i) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${i ? 4 : 5.5}" fill="${(sel[i].motivos || []).includes('urgente') ? '#B42318' : '#17457A'}" stroke="#fff" stroke-width="1.5"/>`).join('')}
  </svg>`;
}

function rpTarjeta(p, i) {
  const M = rpMotivos(), cuenta = {};
  p.sel.forEach(c => (c.motivos || []).forEach(m => { cuenta[m] = (cuenta[m] || 0) + 1; }));
  const t = rpTiempos(p.sel, p.ini), n = p.sel.length;
  const porque = rpPorque(p.sel, RPROP.datos.dia);
  const chips = Object.keys(M).filter(k => cuenta[k]).map(k => `<span class="pill ${M[k][2]}">${cuenta[k]} ${cuenta[k] === 1 ? M[k][0] : M[k][1]}</span>`).join('');
  return `<div class="rprop" data-rp="${i}">
    <div class="rpcroq">${rpCroquis(p.sel)}</div>
    <div class="rptx"><b class="rpzona"><span class="rpnum">${i + 1}</span>${esc(rpZona(p.sel))}</b>
      <span class="sm">${n} ${n === 1 ? TT('medico', 's', '', 'l', 'l') : TT('medico', 'p', '', 'l', 'l')} · ${t.paradas} ${t.paradas === 1 ? 'parada' : 'paradas'} ·
        ${hm(p.ini)}–${hm(t.fin)}${t.km >= 1 ? ' · ' + Math.round(t.km) + ' km' : ''}</span>
      <span class="rpmot">${chips}</span>
      ${porque ? `<span class="sm rpporque">${esc(porque)}</span>` : ''}</div>
    <div class="acts rpacts"><button class="btn sec" type="button" data-rpver="${i}" aria-expanded="false">Ver ${TT('medico', 'p', '', 'l', 'l')}</button>
      <button class="btn sec" type="button" data-rpplan="${i}">Planificar</button>
      <button class="btn" type="button" data-rpag="${i}">A mi agenda</button></div>
    <div class="rplista" hidden>${p.sel.map(c => `<div class="rpit">
      <button type="button" class="lnkmed" data-rpficha="${c.id}">${esc(c.nombre)}</button>
      <span class="sm">${esc([c.centro_nombre, rpTitulo(c.municipio)].filter(Boolean).join(' · '))}</span>
      <span class="rpmot">${(c.motivos || []).map(m => `<span class="pill ${M[m][2]}">${M[m][0]}</span>`).join('')}</span>
      <button type="button" class="x rpquitar" data-rpquitar="${i}|${c.id}" title="Quitar de la propuesta" aria-label="Quitar ${esc(c.nombre)}">✕</button></div>`).join('')}</div>
  </div>`;
}

function rpPintar() {
  const caja = $('rprops'); if (!caja || !RPROP) return;
  const o = RPROP, d = o.datos || {}, quien = rpNombreDia(o.fecha);
  const man = siguienteLaborable(), etMan = rpNombreDia(man).replace(/^el /, '');
  const aprende = (d.aprendido || {}).visitas ? `Tienen en cuenta tus ${num(d.aprendido.visitas)} ${TT('visita', 'p', '', 'l', 'l')} de los últimos 4 meses y quién compra más.`
    : `Aprenden de tus ${TT('visita', 'p', '', 'l', 'l')} y de quién compra más a medida que uses la app.`;
  caja.innerHTML = `<div class="fh"><div><h2>Propuestas para ${quien}</h2><div class="sm">${aprende}</div></div>
      <div class="segs" id="rpdia" role="group" aria-label="Día">${o.finde ? '' : `<button type="button" data-rpd="hoy" class="${o.manana ? '' : 'on'}" aria-pressed="${!o.manana}">Hoy</button>`}
        <button type="button" data-rpd="man" class="${o.manana ? 'on' : ''}" aria-pressed="${o.manana}">${etMan.replace(/^./, c => c.toUpperCase())}</button></div></div>
    ${o.lista.length ? o.lista.map(rpTarjeta).join('')
      : `<div class="vacio">No hay a nadie a quien convenga ir ${quien}: ni urgentes, ni quien atienda ese día, ni ${TT('medico', 'p', '', 'l', 'l', 'interesado')} sin ${TT('visita', 's', '', 'l', 'l')}.
          ${o.manana ? '' : 'Prueba con el día siguiente.'}</div>`}`;
  caja.querySelectorAll('[data-rpd]').forEach(b => b.onclick = () => rpCargar(b.dataset.rpd === 'man'));
  caja.querySelectorAll('[data-rpver]').forEach(b => b.onclick = () => {
    const l = b.closest('.rprop').querySelector('.rplista'); l.hidden = !l.hidden; b.setAttribute('aria-expanded', String(!l.hidden));
    b.textContent = l.hidden ? `Ver ${TT('medico', 'p', '', 'l', 'l')}` : 'Ocultar';
  });
  caja.querySelectorAll('[data-rpficha]').forEach(b => b.onclick = () => abrirFicha(b.dataset.rpficha));
  caja.querySelectorAll('[data-rpquitar]').forEach(b => b.onclick = () => {
    const [i, id] = b.dataset.rpquitar.split('|'), p = o.lista[+i];
    p.sel = p.sel.filter(c => c.id !== id);
    if (!p.sel.length) o.lista.splice(+i, 1);
    const abierta = !p.sel.length ? null : +i;
    rpPintar();
    if (abierta != null) { const v = caja.querySelector(`[data-rpver="${abierta}"]`); if (v) v.click(); }
  });
  caja.querySelectorAll('[data-rpplan]').forEach(b => b.onclick = () => rpPlan(+b.dataset.rpplan, b));
  caja.querySelectorAll('[data-rpag]').forEach(b => b.onclick = () => rpAgenda(+b.dataset.rpag, b));
}

async function rpPlan(i, btn) {
  const p = rpPlanDe(i); if (!p) return;
  await construirPlan(p.sel, 'prop' + (i + 1), btn, { manana: RPROP.manana, horario: null });
}

async function rpCargar(manana) {
  const obj = rpObjetivo(manana);
  const { data, error } = await db.rpc('rutas_candidatos', { p_fecha: obj.fecha });
  if (error) { if ($('rprops')) $('rprops').innerHTML = `<div class="vacio">No se han podido calcular las propuestas: ${esc(error.message)}</div>`; return; }
  RPROP = Object.assign(obj, { datos: data || {}, lista: rpArmar((data || {}).candidatos || [], obj) });
  rpPintar();
}


cargarRutasBase = async function () {
  const v = $('v-rutas');
  const [{ data: rutas }] = await Promise.all([db.rpc('rutas_visibles'), (async () => {
    const obj = rpObjetivo(RPROP ? RPROP.manana : undefined);
    const { data } = await db.rpc('rutas_candidatos', { p_fecha: obj.fecha });
    RPROP = Object.assign(obj, { datos: data || {}, lista: rpArmar((data || {}).candidatos || [], obj) });
  })()]);
  RUTAS = rutas || [];
  v.innerHTML = `
    <div class="saludo"><div><h1>Rutas</h1><div class="fecha">Crea, edita y planifica tus rutas</div></div>
      <div class="acts" style="margin:0"><button class="btn" id="rnueva">+ Nueva ruta</button></div></div>
    <div class="rgrid2"><div class="card rprops" id="rprops"></div><div class="card rmis" id="rmis"></div></div>
    <div id="rcuerpo" hidden></div>
    <div id="rplan"></div>`;
  $('rnueva').onclick = () => editorRuta(null);
  rpPintar(); rpMisRutas();
  if (PLAN) pintarPlan();
};

// El subtítulo cuenta cómo va el día (lo que antes era la tarjeta «Hoy» del resumen)
cargarRutasPaso2 = (orig => async function (...a) {
  const r = await orig.apply(this, a);
  const sub = $('v-rutas') && $('v-rutas').querySelector('.saludo .fecha');
  if (sub && !jornadaActiva()) {
    const citas = await citasDelDia(hoyISO());
    if (!sub.isConnected) return r;   // v2.202.0: la pantalla se repintó o se salió de ella mientras se leían las citas
    const hechas = citas.filter(c => c.estado === 'Visitada').length, abiertas = citas.filter(c => CITA_ABIERTA.includes(c.estado)).length;
    const txt = hechas + abiertas ? `Hoy tienes ${hechas + abiertas} ${hechas + abiertas === 1 ? 'cita' : 'citas'}: ${hechas} ${hechas === 1 ? 'visitada' : 'visitadas'} y ${abiertas} por hacer` : 'Hoy no tienes citas';
    sub.innerHTML = `${esc(txt)} · <button type="button" class="kcfg" id="rverdia">Ver mi día</button>`;
    sub.querySelector('#rverdia').onclick = () => { AG_MODO = 'dia'; AG_FECHA = hoyISO(); ir('agenda'); };
  }
  return r;
})(cargarRutasPaso2);

/* v2.146.0 · Agenda: al pulsar un día de la semana o del mes, «Tu día» pasa a ese día (petición de Eric: antes se abría un desplegable).
   El título de «Tu día» es la fecha elegida y al lado está «Volver a hoy»; el día elegido queda marcado en la semana y en el mes.
   Las cifras de arriba, la semana y el mes siguen siendo los de hoy. */
function agMarcarDia() {
  const v = $('v-agenda'); if (!v || !v.classList.contains('agunida')) return;
  const hoy = hoyISO(), otro = AG_FECHA !== hoy;
  if ($('agtit')) $('agtit').textContent = 'Hoy · ' + fechaLarga(new Date(hoy + 'T00:00:00'));
  const h = v.querySelector('#agcuerpo .tdhead h2'); if (!h) return;
  const caja = h.parentElement;
  let b = $('agahoy');
  if (!otro) { if (b) b.remove(); return; }
  h.textContent = fechaLarga(new Date(AG_FECHA + 'T00:00:00')).replace(/^./, c => c.toUpperCase());
  if (!b) {
    h.insertAdjacentHTML('afterend', '<button type="button" class="btn sec" id="agahoy">Volver a hoy</button>');
    b = $('agahoy'); b.onclick = () => agVerDia(hoyISO());
  }
  // v2.338.0: en el móvil va delante de «+ Tarea», en la misma fila (Eric)
  const acts = !matchMedia('(min-width: 761px)').matches && v.querySelector('#agcuerpo .tdhead .acts');
  if (acts && acts.firstElementChild !== b) acts.prepend(b);
  caja.classList.add('agtitdia');
}



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
// [id, área, título, formato, mejor si sube (true/false/null), ayuda, a hoy, solo con importes, por defecto]
function anCatalogo() {
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
const anFamNombre = f => { const x = AN_FAM.find(a => a[0] === f); return x ? (typeof x[1] === 'function' ? x[1]() : x[1]) : f; };
const anFamVisible = f => { const x = AN_FAM.find(a => a[0] === f); return !!x && x[2](); };
const anKpiVisible = k => anFamVisible(k.fam) && (!k.imp || verImportes());

let AN_CFG = null, AN_DATOS = {};


// Las cifras: una llamada por cada combinación distinta de filtro y comparación
async function anCargarKpis() {
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

document.addEventListener('pointerdown', e => { if (!e.target.closest('.ankpop, [data-ancfg]')) document.querySelectorAll('.ankpop').forEach(x => x.remove()); }, true);



pintarResumenAnalitica = async function () {
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
};

// En «Filtros y columnas» van los del Resumen o los de Explorar según la pestaña
Object.defineProperty(HT_FILTROS, 'analitica', { configurable: true, enumerable: true,
  get: () => ANSEC === 'explorar' ? '#v-analitica .panel > .filtros' : '#anfil' });
cargarAnalitica = (orig => async function () {
  await orig();
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
})(cargarAnalitica);


