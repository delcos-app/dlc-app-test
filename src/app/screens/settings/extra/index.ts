/**
 * Configuración, third part (v2.417.0): «Correo y firma» with its email templates, the notifications window and «Mi perfil →
 * Notificaciones», and «Textos personalizados». Registered as window.delcos.screens.settingsExtra; the legacy names in
 * pantallas/configuracion.js are one-line adapters to these.
 */
export { paintEmail } from '../email/account';
export { chooseTemplate, emailVariables, fillTemplate, newTemplateId, saveTemplates, templateList, templatesFor } from '../email/templates';
export { showNotifications } from '../notifications/panel';
export { modeOf as notificationMode, paintNotificationSettings, saveOrderAlerts } from '../notifications/settings';
export { paintMenuNames } from '../texts/menu-names';
