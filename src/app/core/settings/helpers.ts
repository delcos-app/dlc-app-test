/**
 * Small shared helpers that lived in Configuración: the module cache mark, the company's name for «Directorio» in any text, the
 * menu footer and the «Pruebas» badge, a menu entry's own text, where a route starts, custom fields in filter order, a plan's price,
 * the users contracted, which changes can be undone and the area and icon of a notification type. Migrated from the legacy
 * marcarCache, nombreEnTextos, menuMarcarPie, colocarIndPruebas, rpPlanDe, txTexto, salidaUsuario, clasCampos, precioPlan,
 * usuariosContratados, deshacible, notifArea and notifIco (v2.428.0).
 */
import { currentScreen, term } from '../../legacy/bridge';
import { settingsCoreLegacy } from '../../legacy/settings-core-bridge';
import { t } from '../../i18n';
import { NOTIFICATION_AREAS } from './constants';

const DIRECTORY = 'Directorio', BESPOKE = 'medida', DEFAULT_ICON = '🔔';
/** Entities and actions of the audit log that can be undone (orders, invoices, users and portfolios have side effects). */
const UNDOABLE_ENTITIES = ['cuentas', 'ubicaciones', 'contactos', 'productos', 'rutas'], UNDOABLE_ACTIONS = ['Edición', 'Baja'];

/** Remembers when a module was painted, with what it showed and after how many writes. */
export function markModuleCache(screen: string): void {
  settingsCoreLegacy.moduleCache()[screen] = { clave: settingsCoreLegacy.moduleState(screen), t: Date.now(), esc: settingsCoreLegacy.writes() };
}

/** Every text that says «Directorio» (help, manual, notices…) uses the name the company chose. */
export function nameInTexts(root: Node | null): void {
  const label = settingsCoreLegacy.contactsLabel();
  if (!root || label === DIRECTORY) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: node => (node.parentElement && !node.parentElement.closest('script,style,textarea,input,[data-notr]') && /directorio/i.test(node.nodeValue ?? '') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT) });
  const nodes: Node[] = []; while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node => { node.nodeValue = (node.nodeValue ?? '').replace(/\bDirectorio\b/g, label).replace(/\bdirectorio\b/g, label.toLowerCase()); });
}

/** v2.135.0: «Configuración» at the foot of the side menu is marked while in Configuración. */
export function markMenuFooter(): void { document.getElementById('mlcfg')?.classList.toggle('activo', currentScreen() === 'config'); }

/** v2.138.0: the «Pruebas» badge next to the brand of the side menu (a dot over the logo when folded), or after the header logo. */
export function placeTestBadge(): void {
  const badge = document.getElementById('indpruebas'); if (!badge) return;
  const brand = document.body.classList.contains('menulat') ? document.querySelector('nav.main .mlmarca') : null;
  const home = brand ?? document.querySelector('.top .logo');
  if (!home) return;
  if (brand) { if (badge.parentNode !== brand) brand.appendChild(badge); } else if (badge.previousElementSibling !== home) home.insertAdjacentElement('afterend', badge);
}

/** A proposal of the day as a plan (kept so «Tiempos de visita» can recalculate it). */
export function proposalPlan(index: number): { sel: unknown } | null {
  const proposal = settingsCoreLegacy.dayProposals()?.lista[index]; if (!proposal) return null;
  settingsCoreLegacy.rememberProposal(`prop${index + 1}`, proposal.sel);
  return proposal;
}

interface EditableText { get: () => string; set: (value: string) => void }

/** The text of a menu entry, to read and to rename (its tooltip follows). */
export function menuLabelText(button: HTMLElement): EditableText | null {
  const setTip = (value: string): void => { if (button.dataset.tip) { button.dataset.tip = value; button.setAttribute('aria-label', value); } };
  const label = button.querySelector('.mllab, b, em, small, .lb');
  if (label && !label.querySelector('svg')) return { get: () => (label.textContent ?? '').trim(), set: value => { label.textContent = value; setTip(value); } };
  const text = [...button.childNodes].find(node => node.nodeType === Node.TEXT_NODE && (node.nodeValue ?? '').trim());
  if (!text) return null;
  return { get: () => (text.nodeValue ?? '').trim(), set: value => { text.nodeValue = (text.nodeValue ?? '').replace((text.nodeValue ?? '').trim(), value); setTip(value); } };
}

export interface RouteStart { nombre: string; lat: number | null; lon: number | null; falta?: boolean }

/** Where the user's routes start: their saved place, or the first visit (marked as missing). */
export const userStart = (): RouteStart =>
  settingsCoreLegacy.activePreferences().salida ?? { nombre: t('settingsCore.firstVisitStart', { firstVisit: term('visita', { article: 'primer' }) }), lat: null, lon: null, falta: true };

/** The custom fields of an area: first those marked «Filtro», then the rest, in their order. */
export const sortedFields = (area: string): CustomField[] =>
  [...(settingsCoreLegacy.customFields()[area] ?? [])].sort((first, second) => (second.en_filtro ? 1 : 0) - (first.en_filtro ? 1 : 0));

/** «29 € por usuario al mes, 290 € con pago anual», or «presupuesto a medida». */
export const planPrice = (plan: { presupuesto?: boolean; precio?: number; anual?: number }): string =>
  (plan.presupuesto ? t('settingsCore.planPrice.quote') : t('settingsCore.planPrice.perUser', { monthly: settingsCoreLegacy.roundEuros(plan.precio ?? 0), yearly: settingsCoreLegacy.roundEuros(plan.anual ?? 0) }));

/** Users contracted (A medida or no figure: no limit). */
export function contractedUsers(): number {
  const plan = settingsCoreLegacy.currentPlan();
  return plan.plan === BESPOKE || plan.usuarios === null || plan.usuarios === undefined ? Infinity : Number(plan.usuarios);
}

/** v2.123.0: only changes to accounts, places, contacts, products and routes can be undone. */
export const isUndoable = (change: { entidad: string; accion: string }): boolean => UNDOABLE_ENTITIES.includes(change.entidad) && UNDOABLE_ACTIONS.includes(change.accion);

export const notificationArea = (type: string): string => NOTIFICATION_AREAS.find(area => area[2].includes(type))?.[0] ?? 'otros';

export const notificationIcon = (type: string): string => settingsCoreLegacy.notificationTypes().find(item => item[0] === type)?.[1] ?? DEFAULT_ICON;
