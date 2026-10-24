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

function rpPlanDe(i) {
  const p = RPROP.lista[i]; if (!p) return null;
  PROPUESTAS = PROPUESTAS || {};
  PROPUESTAS['prop' + (i + 1)] = p.sel;   // así «Tiempos de visita» puede recalcular el plan
  return p;
}
async function rpPlan(i, btn) {
  const p = rpPlanDe(i); if (!p) return;
  await construirPlan(p.sel, 'prop' + (i + 1), btn, { manana: RPROP.manana, horario: null });
}
async function rpAgenda(i, btn) {
  const p = rpPlanDe(i); if (!p) return;
  btn.disabled = true;
  try {
    PLAN = null;
    await construirPlan(p.sel, 'prop' + (i + 1), btn, { manana: RPROP.manana, horario: null });
    if (!PLAN) return;
    const r = await planAAgenda(PLAN);
    if (!r) return;
    toast(`${r.n} citas en tu agenda ${rpNombreDia(r.fecha) === 'hoy' ? 'de hoy' : 'del ' + fechaCorta(r.fecha)}`);
    PLAN = null; AG_MODO = 'dia'; AG_FECHA = r.fecha; ir('agenda');
  } finally { btn.disabled = false; }
}

async function rpCargar(manana) {
  const obj = rpObjetivo(manana);
  const { data, error } = await db.rpc('rutas_candidatos', { p_fecha: obj.fecha });
  if (error) { if ($('rprops')) $('rprops').innerHTML = `<div class="vacio">No se han podido calcular las propuestas: ${esc(error.message)}</div>`; return; }
  RPROP = Object.assign(obj, { datos: data || {}, lista: rpArmar((data || {}).candidatos || [], obj) });
  rpPintar();
}

// Mis rutas: lista compacta con «Planificar» y el resto en el menú ⋯
function rpMisRutas() {
  const caja = $('rmis'); if (!caja) return;
  const R = RUTAS || [];
  caja.innerHTML = `<div class="fh"><h2>Mis rutas${R.length ? `<span class="n">${R.length}</span>` : ''}</h2></div>
    ${R.length ? `<div class="lista">${R.map(r => `<div class="item rmit" style="cursor:default">
        <span class="tx"><b>${esc(r.nombre)}</b><span class="sm">${r.dinamica ? 'Por criterios' : num(r.n_fijos || 0) + ' ' + TT('medico', 'p', '', 'l', 'l')}${r.visitados ? ` · ${num(r.visitados)} visitados` : ''}${r.mia ? '' : ' · de ' + esc(r.duenyo || '')}</span></span>
        <span class="acts" style="margin:0"><button class="btn sec" type="button" data-ruta="${r.id}">Planificar</button>
          <button class="btn sec tdmas" type="button" data-rmas="${r.id}" aria-label="Más opciones de ${esc(r.nombre)}">⋯</button></span></div>`).join('')}</div>`
    : `<div class="rguia"><p>Una ruta es una lista de ${TT('medico', 'p', '', 'l', 'l')} a quienes vas a ver a menudo: con nombres concretos o por criterios (municipio, estado, días de atención) que se recalculan solos.</p>
        <div class="acts"><button class="btn sec" type="button" id="rrnueva">+ Crear mi primera ruta</button></div></div>`}`;
  if ($('rrnueva')) $('rrnueva').onclick = () => editorRuta(null);
  caja.querySelectorAll('[data-ruta]').forEach(b => b.onclick = () => planificar(b.dataset.ruta, b));
  caja.querySelectorAll('[data-rmas]').forEach(b => b.onclick = () => rpMenuRuta(b, R.find(x => x.id === b.dataset.rmas)));
}
function rpMenuRuta(boton, r) {
  document.querySelectorAll('.tdmenu').forEach(m => m.remove());
  if (!r) return;
  const ed = r.mia || puede('administrar');
  const ops = [['ver', `Ver ${TT('medico', 'p', '', 'l', 'l')}`], ed ? ['editar', 'Editar'] : null, ed ? ['duplicar', 'Duplicar'] : null, ed ? ['eliminar', 'Eliminar'] : null].filter(Boolean);
  const m = document.createElement('div');
  m.className = 'tdmenu'; m.__t = Date.now();
  m.innerHTML = ops.map(([k, t]) => `<button type="button" data-rmop="${k}" class="${k === 'eliminar' ? 'peligro' : ''}"><b>${t}</b></button>`).join('');
  document.body.appendChild(m);
  const b = boton.getBoundingClientRect();
  m.style.top = Math.min(window.innerHeight - m.offsetHeight - 10, b.bottom + 6) + 'px';
  m.style.left = Math.max(10, Math.min(window.innerWidth - m.offsetWidth - 10, b.right - m.offsetWidth)) + 'px';
  m.querySelectorAll('[data-rmop]').forEach(x => x.onclick = async () => {
    m.remove();
    const k = x.dataset.rmop;
    if (k === 'ver') return verMedicosRuta(r.id);
    if (k === 'editar') return editorRuta(r.id);
    if (k === 'duplicar') return duplicarRuta(r.id);
    if (!await preguntar(`Se elimina "${r.nombre}".\nLos ${TT('medico', 'p', '', 'l', 'l')} y sus ${TT('visita', 'p', '', 'l', 'l')} no se borran.`,
      { titulo: '¿Eliminar la ruta?', ok: 'Eliminar', peligro: true })) return;
    await db.rpc('guardar_ruta', { p: { id: r.id, activa: false } });
    toast('Ruta eliminada'); cargarRutas();
  });
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

/* v2.147.0 · Agenda: «Tu día» sin citas (petición de Eric). Sin contadores a cero; en un día pasado, «No tuviste citas este día.» (no se
   puede añadir nada); el mensaje, compacto: icono y frase en una línea, centrado. */
function agDiaVacio() {
  const c = $('agcuerpo'); if (!c || TAB !== 'agenda') return;
  const v = c.querySelector(':scope > .vacio'), st = c.querySelector('.tdhead .tdstats');
  const sinCitas = !!v && !c.querySelector('.tdesc');
  if (st) st.classList.toggle('hide', sinCitas);
  if (!v) return;
  v.classList.add('vlinea');
  if (AG_FECHA < hoyISO()) v.textContent = 'No tuviste citas este día.';
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
let AN_CFG = null, AN_DATOS = {};

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
document.addEventListener('pointerdown', e => { if (!e.target.closest('.ankpop, [data-ancfg]')) document.querySelectorAll('.ankpop').forEach(x => x.remove()); }, true);

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


