/**
 * Concursos and Parque instalado in the menu (v2.200.0, v2.201.0): their icons, menu place, pages and tabs, the plans that include
 * them, their notifications, and repainting each page when a window over it closes. Also the menu permissions and «Administración»
 * layers of legado 080, folded into one function each (v2.424.0); aplicarPermisosMenu and cargarAdmin stay as adapters.
 */
import { menuLegacy, type LegacyPage } from '../../legacy/legado-d-bridge';
import { t, type MessageKey } from '../../i18n';

const GAVEL = '<path d="m14.5 12.5-8 8a2.12 2.12 0 1 1-3-3l8-8"/><path d="m16 16 6-6"/><path d="m8 8 6-6"/><path d="m9 7 8 8"/><path d="m21 11-8-8"/>';
const MONITOR = '<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>';
const REPAINT_DELAY_MS = 300;
const BUSINESS_PLANS = ['empresa', 'medida'];
interface NewNotification { key: string; icon: string; title: MessageKey; hint: MessageKey; what: MessageKey; todo: MessageKey }
/** v2.203.0: notifications of surgeries, contracts and equipment (chosen like the others: at once, in the summary or not at all). */
const NEW_NOTIFICATIONS: readonly NewNotification[] = [
  { key: 'reposicion_cirugia', icon: '🔄', title: 'legacyD.sales.replenishTitle', hint: 'legacyD.sales.replenishHint', what: 'legacyD.sales.replenishWhat', todo: 'legacyD.sales.replenishTodo' },
  { key: 'vence_contrato', icon: '📜', title: 'legacyD.sales.contractTitle', hint: 'legacyD.sales.contractHint', what: 'legacyD.sales.contractWhat', todo: 'legacyD.sales.contractTodo' },
  { key: 'vence_equipo', icon: '⏳', title: 'legacyD.sales.equipmentDueTitle', hint: 'legacyD.sales.equipmentDueHint', what: 'legacyD.sales.equipmentDueWhat', todo: 'legacyD.sales.equipmentDueTodo' },
  { key: 'revision_equipo', icon: '📆', title: 'legacyD.sales.reviewTitle', hint: 'legacyD.sales.reviewHint', what: 'legacyD.sales.reviewWhat', todo: 'legacyD.sales.reviewTodo' },
];

/** Adds a module to the «Ventas» menu group, after `after`. */
function addToSalesMenu(module: string, after: string, icon: string, svg: string): void {
  menuLegacy.addIcon(icon, svg);
  menuLegacy.setModuleIcon(module, icon);
  const group = menuLegacy.menuGroups().find(item => item.id === 'ventas');
  if (group && !group.items.includes(module)) group.items.splice(group.items.indexOf(after) + 1, 0, module);
}

/** Repaints a page tab when the window over it closes (its data may have changed). */
function repaintOnClose(screen: string, paint: () => void): void {
  menuLegacy.dialog()?.addEventListener('close', () => {
    if (menuLegacy.currentScreen() !== screen || !document.getElementById('cfgcuerpo')) return;
    setTimeout(() => { if (!menuLegacy.dialog()?.open && menuLegacy.currentScreen() === screen) paint(); }, REPAINT_DELAY_MS);
  });
}

function tendersPage(): LegacyPage {
  const page: LegacyPage = { t: t('legacyD.sales.tenders'), permiso: () => !menuLegacy.isProfessionalPortal() && menuLegacy.canUseModule('ventas'),
    tabs: [['marcha', t('legacyD.sales.tendersOpen'), () => menuLegacy.paintTenders('marcha')], ['contratos', t('legacyD.sales.tendersContracts'), () => menuLegacy.paintTenders('contratos')],
      ['cerrados', t('legacyD.sales.tendersClosed'), () => menuLegacy.paintTenders('cerrados')]] };
  Object.defineProperty(page, 'd', { get: () => t('legacyD.sales.tendersHint') });
  return page;
}

