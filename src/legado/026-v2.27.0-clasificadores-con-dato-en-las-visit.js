/* ============================================================
   DLC OS 2.0 · v2.27.0 · Clasificadores con dato en las visitas,
   material comercial, Clientes con filtros, columnas en el panel
   lateral, mapa del plan y aviso de cita repetida
   ============================================================ */

Object.assign(RPC_TTL, { clasificadores_actividad: 300, municipios_clientes: 300 });

/* ---------------- registrar visita con datos ---------------- */

// v2.205.0: los resultados sin dato ya salen en la línea de la visita; no son material
const detTxt = v => (v.detalles || []).filter(d => !esMuestras(d) && !(!d.dato && (v.resultados || []).includes(d.valor)))
  .map(d => d.valor + (d.dato ? ' (' + d.dato + ')' : '')).join(', ');


/* Registrar visita: la ventana base y el aviso si falta el horario de atención (antes eran 3 capas). */
async function abrirVisita(id) {
  return ventanaCargando(async () => {
    await abrirVisitaBase(id);
    await visitaAvisoHorario(id);
  });
}


/* Parte base; abrirVisita le añade el resto */
async function abrirVisitaBase(id) {
  const [{ data, error }, { data: clas }] = (VISITA_OP = null, await visitaDatos(id));   // v2.259.0: sin red, con la copia guardada   // v2.179.0: con la ficha, marca los resultados que no tocan en su estado
  if (error) { toast('No se ha podido abrir: ' + error.message, true); return; }
  const m = data.medico, cons = data.consultas || [];
  const grupos = (clas || []).filter(c => (c.valores || []).length);
  const res = grupos.find(c => c.papel === 'resultado_visita') || { clave: '', papel: 'resultado_visita', nombre: 'Resultado', valores: CAT.resultado_visita || [] };
  const otros = grupos.filter(c => c !== res);
  const idx = {};   // clave del botón → { clasificador, valor }
  const boton = (c, v, neg) => {
    const k = c.clave + '::' + v.valor; idx[k] = { c: c.clave, v };
    return `<span class="optw"${v.oculto ? ' data-oculto="1"' : ''}><button type="button" class="opt ${neg ? 'neg' : ''}" data-vk="${esc(k)}" ${c === res ? `data-res="${esc(v.valor)}"` : ''} ${neg ? 'data-neg="1"' : ''} aria-pressed="false">
      <span class="mk"></span>${esc(v.valor)}${v.dato_tipo ? ' <span class="datom">+ dato</span>' : ''}</button>
      ${v.dato_tipo ? `<span class="datobox hide" data-box="${esc(k)}">${campoDato(v, k)}</span>` : ''}</span>`;
  };

  $('dbody').innerHTML = `
    <div class="fh"><div><h2>Registrar ${TT('visita', 's', '', 'l', 'l')}</h2><div class="sm">${esc(m.nombre)}</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="g2">
      <div><label for="vf">Fecha</label><input id="vf" type="date" value="${hoyISO()}"></div>
      <div><label for="vc">Centro ${TT('visita', 's', 'del', 'l', 'l')}</label><select id="vc">
        ${cons.map(c => `<option value="${c.id}">${esc(c.centro_nombre || consultaPrivada())}${c.municipio ? ' · ' + esc(c.municipio) : ''}</option>`).join('')}
      </select></div>
    </div>
    <label>Resultado <span class="sm">· puedes marcar varios de «${TT('visita', 's', '', 'l', 'l', 'realizado')}»</span></label>
    <div class="opciones">${res.valores.filter(v => v.extra !== 'neg').map(v => boton(res, v, false)).join('')}</div>
    <div class="opciones" style="margin-top:8px">${res.valores.filter(v => v.extra === 'neg').map(v => boton(res, v, true)).join('')}</div>
    ${otros.map(c => `<label>${esc(c.nombre)}${c.descripcion ? ` <span class="sm">· ${esc(c.descripcion)}</span>` : ''}</label>
      <div class="opciones">${c.valores.map(v => boton(c, v, false)).join('')}</div>`).join('')}
    <div class="g2" style="margin-top:6px">
      <div><label for="vpa">Próxima acción</label><input id="vpa" placeholder="p. ej. Llevar reporting"></div>
      <div><label for="vpf">Fecha de la próxima acción</label><input id="vpf" type="date"></div>
    </div>
    <label for="vn">Nota</label><textarea id="vn" rows="3"></textarea>
    <div class="acts" style="justify-content:flex-end">
      <button class="btn sec" data-cerrar>Cancelar</button>
      <button class="btn" id="vguardar">Guardar ${TT('visita', 's', '', 'l', 'l')}</button>
    </div>`;

  $('dbody').querySelectorAll('[data-vk]').forEach(b => b.onclick = () => {
    const k = b.dataset.vk, info = idx[k], on = b.getAttribute('aria-pressed') === 'true';
    if (info.c === res.clave) {
      const esNeg = b.dataset.neg === '1';
      $('dbody').querySelectorAll('[data-res]').forEach(x => {
        if ((esNeg || x.dataset.neg === '1') && x !== b) {
          x.setAttribute('aria-pressed', 'false');
          const bx = $('dbody').querySelector(`[data-box="${CSS.escape(x.dataset.vk)}"]`); if (bx) bx.classList.add('hide');
        }
      });
    }
    b.setAttribute('aria-pressed', String(!on));
    const box = $('dbody').querySelector(`[data-box="${CSS.escape(k)}"]`);
    if (box) { box.classList.toggle('hide', on); if (!on) { const i = box.querySelector('input, select'); if (i) setTimeout(() => i.focus(), 30); } }
  });

  $('vguardar').onclick = async ev => {
    const marcados = [...$('dbody').querySelectorAll('[data-vk][aria-pressed=true]')].map(b => b.dataset.vk);
    const resultados = marcados.filter(k => idx[k].c === res.clave).map(k => idx[k].v.valor);
    if (!resultados.length) { toast('Elige al menos un resultado', true); return; }
    const detalles = marcados.map(k => {
      const el = $('dbody').querySelector(`[data-dato="${CSS.escape(k)}"]`);
      const d = el ? el.value.trim() : '';
      return Object.assign({ clasificador: idx[k].c, valor: idx[k].v.valor }, d ? { dato: d } : {});
    });
    ev.target.disabled = true; ev.target.textContent = 'Guardando…';
    const { data: r, error: err } = await escribirRpc('registrar_actividad', { p: {
      cuenta_id: id, ubicacion_id: $('vc').value || null, fecha: $('vf').value,
      resultados, detalles, nota: $('vn').value.trim(),
      proxima_accion: $('vpa').value.trim(), proxima_fecha: $('vpf').value || null,
      op_id: VISITA_OP || (VISITA_OP = 'v-' + id + '-' + Date.now())
    }});
    ev.target.disabled = false; ev.target.textContent = `Guardar ${TT('visita', 's', '', 'l', 'l')}`;
    if (err) { toast('No se ha podido guardar: ' + err.message, true); return; }
    $('dlg').close();
    if (!(r && r.encolada)) toast(`${TT('visita', 's', '', 'l', 'C', 'registrado')}` + (r && r.estado ? ' · estado: ' + r.estado : ''));
    // v2.87.0: si estaba marcada como urgente y la visita se ha hecho, se pregunta si se quita la marca
    const hecha = marcados.some(k => idx[k].c === res.clave && idx[k].v.extra !== 'neg');
    if (m.urgente && hecha) {
      const op = await elegirOpcion('Estaba marcada como urgente',
        `${m.nombre}${m.urgente_motivo ? ' · ' + m.urgente_motivo : ''}\n\n¿Quitas la marca de urgente ahora que ya la has visitado?`,
        [{ k: 'dejar', t: 'La dejo', cls: 'sec' }, { k: 'quitar', t: 'Quitar urgente' }]);
      if (op === 'quitar') {
        const { error: e2 } = await db.from('cuentas').update({ urgente: false, urgente_motivo: null }).eq('id', id);
        toast(e2 ? 'No se ha podido quitar la marca' : 'Ya no está marcada como urgente', !!e2);
      }
    }
    cargarInicio();
    if (FICHA_ID === id) abrirFicha(id);
  };
  $('dlg').showModal();
}

