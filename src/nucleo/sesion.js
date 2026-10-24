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

function limpiarDatosLocales() {
  try { Object.keys(localStorage).filter(k => /^dlc-(rc-|perfil|jornada-)/.test(k)).forEach(k => localStorage.removeItem(k)); } catch (e) {}
}

function pintarBarraSuplantacion() {
  const s = suplantando();
  let b = $('barrasup');
  if (!s) { if (b) b.remove(); return; }
  if (!b) { document.body.insertAdjacentHTML('afterbegin', '<div id="barrasup"></div>'); b = $('barrasup'); }
  b.innerHTML = `<span>👤 <b>Impersonalizando a ${esc(PERFIL ? PERFIL.nombre : s.como)}</b>${PERFIL ? ' · ' + esc(PERFIL.rol) : ''} · Sesión con su usuario: lo que hagas queda a su nombre</span>
    <button class="btn chico" id="supvolver">↩ Terminar la impersonalización (${esc(nombrePila(s.nombre))})</button>`;
  $('supvolver').onclick = volverAMiSesion;
}

// ---- Cambiar de organización sin heredar nada: la recarga va tapada hasta tener el menú, la marca y la pantalla de la organización nueva
function prepararCambioOrg(destino) {
  try { sessionStorage.setItem('dlc-cambio-org', destino || ''); sessionStorage.removeItem('dlc-f5'); localStorage.removeItem('app-marca'); } catch (e) {}
}

const vaciarModulos = salvo => ['v-pacientes', 'v-productos', 'v-ventas'].forEach(k => { if (k !== salvo) $(k).innerHTML = ''; });

const suplantando = () => { try { return JSON.parse(localStorage.getItem(SKEY) || 'null'); } catch (e) { return null; } };

const ERRORES_SESION = [];

/* v2.164.0 · Lo que no entra en el plan no sale en el menú (petición de Eric): al bajar de plan, los módulos con candado se quitan
   solos del menú lateral y del «Más» del móvil, y en «Personalizar menú» salen con candado y el interruptor apagado y sin poder
   encenderlo. No se toca lo que cada uno eligió: al volver a un plan que los incluye, reaparecen como estaban. */
const fueraDePlan = b => !!b && b.classList.contains('bloq');

/* ============================================================
   v2.270.0 · «Entrar como» que funciona e invitados en Usuarios (aviso de Eric, 12/10/2026; necesita el SQL 145 y la función de
   Supabase «impersonar» nueva).
   - «Entrar como» fallaba: la función antigua solo dejaba entrar al rol «Administrador». Ahora comprueba la base (suplantar_preparar)
     y, si algo no deja, la app dice por qué (y lo anota en el registro de errores si es un fallo).
   - Invitados: profesionales y centros con acceso a su portal. En Usuarios van en su propio grupo, con su ficha, cuándo entraron por
     última vez y qué ven; «Ver lo que ve» abre la plataforma como esa persona (con cualquier plan: solo ve su portal).
   ============================================================ */
const esInvitado = u => !!u && (rolPuede(u.rol, 'portal_prescriptor') || rolPuede(u.rol, 'portal_centro'));

const queVeInvitado = u => rolPuede(u.rol, 'portal_centro')
  ? 'Pide la reposición de los productos que le des de alta, pide material y escribe a su comercial.'
  : `Ve su portal (cifras agregadas de ${TT('pauta', 'p', '', 'l', 'l')}, sin importes ni datos de ${TT('paciente', 'p', '', 'l', 'l')}), pide material y escribe sus dudas.`;

const SUPL_ERR = {
  administrador: 'No se puede impersonalizar a un usuario que administra',
  permiso: 'No tienes permiso para impersonalizar usuarios',
  inactivo: 'Esa persona está desactivada: actívala antes',
  propio: 'Ya estás en tu propia sesión',
  otra: 'Esa persona es de otra empresa',
  no_encontrado: 'No se encuentra a esa persona (o no tiene correo)',
  plan: 'Impersonalizar a usuarios del equipo es del plan A medida (a los invitados, con cualquier plan)',
  sesion: 'Tu sesión ha caducado: vuelve a entrar y prueba otra vez',
};
