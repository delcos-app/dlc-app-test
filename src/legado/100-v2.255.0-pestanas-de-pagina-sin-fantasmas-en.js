/* ============================================================
   v2.255.0 · Pestañas de página sin fantasmas. En Ciclo de visitas (como administración), al cambiar de pestaña la página se volvía a
   montar y se iba llenando en varios pasos. Las pestañas de las páginas (Ciclo, Eventos, Intervenciones, Concursos, Parque, Mi perfil,
   Empresa…) usan ahora la copia fija y atenuada que ya usaban las demás pestañas de la app, hasta que la nueva está entera. De la lista
   de botones que la usan salen los de la Agenda de antes (Día, Semana, Mes y las flechas), que ya no existen.
   Analítica (resumen y Explorar) ya llegaba y cambiaba de una vez (prueba ciclo2255).
   ============================================================ */
document.addEventListener('click', e => {
  const b = e.target.closest('main .pagtabs [data-ptab]'); if (!b || b.classList.contains('on')) return;
  congelar(b.closest('main > section'));
}, true);


