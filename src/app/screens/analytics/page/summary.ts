/**
 * Analítica → «Resumen»: its period and comparison (in «Filtros y columnas»), the indicators by area and the charts; and moving the
 * filters of both tabs into the panel (each time: the Resumen can be painted again), with «Ver por», «Ordenar por» and the search in
 * view. Migrated from the legacy pintarResumenAnalitica, anMoverFiltros and anPestana (v2.419.0); pintarResumenAnalitica stays as
 * an adapter (legado 028 calls it).
 */
import { permissions, salesTeam } from '../../../legacy/bridge';
import { panelsLegacy } from '../../../legacy/panels-bridge';
import { t } from '../../../i18n';
import { counter } from '../../../components/filters-panel/counter';
import { prepare } from '../../../components/filters-panel/prepare';
import { analyticsState, loadConfig, saveConfig } from './catalog';
import { paintCharts } from './charts';
import { loadKpis, summaryPeriod } from './kpis';

const SKELETON_CARDS = 4;

/** The filters of both tabs go into the panel; «Ver por», «Ordenar por» and the text search stay in view. */
export function moveFilters(): void {
  const view = document.getElementById('v-analitica'); if (!view) return;
  prepare(view);
  const target = view.querySelector('.htpanel .htpropios'); if (!target) return;
  ([['#anfil', 'resumen'], ['#v-analitica .panel > .filtros', 'explorar']] as const).forEach(([selector, tab]) => {
    const source = document.querySelector<HTMLElement>(selector); if (!source) return;
    [...source.children].forEach(child => {
      if (child.matches('input[type=search],input[type=text]') || child.querySelector('input[type=search],input[type=text], #adim, #amedida')) return;
      (child as HTMLElement).dataset.anp = tab; target.appendChild(child);
    });
    source.dataset.ht = '1'; if (!source.children.length) source.classList.add('hide');
  });
  target.querySelectorAll<HTMLSelectElement>('select').forEach(select => {
    if (!select.dataset.anht) { select.dataset.anht = '1'; select.addEventListener('change', () => { counter(view); }); }
  });
}

/** Marks the tab on the view (and on the side panel, which is outside the view) and moves the filters. */
export function markTab(): void {
  const view = document.getElementById('v-analitica'); if (!view) return;
  const explore = panelsLegacy.section() === 'explorar';
  view.classList.toggle('an-exp', explore); view.classList.toggle('an-res', !explore);
  const tools = document.getElementById('tools'); if (tools) tools.dataset.ansec = explore ? 'explorar' : 'resumen';
  moveFilters();
  const customiseButton = document.getElementById('anpers'); if (customiseButton) customiseButton.hidden = explore;
}

const option = (value: string, text: string, selected: boolean): string => `<option value="${value}" ${selected ? 'selected' : ''}>${text}</option>`;

function summaryHtml(comparison: string): string {
  const report = panelsLegacy.reportFilter();
  return `<div class="filtros" id="anfil"><div id="anper" data-anp="resumen"></div>
      <div data-anp="resumen"><label for="ancomp">${t('panels.analytics.compareWith')}</label><select id="ancomp">
        ${option('anterior', t('panels.analytics.previousPeriod'), comparison === 'anterior')}
        ${option('anio', t('panels.analytics.lastYear'), comparison === 'anio')}</select></div>
      ${permissions.seesEverything() ? `<div data-anp="resumen"><label for="anrep">${t('panels.analytics.report')}</label><select id="anrep">${option('', t('panels.analytics.all'), false)}${option('si', t('panels.analytics.reported'), report === 'si')}${option('no', t('panels.analytics.notReported'), report === 'no')}</select></div>` : ''}</div>
    <p class="sm anresumen" id="anresumen"></p>
    <div id="ankpis" hidden></div>
    <div id="anareas"><div class="ankgrid">${Array.from({ length: SKELETON_CARDS }, () => '<div class="ankpi"><div class="skel" style="width:60%"></div><div class="skel" style="width:40%;height:24px"></div></div>').join('')}</div></div>
    <div class="angrid" id="angraf"></div>`;
}

function paintFigures(): void {
  const { from, to } = summaryPeriod();
  void loadKpis(); void paintCharts(from, to);
}

function bindSummary(): void {
  panelsLegacy.mountPeriod(document.getElementById('anper'), { id: 'analitica-resumen', valor: 'anio', alCambiar: paintFigures });
  const comparison = document.getElementById('ancomp') as HTMLSelectElement | null;
  if (comparison) comparison.onchange = async (): Promise<void> => {
    const config = analyticsState.config; if (!config) return;
    config.comp = comparison.value; await saveConfig(config); void loadKpis();
  };
  // v2.329.0: «Reporte»
  const report = document.getElementById('anrep') as HTMLSelectElement | null;
  if (report) report.onchange = (): void => { panelsLegacy.setReportFilter(report.value); void loadKpis(); };
}

/** Paints the Resumen tab. */
export async function paintSummary(): Promise<void> {
  const body = document.getElementById('anres'); if (!body) return;
  if (!salesTeam.members().length && permissions.seesEverything()) await salesTeam.load();
  analyticsState.config = loadConfig();
  // The filters of a previous painting
  document.querySelectorAll('#v-analitica .htpropios [data-anp="resumen"]').forEach(item => { item.remove(); });
  body.innerHTML = summaryHtml(analyticsState.config.comp);
  bindSummary();
  paintFigures();
  moveFilters();
}
