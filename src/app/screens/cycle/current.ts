/**
 * Ciclo de visitas → «Este ciclo»: how each class goes and who still needs visits this cycle, with «+ Cita». Migrated from the
 * legacy pintarCiclo (v2.408.0).
 */
import { agendaActions, cardSectionsLegacy, currentScreen, legacyDb } from '../../legacy/bridge';
import { t } from '../../i18n';
import { formatShortDate } from '../../services/date-format';
import { escapeHtml, formatNumber } from '../../services/format';
import { sum } from '../../services/values';
import { bindOwner, classPill, CLASSES, cycleName, cycleState, goToTab, ownerParam, ownerSelector, percentOf, progressBar, rangeText, visitsText, words } from './model';
import { editCycle } from './settings';

interface ClassSummary { clase: string; cuentas: number; al_dia: number; hechas: number; objetivo: number }
interface Pending { id: string; clase: string; nombre: string; especialidad?: string | null; municipio?: string | null; ultima_visita?: string | null; hechas: number; objetivo: number; faltan: number; proxima_cita?: string | null }
interface CycleData { meses: number; desde: string; hasta: string; quedan_dias: number; sin_clase?: number; resumen?: ClassSummary[]; objetivo?: Record<string, number>; pendientes?: Pending[] }

const EMPTY: ClassSummary = { clase: '', cuentas: 0, al_dia: 0, hechas: 0, objetivo: 0 };

function classCard(letter: string, data: CycleData): string {
  const summary = (data.resumen ?? []).find(item => item.clase === letter) ?? EMPTY, percent = percentOf(summary.hechas, summary.objetivo);
  const head = summary.cuentas ? t('cycle.current.upToDate', { done: formatNumber(summary.al_dia), total: formatNumber(summary.cuentas) }) : t('cycle.current.noneIn', { class: letter });
  return `<div class="card cicc">${classPill(letter)}<div class="cicct"><b>${head}</b>
      <span class="sm">${t('cycle.current.every', { visits: visitsText(data.objetivo?.[letter] ?? 0), cycle: cycleName(data.meses) })}</span></div>
      ${summary.cuentas ? `${progressBar(percent, 'div')}<span class="sm">${t('cycle.current.doneOf', { done: formatNumber(summary.hechas), goal: visitsText(summary.objetivo), percent })}</span>` : ''}</div>`;
}

function pendingRow(item: Pending): string {
  const place = escapeHtml([item.especialidad, item.municipio].filter(Boolean).join(' · '));
  const last = item.ultima_visita ? t('cycle.current.lastVisit', { ...words(), date: formatShortDate(item.ultima_visita) }) : t('cycle.current.noVisits', words());
  return `<div class="item cicrow">${classPill(item.clase)}
        <span class="tx"><button type="button" class="lnk" data-cfi="${item.id}"><b>${escapeHtml(item.nombre)}</b></button>
          <span class="sm">${place}${last}</span></span>
        <span class="cicfal"><b>${t('cycle.current.progress', { done: item.hechas, goal: item.objetivo })}</b><span class="sm">${item.faltan === 1 ? t('cycle.current.oneMissing') : t('cycle.current.missing', { count: item.faltan })}</span></span>
        ${item.proxima_cita ? `<span class="pill p-per">${t('cycle.current.appointmentOn', { date: formatShortDate(item.proxima_cita) })}</span>` : `<button type="button" class="btn sec" data-ccita="${item.id}">${t('cycle.current.newAppointment')}</button>`}</div>`;
}

function headerHtml(data: CycleData, selector: string): string {
  const left = data.quedan_dias === 1 ? t('cycle.current.oneDayLeft') : t('cycle.current.daysLeft', { count: formatNumber(data.quedan_dias) });
  return `<div class="ciccab"><div><b>${escapeHtml(rangeText(data))}</b>
      <span class="sm">${left} · ${t('cycle.current.allCount', words())}</span></div>
      <span class="cicacc">${selector}${cardSectionsLegacy.can('administrar') ? `<button type="button" class="btn sec" id="cicajustar">${t('cycle.current.adjust')}</button>` : ''}</span></div>`;
}