/* ---------------- clasificadores: configurar el dato de cada valor ---------------- */


abrirClasificador = (orig => function (id) {
  orig(id);
  const c = CATS.find(x => x.id === id);
  const permitido = puede('administrar') || ((PERFIL.areas || {}).K || 0) >= 2;
  if (!c || !permitido || !['visita'].includes(c.ambito) && c.papel !== 'resultado_visita') return;
  // Cada vez que se repinta la ventana, se añaden los botones de dato
  const decorar = () => {
    const items = $('dbody').querySelectorAll('.lista > .item');
    (c.valores || []).forEach((v, i) => {
      const it = items[i]; if (!it || it.querySelector('[data-vdato]')) return;
      const tx = it.querySelector('.tx');
      if (v.dato_tipo) tx.insertAdjacentHTML('beforeend', `<span class="sm">Pide: ${esc(v.dato_etiqueta || v.dato_tipo)}${v.dato_tipo === 'lista' ? ' (' + (v.dato_opciones || []).length + ' opciones)' : ''}</span>`);
      const acts = it.querySelector('.acts');
      if (acts) acts.insertAdjacentHTML('afterbegin', `<button class="btn sec" data-vdato="${v.id}">${v.dato_tipo ? 'Cambiar dato' : '+ Dato'}</button>`);
    });
    $('dbody').querySelectorAll('[data-vdato]').forEach(b => b.onclick = () => {
      const v = (c.valores || []).find(x => x.id === b.dataset.vdato);
      editorDato(v, async () => {
        const { data } = await db.rpc('catalogos_todos'); CATS = data || [];
        cargarCatalogos(); abrirClasificador(id);
      });
    });
    if (!$('dbody').querySelector('.datoinfo')) $('dbody').querySelector('.fh').insertAdjacentHTML('afterend',
      `<p class="sm datoinfo">Con <b>+ Dato</b>, al marcar ese valor en ${TT('visita', 's', 'un', 'l', 'l')} se pedirá también una cantidad, un texto o una opción de una lista.</p>`);
  };
  decorar();
  new MutationObserver((_, obs) => { if (!$('dlg').open) { obs.disconnect(); return; } decorar(); })
    .observe($('dbody'), { childList: true });
})(abrirClasificador);

