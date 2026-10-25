/**
 * The Configuración page: the index of sections (with its search), the header of the chosen section, its pending notice and its
 * content (one painter, or its parts one under another). v2.340.0: it always opens in «Mis datos»; changing section only changes the
 * page on the right (the index stays, with its scroll). Migrated from the legacy cargarConfig, cargarConfigBase and cargarConfigBase2
 * (v2.422.0); the «Volver» button is painted in its final form at once (before, a second layer rewrote it).
 */
import { isMobile } from '../../../legacy/bridge';
import { shellLegacy, type SettingsItem, type SettingsPart, type SettingsTree } from '../../../legacy/shell-bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { leavePanel } from '../../../components/embedded-window/panel';
import { fitIndex } from './helpers';
import { pendingSettings } from './pending';
import { forgetActiveSection, stackSections } from './sections';

const SEARCH_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
const DEFAULT_KEY = 'datos', PLAN_KEY = 'o.plan';

type Leaf = SettingsItem & { gr: string };

const byId = (id: string): HTMLElement | null => document.getElementById(id);

/** v2.340.0: each section is one entry of the index; its parts go inside it. */
const leavesOf = (tree: SettingsTree): Leaf[] => tree.flatMap(([group, items]) => items.map(item => ({ gr: group, ...item })));

function chosenLeaf(leaves: readonly Leaf[], asked: string): Leaf | undefined {
  return leaves.find(leaf => leaf.k === asked) ?? leaves.find(leaf => leaf.hijos?.some(part => part.k === asked)) ?? leaves.find(leaf => asked.startsWith(`${leaf.k}.`))
    ?? leaves.find(leaf => leaf.k === DEFAULT_KEY) ?? leaves[0];
}

function planPill(item: SettingsItem): string {
  if (!item.mod || shellLegacy.planIncludes(item.mod)) return '';
  return `<span class="pill p-plan">${escapeHtml(shellLegacy.planMinimum(item.mod)?.nombre ?? t('settingsShell.plan'))}</span>`;
}

function indexHtml(tree: SettingsTree): string {
  const index = tree.map(([group, items]) => `<h4>${escapeHtml(group)}</h4>${items.map(item => `<button type="button" data-ck="${item.k}">${shellLegacy.iconOf(item.ic)}<span>${escapeHtml(item.t)}</span>${planPill(item)}</button>`).join('')}`).join('');
  return `<div class="saludo"><div><h1>${t('settingsShell.title')}</h1><div class="fecha">${t(tree.length > 1 ? 'settingsShell.subtitleAll' : 'settingsShell.subtitleOwn')}</div></div></div>
      <div class="cfu">
        <nav class="cfuidx" aria-label="${t('settingsShell.sections')}"><div class="cfubusca">${SEARCH_ICON}<input id="cfubus" type="search" placeholder="${t('settingsShell.search')}" autocomplete="off" aria-label="${t('settingsShell.search')}"></div>
          <div id="cfulista">${index}</div><div class="cfusin hide" id="cfusin">${t('settingsShell.noResults')}</div></nav>
        <section class="cfupag"><button type="button" class="cfuvolver manvuelta" id="cfuvolver" aria-label="${t('settingsShell.backToSettings')}"><b aria-hidden="true">‹</b> ${t('settingsShell.back')}</button>
          <div class="cfucab"></div><div class="cfupend hide" id="cfupend"></div>
          <div id="cfgcuerpo-hub"><div id="cfgcuerpo"></div></div></section></div>`;
}

/** The words a section is found by: its name, group, description, parts and keywords. */
function searchText(key: string): string {
  const leaf = leavesOf(shellLegacy.tree()).find(candidate => candidate.k === key);
  if (!leaf) return shellLegacy.normalise('');
  const parts = (leaf.hijos ?? []).map(part => `${part.t} ${shellLegacy.searchWords(part.k)}`).join(' ');
  return shellLegacy.normalise([leaf.t, leaf.gr, leaf.d, parts, shellLegacy.searchWords(leaf.k)].join(' '));
}

function filterIndex(view: HTMLElement, query: string): void {
  let shown = 0;
  view.querySelectorAll<HTMLElement>('#cfulista [data-ck]').forEach(button => {
    const text = searchText(button.dataset.ck ?? ''), found = !query || query.split(/\s+/).every(word => text.includes(word));
    button.classList.toggle('hide', !found); if (found) shown++;
  });
  view.querySelectorAll('#cfulista h4').forEach(heading => {
    let next = heading.nextElementSibling, any = false;
    while (next && next.tagName !== 'H4') { if (next.matches('[data-ck]:not(.hide)')) any = true; next = next.nextElementSibling; }
    heading.classList.toggle('hide', Boolean(query) && !any);
  });
  byId('cfusin')?.classList.toggle('hide', shown > 0);
}

function bindIndex(view: HTMLElement): void {
  view.querySelectorAll<HTMLElement>('#cfulista [data-ck]').forEach(button => {
    button.onclick = (): void => { shellLegacy.setKey(button.dataset.ck ?? ''); shellLegacy.setDetail(true); shellLegacy.reload(); if (isMobile()) scrollTo(0, 0); };
  });
  const back = byId('cfuvolver');
  if (back) back.onclick = (): void => { shellLegacy.setDetail(false); view.querySelector('.cfu')?.classList.remove('det'); scrollTo(0, 0); };
  // Search: by name, group, parts and keywords; Intro opens the first one
  const search = byId('cfubus') as HTMLInputElement | null; if (!search) return;
  search.oninput = (): void => { filterIndex(view, shellLegacy.normalise(search.value.trim())); };
  search.onkeydown = (event): void => {
    if (event.key !== 'Enter') return;
    const first = view.querySelector<HTMLElement>('#cfulista [data-ck]:not(.hide)'); if (first) { event.preventDefault(); first.click(); }
  };
}

