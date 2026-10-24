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
const agK = (fn, d, h, u) => [fn, d, h, u || ''].join('|');
rpcCache = (orig => function (fn, params, clave, ...x) {
  if (AG_PRE.size && fn === 'agenda_rango' && params) { const k = agK(fn, params.p_desde, params.p_hasta, params.p_usuario); if (AG_PRE.has(k)) return Promise.resolve(AG_PRE.get(k)); }
  return orig.call(this, fn, params, clave, ...x);
})(rpcCache);
bloqueadosSemana = (orig => function (d, h, ...x) {
  const k = agK('bloq', d, h, agUid()); if (AG_PRE.has(k)) return Promise.resolve(AG_PRE.get(k));
  return orig.call(this, d, h, ...x);
})(bloqueadosSemana);


// ---- «Tu día» con sus bandejas y «En este centro también», de una vez
async function pintarTuDia() {
  if (!agConCinta()) return;
  const f = AG_FECHA;
  let s = null;
  await agConDatos([...agDiaCargas(f), !AG_SUG || AG_SUG.fecha !== f ? agSugDatos(f).then(x => { s = x; }) : null], async () => {
    if (AG_FECHA !== f || !agConCinta()) return;
    agPonerSug(f, s);
    await tdPintar();
    if (agN()) { agTamb(); agBandejas(); }
  });
}

// ---- Elegir otro día: todo lo que cambia (Tu día, bandejas, cinta, «Tu semana», la semana abierta) aparece a la vez
agVerDia = async function (f) {
  document.querySelectorAll('.agpop').forEach(x => x.remove());
  cerrarMesCinta();
  if (!f) return;
  if (!agN()) { AG_MODO = 'dia'; AG_FECHA = f; return cargarAgenda(); }
  const antes = AG_FECHA || f; AG_FECHA = f;
  const c = $('agcuerpo'); if (c) c.classList.add('agcargando');
  const fuera = !CINTA_INI || f < CINTA_INI || f > diasMas(CINTA_INI, 13); if (fuera) CINTA_INI = lunesCinta(f);
  const otraSem = lunesDe(f) !== lunesDe(antes);
  let s = null;
  try {
    await agConDatos([...agDiaCargas(f), agSugDatos(f).then(x => { s = x; }), ...(fuera ? agCintaCargas() : []), ...agSemCargas(f)], async () => {
      if (AG_FECHA !== f || !agN()) return;
      agPonerSug(f, s);
      const piezas = [pintarTuDia(), agSemanaLateral()];
      if (fuera || (otraSem && AG_SEM_ABIERTA)) piezas.push(agCinta());
      await Promise.all(piezas);
      if (!fuera) document.querySelectorAll('#agcinta .cdia').forEach(x => x.classList.toggle('sel', x.dataset.cf === f));
      agMarcarDia(); agDiaVacio(); agPastillas();
    });
  } finally { const cc = $('agcuerpo'); if (cc) cc.classList.remove('agcargando'); }
  if (AG_FECHA !== f) return;
  const cc = $('agcuerpo'); if (!cc) return;
  const top = cc.getBoundingClientRect().top;
  if (top < 80 || top > innerHeight * 0.6) scrollTo({ top: scrollY + top - 90, behavior: 'smooth' });
};

// ---- Cinta: datos, «⋯» de cada día y semana desplegada, de una vez
agCinta = (orig => async function () {
  if (!agN()) return;
  if (!CINTA_INI) CINTA_INI = lunesCinta(AG_FECHA || hoyISO());
  return agConDatos([...agCintaCargas(), ...(AG_SEM_ABIERTA ? agSemCargas(AG_FECHA) : [])], async () => {
    await orig();
    if (!agN() || !$('agcinta')) return;
    await agMenusCinta();
    if (AG_SEM_ABIERTA) await agPintarSemanaExp();
    agBotonSemana();
    const b = $('cmesb'); if (b) b.onclick = e => { e.stopPropagation(); agMesPop(); };
    const h = $('choy'); if (h) h.onclick = () => { CINTA_INI = null; agVerDia(hoyISO()); };
  });
})(agCinta);
agSemanaLateral = (orig => function (...a) {
  if (!agN()) return orig.apply(this, a);
  return agConDatos(agSemCargas(AG_FECHA), () => orig.apply(this, a));
})(agSemanaLateral);
agPintarSemanaExp = (orig => function (...a) {
  if (!agN()) return orig.apply(this, a);
  return agConDatos(AG_SEM_ABIERTA ? agSemCargas(AG_FECHA) : [], () => orig.apply(this, a));
})(agPintarSemanaExp);




