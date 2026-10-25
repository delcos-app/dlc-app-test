/**
 * The Analítica page: «Resumen» (indicators by area) and «Explorar datos» (the screen filters, «Ver por», «Ordenar por», Ranking and
 * Tabla por meses), with «Personalizar» in the header for the Resumen. Migrated from the legacy cargarAnalitica with its Base layers
 * (v2.419.0); cargarAnalitica stays as an adapter (the page map of legado 001 and the screen cache of legado 057 call it).
 */
import { permissions, salesTeam, term } from '../../../legacy/bridge';
import { panelsLegacy } from '../../../legacy/panels-bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { paintRanking, refreshExplore } from '../explore';
import { paintMonthlyTable } from '../monthly-table';
import { analyticsState, loadConfig } from './catalog';
import { customise } from './customise';
import { loadKpis } from './kpis';
import { markTab, paintSummary } from './summary';

const SELECTS = ['adim', 'acanal', 'amedida', 'aprod', 'acom', 'arep', 'areprt'];
const element = (id: string): HTMLElement | null => document.getElementById(id);

const option = (value: string, text: string): string => `<option value="${value}">${text}</option>`;

function filtersHtml(): string {
  const all = permissions.seesEverything();
  return `<div id="aper"></div>
        <div><label for="adim">${t('panels.analytics.viewBy')}</label><select id="adim">
          ${option('medico', term('medico', { capital: 'C' }))}${option('comercial', t('panels.analytics.commercial'))}
          ${option('producto', t('panels.analytics.product'))}${option('municipio', t('panels.analytics.municipality'))}
          ${option('mes', t('panels.analytics.month'))}${option('canal', t('panels.analytics.channel'))}</select></div>
        <div><label for="amedida">${t('panels.analytics.sortBy')}</label><select id="amedida">
          ${option('unidades', t('panels.analytics.units'))}${option('importe', t('panels.analytics.amount'))}</select></div>
        <div><label for="acanal">${t('panels.analytics.channel')}</label><select id="acanal">
          ${option('', t('panels.analytics.all'))}${option('paciente', t('panels.analytics.toCustomer', { toPatient: term('paciente', { article: 'al' }) }))}
          ${option('centro', t('panels.analytics.toCentre'))}</select></div>
        <div><label for="aprod">${t('panels.analytics.product')}</label><select id="aprod">${option('', t('panels.analytics.all'))}
          ${panelsLegacy.products().map(product => `<option value="${product.id}">${escapeHtml(product.nombre)}</option>`).join('')}</select></div>
        <div><label for="arep">${t('panels.analytics.reporting')}</label><select id="arep">${option('', t('panels.analytics.allProfessionals', { theProfessionals: term('medico', { number: 'p', article: 'el' }) }))}
          ${option('con', t('panels.analytics.withReporting'))}${option('sin', t('panels.analytics.withoutReporting'))}</select></div>
        ${all ? `<div><label for="areprt">${t('panels.analytics.report')}</label><select id="areprt">${option('', t('panels.analytics.all'))}${option('si', t('panels.analytics.reported'))}${option('no', t('panels.analytics.notReported'))}</select></div>` : ''}
        ${all ? `<div><label for="acom">${t('panels.analytics.commercial')}</label><select id="acom">${option('', t('panels.analytics.all'))}
          ${salesTeam.members().map(member => `<option value="${member.id}">${escapeHtml(member.nombre)}</option>`).join('')}</select></div>` : ''}
        <div style="grid-column:span 2"><label>${term('medico', { capital: 'C' })}</label><div id="amed"></div></div>
        <input type="hidden" id="adesde"><input type="hidden" id="ahasta">`;
}

function pageHtml(): string {
  return `
    <div class="saludo"><div><h1>${t('panels.analytics.title')}</h1><div class="fecha">${t('panels.analytics.subtitle', { professional: term('medico') })}</div></div></div>
    <div class="panel">
      <div class="filtros">
        ${filtersHtml()}
      </div>
      <div class="kpis vtot" id="atot"></div>
      <div id="aprods"></div>
      <div class="subnav"><button data-avista="rank" aria-pressed="true">${t('panels.analytics.ranking')}</button>
        <button data-avista="tabla" aria-pressed="false">${t('panels.analytics.monthlyTable')}</button></div>
      <div id="aserie" style="padding:14px"></div>
      <div id="atabla"></div>
      <div id="atabla2" class="hide"></div>
    </div>`;
}

function syncPeriod(): void {
  const range = Reflect.get(element('aper') ?? {}, '__rango') as (() => { desde?: string | null; hasta?: string | null }) | undefined;
  const chosen = range ? range() : {};
  const from = element('adesde') as HTMLInputElement | null, to = element('ahasta') as HTMLInputElement | null;
  if (from) from.value = chosen.desde ?? '';
  if (to) to.value = chosen.hasta ?? '';
}

