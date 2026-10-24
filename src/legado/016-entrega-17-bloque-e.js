/* ============================================================
   DLC OS 2.0 · Entrega 17 · Bloque E
   ============================================================ */

/* ---------------- copia local para consultar sin conexión ---------------- */

const CKEY = k => 'dlc-cache-' + (PERFIL ? PERFIL.id : '') + '-' + k;
const guardarCache = (k, d) => { try { localStorage.setItem(CKEY(k), JSON.stringify({ t: Date.now(), d })); } catch (e) {} };
const leerCache = k => { try { const x = JSON.parse(localStorage.getItem(CKEY(k)) || 'null'); return x ? x : null; } catch (e) { return null; } };

/** Llama a una función del servidor y guarda copia; sin conexión devuelve la última copia. */
async function rpcCache(fn, params, clave) {
  if (navigator.onLine) {
    const { data, error } = await db.rpc(fn, params);
    if (!error) { guardarCache(clave, data); return { data, cache: false }; }
  }
  const c = leerCache(clave);
  if (c) return { data: c.d, cache: true, fecha: c.t };
  return { data: null, cache: true };
}


/* ---------------- administración: secciones nuevas ---------------- */

async function pintarAccesos() {
  cargando($('admcuerpo'), 'Cargando los accesos…');
  const { data } = await db.rpc('accesos_lista', { p_usuario: null, lim: 200 });
  const l = data || [];
  ($('admcuerpo') || document.createElement('div')).innerHTML = `<h2>Accesos<span class="n">${l.length}</span></h2>
    <p class="sm">Últimas entradas y salidas de la plataforma.</p>
    <div class="lista">${l.map(a => `<div class="item" style="cursor:default">
      <span class="ic ${a.evento === 'Entrada' ? 'o' : ''}">${a.evento === 'Entrada' ? '→' : '←'}</span>
      <span class="tx"><b>${esc(a.usuario)}</b><span class="sm">${esc(a.evento)} ·
        ${new Date(a.creado_en).toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        ${a.agente ? ' · ' + esc(String(a.agente).slice(0, 60)) : ''}</span></span></div>`).join('')
      || '<div class="vacio">Todavía no hay accesos registrados.</div>'}</div>`;
}



/* ---------------- cartera y contraseña de un usuario ---------------- */

async function verCartera(id) {
  const u = USUARIOS.find(x => x.id === id) || {};
  cargando($('dbody'), 'Cargando la cartera…');
  $('dlg').showModal();
  const pinta = async q => {
    const { data } = await db.rpc('cartera_usuario', { p_usuario: id, q: q || null, lim: 500 });
    const l = data || [];
    $('dbody').innerHTML = `
      <div class="fh"><div><h2>Cartera de ${esc(u.nombre || '')}</h2>
        <div class="sm">${num(l.length)} ${TT('medico', 'p', '', 'l', 'l', 'asignado')}</div></div>
        <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
      <input id="cbusca" value="${esc(q || '')}" placeholder="Buscar dentro de la cartera">
      <div class="lista" style="max-height:52vh;overflow:auto">${l.map(m => `<div class="item" style="cursor:default">
        <span class="ic ${m.urgente ? 'w' : ''}">${m.urgente ? '!' : '·'}</span>
        <span class="tx"><b>${esc(m.nombre)}</b><span class="sm">${esc(m.especialidad || '')} · ${esc(m.centro || '')} ${esc(m.municipio || '')}
          ${m.ultima_visita ? ` · ${TT('visita', 's', 'ultimo', 'l', 'l')} ` + fechaCorta(m.ultima_visita) : ' · sin visitar'}</span></span>
        <span class="acts" style="margin:0">
          <button class="btn sec" data-cficha="${m.id}">Ficha</button>
          <button class="btn sec dang" data-cquita="${m.id}">Quitar</button></span></div>`).join('')
        || `<div class="vacio">Sin ${TT('medico', 'p', '', 'l', 'l', 'asignado')}.</div>`}</div>
      <div class="acts" style="justify-content:flex-end"><button class="btn sec" id="cmas">Asignar más ${TT('medico', 'p', '', 'l', 'l')}</button></div>`;

    let t;
    $('cbusca').oninput = e => { clearTimeout(t); t = setTimeout(() => pinta(e.target.value.trim()), 300); };
    $('dbody').querySelectorAll('[data-cficha]').forEach(b => b.onclick = () => { $('dlg').close(); abrirFicha(b.dataset.cficha); });
    $('dbody').querySelectorAll('[data-cquita]').forEach(b => b.onclick = async () => {
      if (!await preguntar(`Dejará de verlo en su cartera. El histórico de ${TT('visita', 'p', '', 'l', 'l')} no cambia.`,
        { titulo: '¿Quitar de la cartera?', ok: 'Quitar', peligro: true })) return;
      const { data: r } = await db.rpc('quitar_de_cartera', { p_usuario: id, p_medico: b.dataset.cquita });
      if (r && r.ok === false) { toast('No tienes permiso', true); return; }
      toast('Quitado de la cartera'); pinta(q); cargarAdmin();
    });
    $('cmas').onclick = () => { $('dlg').close(); asignarCartera(id); };
  };
  pinta('');
}

async function restablecerPassword(u) {
  if (!u.email) { toast('Ese usuario no tiene correo', true); return; }
  if (!await preguntar(`Se enviará a ${u.email} un correo para que cree una contraseña nueva.`,
    { titulo: '¿Restablecer la contraseña?', ok: 'Enviar correo' })) return;
  const { error } = await db.auth.resetPasswordForEmail(u.email, { redirectTo: location.origin + location.pathname });
  if (error) { toast('No se ha podido enviar: ' + error.message, true); return; }
  toast('Correo enviado a ' + u.email);
}



