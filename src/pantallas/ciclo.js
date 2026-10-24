// pantallas/ciclo.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

function menuCiclo() {
  const nav = document.querySelector('nav.main .in'); if (!nav) return;
  let b = nav.querySelector('[data-t="ciclo"]');
  if (!b) { const tras = nav.querySelector('[data-t="rutas"]') || nav.querySelector('[data-t="agenda"]'); if (!tras) return; tras.insertAdjacentHTML('afterend', `<button data-t="ciclo" aria-selected="false">Ciclo de ${TT('visita', 'p', '', 'l', 'l')}</button>`); b = nav.querySelector('[data-t="ciclo"]'); }
  b.classList.toggle('hide', !!(ES_MEDICO() || !puedeModulo('agenda')));
}

async function cicSelectorDe() {
  if (!VE_TODO()) return '';
  if (!COMS.length) { try { await cargarComerciales(); } catch (e) {} }
  return `<select id="cicde" aria-label="De quién"><option value="">Todo el equipo</option>${COMS.map(u => `<option value="${u.id}" ${CIC_DE === u.id ? 'selected' : ''}>${esc(u.nombre)}</option>`).join('')}</select>`;
}

async function pintarCiclo() {
  const caja = $('cfgcuerpo'); if (!caja) return;
  const [{ data: d, error }, sel] = await Promise.all([db.rpc('ciclo_cuentas', { p_usuario: cicUsuario() }), cicSelectorDe()]);
  if (!$('cfgcuerpo') || TAB !== 'ciclo') return;
  if (error || !d) { caja.innerHTML = '<div class="vacio">No se ha podido cargar el ciclo.</div>'; return; }
  const res = Object.fromEntries((d.resumen || []).map(x => [x.clase, x])), obj = d.objetivo || {};
  const clasif = (d.resumen || []).reduce((s, x) => s + x.cuentas, 0);
  const pend = (d.pendientes || []).filter(p => !CIC_FIL || p.clase === CIC_FIL);
  const tarjeta = k => { const x = res[k] || { cuentas: 0, al_dia: 0, hechas: 0, objetivo: 0 }, p = x.objetivo ? Math.round(x.hechas / x.objetivo * 100) : 0;
    return `<div class="card cicc">${cicPill(k)}<div class="cicct"><b>${x.cuentas ? `${num(x.al_dia)} de ${num(x.cuentas)} al día` : `Ninguno en ${k}`}</b>
      <span class="sm">${cicVis(obj[k] || 0)} cada ${cicNombre(d.meses)}</span></div>
      ${x.cuentas ? `<div class="cicbar"><i style="width:${p}%"></i></div><span class="sm">${num(x.hechas)} de ${cicVis(x.objetivo)} hechas · ${p}%</span>` : ''}</div>`; };
  caja.innerHTML = `<div class="cicpag"><div class="ciccab"><div><b>${esc(cicNombre(d.meses).replace(/^./, c => c.toUpperCase()))} del ${fechaCorta(d.desde)} al ${fechaCorta(d.hasta)}</b>
      <span class="sm">${d.quedan_dias === 1 ? 'Queda 1 día' : `Quedan ${num(d.quedan_dias)} días`} · cuentan todas las ${TT('visita', 'p', '', 'l', 'l')} registradas, también por teléfono o videollamada</span></div>
      <span class="cicacc">${sel}${puede('administrar') ? '<button type="button" class="btn sec" id="cicajustar">Ajustar el ciclo</button>' : ''}</span></div>
    ${d.sin_clase ? `<div class="banda-aviso cicsin">${d.sin_clase === 1 ? `1 ${TT('medico', 's', '', 'l', 'l')} sin clasificar` : `${num(d.sin_clase)} ${TT('medico', 'p', '', 'l', 'l')} sin clasificar`}: sin clase no cuentan en el ciclo.
      <button type="button" class="btn sec" id="cicirclas">Clasificar</button></div>` : ''}
    ${clasif ? `<div class="cicres">${CIC_CLASES.map(tarjeta).join('')}</div>
    <section class="card cicbloque"><div class="cicbcab"><h2>Les faltan ${TT('visita', 'p', '', 'l', 'l')} este ${cicNombre(d.meses)}</h2>
        <span class="segs" id="cicfil" role="group" aria-label="Clase">${[['', 'Todas']].concat(CIC_CLASES.map(k => [k, k])).map(([k, t]) => `<button type="button" data-cf="${k}" class="${k === CIC_FIL ? 'on' : ''}" aria-pressed="${k === CIC_FIL}">${t}</button>`).join('')}</span></div>
      ${pend.length ? `<div class="lista">${pend.map(p => `<div class="item cicrow">${cicPill(p.clase)}
        <span class="tx"><button type="button" class="lnk" data-cfi="${p.id}"><b>${esc(p.nombre)}</b></button>
          <span class="sm">${esc([p.especialidad, p.municipio].filter(Boolean).join(' · '))}${p.ultima_visita ? ` · última ${TT('visita', 's', '', 'l', 'l')} ${fechaCorta(p.ultima_visita)}` : ` · sin ${TT('visita', 'p', '', 'l', 'l')}`}</span></span>
        <span class="cicfal"><b>${p.hechas} de ${p.objetivo}</b><span class="sm">${p.faltan === 1 ? 'falta 1' : `faltan ${p.faltan}`}</span></span>
        ${p.proxima_cita ? `<span class="pill p-per">Cita el ${fechaCorta(p.proxima_cita)}</span>` : `<button type="button" class="btn sec" data-ccita="${p.id}">+ Cita</button>`}</div>`).join('')}</div>`
        : `<div class="vacio vlinea">${CIC_FIL ? `En ${CIC_FIL} no le falta ${TT('visita', 's', '', 'l', 'l')} a nadie.` : `Todos al día este ${cicNombre(d.meses)}.`}</div>`}</section>`
    : `<div class="vacio">Todavía no hay ${TT('medico', 'p', '', 'l', 'l')} en A, B o C. Empieza por «Clasificar»: A para los más importantes, B para los intermedios y C para el resto.</div>`}</div>`;
  if ($('cicde')) $('cicde').onchange = e => { CIC_DE = e.target.value; pintarCiclo(); };
  if ($('cicajustar')) $('cicajustar').onclick = () => editorCiclo();
  if ($('cicirclas')) $('cicirclas').onclick = () => { CIC_CLF = 'sin'; cicIrA('clasificar'); };
  caja.querySelectorAll('#cicfil [data-cf]').forEach(b => b.onclick = () => { CIC_FIL = b.dataset.cf; pintarCiclo(); });
  caja.querySelectorAll('[data-cfi]').forEach(b => b.onclick = () => abrirFicha(b.dataset.cfi));
  caja.querySelectorAll('[data-ccita]').forEach(b => b.onclick = () => nuevaCita(b.dataset.ccita));
}

