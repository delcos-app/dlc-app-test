/* ============================================================
   DLC OS 2.0 · v2.24.0 · «Tu día»: la agenda del día es la ruta.
   Estados de cita, orden del día, jornada en curso
   ============================================================ */

/* ---------------- estados de cita ---------------- */

Object.assign(EST_COL, { Planificada: 'var(--navy)', Confirmada: 'var(--sky)', Visitada: 'var(--ok)',
  'No estaba': 'var(--warn)', Aplazada: 'var(--muted)', Descartada: 'var(--muted)' });

// La ruta en curso de versiones anteriores se sustituye por la jornada
try { Object.keys(localStorage).filter(k => k.startsWith('dlc-ruta-')).forEach(k => localStorage.removeItem(k)); } catch (e) {}

/* ---------------- jornada ---------------- */



async function empezarJornada() {
  const citas = await citasDelDia(hoyISO());
  if (!citas.some(c => CITA_ABIERTA.includes(c.estado))) { toast('No tienes citas abiertas hoy. Añade citas o planifica una ruta.', true); return; }
  localStorage.setItem(JKEY(), JSON.stringify({ fecha: hoyISO(), inicio: Date.now() }));
  pintarRutaBarra();
  toast('Jornada iniciada');
  AG_MODO = 'dia'; AG_FECHA = hoyISO();
  if (TAB === 'agenda') cargarAgenda(); else ir('agenda');
}



/* ---------------- orden y horas estimadas ---------------- */


/** Calcula la hora estimada de cada cita abierta siguiendo el orden actual. */

/** Orden por cercanía: las citas con hora fija marcan el esqueleto; las demás se insertan donde menos desvío suman. */



/* ---------------- «Tu día» en la agenda ---------------- */



// (v2.183.0: aquí iba la primera versión de menuCita; se redefine entera más abajo)
document.addEventListener('pointerdown', e => {
  if (!e.target.closest('.tdmenu, .tdmas')) document.querySelectorAll('.tdmenu').forEach(m => m.remove());
}, true);
// Se cierra al desplazarse, salvo en el primer instante (el propio toque puede mover un poco la página)
document.addEventListener('scroll', () => document.querySelectorAll('.tdmenu').forEach(m => { if (Date.now() - (m.__t || 0) > 400) m.remove(); }), true);

async function accionCita(k, c) {
  const refrescar = () => agRefrescoQuieto(c.id);
  if (k === 'ficha') return abrirFicha(c.cuenta_id);
  if (k === 'llegar') return navegarA(xyCita(c));
  if (k === 'hora') return cambiarHoraCita(c.id, c.hora || '');
  if (k === 'confirmar' || k === 'desconfirmar' || k === 'descartar') {
    const estado = k === 'confirmar' ? 'Confirmada' : k === 'desconfirmar' ? 'Planificada' : 'Descartada';
    const r = await escribir('estado_cita', { p_id: c.id, p_estado: estado });
    if (r && r.error) { toast('No se ha podido cambiar', true); return; }
    toast(estado === 'Confirmada' ? 'Cita confirmada' : estado === 'Descartada' ? 'Cita descartada' : 'Confirmación quitada'); refrescar(); return;
  }
  if (k === 'borrar') {
    if (!await preguntar('La cita desaparece de la agenda sin dejar rastro.', { titulo: '¿Eliminar la cita?', ok: 'Eliminar', peligro: true })) return;
    const { data: r } = await db.rpc('borrar_cita', { p_id: c.id });
    if (r && r.ok === false) { toast(r.error === 'pasada' ? 'Solo se pueden eliminar citas de hoy en adelante' : 'No se ha podido eliminar', true); return; }
    toast('Cita eliminada'); refrescar(); return;
  }
  if (k === 'aplazar') {
    const f = await pedirFecha('¿A qué día la pasas?', proximoDiaConsulta(c.dias, c.fecha),
      { titulo: 'Aplazar la cita', ok: 'Aplazar' });
    if (!f) return;
    const { data: r, error } = await db.rpc('aplazar_cita', { p_id: c.id, p_fecha: f, p_hora: null, p_origen: 'Aplazada' });
    if (error || (r && r.ok === false)) { toast('No se ha podido aplazar', true); return; }
    toast(r && r.ya ? 'Ya tenía una cita ese día' : r && r.mismo_dia ? 'Sigue en el mismo día' : r && r.reabierta ? 'Vuelve a su cita del ' + fechaCorta(f) : 'Aplazada al ' + fechaCorta(f)); refrescar(); return;
  }
  if (k === 'noestaba') {
    const neg = (CAT.resultado_visita || []).filter(x => x.extra === 'neg');
    if (!neg.length) { toast('Falta un resultado negativo en Configuración → Clasificadores', true); return; }
    let res = neg[0].valor;
    if (neg.length > 1) {
      const op = await elegirOpcion('¿Qué ha pasado?', c.nombre, [{ k: 'no', t: 'Cancelar', cls: 'sec' }].concat(neg.map((x, i) => ({ k: 'n' + i, t: x.valor, cls: 'sec' }))));
      if (!op) return;
      res = neg[+op.slice(1)].valor;
    }
    const { error } = await escribirRpc('registrar_actividad', { p: { cuenta_id: c.cuenta_id, fecha: c.fecha, resultados: [res],
      op_id: 'v-' + c.cuenta_id + '-' + Date.now() } });
    if (error) { toast('No se ha podido guardar: ' + error.message, true); return; }
    toast('Anotado: ' + res);
    refrescar();
    return nuevaFechaTrasNoEstaba(c);
  }
  if (k === 'nueva') return nuevaFechaTrasNoEstaba(c);
}


