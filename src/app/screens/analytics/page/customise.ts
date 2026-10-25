/**
 * «Personalizar»: which indicators are shown, by area; the copies made with the gear can be deleted, and «Volver a los de siempre»
 * restores the default ones. Migrated from the legacy anPersonalizar (v2.419.0).
 */
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { analyticsState, catalogue, defaultSettings, FAMILIES, familyName, familyVisible, filterText, kpiHelp, kpiTitle, kpiVisible, loadConfig, saveConfig, type Kpi, type KpiSetting } from './catalog';

const dialog = (): HTMLDialogElement | null => document.getElementById('dlg') as HTMLDialogElement | null;
const markChanged = (): void => { const box = dialog(); if (box) box.dataset.sucio = '1'; };

function rowHtml(setting: KpiSetting, index: number, kpi: Kpi): string {
  const filter = filterText(setting.f);
  return `<label class="anpf"><span class="vfswitch mini"><input type="checkbox" data-anon="${index}" ${setting.on ? 'checked' : ''}><span class="sw"></span></span>
            <span class="tx"><b>${escapeHtml(setting.t || kpiTitle(kpi))}</b><span class="sm">${escapeHtml(filter || kpiHelp(kpi))}</span></span>
            ${setting.u !== setting.id ? `<button type="button" class="x" data-andel="${index}" title="${t('panels.customise.deleteCopy')}" aria-label="${t('panels.customise.deleteCopy')}">✕</button>` : ''}</label>`;
}

function areaHtml(family: string, draft: readonly KpiSetting[], kpis: readonly Kpi[]): string {
  const rows = draft.map((setting, index) => [setting, index] as const).map(([setting, index]) => {
    const kpi = kpis.find(item => item.id === setting.id);
    return kpi && kpi.fam === family && kpiVisible(kpi) ? rowHtml(setting, index, kpi) : '';
  }).join('');
  return `<div class="blk anpers"><h3>${escapeHtml(familyName(family))}</h3>
        ${rows}</div>`;
}

function paint(draft: KpiSetting[], kpis: readonly Kpi[], onSaved: () => void): void {
  const body = document.getElementById('dbody'); if (!body) return;
  body.innerHTML = `<div class="fh"><div><h2>${t('panels.customise.title')}</h2>
        <div class="sm">${t('panels.customise.subtitle')}</div></div>
        <button class="x" data-cerrar aria-label="${t('panels.customise.close')}">✕</button></div>
      ${FAMILIES.filter(([family]) => familyVisible(family)).map(([family]) => areaHtml(family, draft, kpis)).join('')}
      <div class="acts u-end"><button class="btn sec" id="anres0">${t('panels.customise.reset')}</button><button class="btn" id="anpok">${t('panels.customise.save')}</button></div>`;
  body.querySelectorAll<HTMLInputElement>('[data-anon]').forEach(box => {
    box.onchange = (): void => { const setting = draft[Number(box.dataset.anon)]; if (setting) setting.on = box.checked; markChanged(); };
  });
  body.querySelectorAll<HTMLElement>('[data-andel]').forEach(button => {
    button.onclick = (event): void => { event.preventDefault(); draft.splice(Number(button.dataset.andel), 1); markChanged(); paint(draft, kpis, onSaved); };
  });
  const reset = document.getElementById('anres0');
  if (reset) reset.onclick = (): void => { draft.splice(0, draft.length, ...defaultSettings()); markChanged(); paint(draft, kpis, onSaved); };
  const ok = document.getElementById('anpok') as HTMLButtonElement | null;
  if (ok) ok.onclick = async (): Promise<void> => {
    ok.disabled = true;
    const config = analyticsState.config ?? loadConfig();
    config.kpis = draft; analyticsState.config = config;
    await saveConfig(config);
    const box = dialog(); if (box) { delete box.dataset.sucio; box.close(); }
    onSaved();
  };
}

/** Opens «Indicadores de Analítica»; `onSaved` reloads the figures. */
export function customise(onSaved: () => void): void {
  analyticsState.config = analyticsState.config ?? loadConfig();
  const draft = analyticsState.config.kpis.map(setting => ({ ...setting }));
  paint(draft, catalogue(), onSaved);
  dialog()?.showModal();
}