function showPending(view: HTMLElement): void {
  void pendingSettings().then(list => {
    if (!byId('cfulista')) return;
    Object.entries(list).forEach(([key, text]) => {
      const button = [...view.querySelectorAll<HTMLElement>('#cfulista [data-ck]')].find(candidate => key === candidate.dataset.ck || key.startsWith(`${candidate.dataset.ck ?? ''}.`));
      if (button && !button.querySelector('.cfupt')) { button.insertAdjacentHTML('beforeend', '<span class="cfupt"></span>'); button.title = text; }
    });
    const notice = byId('cfupend'), own = list[shellLegacy.key()];
    if (own && notice) { notice.innerHTML = `<span class="cfupt"></span>${escapeHtml(own)}`; notice.classList.remove('hide'); }
  });
}

/** A section the plan does not include: which plan brings it. */
function showPlanNeeded(item: SettingsItem): void {
  const box = byId('cfgcuerpo'); if (!box || !item.mod) return;
  const plan = shellLegacy.planMinimum(item.mod);
  box.innerHTML = `<div class="card cfgpanel planup"><div class="planupico">${shellLegacy.iconOf('lock')}</div><h2>${escapeHtml(t('settingsShell.inPlan', { section: item.t, plan: plan?.nombre ?? t('settingsShell.customPlan') }))}</h2>
      <p class="sm">${escapeHtml(t('settingsShell.notIncluded', { plan: shellLegacy.currentPlanName() }))}</p>${shellLegacy.canManageOrganisation() ? `<div class="acts"><button class="btn" id="planver">${t('settingsShell.seePlans')}</button></div>` : ''}</div>`;
  const see = byId('planver'); if (see) see.onclick = (): void => { shellLegacy.setKey(PLAN_KEY); shellLegacy.reload(); };
}

function paintIndexIfChanged(view: HTMLElement, tree: SettingsTree, leaves: readonly Leaf[]): void {
  const mobile = isMobile();
  const signature = `${leaves.map(leaf => leaf.k + (leaf.hijos ? `(${leaf.hijos.map(part => part.k).join(',')})` : '')).join('|')}|${String(mobile)}`;
  if (view.dataset.cfgfirma === signature && byId('cfulista') && view.querySelector('.cfupag')) return;
  view.innerHTML = indexHtml(tree);
  view.dataset.cfgfirma = signature;
  bindIndex(view);
  fitIndex();
}

function paintHeader(view: HTMLElement, leaf: Leaf): void {
  view.querySelector('.cfu')?.classList.toggle('det', isMobile() && shellLegacy.detail());
  view.querySelectorAll('#cfulista [data-ck]').forEach(button => { button.classList.toggle('on', (button as HTMLElement).dataset.ck === leaf.k); });
  // v2.344.0: no tabs; the parts, one under another
  const head = view.querySelector('.cfucab');
  if (head) head.innerHTML = `<div class="miga">${escapeHtml(leaf.gr)}</div><h2>${escapeHtml(leaf.t)}</h2>${leaf.d ? `<p>${escapeHtml(leaf.d)}</p>` : ''}`;
  const pending = byId('cfupend'); if (pending) { pending.classList.add('hide'); pending.innerHTML = ''; }
  const hub = byId('cfgcuerpo-hub'); if (hub) hub.innerHTML = '<div id="cfgcuerpo"></div>';
}

function paintPage(): void {
  leavePanel();
  const tree = shellLegacy.tree(), leaves = leavesOf(tree);
  const leaf = chosenLeaf(leaves, shellLegacy.key() || DEFAULT_KEY), view = byId('v-config');
  if (!leaf || !view) return;
  const part: SettingsPart | null = leaf.hijos ? leaf.hijos.find(candidate => candidate.k === shellLegacy.key()) ?? leaf.hijos[0] ?? null : null;
  shellLegacy.setKey(part ? part.k : leaf.k);
  paintIndexIfChanged(view, tree, leaves);
  paintHeader(view, leaf);
  showPending(view);
  if (leaf.mod && !shellLegacy.planIncludes(leaf.mod)) { showPlanNeeded(leaf); return; }
  const paint = leaf.hijos ? (): Promise<void> => stackSections(leaf, part) : leaf.r;
  if (paint) void Promise.resolve().then(paint);
}

/** Leaving a page of parts gives the usual window its id back. */
function leaveStackedParts(): void {
  const hub = byId('cfgcuerpo-hub');
  if (!hub?.dataset.apilado) return;
  hub.querySelectorAll('[data-idd]').forEach(element => { element.removeAttribute('data-idd'); });
  const modal = byId('dbody-modal');
  if (modal) { document.querySelector('#dbody[data-panel]')?.removeAttribute('id'); modal.id = 'dbody'; }
  shellLegacy.setActivePanel(null); forgetActiveSection(); delete hub.dataset.apilado;
}

/** Opens Configuración on the section of the settings key (CFG_KEY). */
export function loadSettingsPage(): Promise<void> {
  leaveStackedParts();
  paintPage();
  return Promise.resolve();
}
