/**
 * Small pieces of the Configuración page and of the menu marks: the old section keys, the mobile layout, the index height, the
 * styles copied for every part, the save buttons of a page and which menu entry is marked. Migrated from the legacy claveCfgVieja,
 * cfgMovil, cfuAjustarIndice, cfgClonarEstilos, pagMarcarSucio, marcarPedsec, marcarFacPlan and marcarPanel (v2.422.0).
 */
import { currentScreen, isMobile } from '../../../legacy/bridge';
import { shellLegacy } from '../../../legacy/shell-bridge';
import { t } from '../../../i18n';
import { markCurrent } from '../../../core/navigation/current';

const INDEX_MIN_HEIGHT = 240, INDEX_BOTTOM_GAP = 12;

/** Keys of the sections before v2.340.0 (links and notifications still use them). */
const OLD_KEYS: Readonly<Record<string, string>> = {
  prefs: 'rutas.salida', perfil: 'datos', datos: 'datos', notif: 'notif', horario: 'rutas.horario', kpis: 'inicio.kpis', usuarios: 'usuarios',
  roles: 'roles', equipo: 'usuarios', reglas: 'cartera.reglas', frec: 'cartera.frec', accesos: 'seguridad.accesos', auditoria: 'seguridad.auditoria',
  alm: 'stock.alm', mues: 'stock.mues', marca: 'o.marca', __empresa: 'o.marca', empresa: 'o.marca', correo: 'o.correo', copias: 'o.copias', plan: 'o.plan',
  fact: 'o.fiscal', fiscal: 'o.fiscal', series: 'o.series', vf: 'o.vf', pdf: 'o.pdf', orgs: 'o.orgs',
};

/** The current key of an old section (and part) name. */
export function oldSettingsKey(section: string | null, part: string | null): string {
  if (!section || section === '__cfg') return '';
  if (section === 'equipo') return part === 'roles' ? 'roles' : 'usuarios';
  if (part) return `${section}.${part}`;
  return OLD_KEYS[section] ?? section;
}

/** On a phone, the index and the section are two steps (with «‹ Configuración» to go back). */
export function mobileLayout(): void {
  const hub = document.querySelector('.cfghub'); if (!hub) return;
  hub.classList.toggle('movil', isMobile());
  if (!isMobile()) { hub.classList.remove('detalle'); return; }
  const content = document.getElementById('cfgcuerpo-hub');
  if (content && !content.querySelector(':scope > .cfgvolver')) content.insertAdjacentHTML('afterbegin', `<button class="cfgvolver" type="button">${t('settingsShell.backMobile')}</button>`);
}

/** The index always fits the screen: its height reaches the bottom edge, so the wheel goes through it without moving the page. */
export function fitIndex(): void {
  const index = document.querySelector<HTMLElement>('#v-config .cfuidx'); if (!index || currentScreen() !== 'config' || isMobile()) return;
  const top = Math.max(0, index.getBoundingClientRect().top);
  index.style.setProperty('--cfuidxh', `${Math.max(INDEX_MIN_HEIGHT, innerHeight - top - INDEX_BOTTOM_GAP)}px`);
}

const ACTIVE_BOX = /#cfgcuerpo(?![-\w])/g;

const partSelector = (selector: string): string => selector.split(',').filter(piece => { ACTIVE_BOX.lastIndex = 0; return ACTIVE_BOX.test(piece); })
  .map(piece => piece.replace(ACTIVE_BOX, '#cfgcuerpo-hub .cfgsecc')).join(',');

const isGroup = (rule: CSSRule): rule is CSSGroupingRule => 'cssRules' in rule && (rule instanceof CSSMediaRule || (typeof CSSLayerBlockRule !== 'undefined' && rule instanceof CSSLayerBlockRule));

function copyRules(rules: CSSRuleList, inside: CSSGroupingRule | null): void {
  for (const rule of [...rules]) {
    if (isGroup(rule)) { copyRules(rule.cssRules, rule); continue; }   // v2.356.0: also inside layers
    if (!(rule instanceof CSSStyleRule) || !rule.selectorText.includes('#cfgcuerpo')) continue;
    const selector = partSelector(rule.selectorText); if (!selector) continue;
    // v2.361.0: the copy goes right after its original (at the end of the block, the desktop one ended after the @media one and won)
    const box = inside ?? rule.parentStyleSheet; if (!box) continue;
    try { box.insertRule(`${selector}{${rule.style.cssText}}`, [...box.cssRules].indexOf(rule) + 1); } catch { /* a rule the browser does not take */ }
  }
}

/** v2.344.0: the Configuración styles speak of #cfgcuerpo (the active box); they are copied for the other parts of the page. */
export function copyPartStyles(): void {
  for (const sheet of document.styleSheets) { try { if (!sheet.href) copyRules(sheet.cssRules, null); } catch { /* a sheet from elsewhere */ } }
}

/** «Guardar» and «Descartar» of a page are on only with unsaved changes. */
export function markUnsaved(): void {
  const count = shellLegacy.unsavedCount();
  ['cfuguardar', 'cfudescartar'].forEach(id => { const button = document.getElementById(id) as HTMLButtonElement | null; if (button) button.disabled = !count; });
}

/** In Ventas, the menu marks the entry of the shown section (Pedidos, Compras…). */
export function markOrderSection(): void {
  if (currentScreen() !== 'ventas') return;
  const aliases = shellLegacy.orderAliases(), view = shellLegacy.orderSectionView();
  const alias = Object.keys(aliases).find(key => aliases[key] === view) ?? 'ventas';
  document.querySelectorAll('nav.main [data-t], #bnav [data-t]').forEach(button => { markCurrent(button, (button as HTMLElement).dataset.t === alias); });
}

/** Billing without the plan: the body says so and the menu follows. */
export function markBillingPlan(): void {
  document.body.classList.toggle('facsolo', shellLegacy.billingWithoutPlan());
  try { shellLegacy.applyMenuPermissions(); } catch { /* the menu is marked on the next start */ }
}

/** In the Panel delcos, the menu marks its tab. */
export function markPlatformPanel(): void {
  const tab = shellLegacy.platformTab();
  document.querySelectorAll<HTMLElement>('nav.main [data-t]').forEach(button => {
    if (button.classList.contains('pdsec') || button.dataset.t === 'delcos') markCurrent(button, button.dataset.t === `pd-${tab}`);
  });
}
