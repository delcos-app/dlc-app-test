/**
 * Configuración, fourth part (v2.420.0): Usuarios (list, guests, a user's window, editor with commission and zone, new user, access
 * data, delete), Mi perfil and «Plan y suscripción» (with the request to delcos, what is lost when changing plan and the receipt).
 * Registered as window.delcos.screens.settingsRest; the legacy names in pantallas/configuracion.js are one-line adapters to these.
 */
export { paintMyProfile } from '../profile/page';
export { paintPreferencesPart, saveIndicators } from '../profile/parts';
export { planLosses, receiptOf } from '../plan/losses';
export { paintPlanPage } from '../plan/page';
export { askBudget } from '../plan/request';
export { showTemporaryAccess } from '../users/access';
export { showUser } from '../users/detail';
export { editUser } from '../users/editor';
export { paintUsers } from '../users/list';
export { ensureUser } from '../users/model';
export { newUser } from '../users/new-user';
export { deleteUser } from '../users/remove';
