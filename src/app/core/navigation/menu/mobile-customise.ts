/**
 * «Personalizar menú» on the phone (v2.337.0): grouped as the bottom bar (up to 4, Inicio always first), «Más» and the hidden ones.
 * Changing a screen's group puts it at the end of that group (to a full bar: its last one becomes the first of «Más»). Sorted by
 * dragging (finger or mouse, by the ⠿ handle; it can be dropped in another group) or with the arrows inside its group. Migrated from
 * the legacy movPersonalizar (v2.426.0).
 */
import { t, type MessageKey } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { menuPrefs } from './groups';
import { availableScreens, BAR_DEFAULT, bottomBar, mobileName, moreOrder } from './mobile';

type Zone = 'barra' | 'mas' | 'oculta';
interface State { groups: Record<Zone, string[]>; fixed: string | null; available: string[] }
interface Dragged { row: HTMLElement; offset: number; pointer: number; gap: HTMLElement }

const ZONES: readonly Zone[] = ['barra', 'mas', 'oculta'];
const GROUP_TEXTS: Readonly<Record<Zone, readonly [MessageKey, MessageKey | null]>> = {
  barra: ['navigationCore.mobileMenu.bar', 'navigationCore.mobileMenu.barLimit'], mas: ['navigationCore.mobileMenu.more', null],
  oculta: ['navigationCore.mobileMenu.hidden', 'navigationCore.mobileMenu.hiddenNote'],
};
const ZONE_TEXTS: Readonly<Record<Zone, MessageKey>> = { barra: 'navigationCore.mobileMenu.zoneBar', mas: 'navigationCore.mobileMenu.zoneMore', oculta: 'navigationCore.mobileMenu.zoneHidden' };
const EDGE = 60, SCROLL_STEP = 12, BAR_MAX = 4;

const body = (): HTMLElement | null => document.getElementById('dlg2body');
const maxBar = (state: State): number => (state.fixed ? BAR_MAX - 1 : BAR_MAX);
const zoneOf = (state: State, key: string): Zone => ZONES.find(zone => state.groups[zone].includes(key)) ?? 'mas';
const fit = (state: State): void => { while (state.groups.barra.length > maxBar(state)) { const last = state.groups.barra.pop(); if (last) state.groups.mas.unshift(last); } };

function rowHtml(key: string, zone: Zone, index: number, count: number): string {
  const zones = ZONES.map(other => `<button type="button" data-mpz="${other}|${key}" class="${zone === other ? 'on' : ''}">${t(ZONE_TEXTS[other])}</button>`).join('');
  return `<div class="movp movp-${zone}" data-mpt="${key}">
      <span class="movpdrag" data-mpd="${key}" aria-hidden="true" title="${t('navigationCore.mobileMenu.drag')}">⠿</span>
      <span class="movpmv"><button type="button" class="kmv" data-mpm="-1|${key}" aria-label="${t('navigationCore.mobileMenu.up')}" ${index === 0 ? 'disabled' : ''}>↑</button><button type="button" class="kmv" data-mpm="1|${key}" aria-label="${t('navigationCore.mobileMenu.down')}" ${index === count - 1 ? 'disabled' : ''}>↓</button></span>
      <span class="movpico">${ICO_MOD[key] ?? '•'}</span><span class="movpn">${escapeHtml(mobileName(key))}</span>
      <div class="segs" role="group" aria-label="${t('navigationCore.mobileMenu.where')}">${zones}</div></div>`;
}

function groupHtml(state: State, zone: Zone): string {
  const [title, note] = GROUP_TEXTS[zone], list = state.groups[zone], count = list.length + (zone === 'barra' && state.fixed ? 1 : 0);
  const fixed = zone === 'barra' && state.fixed ? `<div class="movp movp-barra movpfijo"><span class="movpico">${ICO_MOD[state.fixed] ?? '•'}</span><span class="movpn">${escapeHtml(mobileName(state.fixed))}</span><span class="sm">${t('navigationCore.mobileMenu.alwaysFirst')}</span></div>` : '';
  return `<div class="movpg"><h3>${t(title)} <span class="sm">· ${count}${note ? ` · ${t(note)}` : ''}</span></h3>
        ${fixed}
        <div class="movpl" data-mpg="${zone}">${list.map((key, index) => rowHtml(key, zone, index, list.length)).join('') || `<div class="movpvac sm">${t('navigationCore.mobileMenu.dropHere')}</div>`}</div></div>`;
}

