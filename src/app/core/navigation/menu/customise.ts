/**
 * «Personalizar menú» on desktop (v2.132.0): order the blocks and the sections inside them (dragging by the handle or with the arrow
 * keys), hide sections, a live preview, out-of-plan sections locked and not counted (v2.16x). Migrated from the legacy
 * menuPersonalizar, menuPersonalizarBase and personalizarCandados (v2.426.0); menuPersonalizar stays as an adapter.
 */
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { MENU_GROUPS, menuGroups, menuPrefs } from './groups';
import * as legacyFreeCoreServices from '../../services';
import { sessionStore } from '../../session-store';
import { navigationStore } from '../store';
import { mountSideMenu } from '../../legacy-c/side-menu';
import * as legacyFreeComponents from '../../../components';

export interface Draft { orden: string[]; items: Record<string, string[]>; ocultos: string[] }
/** The panel keeps its close function as `__cerrar`, as legacy did (the tests close it with it). */
// eslint-disable-next-line @typescript-eslint/naming-convention -- legacy expando name the tests use
interface Panel extends HTMLElement { __cerrar?: () => void }
interface Session { box: Panel; draft: Draft; saved: boolean; original: unknown }

const sectionButton = (key: string): HTMLElement | null => document.querySelector(`#nav button[data-t="${key}"]`);
const nameOf = (key: string): string => { const button = sectionButton(key); return button ? (button.dataset.tip ?? (button.querySelector('.mllab') ?? button).textContent?.trim() ?? '') : ''; };
const iconOf = (key: string): string => sectionButton(key)?.querySelector('svg')?.outerHTML ?? '';
const available = (key: string): boolean => {
  const button = sectionButton(key);
  return Boolean(button) && key !== 'seguimiento' && key !== 'inicio' && !button?.classList.contains('hide') && (Boolean(button?.classList.contains('mloculto')) || (button ? getComputedStyle(button).display !== 'none' : false));
};
const groupTitle = (id: string): string => (MENU_GROUPS.find(group => group.id === id) ?? { t: t('navigationCore.menu.others') }).t;
const blocks = (draft: Draft): string[] => draft.orden.filter(id => (draft.items[id] ?? []).some(available));

const handle = (text: string, attributes: string): string =>
  `<button type="button" class="mlpasa" ${attributes} aria-label="${escapeHtml(t('navigationCore.menu.moveHandle', { what: text }))}" title="${t('navigationCore.menu.dragToSort')}">${svgIco(ICON_NOM['grip-vertical'] ?? '')}</button>`;

function itemHtml(key: string, id: string, shown: boolean): string {
  return `<div class="mlpi${shown ? '' : ' off'}" data-k="${key}" data-g="${id}">${handle(nameOf(key), `data-ak="${key}" data-g="${id}"`)}
              <span class="mlpico">${iconOf(key)}</span><span class="mlpn">${escapeHtml(nameOf(key))}</span>
              <label class="vfswitch mini"><input type="checkbox" role="switch" data-vk="${key}" ${shown ? 'checked' : ''} aria-label="${escapeHtml(t('navigationCore.menu.showInMenu', { name: nameOf(key) }))}"><span class="sw"></span></label></div>`;
}

function blockHtml(id: string, draft: Draft): string {
  const items = (draft.items[id] ?? []).filter(available), shown = items.filter(key => !draft.ocultos.includes(key)).length;
  return `<section class="mlpg" data-g="${id}">
          <div class="mlpgh">${handle(t('navigationCore.menu.theGroup', { name: groupTitle(id) }), `data-ag="${id}"`)}<b>${escapeHtml(groupTitle(id))}</b><span class="mlpcnt">${t('navigationCore.menu.count', { shown, total: items.length })}</span></div>
          <div class="mlpis">${items.map(key => itemHtml(key, id, !draft.ocultos.includes(key))).join('')}</div></section>`;
}

