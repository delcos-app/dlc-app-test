/**
 * Acceso (v2.414.0): the password meter, the activation and reset e-mails, the welcome window and the sign-in screen. The legacy
 * names medidorClave, reenviarActivacion, accesoSinActivar, restablecerPassword, bienvenidaAlta and mostrarLogin stay as adapters.
 */
export { addPasswordMeter, passwordStrength } from './password';
export { resendActivation, resetPassword, showNotActivated } from './account';
export { showLogin, showWelcome } from './welcome';
