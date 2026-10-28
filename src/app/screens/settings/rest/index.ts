/**
 * Configuración, fourth part (v2.420.0): Usuarios (list, guests, a user's window, editor with commission and zone, new user, access
 * data, delete), Mi perfil and «Plan y suscripción» (with the request to delcos, what is lost when changing plan and the receipt).
 * Registered as window.delcos.screens.settingsRest; the legacy names in pantallas/configuracion.js are one-line adapters to these.
 * Plan 7.3 (cut D3): these sections are loaded on first use (../lazy.ts); what a plan change loses, the receipt and loading a user
 * are read at once by other screens and stay in the core.
 */
export {
  askBudget, deleteUser, editUser, newUser, paintMyProfile, paintPlanPage, paintPreferencesPart, paintUsers, saveIndicators, showTemporaryAccess,
  showUser,
} from '../lazy';
export { planLosses, receiptOf } from '../plan/losses';
export { ensureUser } from '../users/model';
// The usage of the plan: the plan page and the Panel delcos (two chunks) read it, so it is published from the core and exists once
export { loadLimits, loadOrganisationLimits, organisationLimitsHtml, usageCardHtml } from '../plan/usage';
