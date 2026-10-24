/* v2.305.0: si el enlace del correo de activación ha caducado, Supabase vuelve a la app con el error en la dirección
   (#error_code=otp_expired o ?error_code=…): se lee antes de nada para avisar en el acceso y ofrecer un enlace nuevo */
const ENLACE_ERROR = (() => { try { const p = new URLSearchParams((location.hash || '').replace(/^#/, '') + '&' + (location.search || '').replace(/^\?/, ''));
  return p.get('error_code') || p.get('error') || null; } catch (e) { return null; } })();
/* Añadir una clase que ya está o quitar una que no está no hace nada (el navegador lo contaba como un cambio
   y despertaba a los componentes que vigilan la pantalla, que podían entrar en bucle entre ellos) */
(function () {
  const P = DOMTokenList.prototype, add = P.add, remove = P.remove, toggle = P.toggle;
  P.add = function (...t) { if (t.every(x => this.contains(x))) return; return add.apply(this, t); };
  P.remove = function (...t) { if (!t.some(x => this.contains(x))) return; return remove.apply(this, t); };
  P.toggle = function (t, forzar) { if (forzar !== undefined && this.contains(t) === !!forzar) return !!forzar; return forzar === undefined ? toggle.call(this, t) : toggle.call(this, t, forzar); };
})();