/* ---------------- ficha: material y datos en el historial de visitas ---------------- */


/* ---------------- plan: mapa con su propio botón y «Descartar plan» ---------------- */


/* ---------------- columnas dentro del panel lateral ---------------- */

function abrirColumnas() {
  const d = $('tools');
  let D = colsConfig();
  const pinta = () => {
    d.innerHTML = `<div class="tbox">
      <div class="fh"><h2>Columnas</h2><button class="x" id="tclose" aria-label="Cerrar">✕</button></div>
      <button class="kcfg" id="tcvolver" style="margin:0 0 10px">← Volver a los filtros</button>
      <p class="sm">Marca las que quieres ver y ordénalas con las flechas. Se aplica al momento. El ancho se cambia arrastrando el borde de cada cabecera.</p>
      <div class="lista tcols">${D.map((c, i) => {
        const col = COLS.find(x => x.k === c.k) || { t: c.k };
        return `<label class="item" style="cursor:pointer;margin:0">
          <input type="checkbox" data-con="${i}" ${c.on ? 'checked' : ''} ${col.fijo ? 'disabled' : ''}>
          <span class="tx"><b>${esc(col.t)}</b>${col.fijo ? '<span class="sm">siempre visible</span>' : ''}</span>
          <span class="kord" style="flex-direction:row">
            <button type="button" class="kmv" data-cmv="${i}|-1" aria-label="Subir" ${i === 0 ? 'disabled' : ''}>${ICO.arriba}</button>
            <button type="button" class="kmv" data-cmv="${i}|1" aria-label="Bajar" ${i === D.length - 1 ? 'disabled' : ''}>${ICO.abajo}</button></span></label>`;
      }).join('')}</div>
      <div class="acts"><button class="btn sec" id="tcres">Restaurar las columnas</button></div></div>`;
    const aplicar = () => { colsGuardar(D); buscar(true); };
    $('tclose').onclick = () => d.classList.remove('abierto');
    $('tcvolver').onclick = () => { HERR_CTX = null; abrirHerramientas('directorio'); };
    d.querySelectorAll('[data-con]').forEach(i => i.onchange = () => {
      D[+i.dataset.con].on = i.checked;
      if (!D.some(c => c.on)) { i.checked = true; D[+i.dataset.con].on = true; toast('Deja al menos una columna', true); return; }
      aplicar();
    });
    d.querySelectorAll('[data-cmv]').forEach(b => b.onclick = e => {
      e.preventDefault();
      const [i, dir] = b.dataset.cmv.split('|').map(Number), j = i + dir;
      if (j < 0 || j >= D.length) return;
      [D[i], D[j]] = [D[j], D[i]]; aplicar(); pinta();
    });
    $('tcres').onclick = () => { localStorage.removeItem(colKey()); D = colsConfig(); buscar(true); pinta(); };
  };
  pinta();
  d.classList.add('abierto');
}