function equipmentPage(): LegacyPage {
  const page: LegacyPage = { t: t('legacyD.sales.equipment'), permiso: () => !menuLegacy.isProfessionalPortal() && menuLegacy.canUseModule('ventas') && menuLegacy.planIncludesSection('parque'),
    tabs: [['lista', t('legacyD.sales.equipmentTab'), () => menuLegacy.paintEquipment()]] };
  Object.defineProperty(page, 'd', { get: () => t('legacyD.sales.equipmentHint') });
  return page;
}

function installNotifications(): void {
  const keys = NEW_NOTIFICATIONS.map(item => item.key);
  menuLegacy.addNotificationTypes(NEW_NOTIFICATIONS.map(item => [item.key, item.icon, t(item.title), t(item.hint)]));
  menuLegacy.notificationAreas().find(area => area[0] === 'cobros')?.[2].push(...keys);
  menuLegacy.dailyNotifications().push(...keys);
  for (const item of NEW_NOTIFICATIONS) menuLegacy.explainNotification(item.key, [t(item.what), t(item.todo)]);
}

/** The «?» of the user menu opens the manual at the current screen (the professional's portal keeps its own). */
function listenToManualButton(): void {
  document.addEventListener('click', event => {
    const button = (event.target as Element).closest('#manbtn');
    if (!button || menuLegacy.isProfessionalPortal()) return;
    event.stopImmediatePropagation(); event.preventDefault();
    document.querySelectorAll('.umenu, #umenu').forEach(menu => { menu.classList.add('hide'); });
    menuLegacy.openManual(menuLegacy.manualAnchor(menuLegacy.currentScreen()) ?? '');
  }, true);
}

/** Legado 080, in its place of the load order. */
export function installSalesModules(): void {
  addToSalesMenu('concursos', 'ventas', 'gavel', GAVEL);
  menuLegacy.setPage('concursos', tendersPage());
  repaintOnClose('concursos', () => { menuLegacy.paintTenders(menuLegacy.pageTab('concursos') ?? 'marcha'); });
  try { menuLegacy.tendersMenu(); } catch { /* the menu may not be painted yet */ }
  menuLegacy.setPlanSections({ cirugias: BUSINESS_PLANS, deposito: BUSINESS_PLANS, concursos: BUSINESS_PLANS, parque: BUSINESS_PLANS });
  for (const key of ['cirugias', 'concursos']) menuLegacy.requirePlanSection(key);
  addToSalesMenu('parque', 'concursos', 'monitor', MONITOR);
  menuLegacy.setPage('parque', equipmentPage());
  repaintOnClose('parque', () => { menuLegacy.paintEquipment(); });
  try { menuLegacy.equipmentMenu(); menuLegacy.lockSections(); } catch { /* the menu may not be painted yet */ }
  installNotifications();
  listenToManualButton();
}

/** aplicarPermisosMenu: the base permissions with Concursos and Parque around them, and the search with the company's words. */
export function applyMenuPermissions(args: unknown[]): unknown {
  const tryMenus = (): void => { try { menuLegacy.equipmentMenu(); } catch { /* not painted yet */ } try { menuLegacy.tendersMenu(); } catch { /* not painted yet */ } };
  tryMenus();
  const result = menuLegacy.baseMenuPermissions(args);
  try { menuLegacy.tendersMenu(); } catch { /* not painted yet */ }
  try { menuLegacy.equipmentMenu(); } catch { /* not painted yet */ }
  const search = document.getElementById('q') as HTMLInputElement | null;
  if (search?.placeholder.startsWith('Buscar ')) search.placeholder = t('legacyD.sales.searchPlaceholder', { professional: menuLegacy.term('medico') });
  return result;
}

/** cargarAdmin: users and roles live in their page or in Configuración; the old «Administración» only where it still exists. */
export function loadAdmin(args: unknown[]): unknown {
  const screen = menuLegacy.currentScreen();
  if (screen === 'usuarios' && menuLegacy.hasPage('usuarios')) { menuLegacy.loadPage('usuarios'); return undefined; }
  if (screen === 'config' && ['usuarios', 'roles'].includes(menuLegacy.settingsKey())) { menuLegacy.loadSettings(); return undefined; }
  if (!document.getElementById('v-admin')) return undefined;
  return menuLegacy.baseLoadAdmin(args);
}
