/**
 * Ciclo de visitas → «Clasificar»: A, B or C on each account, with its visits of the last 12 months to help decide; and the A/B/C
 * buttons wherever they are (this page and the account card). Migrated from the legacy pintarClasificar and the data-ccl listener
 * of legado 079 (v2.408.0).
 */
import { rpc } from '../../api/client';
import { appLegacy, currentScreen, notices } from '../../legacy/bridge';
import { t } from '../../i18n';
import { escapeHtml, formatNumber } from '../../services/format';
import { bindAccounts } from './current';
import { bindOwner, classButtons, CLASSES, cycleState, ownerParam, ownerSelector, words } from './model';

const SHOWN = 300, SEARCH_WAIT_MS = 350;

interface Classifiable { id: string; nombre: string; especialidad?: string | null; municipio?: string | null; estado_comercial?: string | null; actividades_12m: number; clase?: string | null }

function rowHtml(item: Classifiable): string {
  return `<div class="item cicrow" data-cfila="${item.id}">
        <span class="tx"><button type="button" class="lnk" data-cfi="${item.id}"><b>${escapeHtml(item.nombre)}</b></button>
          <span class="sm">${escapeHtml([item.especialidad, item.municipio, item.estado_comercial].filter(Boolean).join(' · '))}</span></span>
        <span class="cicfal"><b>${formatNumber(item.actividades_12m)}</b><span class="sm">${t('cycle.classifyPage.in12Months')}</span></span>
        ${classButtons(item.id, item.clase)}</div>`;
}

function listHtml(rows: readonly Classifiable[]): string {
  if (!rows.length) return `<div class="vacio vlinea">${t(cycleState.classifyFilter === 'sin' && !cycleState.query ? 'cycle.classifyPage.allClassified' : 'cycle.classifyPage.noneWithFilter')}</div>`;
  return `<section class="card cicbloque"><div class="lista">${rows.map(rowHtml).join('')}</div></section>${rows.length >= SHOWN ? `<p class="sm">${t('cycle.classifyPage.firstOnly')}</p>` : ''}`;
}

function pageHtml(rows: readonly Classifiable[], selector: string): string {
  const filters = [['sin', t('cycle.classifyPage.unclassified')], ...CLASSES.map(letter => [letter, letter]), ['todas', t('cycle.classifyPage.all')]]
    .map(([value = '', label = '']) => `<button type="button" data-cl="${value}" class="${value === cycleState.classifyFilter ? 'on' : ''}" aria-pressed="${String(value === cycleState.classifyFilter)}">${label}</button>`).join('');
  return `<div class="cicpag"><div class="ciccab"><span class="segs" id="cicclf" role="group" aria-label="${t('cycle.classifyPage.show')}">${filters}</span>
      <span class="cicacc"><input id="cicq" type="search" placeholder="${t('cycle.classifyPage.search', words())}" value="${escapeHtml(cycleState.query)}" aria-label="${t('cycle.classifyPage.searchLabel')}">${selector}</span></div>
    <p class="sm">${t('cycle.classifyPage.hint', words())}</p>
    ${listHtml(rows)}</div>`;
}

let searchTimer: ReturnType<typeof setTimeout> | undefined;

function bind(box: HTMLElement, wasSearching: boolean): void {
  box.querySelectorAll<HTMLElement>('#cicclf [data-cl]').forEach(button => { button.onclick = (): void => { cycleState.classifyFilter = button.dataset.cl ?? 'sin'; void paintClassify(); }; });
  const search = document.getElementById('cicq') as HTMLInputElement | null;
  if (search) {
    search.oninput = (): void => { clearTimeout(searchTimer); searchTimer = setTimeout(() => { cycleState.query = search.value.trim(); void paintClassify(); }, SEARCH_WAIT_MS); };
    // Typing repaints the page: the search keeps the focus and the cursor at the end
    if (wasSearching) { search.focus(); search.setSelectionRange(search.value.length, search.value.length); }
  }
  bindOwner(paintClassify);
  bindAccounts(box);
}

export async function paintClassify(): Promise<void> {
  if (!document.getElementById('cfgcuerpo')) return;
  const [{ data, error }, selector] = await Promise.all([
    rpc('cuentas_para_clasificar', { p_usuario: ownerParam(), p_filtro: cycleState.classifyFilter, p_q: cycleState.query || null }), ownerSelector(),
  ]);
  const rows = data as Classifiable[] | null;
  const box = document.getElementById('cfgcuerpo');
  if (!box || currentScreen() !== 'ciclo') return;
  if (error) { box.innerHTML = `<div class="vacio">${t('cycle.classifyPage.couldNotLoad')}</div>`; return; }
  const search = document.getElementById('cicq'), wasSearching = Boolean(search) && document.activeElement === search;
  box.innerHTML = pageHtml(rows ?? [], selector);
  bind(box, wasSearching);
}

async function classify(button: HTMLButtonElement, onCard: (id: string) => void): Promise<void> {
  const [id = '', letter = ''] = (button.dataset.ccl ?? '').split('|'), group = button.closest('.cicsegs');
  if (!group) return;
  const chosen = button.classList.contains('on') ? null : letter, buttons = [...group.querySelectorAll('button')];
  buttons.forEach(other => { other.disabled = true; });
  const { data, error } = await rpc('clasificar_cuentas', { p_ids: [id], p_clase: chosen }), result = data as { ok?: boolean; error?: string } | null;
  buttons.forEach(other => { other.disabled = false; });
  if (error || !result || result.ok === false) { notices.toast(t(result?.error === 'permiso' ? 'cycle.classifyPage.noPermission' : 'cycle.classifyPage.couldNotSave'), true); return; }
  buttons.forEach(other => { const on = other.dataset.ccl === `${id}|${String(chosen)}`; other.classList.toggle('on', on); other.setAttribute('aria-pressed', String(on)); });
  appLegacy.forgetCache();
  if (group.closest('#fciclo')) onCard(id);
}

/** A, B or C anywhere (the «Clasificar» page and the account card): pressing the marked one removes it. */
export function listenToClassButtons(onCard: (id: string) => void): void {
  document.addEventListener('click', event => {
    const button = (event.target as Element | null)?.closest<HTMLButtonElement>('[data-ccl]');
    if (!button || button.disabled) return;
    void classify(button, onCard);
  }, true);
}
