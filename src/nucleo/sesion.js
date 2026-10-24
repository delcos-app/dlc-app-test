// nucleo/sesion.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

async function entrarComo(id) {
  const u = (USUARIOS || []).find(x => x.id === id) || { nombre: 'esta persona' };
  const inv = esInvitado(u);
  if (!await preguntar(inv
      ? `Abrirás una sesión con el usuario de ${u.nombre} y verás su portal tal como lo ve.\n\nLo que hagas quedará a su nombre y la impersonalización queda registrada en la auditoría. Para terminar, pulsa «Terminar la impersonalización» en la barra morada de arriba.`
      : `Abrirás una sesión con el usuario de ${u.nombre}: su menú, sus permisos, su cartera y sus datos.\n\nLo que hagas quedará a su nombre y la impersonalización queda registrada en la auditoría. Para terminar, pulsa «Terminar la impersonalización» en la barra morada de arriba.`,
    { titulo: `¿Impersonalizar a ${u.nombre}?`, ok: 'Impersonalizar' })) return;
  pantallaCarga('Impersonalizando a ' + u.nombre + '…');
  const { data: { session } } = await db.auth.getSession();
  if (!session) { quitarCarga(); toast(SUPL_ERR.sesion, true); return; }
  let { data, error } = await db.functions.invoke('impersonar', { body: { usuario_id: id } });
  // La función antigua respondía con un error HTTP: se lee el motivo igualmente
  if (error && !data && error.context && typeof error.context.json === 'function') { try { data = await error.context.json(); } catch (e) {} }
  if (!data || !data.ok) {
    const e = data && data.error;
    toast(SUPL_ERR[e] || ('No se ha podido entrar: ' + ((data && data.detalle) || (error && error.message) || e || 'la función «impersonar» no responde')), true);
    if (!SUPL_ERR[e] || e === 'sesion') registrarError('api', 'Impersonalizar: ' + (e || (error && error.message) || 'sin respuesta'), { estado: error && error.context && error.context.status, detalle: data && data.detalle });
    quitarCarga(); return;
  }
  localStorage.setItem(SKEY, JSON.stringify({ access_token: session.access_token, refresh_token: session.refresh_token,
    nombre: PERFIL.nombre, id: PERFIL.id, como: data.nombre, rol: data.rol, desde: Date.now() }));
  const { error: e2 } = await db.auth.verifyOtp({ token_hash: data.token_hash, type: 'magiclink' });
  if (e2) {
    localStorage.removeItem(SKEY);
    await db.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token });
    registrarError('api', 'Impersonalizar: no se abre la sesión', { mensaje: e2.message });
    toast('No se ha podido abrir su sesión: ' + e2.message, true); quitarCarga(); return;
  }
  limpiarDatosLocales();
  location.reload();
}

async function comprobarAcceso(forzar) {
  if (ACCESO_FUERA || !PERFIL || !PERFIL.id || document.body.classList.contains('sin-sesion') || !navigator.onLine) return;
  if (!forzar && Date.now() - ACCESO_MIRADO < 3000) return;
  ACCESO_MIRADO = Date.now();
  const { data, error } = await db.from('perfiles').select('id, activo').eq('id', PERFIL.id).maybeSingle();
  if (error) return;                       // sin red o fallo puntual: no se echa a nadie
  if (data && data.activo) return;
  ACCESO_FUERA = true;
  try { sessionStorage.setItem('delcos-fuera', '1'); } catch (e) {}
  try { localStorage.removeItem(PKEY); localStorage.removeItem('dlc-os-sesion'); } catch (e) {}
  try { limpiarDatosLocales(); } catch (e) {}
  try { await db.auth.signOut(); } catch (e) {}
  location.reload();
}
