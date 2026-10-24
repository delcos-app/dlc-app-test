/* ============================================================
   DLC OS 2.0 · v2.26.0 · Rutas y Agenda, bloques 3 y 4:
   planificador semanal, días bloqueados, frecuencia objetivo,
   supervisión del equipo y aviso de horario de atención
   ============================================================ */

/* ---------------- qué agenda se está viendo ---------------- */



/* ---------------- días bloqueados ---------------- */

async function bloqueadosSemana(desde, hasta) {
  const { data } = await RPC_ORIG('dias_bloqueados_rango', { p_desde: desde, p_hasta: hasta, p_usuario: agUid() });
  const b = {}; (data || []).forEach(x => b[x.fecha] = x.motivo || 'Día bloqueado');
  return b;
}


/* ---------------- semana: carga, bloqueos, arrastrar y planificador ---------------- */






/* ---------------- supervisión del equipo ---------------- */

async function pintarEquipo() {
  $('agcuerpo').innerHTML = `<div class="semhead"><h2 style="padding:0">Equipo y cumplimiento</h2>
      ${puede('administrar') ? '<button class="btn sec" id="eqfrec">⚙ Frecuencia objetivo</button>' : ''}</div>
    <div class="filtros" style="border:0;padding:4px 16px 10px"><div id="eqper"></div></div>
    <div id="eqtabla"></div>`;
  if ($('eqfrec')) $('eqfrec').onclick = editorFrecuencia;
  const pinta = async () => {
    cargando($('eqtabla'), 'Calculando…');
    const r = $('eqper').__rango();
    const { data, error } = await RPC_ORIG('supervision_equipo', { p_desde: r.desde || '2000-01-01', p_hasta: r.hasta || isoMas(hoyISO(), 365) });
    if (error) { $('eqtabla').innerHTML = `<div class="vacio">${esc(error.message)}</div>`; return; }
    const l = data || [];
    const pct = x => { const base = x.visitadas + x.no_estaba + x.aplazadas + x.sin_hacer; return base ? Math.round(x.visitadas / base * 100) : null; };
    $('eqtabla').innerHTML = l.length ? `<div class="dgrid-wrap"><div class="dgrid eq">
      <div class="dh"><span>Persona</span><span class="num">Cartera</span><span class="num">Citas</span><span class="num">Visitadas</span>
        <span class="num">No estaba</span><span class="num">Aplazadas</span><span class="num">Sin hacer</span><span>Cumplimiento</span>
        <span class="num">${TT('visita', 'p', '', 'l', 'C')}</span><span class="num">Les toca</span></div>
      ${l.map(x => { const p = pct(x); return `<button class="dr" data-eqver="${x.id}" title="Ver su agenda">
        <span><b>${esc(x.nombre)}</b><span class="sm">${esc(x.rol)}</span></span>
        <span class="num">${num(x.cartera)}</span><span class="num">${num(x.citas)}</span>
        <span class="num"><b style="color:var(--ok)">${num(x.visitadas)}</b></span><span class="num">${num(x.no_estaba)}</span>
        <span class="num">${num(x.aplazadas)}</span><span class="num" style="${x.sin_hacer ? 'color:var(--warn);font-weight:700' : ''}">${num(x.sin_hacer)}</span>
        <span>${p == null ? '<span class="vac">—</span>' : `<span class="barra"><i style="width:${p}%;${p < 60 ? 'background:var(--warn)' : ''}"></i><em>${p}%</em></span>`}</span>
        <span class="num">${num(x.visitas)}</span>
        <span class="num" style="${x.atrasados ? 'color:var(--warn);font-weight:700' : ''}">${num(x.atrasados)}</span></button>`; }).join('')}
    </div></div>
    <p class="sm" style="padding:10px 16px 14px"><b>Cumplimiento</b> = visitadas sobre las citas de días ya pasados (visitadas, no estaba, aplazadas y sin hacer).
      <b>Les toca</b> = ${TT('medico', 'p', '', 'l', 'l')} de su cartera que llevan más tiempo sin ${TT('visita', 's', '', 'l', 'l')} que su frecuencia objetivo. Pulsa una persona para ver su agenda.</p>`
      : '<div class="vacio">Sin actividad en este periodo.</div>';
    $('eqtabla').querySelectorAll('[data-eqver]').forEach(b => b.onclick = () => { AG_MODO = 'semana'; AG_FECHA = hoyISO(); verAgendaDe(b.dataset.eqver); });
  };
  montarPeriodo($('eqper'), { id: 'equipo', valor: 'semana', alCambiar: pinta });
  pinta();
}


/* ---------------- cabecera de la agenda: de quién es y equipo ---------------- */


document.addEventListener('click', e => {
  const b = e.target.closest('[data-ag="equipo"]');
  if (!b) return;
  e.stopImmediatePropagation();
  AG_MODO = 'equipo'; cargarAgenda();
}, true);

// Al salir de la agenda se vuelve a la propia

/* ---------------- aviso: falta el horario de atención ---------------- */




/* ---------------- ayudas ---------------- */

AYUDA.agenda[2].push(
  'En la <b>semana</b>: la hora con «~» junto al día es el fin estimado (en naranja si pasa de la hora de vuelta con la que se planificó). Arrastra una cita a otro día para moverla. El menú «⋯» de cada día permite añadir una cita o <b>bloquear el día</b> (vacaciones, formación…).',
  `<b>Planificar la semana</b> reparte ${TT('medico', 'p', '', 'l', 'l')} entre los días libres: a quien le toca ${TT('visita', 's', '', 'l', 'l')}, urgentes, interesados, nunca visitados o una de tus rutas. Cada uno cae un día que atiende y agrupado por zona. Revisa la propuesta y pulsa <b>Guardar en la agenda</b>.`,
  'Administración y televenta pueden ver la agenda de otra persona con el selector de arriba, planificarle la semana y ver el <b>cumplimiento del equipo</b> con el botón «Equipo».');


