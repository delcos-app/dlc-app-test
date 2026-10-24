/* ============================================================
   DLC OS 2.0 · v2.26.0 · Rutas y Agenda, bloques 3 y 4:
   planificador semanal, días bloqueados, frecuencia objetivo,
   supervisión del equipo y aviso de horario de atención
   ============================================================ */

/* ---------------- qué agenda se está viendo ---------------- */



/* ---------------- días bloqueados ---------------- */



/* ---------------- semana: carga, bloqueos, arrastrar y planificador ---------------- */






/* ---------------- supervisión del equipo ---------------- */



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


