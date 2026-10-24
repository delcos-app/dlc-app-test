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

// (R-12: entrarComo se definía aquí otra vez; ahora está en su sitio, más arriba)