/* ---------------- Clientes (antes Pacientes): tipo y filtros ---------------- */

Object.assign(PAC, { tipo: '', pedidos: '', municipio: '' });


async function pintarPacientes() {
  const { data: munis } = await db.rpc('municipios_clientes');
  $('vcuerpo').innerHTML = `
    <div class="panel">
      <div class="filtros">
        <div><label for="pacq">Buscar</label><input id="pacq" type="search" value="${esc(PAC.q)}" placeholder="Nombre, teléfono, email, DNI o CIF"></div>
        <div><label for="pactipo">Tipo</label><select id="pactipo">
          <option value="">Todos</option><option value="Persona" ${PAC.tipo === 'Persona' ? 'selected' : ''}>Personas (${TT('paciente', 'p', '', 'l', 'l')})</option>
          <option value="Empresa" ${PAC.tipo === 'Empresa' ? 'selected' : ''}>Empresas</option></select></div>
        <div><label for="pacped">Pedidos</label><select id="pacped">
          <option value="">Todos</option><option value="con" ${PAC.pedidos === 'con' ? 'selected' : ''}>Con pedidos</option>
          <option value="sin" ${PAC.pedidos === 'sin' ? 'selected' : ''}>Sin pedidos</option></select></div>
        <div><label for="pacmun">Población</label><select id="pacmun"><option value="">Todas</option>
          ${(munis || []).map(x => `<option value="${esc(x.v)}" ${PAC.municipio === x.v ? 'selected' : ''}>${esc(x.v)} (${x.n})</option>`).join('')}</select></div>
        ${camposFiltros('cliente', PAC.campos = PAC.campos || {}, 'pfcp')}
        ${PAC.medico ? `<div><label>${TT('medico', 's', '', 'l', 'C')}</label><div style="min-height:44px;display:flex;align-items:center"><button class="chip" id="pacmedx">${esc(PAC.medicoNombre)} ✕</button></div></div>` : ''}
      </div>
      <div class="cuenta" id="paccuenta">Cargando…</div>
      <div id="paclista"></div>
      <div id="pacpag"></div>
    </div>`;
  let tq;
  $('pacq').oninput = e => { clearTimeout(tq); tq = setTimeout(() => { PAC.q = e.target.value.trim(); PAC.pagina = 0; listaPacientes(); }, 300); };
  $('pactipo').onchange = e => { PAC.tipo = e.target.value; PAC.pagina = 0; listaPacientes(); };
  $('pacped').onchange = e => { PAC.pedidos = e.target.value; PAC.pagina = 0; listaPacientes(); };
  $('pacmun').onchange = e => { PAC.municipio = e.target.value; PAC.pagina = 0; listaPacientes(); };
  camposFiltrosActivar($('vcuerpo'), PAC.campos, () => { PAC.pagina = 0; listaPacientes(); });
  if ($('pacmedx')) $('pacmedx').onclick = () => { PAC.medico = null; PAC.medicoNombre = ''; PAC.pagina = 0; pintarPacientes(); };
  listaPacientes();
}


