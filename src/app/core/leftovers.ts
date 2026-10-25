/**
 * The last pieces moved out of src/pantallas, src/componentes and src/servicios/camara.js (v2.427.0), registered as
 * window.delcos.leftovers: the legacy names (editorContacto, citasDelDia, validarDoc, leerGS1, iconizar, pagPonerGuardar…) stay as
 * one-line adapters in their legacy files and call these.
 */
export { customFieldBox, customFieldInput, checkDocument, liveEmailCheck, passwordEye, valueDataField, wideNote, withoutHistory } from '../components/fields';
export { iconise, menuIcons } from '../components/icons';
export { blockOf, currentPage, placeSave, saveAll } from '../components/page-save';
export { menuCycle, menuEquipment, menuEvents, menuOrganization, menuSurgeries, menuTenders } from './module-menus';
export { addScannerButtons, closeScanner, openScanner } from '../services/scanner/scanner';
export { readGs1 } from '../services/scanner/gs1';
export {
  agendaOwnerId, agendaUserFilter, appointmentsOfDay, blockedDays, blockedFrom, canRecordOn, changedWhileOpen, myPlannedAppointments, readBlockedDays,
  showAgendaOf, tasksOfDay,
} from '../screens/agenda/agenda-access';
export { paintTeamCompliance } from '../screens/agenda/team-compliance';
export { loadAccountAccess, loadSalesTeam, recentContacts } from '../screens/accounts/shared-reads';
export { billingSettingsSubnav } from '../screens/billing/settings-subnav';
export { editContact } from '../screens/customers/contact-editor';
export { alertKey } from '../screens/home/alert-key';
export { indicatorAllowed, indicatorSettings } from '../screens/home/indicator-rules';
export { earliestStart } from '../screens/routes/visit-window';
export { openPlanHours } from '../screens/routes/plan-hours-help';
export { eventDetail } from '../screens/settings/audit/event-detail';
export { loadContractPrices } from '../screens/tenders/contract-prices';
