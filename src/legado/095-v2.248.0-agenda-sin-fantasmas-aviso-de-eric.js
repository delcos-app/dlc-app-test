/* ============================================================
   v2.248.0 · Agenda sin fantasmas (aviso de Eric: al cambiar de día, abrir la semana o el mes, planificar o volver, las piezas
   aparecían tarde y se movían). Cada pieza pedía sus datos y se pintaba al llegar: la bandeja y «Volver a hoy» empujaban las
   tarjetas, los «⋯» de la cinta salían después, la semana se pintaba dos veces… Ahora cada cambio pide primero todo lo que
   necesita (agConDatos: los datos quedan a mano en AG_PRE mientras se pinta) y lo pinta todo de una vez, sin pasar por la red.
   Además:
   - Fuera las pantallas sueltas de Semana y Mes de antes (flechas, Día/Semana/Mes, varios meses): quien pide la semana llega a la
     vista del día con la semana desplegada en la cinta, y quien pide el mes, con el mes abierto. Equipo tiene su pantalla
     (agCargarEquipo).
   - Las bandejas «Les toca visita» y «Pendientes de días anteriores» vuelven a abrirse (desde la v2.245 no hacían nada).
   - «Ver la semana» cambia su texto cuando la semana ya está pintada; el mes se abre ya pintado.
   ============================================================ */
const AG_PRE = new Map(); let AG_PRE_USO = 0;
rpcCache = (orig => function (fn, params, clave, ...x) {
  if (AG_PRE.size && fn === 'agenda_rango' && params) { const k = agK(fn, params.p_desde, params.p_hasta, params.p_usuario); if (AG_PRE.has(k)) return Promise.resolve(AG_PRE.get(k)); }
  return orig.call(this, fn, params, clave, ...x);
})(rpcCache);