async function pintarClasificar() {
  const caja = $('cfgcuerpo'); if (!caja) return;
  const [{ data: l, error }, sel] = await Promise.all([db.rpc('cuentas_para_clasificar', { p_usuario: cicUsuario(), p_filtro: CIC_CLF, p_q: CIC_Q || null }), cicSelectorDe()]);
  if (!$('cfgcuerpo') || TAB !== 'ciclo') return;
  if (error) { caja.innerHTML = '<div class="vacio">No se han podido cargar las fichas.</div>'; return; }
  const filas = l || [], fil = [['sin', 'Sin clasificar']].concat(CIC_CLASES.map(k => [k, k]), [['todas', 'Todas']]);
  const yaQ = $('cicq') && document.activeElement === $('cicq');
  caja.innerHTML = `<div class="cicpag"><div class="ciccab"><span class="segs" id="cicclf" role="group" aria-label="Mostrar">${fil.map(([k, t]) => `<button type="button" data-cl="${k}" class="${k === CIC_CLF ? 'on' : ''}" aria-pressed="${k === CIC_CLF}">${t}</button>`).join('')}</span>
      <span class="cicacc"><input id="cicq" type="search" placeholder="Buscar por nombre, ${TT('especialidad', 's', '', 'l', 'l')} o municipio" value="${esc(CIC_Q)}" aria-label="Buscar">${sel}</span></div>
    <p class="sm">Pulsa A, B o C en cada ${TT('medico', 's', '', 'l', 'l')}: <b>A</b> para los más importantes, <b>B</b> para los intermedios y <b>C</b> para el resto. Pulsar la letra marcada la quita. Las ${TT('visita', 'p', '', 'l', 'l')} de los últimos 12 meses ayudan a decidir.</p>
    ${filas.length ? `<section class="card cicbloque"><div class="lista">${filas.map(m => `<div class="item cicrow" data-cfila="${m.id}">
        <span class="tx"><button type="button" class="lnk" data-cfi="${m.id}"><b>${esc(m.nombre)}</b></button>
          <span class="sm">${esc([m.especialidad, m.municipio, m.estado_comercial].filter(Boolean).join(' · '))}</span></span>
        <span class="cicfal"><b>${num(m.actividades_12m)}</b><span class="sm">en 12 meses</span></span>
        ${cicSegs(m.id, m.clase)}</div>`).join('')}</div></section>${filas.length >= 300 ? '<p class="sm">Se ven las 300 primeras: busca para encontrar el resto.</p>' : ''}`
      : `<div class="vacio vlinea">${CIC_CLF === 'sin' && !CIC_Q ? `Todos están clasificados.` : 'No hay ninguno con este filtro.'}</div>`}</div>`;
  caja.querySelectorAll('#cicclf [data-cl]').forEach(b => b.onclick = () => { CIC_CLF = b.dataset.cl; pintarClasificar(); });
  let t = null;
  $('cicq').oninput = e => { clearTimeout(t); t = setTimeout(() => { CIC_Q = e.target.value.trim(); pintarClasificar(); }, 350); };
  if (yaQ) { const i = $('cicq'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
  if ($('cicde')) $('cicde').onchange = e => { CIC_DE = e.target.value; pintarClasificar(); };
  caja.querySelectorAll('[data-cfi]').forEach(b => b.onclick = () => abrirFicha(b.dataset.cfi));
}

async function editorCiclo() {
  await cargarAjustes();
  const c = Object.assign({ meses: 3, A: 3, B: 2, C: 1 }, AJUSTES.ciclo_visitas || {});
  $('dbody').innerHTML = `<div class="fh"><div><h2>Ciclo de ${TT('visita', 'p', '', 'l', 'l')} A/B/C</h2>
      <div class="sm">Cuántas ${TT('visita', 'p', '', 'l', 'l')} necesita cada clase en cada ciclo. El ciclo va por el calendario: con un trimestre, de enero a marzo, de abril a junio…</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <label for="cicmeses">Duración del ciclo</label><select id="cicmeses">${[[1, 'Un mes'], [2, 'Dos meses'], [3, 'Un trimestre'], [4, 'Cuatro meses'], [6, 'Un semestre'], [12, 'Un año']].map(([m, t]) => `<option value="${m}" ${+c.meses === m ? 'selected' : ''}>${t}</option>`).join('')}</select>
    <div class="cicobj">${CIC_CLASES.map(k => `<label>${cicPill(k)}<span>${TT('visita', 'p', '', 'l', 'C')} por ciclo</span><input type="number" min="0" max="31" step="1" data-cobj="${k}" value="${Math.max(0, +c[k] || 0)}" aria-label="${TT('visita', 'p', '', 'l', 'C')} de la clase ${k}"></label>`).join('')}</div>
    <p class="sm">Con 0, esa clase no pide ${TT('visita', 'p', '', 'l', 'l')}. Cambiarlo no borra nada: solo cambia lo que se cuenta.</p>
    <div class="acts" style="justify-content:flex-end"><button class="btn sec" data-cerrar>Cancelar</button><button class="btn" id="cicok">Guardar</button></div>`;
  if (!$('dlg').open) $('dlg').showModal();
  $('cicok').onclick = async () => {
    const v = { meses: +$('cicmeses').value || 3 };
    $('dbody').querySelectorAll('[data-cobj]').forEach(i => v[i.dataset.cobj] = Math.min(31, Math.max(0, Math.floor(+i.value || 0))));
    const { data: r, error } = await db.rpc('guardar_ajuste', { p_clave: 'ciclo_visitas', p_valor: v });
    if (error || (r && r.ok === false)) { toast('No se ha podido guardar', true); return; }
    AJUSTES.ciclo_visitas = v; $('dlg').close(); toast('Ciclo guardado'); invalidarCache();
  };
}

async function pintarCicloEquipo() {
  const caja = $('cfgcuerpo'); if (!caja) return;
  const [{ data: l }, { data: d }] = await Promise.all([db.rpc('ciclo_equipo'), db.rpc('ciclo_rango')]);
  if (!$('cfgcuerpo') || TAB !== 'ciclo') return;
  const f = l || [], rg = (d || [])[0];
  caja.innerHTML = `<div class="cicpag">${rg ? `<p class="sm">${esc(cicNombre(rg.meses).replace(/^./, c => c.toUpperCase()))} del ${fechaCorta(rg.desde)} al ${fechaCorta(rg.hasta)} · A ${cicVis(rg.obj_a)}, B ${rg.obj_b} y C ${rg.obj_c} por ${TT('medico', 's', '', 'l', 'l')}.</p>` : ''}
    ${f.length ? `<div class="card cicbloque"><div class="dgrid-wrap"><table class="trtabla cictab"><thead><tr><th>Persona</th><th>Cartera</th><th>A</th><th>B</th><th>C</th><th>Sin clase</th><th>Al día</th><th>${TT('visita', 'p', '', 'l', 'C')} del ciclo</th></tr></thead>
      <tbody>${f.map(x => { const cl = x.a + x.b + x.c, p = x.objetivo ? Math.round(x.hechas / x.objetivo * 100) : null;
        return `<tr><td><button type="button" class="lnk" data-cde="${x.id}"><b>${esc(x.nombre)}</b></button><span class="sm"> · ${esc(x.rol)}</span></td><td>${num(x.cartera)}</td><td>${num(x.a)}</td><td>${num(x.b)}</td><td>${num(x.c)}</td>
          <td class="${x.sin_clase ? 'cicaviso' : ''}">${num(x.sin_clase)}</td><td>${cl ? `${num(x.al_dia)} de ${num(cl)}` : '—'}</td>
          <td>${p == null ? '—' : `<span class="cicbarc"><span class="cicbar"><i style="width:${p}%"></i></span>${num(x.hechas)} de ${num(x.objetivo)} · ${p}%</span>`}</td></tr>`; }).join('')}</tbody></table></div></div>
      <p class="sm">Cada ${TT('medico', 's', '', 'l', 'l')} cuenta hasta las ${TT('visita', 'p', '', 'l', 'l')} de su clase (si tiene más, no compensan las que faltan en otro). Pulsa una persona para ver su ciclo.</p>`
      : '<div class="vacio">Nadie del equipo tiene cartera asignada.</div>'}</div>`;
  caja.querySelectorAll('[data-cde]').forEach(b => b.onclick = () => { CIC_DE = b.dataset.cde; cicIrA('ciclo'); });
}

// Ficha: la clase y las visitas del ciclo, en el bloque «Estado»
async function cicFicha(id) {
  const { data: c } = await db.rpc('ciclo_de_cuenta', { p_id: id });
  const box = $('fciclo'); if (!c || !box || FICHA_ID !== id) return;
  box.innerHTML = `<span class="sm cicfl">Clase</span>${puedeEditar() ? cicSegs(id, c.clase) : cicPill(c.clase)}
    <span class="sm">${c.clase ? (c.objetivo ? `${c.hechas} de ${cicVis(c.objetivo)} este ${cicNombre(c.meses)}` : `${cicVis(c.hechas)} este ${cicNombre(c.meses)} · su clase no pide ${TT('visita', 'p', '', 'l', 'l')}`) : `Sin clasificar · ${cicVis(c.hechas)} este ${cicNombre(c.meses)}`}</span>`;
}

// Ciclo de visitas → «Por producto»
async function pintarCobertura() {
  const caja = $('cfgcuerpo'); if (!caja) return;
  const [{ data: d, error }, sel] = await Promise.all([db.rpc('ciclo_cobertura', { p_usuario: cicUsuario() }), cicSelectorDe()]);
  if (!$('cfgcuerpo') || TAB !== 'ciclo') return;
  if (error || !d) { caja.innerHTML = '<div class="vacio">No se ha podido cargar la cobertura.</div>'; return; }
  const l = d.productos || [];
  const fila = (k, x) => { const p = x.cuentas ? Math.round(x.presentado / x.cuentas * 100) : 0;
    return `<div class="cobf">${cicPill(k)}<span class="cicbar"><i style="width:${p}%"></i></span><span class="cobn"><b>${num(x.presentado)} de ${num(x.cuentas)}</b> · ${p}%</span></div>`; };
  caja.innerHTML = `<div class="cicpag"><div class="ciccab"><div><b>${esc(cicNombre(d.meses).replace(/^./, c => c.toUpperCase()))} del ${fechaCorta(d.desde)} al ${fechaCorta(d.hasta)}</b>
      <span class="sm">Cuántos ${TT('medico', 'p', '', 'l', 'l')} de cada clase han oído hablar de cada producto en sus ${TT('visita', 'p', '', 'l', 'l')} de este ${cicNombre(d.meses)}</span></div>
      <span class="cicacc">${sel}</span></div>
    ${!l.length ? `<div class="vacio">Ningún producto se promociona todavía.${puede('administrar') ? ' Márcalo en Productos: abre el producto y activa «Se promociona en las ' + TT('visita', 'p', '', 'l', 'l') + '».' : ''}</div>`
    : !d.cuentas ? `<div class="vacio">Todavía no hay ${TT('medico', 'p', '', 'l', 'l')} en A, B o C: la cobertura se mide sobre los clasificados. <button type="button" class="btn sec" id="cobclas">Clasificar</button></div>`
    : `<div class="cobgrid">${l.map(p => { const tot = (p.clases || []).reduce((s, x) => ({ c: s.c + x.cuentas, p: s.p + x.presentado }), { c: 0, p: 0 });
        return `<section class="card cobcard"><div class="cobcab"><h2>${esc(p.nombre)}</h2><span class="cobtot">${tot.c ? Math.round(tot.p / tot.c * 100) : 0}%</span></div>
          ${(p.clases || []).map(x => fila(x.clase, x)).join('')}
          ${(p.faltan || []).length ? `<details class="cobfal"><summary>A quién le falta${tot.c - tot.p > (p.faltan || []).length ? ` (los ${p.faltan.length} primeros de ${num(tot.c - tot.p)})` : ` (${num(p.faltan.length)})`}</summary>
            <div class="lista">${p.faltan.map(m => `<div class="item cicrow">${cicPill(m.clase)}<span class="tx"><button type="button" class="lnk" data-cfi="${m.id}"><b>${esc(m.nombre)}</b></button>
              <span class="sm">${esc([m.especialidad, m.municipio].filter(Boolean).join(' · '))}</span></span><button type="button" class="btn sec" data-ccita="${m.id}">+ Cita</button></div>`).join('')}</div></details>`
            : '<div class="banda-ok cobok">Todos lo han oído este ' + cicNombre(d.meses) + '.</div>'}</section>`; }).join('')}</div>`}</div>`;
  if ($('cicde')) $('cicde').onchange = e => { CIC_DE = e.target.value; pintarCobertura(); };
  if ($('cobclas')) $('cobclas').onclick = () => { CIC_CLF = 'sin'; cicIrA('clasificar'); };
  caja.querySelectorAll('[data-cfi]').forEach(b => b.onclick = () => abrirFicha(b.dataset.cfi));
  caja.querySelectorAll('[data-ccita]').forEach(b => b.onclick = () => nuevaCita(b.dataset.ccita));
}