document.querySelectorAll('#nav [data-t="pacientes"]').forEach(b => b.textContent = 'Clientes');

/* ---------------- nueva cita: aviso si ya tiene cita ese día ---------------- */

async function citaRepetida(medicoId, fecha) {
  const uid = TAB === 'agenda' && AG_VISTA ? AG_VISTA.id : PERFIL.id;
  const { data } = await RPC_ORIG('agenda_rango', { p_desde: fecha, p_hasta: fecha, p_usuario: uid });
  const ya = (data || []).find(c => c.cuenta_id === medicoId && CITA_ABIERTA.includes(c.estado));
  if (!ya) return 'nueva';
  const op = await elegirOpcion('Ya tiene una cita ese día',
    `${ya.nombre}\n${fechaLarga(new Date(fecha + 'T00:00:00'))}${ya.hora ? ' a las ' + String(ya.hora).slice(0, 5) : ''} · ${ya.estado}${ya.origen ? ' · ' + ya.origen : ''}\n\n¿Qué quieres hacer?`,
    [{ k: 'no', t: 'Cancelar', cls: 'sec' }, { k: 'dos', t: 'Mantener las dos', cls: 'sec' }, { k: 'sust', t: 'Quedarme solo con la nueva' }]);
  if (!op) return null;
  if (op === 'sust') {
    const { data: r } = await db.rpc('borrar_cita', { p_id: ya.id });
    if (r && r.ok === false) { toast('No se ha podido quitar la cita anterior', true); return null; }
  }
  return op;
}

/* ---------------- ayudas ---------------- */

Object.assign(AYUDA, {
  pacientes: ['Clientes', `${TT('paciente', 'p', '', 'l', 'C')} (personas) y empresas que compran con ${TT('medico', 's', 'un', 'l', 'l')} de referencia.`, [
    `La columna <b>Tipo</b> distingue ${TT('paciente', 'p', '', 'l', 'l')} y empresas. Filtra por tipo, si tienen pedidos o por población.`,
    `Cada cliente tiene un <b>${TT('medico', 's', '', 'l', 'l')} que lo trata</b>: se elige al darlo de alta o se asigna solo con su primer pedido.`,
    'A una persona se le pide DNI o NIE; a una empresa, el CIF.']]
});
AYUDA.config = AYUDA.config || ['Configuración', '', []];
AYUDA.config[2].push(`En <b>Clasificadores</b>, los de ${TT('visita', 'p', '', 'l', 'l')} (resultados, material comercial…) pueden pedir un <b>dato</b> al marcarse: una cantidad, un texto o una opción de una lista. Usa «+ Dato» en cada valor.`);
AYUDA.agenda[2].push(`Si añades una cita a ${TT('medico', 's', 'un', 'l', 'l')} que ya tiene otra ese día, te avisa y eliges: mantener las dos o quedarte solo con la nueva.`);


