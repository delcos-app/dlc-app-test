/**
 * Configuración, third part (v2.417.0): «Correo y firma» with its email templates, the notifications window and «Mi perfil →
 * Notificaciones», and «Textos personalizados». Registered as window.delcos.screens.settingsExtra; the legacy names in
 * pantallas/configuracion.js are one-line adapters to these. Plan 7.3 (cut D3): «Correo y firma», the panel and the texts are loaded
 * on first use (../lazy.ts); the templates and the notification modes are read at once by other screens and stay in the core.
 */
export { chooseTemplate, emailVariables, fillTemplate, newTemplateId, saveTemplates, templateList, templatesFor } from '../email/templates';
export { modeOf as notificationMode, paintNotificationSettings, saveOrderAlerts } from '../notifications/settings';
export { paintEmail, paintMenuNames, showNotifications } from '../lazy';