function unclassifiedHtml(count: number): string {
  if (!count) return '';
  const text = count === 1 ? t('cycle.current.oneUnclassified', words()) : t('cycle.current.unclassified', { ...words(), count: formatNumber(count) });
  return `<div class="banda-aviso cicsin">${text}${t('cycle.current.unclassifiedTail')}
      <button type="button" class="btn sec" id="cicirclas">${t('cycle.classify')}</button></div>`;
}

function missingHtml(data: CycleData): string {
  const filter = cycleState.classFilter, pending = (data.pendientes ?? []).filter(item => !filter || item.clase === filter), cycle = cycleName(data.meses);
  const buttons = [['', t('cycle.current.all')], ...CLASSES.map(letter => [letter, letter])]
    .map(([value = '', label = '']) => `<button type="button" data-cf="${value}" class="${value === filter ? 'on' : ''}" aria-pressed="${String(value === filter)}">${label}</button>`).join('');
  const empty = filter ? t('cycle.current.noneMissingIn', { ...words(), class: filter }) : t('cycle.current.allUpToDate', { cycle });
  return `<section class="card cicbloque"><div class="cicbcab"><h2>${t('cycle.current.missingTitle', { ...words(), cycle })}</h2>
        <span class="segs" id="cicfil" role="group" aria-label="${t('cycle.classLabel')}">${buttons}</span></div>
      ${pending.length ? `<div class="lista">${pending.map(pendingRow).join('')}</div>` : `<div class="vacio vlinea">${empty}</div>`}</section>`;
}

function pageHtml(data: CycleData, selector: string): string {
  const classified = sum((data.resumen ?? []).map(item => item.cuentas));
  return `<div class="cicpag">${headerHtml(data, selector)}
    ${unclassifiedHtml(data.sin_clase ?? 0)}
    ${classified ? `<div class="cicres">${CLASSES.map(letter => classCard(letter, data)).join('')}</div>
    ${missingHtml(data)}` : `<div class="vacio">${t('cycle.current.nobodyClassified', words())}</div>`}</div>`;
}

/** Opens the account card and «+ Cita» buttons of a cycle page. */
export function bindAccounts(box: HTMLElement): void {
  box.querySelectorAll<HTMLElement>('[data-cfi]').forEach(button => { button.onclick = (): void => { agendaActions.openAccount(button.dataset.cfi ?? ''); }; });
  box.querySelectorAll<HTMLElement>('[data-ccita]').forEach(button => { button.onclick = (): void => { agendaActions.newAppointment(button.dataset.ccita ?? '', null); }; });
}

/** «Clasificar» from a notice: the classify tab with the unclassified ones. */
export function bindClassify(elementId: string): void {
  const button = document.getElementById(elementId);
  if (button) button.onclick = (): void => { cycleState.classifyFilter = 'sin'; goToTab('clasificar'); };
}

function bind(box: HTMLElement): void {
  bindOwner(paintCycle);
  const adjust = document.getElementById('cicajustar'); if (adjust) adjust.onclick = (): void => { void editCycle(); };
  bindClassify('cicirclas');
  box.querySelectorAll<HTMLElement>('#cicfil [data-cf]').forEach(button => { button.onclick = (): void => { cycleState.classFilter = button.dataset.cf ?? ''; void paintCycle(); }; });
  bindAccounts(box);
}

export async function paintCycle(): Promise<void> {
  if (!document.getElementById('cfgcuerpo')) return;
  const [{ data, error }, selector] = await Promise.all([legacyDb().rpc<CycleData>('ciclo_cuentas', { p_usuario: ownerParam() }), ownerSelector()]);
  // The page may have been painted again meanwhile: the box is looked up after the answer
  const box = document.getElementById('cfgcuerpo');
  if (!box || currentScreen() !== 'ciclo') return;
  if (error || !data) { box.innerHTML = `<div class="vacio">${t('cycle.current.couldNotLoad')}</div>`; return; }
  box.innerHTML = pageHtml(data, selector);
  bind(box);
}
