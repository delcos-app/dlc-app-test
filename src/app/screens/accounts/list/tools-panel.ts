/**
 * The side panel «Herramientas» of the directory (legado 014, v2.424.0): its filters, the custom field filters, the order and the
 * columns. Pressing the same button again closes it. abrirHerramientasBase stays as an adapter (legado 053 wraps it).
 */
import { term } from '../../../legacy/bridge';
import { toolsPanelLegacy } from '../../../legacy/legado-a-bridge';
import { t } from '../../../i18n';

const DIRECTORY = 'directorio';
const DOWNLOADERS: Readonly<Record<string, string>> = { directorio: '__dlDir', seguimiento: '__dlSeg', analitica: '__dlAn' };
const selected = (on: boolean): string => (on ? 'selected' : '');
const checked = (on: boolean): string => (on ? 'checked' : '');

function selectsHtml(filters: AccountFilters): string {
  const options = toolsPanelLegacy.options();
  return `
    <label>${t('legacyA.tools.type')}</label><select data-tf="tipo"><option value="">${t('legacyA.tools.all')}</option><option value="Persona" ${selected(filters.tipo === 'Persona')}>${t('legacyA.tools.professionals')}</option><option value="Centro" ${selected(filters.tipo === 'Centro')}>${t('legacyA.tools.centres')}</option></select>
    <label>${t('legacyA.tools.province')}</label><select data-tf="prov">${toolsPanelLegacy.option(options.provincias, filters.prov, t('legacyA.tools.allProvinces'))}</select>
    <label>${t('legacyA.tools.municipality')}</label><select data-tf="muni">${toolsPanelLegacy.option(options.municipios, filters.muni, t('legacyA.tools.allMunicipalities'))}</select>
    <label>${term('especialidad', { capital: 'C' })}</label><select data-tf="esp">${toolsPanelLegacy.option(options.especialidades, filters.esp, toolsPanelLegacy.allOf('especialidad'))}</select>
    <label>${t('legacyA.tools.commercialState')}</label><select data-tf="est">${toolsPanelLegacy.option(options.estados, filters.est, t('legacyA.tools.allStates'))}</select>
    <label>${t('legacyA.tools.reporting')}</label><select data-tf="rep"><option value="">${t('legacyA.tools.everyone')}</option><option value="con" ${selected(filters.rep === 'con')}>${t('legacyA.tools.withReporting')}</option><option value="sin" ${selected(filters.rep === 'sin')}>${t('legacyA.tools.withoutReporting')}</option></select>
    ${toolsPanelLegacy.seesEverything() && document.getElementById('fcom') ? `<label>${t('legacyA.tools.salesperson')}</label><select data-tf="com">${document.getElementById('fcom')?.innerHTML ?? ''}</select>` : ''}`;
}

function filtersHtml(filters: AccountFilters): string {
  const order = filters.orden;
  return `
    <h3>${t('legacyA.tools.filters')}</h3>${selectsHtml(filters)}
    <label class="opt u-mt-10"><input type="checkbox" data-tfc="mios" ${checked(Boolean(filters.mios))}> ${t('legacyA.tools.onlyMine', { theProfessionals: term('medico', { number: 'p', article: 'el' }) })}</label>
    <label class="opt"><input type="checkbox" data-tfc="sin" ${checked(Boolean(filters.sin))}> ${t('legacyA.tools.neverVisited')}</label>
    <label class="opt"><input type="checkbox" data-tfc="urg" ${checked(filters.urg)}> ${t('legacyA.tools.onlyUrgent')}</label>
    <div class="tfcampos">${toolsPanelLegacy.fieldFilters(filters.campos)}</div>
    <label>${t('legacyA.tools.orderBy')}</label><select data-tf="orden">
      <option value="nombre" ${selected(order === 'nombre')}>${t('legacyA.tools.name')}</option>
      <option value="urgentes" ${selected(order === 'urgentes')}>${t('legacyA.tools.urgentFirst')}</option>
      <option value="reciente" ${selected(order === 'reciente')}>${t('legacyA.tools.recent', { Visit: term('visita', { capital: 'C' }) })}</option></select>
    <div class="acts"><button class="btn sec" id="tlimpiar">${t('legacyA.tools.clear')}</button></div>
    <h3 style="margin-top:18px">${t('legacyA.tools.columns')}</h3>
    <p class="sm">${t('legacyA.tools.columnsHint')}</p>
    <div class="acts"><button class="btn sec" id="tcols">${t('legacyA.tools.chooseColumns')}</button></div>`;
}

function clearFilters(panel: HTMLElement, filters: AccountFilters): void {
  Object.assign(filters, { q: '', prov: '', muni: '', esp: '', est: '', urg: false, mios: false, sin: false, orden: 'nombre', com: '', rep: '', campos: {} });
  for (const id of ['frep', 'fcom', 'q']) { const field = document.getElementById(id) as HTMLInputElement | null; if (field) field.value = ''; }
  toolsPanelLegacy.search(); panel.classList.remove('abierto');
}

function bind(panel: HTMLElement, context: string, filters: AccountFilters): void {
  const record = filters as unknown as Record<string, unknown>;
  panel.querySelectorAll<HTMLSelectElement>('[data-tf]').forEach(select => {
    select.onchange = (): void => {
      const key = select.dataset.tf ?? '';
      if (key === 'prov') { filters.prov = select.value; filters.muni = ''; toolsPanelLegacy.loadFilters(); } else record[key] = select.value;
      toolsPanelLegacy.search();
    };
  });
  const salesperson = panel.querySelector<HTMLSelectElement>('[data-tf="com"]'); if (salesperson) salesperson.value = filters.com ?? '';
  toolsPanelLegacy.bindFieldFilters(panel, filters.campos);
  panel.querySelectorAll<HTMLInputElement>('[data-tfc]').forEach(box => { box.onchange = (): void => { record[box.dataset.tfc ?? ''] = box.checked; toolsPanelLegacy.search(); }; });
  const clear = document.getElementById('tlimpiar'); if (clear) clear.onclick = (): void => { clearFilters(panel, filters); };
  const columns = document.getElementById('tcols'); if (columns) columns.onclick = (): void => { panel.classList.remove('abierto'); toolsPanelLegacy.openColumns(); };
  panel.querySelectorAll<HTMLElement>('[data-tdl]').forEach(button => {
    button.onclick = (): void => {
      panel.classList.remove('abierto');
      const download = (window as unknown as Record<string, ((format: string) => void) | undefined>)[DOWNLOADERS[context] ?? ''];
      if (download) download(button.dataset.tdl ?? '');
    };
  });
}

/** Opens the panel for `context` (or closes it if it is already open for it). */
export function openTools(context: string): void {
  const panel = document.getElementById('tools'); if (!panel) return;
  if (panel.classList.contains('abierto') && toolsPanelLegacy.context() === context) { panel.classList.remove('abierto'); return; }
  toolsPanelLegacy.setContext(context);
  const filters = toolsPanelLegacy.filters();
  panel.innerHTML = `<div class="tbox">
    <div class="fh"><h2>${t('legacyA.tools.title')}</h2><button class="x" id="tclose" aria-label="${t('common.close')}">✕</button></div>
    ${context === DIRECTORY ? filtersHtml(filters) : ''}
  </div>`;
  panel.classList.add('abierto');
  const close = document.getElementById('tclose'); if (close) close.onclick = (): void => { panel.classList.remove('abierto'); };
  bind(panel, context, filters);
}