function bindExplore(view: HTMLElement): void {
  panelsLegacy.mountPeriod(element('aper'), { id: 'analitica', valor: 'anio', alCambiar: () => { syncPeriod(); refreshExplore(); } });
  syncPeriod();
  panelsLegacy.pickProfessional(element('amed'), {
    value: panelsLegacy.professional(), placeholder: t('panels.analytics.professionalPlaceholder', { aProfessional: term('medico', { article: 'un' }) }),
    onPick: account => { panelsLegacy.setProfessional(account); refreshExplore(); },
  });
  SELECTS.forEach(id => { const select = element(id); if (select) select.onchange = (): void => { refreshExplore(); }; });
  view.querySelectorAll<HTMLElement>('[data-avista]').forEach(button => {
    button.onclick = (): void => {
      const table = button.dataset.avista === 'tabla';
      view.querySelectorAll('[data-avista]').forEach(other => { other.setAttribute('aria-pressed', String(other === button)); });
      element('atabla')?.classList.toggle('hide', table); element('aserie')?.classList.toggle('hide', table);
      element('atabla2')?.classList.toggle('hide', !table);
      if (table) void paintMonthlyTable();
    };
  });
}

/** «Resumen» / «Explorar datos» under the header. */
function addTabs(view: HTMLElement, panel: Element): void {
  const section = panelsLegacy.section();
  view.querySelector('.saludo')?.insertAdjacentHTML('afterend', `<div class="subnav" id="ansub">
    <button data-ansec="resumen" aria-pressed="${String(section === 'resumen')}">${t('panels.analytics.summary')}</button>
    <button data-ansec="explorar" aria-pressed="${String(section === 'explorar')}">${t('panels.analytics.explore')}</button></div>
    <div id="anres" class="${section === 'resumen' ? '' : 'hide'}"></div>`);
  panel.classList.toggle('hide', section === 'resumen');
  view.querySelectorAll<HTMLElement>('[data-ansec]').forEach(button => {
    button.onclick = (): void => {
      panelsLegacy.setSection(button.dataset.ansec ?? 'resumen');
      const summary = panelsLegacy.section() === 'resumen';
      view.querySelectorAll('[data-ansec]').forEach(other => { other.setAttribute('aria-pressed', String(other === button)); });
      element('anres')?.classList.toggle('hide', !summary); panel.classList.toggle('hide', summary);
      if (summary && !element('ankpis')) void paintSummary();
      setTimeout(markTab, 0);
    };
  });
}

/** Explorar: «Ver por» and «Ordenar por» stay in view, above Ranking / Tabla; the rest goes to «Filtros y columnas». */
function keepInView(panel: Element): void {
  const filters = panel.querySelector(':scope > .filtros');
  if (!filters || element('anvista')) return;
  filters.insertAdjacentHTML('afterend', '<div class="anvista" id="anvista"></div>');
  const place = element('anvista');
  ['adim', 'amedida'].forEach(id => {
    const holder = element(id)?.closest<HTMLElement>('.filtros > div') ?? element(id)?.closest<HTMLElement>('.htpropios > div');
    if (holder && place) { delete holder.dataset.anp; place.appendChild(holder); }
  });
  [...filters.children].forEach(child => { (child as HTMLElement).dataset.anp = 'explorar'; });
}

/** «Personalizar», in the header (only in the Resumen). */
function addCustomise(view: HTMLElement): void {
  const greeting = view.querySelector('.saludo');
  const subtitle = greeting?.querySelector('.fecha'); if (subtitle) subtitle.textContent = t('panels.analytics.summarySubtitle');
  if (!greeting || element('anpers')) return;
  let acts = greeting.querySelector(':scope > .acts');
  if (!acts) { greeting.insertAdjacentHTML('beforeend', '<div class="acts"></div>'); acts = greeting.querySelector(':scope > .acts'); }
  acts?.insertAdjacentHTML('afterbegin', `<button type="button" class="btn sec" id="anpers">${t('panels.analytics.customise')}</button>`);
  const button = element('anpers');
  if (button) button.onclick = (): void => { analyticsState.config = analyticsState.config ?? loadConfig(); customise(() => { void loadKpis(); }); };
}

export async function loadAnalytics(): Promise<void> {
  if (!salesTeam.members().length && permissions.seesEverything()) await salesTeam.load();
  await panelsLegacy.loadProducts();
  const view = element('v-analitica'); if (!view) return;
  view.innerHTML = pageHtml();
  bindExplore(view);
  void paintRanking();
  const panel = view.querySelector('.panel'); if (!panel) return;
  addTabs(view, panel);
  if (panelsLegacy.section() === 'resumen') await paintSummary();
  keepInView(panel);
  addCustomise(view);
  markTab();
}