function paint(state: State): void {
  const box = body(); if (!box) return;
  box.innerHTML = `<div class="fh"><div><h2>${t('navigationCore.menu.customise')}</h2></div><button class="x" data-cerrar2 aria-label="${t('navigationCore.menu.close')}">✕</button></div>
      <p class="sm">${t('navigationCore.mobileMenu.hint')}</p>
      ${ZONES.map(zone => groupHtml(state, zone)).join('')}
      <div class="acts"><button type="button" class="btn sec" id="movpdef">${t('navigationCore.menu.reset')}</button><button type="button" class="btn" id="movpok">${t('navigationCore.menu.save')}</button></div>`;
}

function move(state: State, data: string): void {
  const [direction = '0', key = ''] = data.split('|'), list = state.groups[zoneOf(state, key)], index = list.indexOf(key), other = index + Number(direction);
  if (other < 0 || other >= list.length) return;
  const swapped = list[other]; if (swapped === undefined) return;
  list[other] = key; list[index] = swapped; paint(state);
}

function changeZone(state: State, data: string): void {
  const [zone, key = ''] = data.split('|') as [Zone, string], from = zoneOf(state, key);
  if (zone === from) return;
  if (from === 'barra' && !state.fixed && state.groups.barra.length <= 1) { toast(t('navigationCore.mobileMenu.barNeedsOne'), true); return; }
  state.groups[from] = state.groups[from].filter(other => other !== key);
  if (zone === 'barra' && state.groups.barra.length >= maxBar(state)) { const last = state.groups.barra.pop(); if (last) state.groups.mas.unshift(last); }
  state.groups[zone].push(key); paint(state);
}

async function save(state: State, button: HTMLButtonElement): Promise<void> {
  const prefs = menuPrefs(), hidden = [...new Set([...(prefs.ocultos ?? []).filter(key => !state.available.includes(key)), ...state.groups.oculta])];
  const bar = state.fixed ? [state.fixed, ...state.groups.barra] : [...state.groups.barra];
  const profile = PERFIL as { preferencias?: Record<string, unknown> };
  const saved = { ...(profile.preferencias ?? {}), menu: { ...prefs, barra: bar, mas: [...state.groups.mas, ...state.groups.oculta], ocultos: hidden } };
  button.disabled = true;
  const { data, error } = await db.rpc<Record<string, unknown>>('guardar_preferencias', { p: saved });
  button.disabled = false;
  if (error) { toast(t('navigationCore.menu.couldNotSave'), true); return; }
  profile.preferencias = data ?? saved;
  (document.getElementById('dlg2') as HTMLDialogElement | null)?.close();
  pintarBnav(); MENU_FIRMA = ''; try { montarMenuLateral(); } catch { /* the side menu is optional on the phone */ }
  toast(t('navigationCore.menu.saved'));
}

function onClick(state: State, event: MouseEvent): void {
  const target = event.target as Element, arrow = target.closest<HTMLElement>('[data-mpm]'), zone = target.closest<HTMLElement>('[data-mpz]');
  if (arrow) { move(state, arrow.dataset.mpm ?? ''); return; }
  if (zone) { changeZone(state, zone.dataset.mpz ?? ''); return; }
  if (target.closest('#movpdef')) {
    state.groups.barra = BAR_DEFAULT.filter(key => state.available.includes(key) && key !== state.fixed);
    state.groups.mas = state.available.filter(key => !state.groups.barra.includes(key) && key !== state.fixed); state.groups.oculta = [];
    paint(state); return;
  }
  const ok = target.closest<HTMLButtonElement>('#movpok'); if (ok) void save(state, ok);
}