function paint(session: Session, focus?: string): void {
  const home = sectionButton('inicio') ? `<div class="mlpi mlpfijo"><span class="mlpico">${iconOf('inicio')}</span><span class="mlpn">${escapeHtml(nameOf('inicio'))}</span><span class="sm">${t('navigationCore.menu.alwaysFirst')}</span></div>` : '';
  session.box.innerHTML = `<div class="mlph"><div><b>${t('navigationCore.menu.customise')}</b><span class="sm">${t('navigationCore.menu.customiseHint')}</span></div>
        <button type="button" class="x" id="mlpx" aria-label="${t('navigationCore.menu.close')}">✕</button></div>
      ${home}
      <div class="mlpl">${blocks(session.draft).map(id => blockHtml(id, session.draft)).join('')}</div>
      <div class="mlpacts"><button type="button" class="btn sec mlpdef" id="mlpdef">${svgIco(ICON_NOM['rotate-ccw'] ?? '')} ${t('navigationCore.menu.reset')}</button><button type="button" class="btn" id="mlpok">${t('navigationCore.menu.save')}</button></div>`;
  if (focus) session.box.querySelector<HTMLElement>(focus)?.focus();
  lockOutOfPlan(session.box);
}

const menuWith = (session: Session, draft: Draft): Record<string, unknown> => {
  const original = (session.original ?? {}) as Record<string, unknown>;
  return { ...original, menu: { ...((original.menu ?? {}) as Record<string, unknown>), orden: draft.orden, items: draft.items, ocultos: draft.ocultos } };
};

/** Preview: the menu is built with what is in the panel; closing without saving goes back to what was saved. */
function preview(session: Session): void {
  const draft = session.draft;
  (sessionStore.profile as { preferencias?: unknown }).preferencias = menuWith(session, { orden: [...draft.orden], items: JSON.parse(JSON.stringify(draft.items)) as Record<string, string[]>, ocultos: [...draft.ocultos] });
  navigationStore.menuSignature = ''; mountSideMenu();
}

/** «Personalizar menú»: out-of-plan sections locked, switched off and not counted in «N de M». */
function lockOutOfPlan(box: HTMLElement): void {
  box.querySelectorAll<HTMLElement>('.mlpi[data-k]').forEach(row => {
    const button = sectionButton(row.dataset.k ?? ''); if (!button || !legacyFreeCoreServices.session.outOfPlan(button)) return;
    row.classList.add('off', 'fueraplan'); row.title = t('navigationCore.menu.notInPlan', { plan: legacyFreeCoreServices.plans.currentPlanName() });
    const toggle = row.querySelector<HTMLInputElement>('[data-vk]'); if (toggle) { toggle.checked = false; toggle.disabled = true; }
    if (!row.querySelector('.mlpcand')) row.querySelector('.mlpn')?.insertAdjacentHTML('afterend', `<span class="mlpcand" role="img" aria-label="${t('navigationCore.menu.notInPlanShort')}"></span>`);
  });
  box.querySelectorAll('.mlpg').forEach(group => {
    const rows = [...group.querySelectorAll('.mlpi[data-k]')], count = group.querySelector('.mlpcnt');
    if (count) count.textContent = t('navigationCore.menu.count', { shown: rows.filter(row => !row.classList.contains('off')).length, total: rows.filter(row => !row.classList.contains('fueraplan')).length });
  });
}

export const moveBlock = (draft: Draft, id: string, target: string, before: boolean): void => {
  if (id === target) return;
  const order = draft.orden.filter(other => other !== id), index = order.indexOf(target); order.splice(before ? index : index + 1, 0, id); draft.orden = order;
};
export const moveItem = (draft: Draft, group: string, key: string, target: { key: string; before: boolean }): void => {
  if (key === target.key) return;
  const list = (draft.items[group] ?? []).filter(other => other !== key), index = list.indexOf(target.key); list.splice(target.before ? index : index + 1, 0, key); draft.items[group] = list;
};

function close(session: Session): void {
  if (!document.getElementById('mlpanel')) return;
  session.box.remove(); detach(session);
  if (!session.saved) { (sessionStore.profile as { preferencias?: unknown }).preferencias = session.original; navigationStore.menuSignature = ''; mountSideMenu(); }
  document.getElementById('mlpers')?.focus();
}

let detach: (session: Session) => void = () => undefined;

async function save(session: Session, button: HTMLButtonElement): Promise<void> {
  const prefs = menuWith(session, session.draft);   // v2.336.0: the phone bar is kept
  button.disabled = true;
  const { data, error } = await db.rpc<unknown>('guardar_preferencias', { p: prefs });
  button.disabled = false;
  if (error) { legacyFreeComponents.toast(t('navigationCore.menu.couldNotSave'), true); return; }
  (sessionStore.profile as { preferencias?: unknown }).preferencias = data ?? prefs; session.saved = true; close(session); navigationStore.menuSignature = ''; mountSideMenu(); legacyFreeComponents.toast(t('navigationCore.menu.saved'), false);
}

