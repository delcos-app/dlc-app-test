/**
 * Organización → Empresa → «Marca y logo»: the name and logo of the platform (also on the invoices), what the contacts module is
 * called, the vocabulary of the company and a preview of how the team sees it. Migrated from the legacy pintarMarcaBase,
 * pintarMarcaBase2 and pintarMarca (v2.415.0): the card is painted whole at once instead of in three layers.
 */
import { cycleLegacy, legacyDb, notices, term } from '../../../legacy/bridge';
import { settingsMoreLegacy, type BrandSettings } from '../../../legacy/settings2-bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { orFallback } from '../../../services/values';
import { brandPreview, vocabularyHtml } from './brand-parts';
import { saveLabel, saveVocabulary } from './brand-save';

const LOGO = 'logo-app.png', LOGO_SIZE = 256, OTHER = '__otra', PREVIEW_WAIT_MS = 300;

function labelHtml(): string {
  const current = settingsMoreLegacy.contactsLabel(), labels = settingsMoreLegacy.contactLabels(), other = !labels.includes(current);
  return `<div class="mketqbox"><label for="mketq">${t('settingsMore.brand.labelTitle')}</label>
    <div class="g2"><select id="mketq">${labels.map(label => `<option ${label === current ? 'selected' : ''}>${label}</option>`).join('')}<option value="${OTHER}" ${other ? 'selected' : ''}>${t('settingsMore.brand.otherName')}</option></select>
      <input id="mketqo" class="${other ? '' : 'hide'}" value="${other ? escapeHtml(current) : ''}" placeholder="${t('settingsMore.brand.writeName')}"></div>
    <div class="sm">${t('settingsMore.brand.labelHint', { professionals: term('medico', { number: 'p' }) })}</div></div>`;
}

function cardHtml(brand: BrandSettings): string {
  return `<div class="conprevia"><div class="card cfgpanel"><h2>${t('settingsMore.brand.title')}</h2>
    <p class="sm">${t('settingsMore.brand.intro')}</p>
    <div class="marcaed"><div class="marcaprev"><img id="mklogo" src="${escapeHtml(brand.logo ?? LOGO)}" alt=""><b id="mknomp">${escapeHtml(brand.nombre)}</b></div>
      <div><label for="mknom">${t('settingsMore.brand.name')}</label><input id="mknom" value="${escapeHtml(brand.nombre)}" placeholder="${t('settingsMore.brand.namePlaceholder')}">
        <label>${t('settingsMore.brand.logo')} ${settingsMoreLegacy.helpButton(t('settingsMore.brand.logoHelpTitle'), t('settingsMore.brand.logoHelp'))}</label>
        <div class="acts u-m-0"><label class="btn sec u-m-0" for="mkfile">${t('settingsMore.brand.upload')}</label><input id="mkfile" type="file" accept="image/*" class="hide">
          ${brand.logo ? `<button class="btn sec" id="mkquitar">${t('settingsMore.brand.remove')}</button>` : ''}</div>
        <label class="opt u-mt-10"><input type="checkbox" id="mkfac" ${brand.logo_factura === false ? '' : 'checked'}> ${t('settingsMore.brand.onInvoices')}</label></div></div>
    ${labelHtml()}${vocabularyHtml()}<div class="acts u-end"><button class="btn" id="mkok">${t('common.save')}</button></div></div>
    <div class="previa"><div class="sm previat">${t('settingsMore.brand.previewTitle')}</div><div id="mkprev2"></div></div></div>`;
}

/** Square crop of the chosen image, 256 × 256 px, as a data URL. */
async function squareLogo(file: File): Promise<string> {
  const image = new Image(); image.src = URL.createObjectURL(file); await image.decode();
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = LOGO_SIZE;
  const side = Math.min(image.width, image.height);
  canvas.getContext('2d')?.drawImage(image, (image.width - side) / 2, (image.height - side) / 2, side, side, 0, 0, LOGO_SIZE, LOGO_SIZE);
  return canvas.toDataURL('image/png');
}

const input = (id: string): HTMLInputElement | null => document.getElementById(id) as HTMLInputElement | null;

async function saveBrand(state: { logo: string | null }): Promise<void> {
  const brand: BrandSettings = { nombre: orFallback(input('mknom')?.value.trim(), t('settingsMore.brand.defaultName')), logo: state.logo, logo_factura: Boolean(input('mkfac')?.checked) };
  const { error } = await legacyDb().rpc('guardar_ajuste', { p_clave: 'marca', p_valor: brand });
  if (error) { notices.toast(t('settingsMore.couldNotSave'), true); return; }
  cycleLegacy.setSetting('marca', brand); settingsMoreLegacy.setBrand({ nombre: brand.nombre, logo: brand.logo });
  notices.toast(t('settingsMore.brand.saved'));
}

async function save(state: { logo: string | null }): Promise<void> {
  const select = document.getElementById('mketq') as HTMLSelectElement | null;
  const label = select?.value === OTHER ? orFallback(input('mketqo')?.value.trim(), term('medico', { number: 'p', capital: 'C' })) : select?.value ?? '';
  await saveBrand(state);
  await saveLabel(label);
  await saveVocabulary();
}

function bind(state: { logo: string | null }): void {
  const name = input('mknom'), file = input('mkfile');
  if (name) name.oninput = (): void => { const shown = document.getElementById('mknomp'); if (shown) shown.textContent = name.value || t('settingsMore.brand.defaultName'); };
  if (file) file.onchange = async (): Promise<void> => {
    const chosen = file.files?.[0]; if (!chosen) return;
    state.logo = await squareLogo(chosen); const logo = document.getElementById('mklogo') as HTMLImageElement | null; if (logo) logo.src = state.logo;
  };
  const remove = document.getElementById('mkquitar');
  if (remove) remove.onclick = (): void => { state.logo = null; const logo = document.getElementById('mklogo') as HTMLImageElement | null; if (logo) logo.src = LOGO; };
  const select = document.getElementById('mketq') as HTMLSelectElement | null;
  if (select) select.onchange = (): void => { input('mketqo')?.classList.toggle('hide', select.value !== OTHER); };
  const ok = document.getElementById('mkok'); if (ok) ok.onclick = (): void => { void save(state); };
}

function bindPreview(): void {
  const card = document.querySelector('#cfgcuerpo .conprevia > .card'), logo = document.getElementById('mklogo'); if (!card || !logo) return;
  card.addEventListener('input', brandPreview); card.addEventListener('change', () => { setTimeout(brandPreview, PREVIEW_WAIT_MS); });
  new MutationObserver(brandPreview).observe(logo, { attributes: true, attributeFilter: ['src'] });
  brandPreview();
}

export async function paintBrand(): Promise<void> {
  await cycleLegacy.loadSettings();
  const box = document.getElementById('cfgcuerpo'); if (!box) return;
  const brand: BrandSettings = { nombre: settingsMoreLegacy.appName(), logo: null, logo_factura: true, ...(cycleLegacy.setting('marca') as Partial<BrandSettings> | undefined) };
  box.innerHTML = cardHtml(brand);
  bind({ logo: brand.logo });
  bindPreview();
}
