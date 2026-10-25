/**
 * The gear of an indicator: its own filter (commercial, product, channel, municipality, only those that make sense in its area), the
 * comparison, its name, duplicate it with another filter, or hide it. Migrated from the legacy anEngranaje (v2.419.0).
 */
import { notices, permissions, salesTeam } from '../../../legacy/bridge';
import { panelsLegacy } from '../../../legacy/panels-bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { analyticsState, catalogue, FILTERS_BY_FAMILY, kpiTitle, saveConfig, type Kpi, type KpiFilter, type KpiSetting } from './catalog';

const MAX_WIDTH = 320, MARGIN = 10, GAP = 6;

const option = (value: string, text: string, selected: boolean): string => `<option value="${escapeHtml(value)}" ${selected ? 'selected' : ''}>${escapeHtml(text)}</option>`;
const field = (id: string): HTMLInputElement | null => document.getElementById(id) as HTMLInputElement | null;

function filterFields(setting: KpiSetting, kpi: Kpi): string {
  const fits = FILTERS_BY_FAMILY[kpi.fam] ?? [], filter = setting.f;
  const channelSelect = document.getElementById('acanal') as HTMLSelectElement | null;
  const channels = channelSelect ? [...channelSelect.options].map(item => option(item.value, item.textContent ?? '', item.value === (filter.canal ?? ''))).join('') : '';
  return `${fits.includes('comercial') && permissions.seesEverything() ? `<label for="ankc">${t('panels.gear.commercial')}</label><select id="ankc">${option('', t('panels.gear.all'), !filter.comercial)}${salesTeam.members().map(member => option(member.id, member.nombre, member.id === filter.comercial)).join('')}</select>` : ''}
    ${fits.includes('producto') ? `<label for="ankp">${t('panels.gear.product')}</label><select id="ankp">${option('', t('panels.gear.all'), !filter.producto)}${panelsLegacy.products().map(product => option(product.id, product.nombre, product.id === filter.producto)).join('')}</select>` : ''}
    ${fits.includes('canal') && channels ? `<label for="ankca">${t('panels.gear.channel')}</label><select id="ankca">${channels}</select>` : ''}
    ${fits.includes('municipio') ? `<label for="ankm">${t('panels.gear.municipality')}</label><input id="ankm" autocomplete="off" value="${escapeHtml(filter.municipio ?? '')}" placeholder="${t('panels.gear.all')}">` : ''}
    ${!fits.length ? `<p class="sm">${t('panels.gear.notFiltered')}</p>` : ''}`;
}

function gearHtml(setting: KpiSetting, kpi: Kpi): string {
  const title = kpiTitle(kpi);
  return `<div class="agpoph"><b>${escapeHtml(setting.t || title)}</b><button type="button" class="x" aria-label="${t('panels.gear.close')}">✕</button></div>
    <label for="ankn">${t('panels.gear.name')}</label><input id="ankn" autocomplete="off" value="${escapeHtml(setting.t || '')}" placeholder="${escapeHtml(title)}">
    ${filterFields(setting, kpi)}
    ${kpi.hoy ? '' : `<label for="ankcmp">${t('panels.gear.compareWith')}</label><select id="ankcmp">${option('', t('panels.gear.sameAsPanel'), !setting.comp)}${option('anterior', t('panels.gear.previous'), setting.comp === 'anterior')}${option('anio', t('panels.gear.lastYear'), setting.comp === 'anio')}</select>`}
    <div class="acts ankacts"><button type="button" class="btn sec" id="ankdup">${t('panels.gear.duplicate')}</button><button type="button" class="btn sec" id="ankoff">${t('panels.gear.hide')}</button>
      <button type="button" class="btn" id="ankok">${t('panels.gear.save')}</button></div>`;
}

function place(popover: HTMLElement, button: Element): void {
  const box = button.getBoundingClientRect(), width = Math.min(MAX_WIDTH, innerWidth - 2 * MARGIN);
  popover.style.width = `${width}px`;
  popover.style.left = `${Math.max(MARGIN, Math.min(innerWidth - width - MARGIN, box.right - width))}px`;
  popover.style.top = `${Math.max(MARGIN, Math.min(innerHeight - popover.offsetHeight - MARGIN, box.bottom + GAP))}px`;
}

function read(): Pick<KpiSetting, 'f' | 't' | 'comp'> {
  const filter: KpiFilter = {};
  const value = (id: string): string => field(id)?.value ?? '';
  if (value('ankc')) filter.comercial = value('ankc');
  if (value('ankp')) filter.producto = value('ankp');
  if (value('ankca')) filter.canal = value('ankca');
  if (value('ankm').trim()) filter.municipio = value('ankm').trim();
  return { f: filter, t: value('ankn').trim(), comp: field('ankcmp') ? value('ankcmp') : '' };
}

function bind(popover: HTMLElement, setting: KpiSetting, kpi: Kpi, onSaved: () => void): void {
  const config = analyticsState.config; if (!config) return;
  const done = async (): Promise<void> => { popover.remove(); await saveConfig(config); onSaved(); };
  const close = popover.querySelector<HTMLElement>('.x'); if (close) close.onclick = (): void => { popover.remove(); };
  const on = (id: string, action: () => void): void => { const button = document.getElementById(id); if (button) button.onclick = action; };
  on('ankok', () => { Object.assign(setting, read()); void done(); });
  on('ankoff', () => { setting.on = false; void done(); notices.toast(t('panels.gear.hidden')); });
  on('ankdup', () => {
    const copy: KpiSetting = { ...setting, ...read(), u: `${setting.id}-${Date.now().toString(36)}`, on: true };
    if (!copy.t) copy.t = t('panels.gear.copy', { name: kpiTitle(kpi) });
    config.kpis.splice(config.kpis.indexOf(setting) + 1, 0, copy); void done();
  });
}

/** Opens the gear of the indicator `id` (its setting's u) under its button; `onSaved` reloads the figures. */
export function openGear(button: Element, id: string, onSaved: () => void): void {
  document.querySelectorAll('.ankpop').forEach(popover => { popover.remove(); });
  const setting = analyticsState.config?.kpis.find(item => item.u === id); if (!setting) return;
  const kpi = catalogue().find(item => item.id === setting.id); if (!kpi) return;
  const popover = document.createElement('div');
  popover.className = 'ankpop'; Reflect.set(popover, '__t', Date.now());
  popover.innerHTML = gearHtml(setting, kpi);
  document.body.appendChild(popover);
  place(popover, button);
  bind(popover, setting, kpi, onSaved);
}
