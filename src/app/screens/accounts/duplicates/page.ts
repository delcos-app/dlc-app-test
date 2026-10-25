/**
 * Duplicados: the page (only administration, or level 3 in Cuentas, can unify) and its buttons: compare a pair, open a card,
 * mark a pair as different and change tab. Migrated from the legacy cargarDuplicados and the click listeners of legado 017 and
 * 136 (v2.417.0).
 */
import { agendaActions, appLegacy, currentScreen, goTo, legacyDb, notices } from '../../../legacy/bridge';
import { miscLegacy } from '../../../legacy/misc-bridge';
import { t } from '../../../i18n';
import { compareIn } from './compare';
import { loadLists, paintLists } from './lists';
import { duplicatesState, emptyPanel, forgetPair } from './model';

const NARROW_SCREEN = 900;

function pageHtml(allowed: boolean): string {
  const grid = allowed ? `<div class="dupgrid">
      <div><div class="card" id="dpendc"></div><div class="card" id="dparc"></div></div>
      <div class="card dupcmp" id="dcmp"><div class="vacio vguia"><b>${t('accountsMore.duplicates.pickPair')}</b><span>${t('accountsMore.duplicates.pickPairHint')}</span></div></div>
    </div>` : `<div class="card"><div class="vacio">${t('accountsMore.duplicates.adminOnly')}</div></div>`;
  return `<button class="cfgvolver visible" id="dupvolver" type="button">${t('accountsMore.duplicates.backToQuality')}</button>
    <div class="saludo"><div><h1>${t('accountsMore.duplicates.title')}</h1>
      <div class="fecha">${t('accountsMore.duplicates.subtitle')}</div></div>
      <div class="acts u-m-0">
        <button class="btn sec" id="dvolver">${t('accountsMore.duplicates.back')}</button>
        <button class="btn sec${allowed ? '' : ' hide'}" id="dbuscar">${t('accountsMore.duplicates.searchAgain')}</button></div></div>
    ${grid}`;
}

/** Opens the Duplicados page. */
export async function loadDuplicates(): Promise<void> {
  const view = document.getElementById('v-duplicados'); if (!view) return;
  const allowed = miscLegacy.canUnify();
  view.innerHTML = pageHtml(allowed);
  const back = document.getElementById('dupvolver'); if (back) back.onclick = (): void => { goTo('seguimiento'); };
  const close = document.getElementById('dvolver');
  if (close) close.onclick = (): void => { const previous = miscLegacy.previousScreen(); goTo(previous && previous !== 'duplicados' ? previous : 'directorio'); };
  if (!allowed) return;
  const again = document.getElementById('dbuscar'); if (again) again.onclick = (): void => { appLegacy.forgetCache(); void loadLists(); };
  await loadLists();
}

function compare(button: HTMLElement): void {
  const [first = '', second = ''] = (button.dataset.dcmp ?? '').split('|');
  duplicatesState.current = [first, second];
  document.querySelectorAll('#v-duplicados .item.sel').forEach(item => { item.classList.remove('sel'); });
  button.closest('.item')?.classList.add('sel');
  const panel = document.getElementById('dcmp'); if (!panel) return;
  void compareIn(panel, first, second);
  if (window.innerWidth <= NARROW_SCREEN) panel.scrollIntoView({ block: 'start', behavior: 'smooth' });
}

async function markDifferent(button: HTMLButtonElement): Promise<void> {
  const [first = '', second = ''] = (button.dataset.ddes ?? '').split('|');
  button.disabled = true;
  const { data: result, error } = await legacyDb().rpc<{ ok?: boolean }>('descartar_duplicado', { p_a: first, p_b: second });
  if (error || result?.ok === false) { button.disabled = false; notices.toast(t('accountsMore.duplicates.couldNotSave'), true); return; }
  forgetPair(first, second);
  const current = duplicatesState.current;
  if (current?.includes(first) && current.includes(second)) { duplicatesState.current = null; emptyPanel(t('accountsMore.duplicates.markedDifferentPanel')); }
  paintLists(); notices.toast(t('accountsMore.duplicates.markedDifferent'));
}

/** The buttons of the page, wherever they are painted (lists and compare panel). */
export function listenToDuplicates(): void {
  document.addEventListener('click', event => {
    const target = event.target as Element | null;
    const tab = target?.closest<HTMLElement>('#duppest [data-dpest]');
    if (tab) { duplicatesState.tab = tab.dataset.dpest ?? duplicatesState.tab; duplicatesState.current = null; paintLists(); emptyPanel(''); return; }
    if (currentScreen() !== 'duplicados' || !target) return;
    const comparison = target.closest<HTMLElement>('[data-dcmp]'), card = target.closest<HTMLElement>('[data-dver]'), different = target.closest<HTMLButtonElement>('[data-ddes]');
    if (comparison) compare(comparison);
    if (card) agendaActions.openAccount(card.dataset.dver ?? '');
    if (different) void markDifferent(different);
  });
}
