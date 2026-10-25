/**
 * The window «Indicadores de Inicio»: the eye shows or hides each one, the arrows order them, each can be renamed, saved Directorio
 * filters can be removed, and «Restaurar» goes back to the default ones. Migrated from the legacy abrirKpis (v2.417.0); abrirKpis
 * stays as an adapter (legado 001, Configuración and the tests open it).
 */
import { indicatorCatalog, legacyIcons, notices } from '../../legacy/bridge';
import { indicatorSettingsLegacy } from '../../legacy/orders2-bridge';
import { t } from '../../i18n';
import { escapeHtml } from '../../services/format';
import { filterText } from '../accounts/filters/saved';

interface Setting { id: string; on: boolean; t: string; filtro?: Record<string, unknown> }

const dialog = (): HTMLDialogElement | null => document.getElementById('dlg') as HTMLDialogElement | null;
const markChanged = (): void => { const box = dialog(); if (box) box.dataset.sucio = '1'; };

function startingList(): Setting[] {
  const list: Setting[] = indicatorCatalog.settings().map(setting => ({ ...setting, t: setting.t ?? '' }));
  indicatorCatalog.definitions().forEach(definition => { if (!list.some(item => item.id === definition.id)) list.push({ id: definition.id, on: false, t: '' }); });
  return list;
}

/** What the card says under the name, and the name it has if none is written. */
function texts(item: Setting, definition: KpiDefinition | undefined): { description: string; placeholder: string } {
  const description = item.filtro ? t('ordersMore.indicators.savedFilter', { filter: filterText(item.filtro) }) : indicatorCatalog.help(item.id) ?? '';
  const placeholder = definition ? definition.t.charAt(0).toUpperCase() + definition.t.slice(1) : filterText(item.filtro ?? {});
  return { description, placeholder };
}

function cardHtml(item: Setting, index: number, count: number): string {
  const definition = indicatorCatalog.definitions().find(entry => entry.id === item.id);
  if (definition ? !indicatorCatalog.allowed(definition) : !item.filtro) return '';
  const { description, placeholder } = texts(item, definition);
  return `<div class="kcard ${item.on ? 'on' : ''}">
          <button type="button" class="kojo" data-kon="${index}" aria-pressed="${String(item.on)}" title="${t(item.on ? 'ordersMore.indicators.visible' : 'ordersMore.indicators.hidden')}">${indicatorSettingsLegacy.eye(item.on)}</button>
          <div class="ktx"><input class="chico" data-kt="${index}" value="${escapeHtml(item.t)}" placeholder="${escapeHtml(placeholder)}" aria-label="${t('ordersMore.indicators.name')}">
            <span class="sm">${escapeHtml(description)}</span></div>
          <div class="kord">
            <button type="button" class="kmv" data-kmv="${index}|-1" aria-label="${t('ordersMore.indicators.up')}" ${index === 0 ? 'disabled' : ''}>${legacyIcons.arrow('arriba')}</button>
            <button type="button" class="kmv" data-kmv="${index}|1" aria-label="${t('ordersMore.indicators.down')}" ${index === count - 1 ? 'disabled' : ''}>${legacyIcons.arrow('abajo')}</button>
            ${item.filtro ? `<button type="button" class="kmv" data-kdel="${index}" aria-label="${t('ordersMore.indicators.remove')}" title="${t('ordersMore.indicators.remove')}">✕</button>` : ''}</div>
        </div>`;
}

function windowHtml(list: readonly Setting[]): string {
  return `
      <div class="fh"><div><h2>${t('ordersMore.indicators.title')}</h2>
        <div class="sm">${t('ordersMore.indicators.subtitle')}</div></div>
        <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
      <div class="kcards">${list.map((item, index) => cardHtml(item, index, list.length)).join('')}</div>
      <div class="acts u-end">
        <button class="btn sec" id="kres">${t('ordersMore.indicators.restore')}</button>
        <button class="btn" id="kok">${t('ordersMore.indicators.save')}</button></div>`;
}

async function save(list: readonly Setting[], button: HTMLButtonElement): Promise<void> {
  button.disabled = true; button.textContent = t('ordersMore.indicators.saving');
  const saved = await indicatorSettingsLegacy.save(list.map(item => ({ id: item.id, on: item.on, t: item.t, ...(item.filtro ? { filtro: item.filtro } : {}) })));
  button.disabled = false; button.textContent = t('ordersMore.indicators.save');
  if (!saved) return;
  dialog()?.close(); notices.toast(t('ordersMore.indicators.saved')); indicatorSettingsLegacy.reloadHome();
}

function bind(body: HTMLElement, state: { list: Setting[] }): void {
  const readNames = (): void => { body.querySelectorAll<HTMLInputElement>('[data-kt]').forEach(input => { const item = state.list[Number(input.dataset.kt)]; if (item) item.t = input.value.trim(); }); };
  const change = (work: () => void): void => { readNames(); work(); markChanged(); paint(state); };
  body.querySelectorAll<HTMLElement>('[data-kon]').forEach(button => { button.onclick = (): void => { change(() => { const item = state.list[Number(button.dataset.kon)]; if (item) item.on = !item.on; }); }; });
  body.querySelectorAll<HTMLElement>('[data-kmv]').forEach(button => {
    button.onclick = (): void => {
      readNames();
      const [from = 0, direction = 0] = (button.dataset.kmv ?? '').split('|').map(Number), to = from + direction;
      const first = state.list[from], second = state.list[to];
      if (!first || !second) return;
      state.list[from] = second; state.list[to] = first; markChanged(); paint(state);
    };
  });
  body.querySelectorAll<HTMLElement>('[data-kdel]').forEach(button => { button.onclick = (): void => { change(() => { state.list.splice(Number(button.dataset.kdel), 1); }); }; });
  const restore = document.getElementById('kres');
  if (restore) restore.onclick = (): void => {
    state.list = indicatorCatalog.definitions().map(definition => ({ id: definition.id, on: indicatorSettingsLegacy.defaults().includes(definition.id), t: '' }));
    markChanged(); paint(state);
  };
  const ok = document.getElementById('kok') as HTMLButtonElement | null;
  if (ok) ok.onclick = (): void => { readNames(); void save(state.list, ok); };
}

function paint(state: { list: Setting[] }): void {
  const body = document.getElementById('dbody'); if (!body) return;
  body.innerHTML = windowHtml(state.list);
  bind(body, state);
}

export function openIndicatorSettings(): void {
  paint({ list: startingList() });
  dialog()?.showModal();
}