function startDrag(event: PointerEvent): Dragged | null {
  const grip = (event.target as Element).closest<HTMLElement>('[data-mpd]'), row = grip?.closest<HTMLElement>('.movp');
  if (!grip || !row) return null;
  event.preventDefault();
  const rect = row.getBoundingClientRect(), gap = document.createElement('div');
  gap.className = 'movphueco'; gap.style.height = `${rect.height}px`; row.before(gap);
  row.classList.add('movparr'); row.style.width = `${rect.width}px`; row.style.top = `${rect.top}px`; row.style.left = `${rect.left}px`;
  try { grip.setPointerCapture(event.pointerId); } catch { /* not every browser captures */ }
  return { row, offset: event.clientY - rect.top, pointer: event.pointerId, gap };
}

function dragMove(box: HTMLElement, dragged: Dragged, event: PointerEvent): void {
  dragged.row.style.top = `${event.clientY - dragged.offset}px`;
  const rows = [...box.querySelectorAll<HTMLElement>('.movpl > .movp:not(.movparr), .movpl > .movpvac')];
  const target = rows.find(row => { const rect = row.getBoundingClientRect(); return event.clientY < rect.top + rect.height / 2; });
  if (target) target.before(dragged.gap); else { const lists = box.querySelectorAll('.movpl'); lists[lists.length - 1]?.appendChild(dragged.gap); }
  const dialog = document.getElementById('dlg2'); if (!dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientY < rect.top + EDGE) dialog.scrollTop -= SCROLL_STEP; else if (event.clientY > rect.bottom - EDGE) dialog.scrollTop += SCROLL_STEP;
}

function dragEnd(state: State, box: HTMLElement, dragged: Dragged): void {
  const { row, gap } = dragged;
  gap.replaceWith(row); row.classList.remove('movparr'); row.style.width = row.style.top = row.style.left = '';
  const key = row.dataset.mpt ?? '';
  box.querySelectorAll<HTMLElement>('.movpl').forEach(list => { state.groups[list.dataset.mpg as Zone] = [...list.querySelectorAll<HTMLElement>(':scope > .movp')].map(item => item.dataset.mpt ?? ''); });
  if (!state.fixed && !state.groups.barra.length) {
    ZONES.forEach(zone => { state.groups[zone] = state.groups[zone].filter(other => other !== key); }); state.groups.barra = [key];
    toast(t('navigationCore.mobileMenu.barNeedsOne'), true);
  }
  fit(state); paint(state);
}

function wire(state: State, box: HTMLElement, dialog: HTMLDialogElement): void {
  let dragged: Dragged | null = null;
  const handlers: [string, (event: Event) => void][] = [
    ['click', (event): void => { onClick(state, event as MouseEvent); }],
    ['pointerdown', (event): void => { dragged = startDrag(event as PointerEvent) ?? dragged; }],
    ['pointermove', (event): void => { if (dragged && (event as PointerEvent).pointerId === dragged.pointer) dragMove(box, dragged, event as PointerEvent); }],
  ];
  const end = (event: Event): void => { if (!dragged || (event as PointerEvent).pointerId !== dragged.pointer) return; const done = dragged; dragged = null; dragEnd(state, box, done); };
  handlers.push(['pointerup', end], ['pointercancel', end]);
  handlers.forEach(([name, handler]) => { box.addEventListener(name, handler); });
  dialog.addEventListener('close', () => { handlers.forEach(([name, handler]) => { box.removeEventListener(name, handler); }); }, { once: true });
}

/** Opens «Personalizar menú» on the phone. */
export function customiseMobileMenu(): void {
  const available = availableScreens(), prefs = menuPrefs(), fixed = available.includes('inicio') ? 'inicio' : null;
  const bar = bottomBar().filter(key => key !== fixed), rest = moreOrder(available.filter(key => !bar.includes(key) && key !== fixed)), hidden = prefs.ocultos ?? [];
  const state: State = { fixed, available, groups: { barra: [...bar], mas: rest.filter(key => !hidden.includes(key)), oculta: rest.filter(key => hidden.includes(key)) } };
  paint(state);
  const dialog = document.getElementById('dlg2') as HTMLDialogElement | null, box = body();
  if (!dialog || !box) return;
  wire(state, box, dialog);
  dialog.showModal();
}