document.addEventListener('click', async e => {
  const b = e.target.closest('[data-td]');
  if (!b) return;
  e.stopPropagation();
  const [acc, id] = b.dataset.td.split('|');
  const c = TD_CITAS.find(x => x.id === id);
  if (!c) return;
  if (acc === 'mas') return menuCita(b, c);
  if (acc === 'visita') { if (!puedeRegistrarEnDia(c.fecha)) return; VISITA_FECHA = c.fecha; return abrirVisita(c.cuenta_id); }
  if (acc === 'nueva') return nuevaFechaTrasNoEstaba(c);
  if (acc === 'sube' || acc === 'baja') {
    const ab = TD_CITAS.filter(x => CITA_ABIERTA.includes(x.estado)), i = ab.indexOf(c), j = acc === 'sube' ? i - 1 : i + 1;
    if (j < 0 || j >= ab.length) return;
    [ab[i], ab[j]] = [ab[j], ab[i]];
    const orden = TD_CITAS.filter(x => !CITA_ABIERTA.includes(x.estado)).concat(ab);
    moverCitaLocal(orden, c.id, acc);
  }
});

// La vista de día de la agenda es «Tu día»

// Al cerrar una visita o una cita, se refresca el día
$('dlg').addEventListener('close', () => { if (TAB === 'agenda' && agCambiosEnVentana()) setTimeout(() => agRefrescoQuieto(), 350); });

// En la semana, «Mover» ahora aplaza (antes dejaba la cita en un estado que ya no existía)
document.addEventListener('click', async e => {
  const c = e.target.closest('[data-cita^="repro|"]');
  if (!c) return;
  e.stopImmediatePropagation(); e.preventDefault();
  const id = c.dataset.cita.split('|')[1];
  const f = await pedirFecha('¿A qué día la pasas?', isoMas(hoyISO(), 1), { titulo: 'Aplazar la cita', ok: 'Aplazar' });
  if (!f) return;
  const { data: r, error } = await db.rpc('aplazar_cita', { p_id: id, p_fecha: f, p_hora: null, p_origen: 'Aplazada' });
  if (error || (r && r.ok === false)) { toast('No se ha podido aplazar', true); return; }
  toast('Aplazada al ' + fechaCorta(f)); cargarAgenda();
}, true);

/* ---------------- rutas: el plan se convierte en la agenda del día ---------------- */




// En Rutas, la ruta en curso se ve en «Tu día»
async function pintarRutaEnCurso() {
  if (TAB !== 'rutas') return;
  if (!$('renc')) $('v-rutas').querySelector('.saludo').insertAdjacentHTML('afterend', '<div id="renc"></div>');
  const j = jornadaActiva();
  $('renc').innerHTML = j ? `<div class="card renc"><h2>Jornada en curso</h2>
    <p class="sm">Empezaste hace ${durTxt(Date.now() - j.inicio)}. El orden, las horas y el registro de ${TT('visita', 'p', '', 'l', 'l')} están en tu agenda de hoy.</p>
    <div class="acts" style="padding:0 16px 16px"><button class="btn" id="rencver">Ver mi día</button>
      <button class="btn sec dang" id="rencfin">Terminar jornada</button></div></div>` : '';
  if (j) { $('rencver').onclick = () => { AG_MODO = 'dia'; AG_FECHA = hoyISO(); ir('agenda'); }; $('rencfin').onclick = terminarJornada; }
}

/* ---------------- ayudas ---------------- */

Object.assign(AYUDA, {
  agenda: ['Agenda y «Tu día»', 'Tus citas por día, semana o mes. La vista de día es tu ruta.', [
    'Las citas se ordenan como vas a visitarlas. <b>Ordenar por cercanía</b> calcula el recorrido más corto; las citas con hora fija se respetan. Las flechas cambian el orden a mano.',
    'La hora con «~» es una estimación según el orden, tu horario y los desplazamientos. Una hora sin «~» es una hora fijada.',
    `<b>Empezar jornada</b> activa la barra verde. Registra cada ${TT('visita', 's', '', 'l', 'l')} al terminarla: la cita pasa a <b>Visitada</b>.`,
    'Estados: <b>Planificada</b> y <b>Confirmada</b> (abiertas); <b>Visitada</b>, <b>No estaba</b>, <b>Aplazada</b> y <b>Descartada</b> (cerradas).',
    '<b>No estaba</b> lo anota en su historial y te propone el próximo día que atiende.',
    '<b>Aplazar</b> deja la cita como aplazada y crea la nueva, así se ve el cumplimiento real.',
    'Las citas abiertas de días anteriores aparecen abajo para moverlas a hoy.']],
  rutas: ['Rutas', 'Plantillas para llenar tu agenda.', [
    `<b>Lista fija</b>: tú eliges ${TT('medico', 'p', 'el', 'l', 'l')}. <b>Por criterios</b>: se rellena sola con los filtros.`,
    'Al planificar ves el orden y las horas estimadas. <b>Guardar en mi agenda</b> crea las citas de ese día; <b>Pasar a mi agenda y empezar</b> además inicia la jornada.',
    'Durante la jornada todo se hace desde <b>Agenda → Tu día</b>.',
    `La salida y la vuelta son de cada ruta (y del planificador semanal); <b>⚙ Tiempos de ${TT('visita', 's', '', 'l', 'l')}</b> cambia los minutos por ${TT('medico', 's', '', 'l', 'l')} y por parada.`,
    `Solo entran ${TT('medico', 'p', '', 'l', 'l')} con ubicación. Completar la dirección y los días de atención mejora mucho las rutas.`]]
});


