/* ============================================================
   v2.279.0 · Datos de acceso a mano, «Mi ficha» con lo necesario y ver la contraseña (peticiones de Eric, 12/10/2026; SQL 148).
   - Al dar de alta a alguien se guardan su usuario y su contraseña temporal; en su ventana de Usuarios, «Datos de acceso» los vuelve a
     enseñar para copiarlos. Cuando esa persona ya ha entrado, la contraseña ya no sirve: se borra y se ofrece enviarle el cambio.
   - Mi ficha del profesional: arriba, lo necesario para quitar el aviso de «faltan datos» (teléfono, al menos un día con horario y
     cómo prefiere las visitas), marcado según lo va rellenando; esos campos llevan «Necesario». Un centro sin nombre se puede escribir.
   - Cualquier campo de contraseña (también el de entrar) tiene un botón para ver lo que se escribe.
   ============================================================ */
async function verAccesoTemporal(u) {
  const { data: r } = await RPC_ORIG('ver_acceso_temporal', { p_usuario: u.id });
  const url = location.origin + location.pathname;
  const cab = t => `<div class="fh"><div><h2>${esc(t)}</h2><div class="sm">${esc(u.nombre || '')} · ${esc(u.email || '')}</div></div><button class="x" data-cerrar aria-label="Cerrar">✕</button></div>`;
  if (!r || !r.ok) {
    const txt = !r ? 'No se han podido leer sus datos de acceso.'
      : r.error === 'ya_entro' ? 'Ya ha entrado en la plataforma, así que su contraseña temporal ya no sirve. Si no la recuerda, envíale el cambio de contraseña.'
      : r.error === 'sin_datos' ? 'No hay datos de acceso guardados: se dio de alta antes de que se guardaran o con otro método. Envíale el cambio de contraseña para que ponga una.'
      : 'No tienes permiso para ver sus datos de acceso.';
    $('dbody').innerHTML = `${cab('Datos de acceso')}<p>${esc(txt)}</p>
      <div class="acts" style="justify-content:flex-end;flex-wrap:wrap">${r && r.error !== 'permiso' ? '<button class="btn sec" id="accpass">Enviar cambio de contraseña</button>' : ''}<button class="btn" data-cerrar>Cerrar</button></div>`;
    if ($('accpass')) $('accpass').onclick = () => { $('dlg').close(); restablecerPassword(u); };
    return;
  }
  const texto = `Hola ${nombrePila(r.nombre)}, ya tienes acceso a ${nombreApp()}.\nEntra en ${url}\nUsuario: ${r.email}\nContraseña temporal: ${r.pass}\nCámbiala al entrar (menú de tu nombre → Mi perfil).`;
  $('dbody').innerHTML = `${cab('Datos de acceso')}
    <div class="usrok"><div><span>Nombre</span><b>${esc(r.nombre)}</b></div><div><span>Rol</span><b>${esc(r.rol || '')}</b></div>
      <div><span>Usuario</span><b>${esc(r.email)}</b></div><div><span>Contraseña temporal</span><b class="mono">${esc(r.pass)}</b></div>
      ${r.cuenta ? `<div><span>${TT('medico', 's', '', 'l', 'C', 'vinculado')}</span><b>${esc(r.cuenta)}</b></div>` : ''}<div><span>Dirección</span><b>${esc(url)}</b></div></div>
    <p class="sm">Aún no ha entrado. Cuando entre por primera vez y cambie la contraseña, estos datos dejan de estar aquí.</p>
    <div class="acts" style="justify-content:flex-end;flex-wrap:wrap"><button class="btn sec" id="acccop">Copiar los datos</button><button class="btn" data-cerrar>Hecho</button></div>`;
  $('acccop').onclick = async () => { try { await navigator.clipboard.writeText(texto); toast('Copiado: pégalo en un mensaje'); } catch (e) { toast('No se ha podido copiar', true); } };
}

// Mi ficha: lo necesario para quitar el aviso, al día según se rellena
function pmPintarCheck() {
  const box = $('pmcheck'); if (!box || !PM.ficha) return;
  try { pmLeerForm(); } catch (e) {}
  const F = PM.ficha;
  const tel = !!String(F.telefono || '').trim(), como = !!String((F.visitas || {}).como || '').trim();
  const horario = (F.consultas || []).some(c => Object.values(c.dias || {}).some(l => (l || []).some(r => /^\d\d:\d\d$/.test(r[0]) && /^\d\d:\d\d$/.test(r[1]) && r[1] > r[0])));
  const todo = tel && como && horario;
  box.classList.toggle('ok', todo);
  box.innerHTML = `<b>${todo ? 'Tu ficha tiene todo lo necesario' : 'Para completar tu ficha'}</b>
    <ul><li class="${tel ? 'ok' : ''}">Un teléfono de contacto</li><li class="${horario ? 'ok' : ''}">${PM_CENTRO() ? 'Dónde y cuándo atendéis' : 'Dónde y cuándo atiendes'} (al menos un día con su horario)</li><li class="${como ? 'ok' : ''}">Cómo prefieres las ${TT('visita', 'p', '', 'l', 'l')}</li></ul>
    <span class="sm">${todo ? 'Envíalo a tu comercial y el aviso de «faltan datos» desaparece.' : 'El resto es opcional. Cuando lo tengas, pulsa «Enviar a mi comercial».'}</span>`;
}

// Ver la contraseña mientras se escribe, en cualquier campo de contraseña
const OJO_SVG = {
  ver: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  ocultar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.9 4.2A10.6 10.6 0 0 1 12 4c6.4 0 10 8 10 8a17.6 17.6 0 0 1-2.2 3.2M6.6 6.6C3.7 8.6 2 12 2 12s3.6 8 10 8a9.7 9.7 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/><path d="M2 2l20 20"/></svg>'
};
function ojoClave(inp) {
  if (!inp || inp.dataset.ojo || inp.closest('.pwdw')) return;
  inp.dataset.ojo = '1';
  const w = document.createElement('span'); w.className = 'pwdw';
  inp.parentNode.insertBefore(w, inp); w.appendChild(inp);
  const b = document.createElement('button'); b.type = 'button'; b.className = 'pwdojo'; b.innerHTML = OJO_SVG.ver;
  b.setAttribute('aria-label', 'Ver la contraseña'); b.title = 'Ver la contraseña';
  b.onclick = () => {
    const ver = inp.type === 'password'; inp.type = ver ? 'text' : 'password';
    b.innerHTML = ver ? OJO_SVG.ocultar : OJO_SVG.ver; const t = ver ? 'Ocultar la contraseña' : 'Ver la contraseña'; b.setAttribute('aria-label', t); b.title = t;
    inp.focus({ preventScroll: true });
  };
  w.appendChild(b);
}
document.querySelectorAll('input[type=password]').forEach(ojoClave);
new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) {
  if (n.nodeType !== 1) continue;
  if (n.matches && n.matches('input[type=password]')) ojoClave(n);
  else if (n.querySelectorAll) n.querySelectorAll('input[type=password]').forEach(ojoClave);
} }).observe(document.body, { childList: true, subtree: true });




