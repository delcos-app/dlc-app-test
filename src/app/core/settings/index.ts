/**
 * The company settings core (v2.428.0): loading the settings, roles and catalogs, the brand, the shared settings lists, the tree of
 * Configuración sections and small shared helpers; and the route plan card. Registered as window.delcos.settingsCore; the legacy
 * names of pantallas/configuracion.js stay as adapters to it.
 */
export { DAILY_NOTIFICATIONS, DETAIL_NAMES, NOTIFICATION_AREAS, QUOTE_NEEDS, QUOTE_STATES, QUOTE_WHEN, REFRESH_REASONS, SEARCH_WORDS } from './constants';
export { contractedUsers, isUndoable, markMenuFooter, markModuleCache, menuLabelText, nameInTexts, notificationArea, notificationIcon, placeTestBadge, planPrice, proposalPlan, sortedFields, userStart } from './helpers';
export { applyBrand, invoiceLogo, loadCatalogs, loadSettings, NEUTRAL_LOGO } from './load';
export { defaultRole, loadRoles, roleCan, roleDefinition, roleNames, ROLES_KEY, roleTemplate, roleWith } from './roles';
export { settingsTree } from './tree';
export { openPlanTimesWindow, paintPlanCard } from '../../screens/routes/planner/plan-card';