function onClick(session: Session, event: MouseEvent): void {
  const target = event.target as Element;
  if (target.closest('#mlpx')) { close(session); return; }
  if (target.closest('#mlpdef')) {
    session.draft.orden = MENU_GROUPS.map(group => group.id); MENU_GROUPS.forEach(group => { session.draft.items[group.id] = [...group.items]; }); session.draft.ocultos = [];
    paint(session); preview(session); return;
  }
  const ok = target.closest<HTMLButtonElement>('#mlpok'); if (ok) void save(session, ok);
}

function onToggle(session: Session, event: Event): void {
  const toggle = (event.target as Element).closest<HTMLInputElement>('[data-vk]'); if (!toggle) return;
  const key = toggle.dataset.vk ?? '', draft = session.draft;
  draft.ocultos = toggle.checked ? draft.ocultos.filter(other => other !== key) : [...new Set([...draft.ocultos, key])];
  const row = toggle.closest('.mlpi'); row?.classList.toggle('off', !toggle.checked);
  const group = row?.closest<HTMLElement>('.mlpg'), items = (draft.items[group?.dataset.g ?? ''] ?? []).filter(available), count = group?.querySelector('.mlpcnt');
  if (count) count.textContent = t('navigationCore.menu.count', { shown: items.filter(other => !draft.ocultos.includes(other)).length, total: items.length });
  lockOutOfPlan(session.box);
  preview(session);
}

/** Keyboard: with the focus on a handle, ↑ and ↓ move. */
function onKey(session: Session, event: KeyboardEvent): void {
  const grip = (event.target as Element).closest<HTMLElement>('.mlpasa'); if (!grip || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return;
  event.preventDefault(); const step = event.key === 'ArrowUp' ? -1 : 1, draft = session.draft;
  if (grip.dataset.ag) {
    const list = blocks(draft), other = list[list.indexOf(grip.dataset.ag) + step]; if (!other) return;
    moveBlock(draft, grip.dataset.ag, other, step < 0); paint(session, `[data-ag="${grip.dataset.ag}"]`);
  } else {
    const group = grip.dataset.g ?? '', key = grip.dataset.ak ?? '', list = (draft.items[group] ?? []).filter(available), other = list[list.indexOf(key) + step]; if (!other) return;
    moveItem(draft, group, key, { key: other, before: step < 0 }); paint(session, `[data-ak="${key}"]`);
  }
  preview(session);
}

/** Opens or closes the panel (the dragging is wired by drag.ts through `wireDrag`). */
export function customiseMenu(wireDrag: (session: { box: HTMLElement; draft: Draft; repaint: () => void }) => void): void {
  const open = document.getElementById('mlpanel') as Panel | null;
  if (open) { if (open.__cerrar) open.__cerrar(); else open.remove(); return; }
  const prefs = menuPrefs(), draft: Draft = { orden: menuGroups().filter(group => group.id !== 'otros').map(group => group.id), items: {}, ocultos: [...(prefs.ocultos ?? [])] };
  menuGroups().forEach(group => { draft.items[group.id] = [...group.items]; });
  document.body.insertAdjacentHTML('beforeend', `<div id="mlpanel" class="mlp2" role="dialog" aria-label="${t('navigationCore.menu.customise')}"></div>`);
  const box = document.getElementById('mlpanel') as Panel | null; if (!box) return;
  const session: Session = { box, draft, saved: false, original: (sessionStore.profile as { preferencias?: unknown }).preferencias };
  const outside = (event: MouseEvent): void => { if (!(event.target as Element).closest('#mlpanel, #mlpers')) close(session); };
  const escape = (event: KeyboardEvent): void => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(session); } };
  detach = (): void => { document.removeEventListener('click', outside, true); document.removeEventListener('keydown', escape, true); };
  box.__cerrar = (): void => { close(session); };
  paint(session); preview(session);
  box.addEventListener('click', event => { onClick(session, event); });
  box.addEventListener('change', event => { onToggle(session, event); });
  box.addEventListener('keydown', event => { onKey(session, event); });
  wireDrag({ box, draft, repaint: (): void => { paint(session); preview(session); } });
  setTimeout(() => { document.addEventListener('click', outside, true); document.addEventListener('keydown', escape, true); }, 0);
  box.querySelector<HTMLElement>('.mlpasa')?.focus();
}
