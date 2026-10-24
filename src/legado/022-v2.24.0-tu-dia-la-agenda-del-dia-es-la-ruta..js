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


