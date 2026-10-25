/**
 * Visit settings: «Muestras y stock» (whether samples are taken from stock, and of which product) and the user's notice of a
 * recent visit. Migrated from the legacy editorMuestras and guardarAvisoRevisita (v2.412.0); both stay as adapters (Productos and
 * Configuración open them by that name).
 */
import { cycleLegacy, legacyDb, notices, term } from '../../legacy/bridge';
import { visitLegacy } from '../../legacy/visit-bridge';
import { t } from '../../i18n';
import { escapeHtml } from '../../services/format';

interface SamplesSetting { producto_id: string | null; restar_stock: boolean }

function samplesHtml(setting: SamplesSetting, products: readonly CatalogProduct[]): string {
  return `
    <div class="fh"><div><h2>${t('visit.settings.samplesTitle')}</h2><div class="sm">${t('visit.settings.samplesSubtitle', { visit: term('visita', { article: 'un' }) })}</div></div>
      <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
    <label class="opt u-mt-10"><input type="checkbox" id="murest" ${setting.restar_stock ? 'checked' : ''}>
      <span><b>${t('visit.settings.fromStock')}</b><br><span class="sm">${t('visit.settings.fromStockHint', { visit: term('visita', { article: 'el' }) })}</span></span></label>
    <label for="muprod">${t('visit.settings.product')}</label><select id="muprod"><option value="">—</option>${products.map(product => `<option value="${product.id}" ${product.id === setting.producto_id ? 'selected' : ''}>${escapeHtml(product.nombre)}</option>`).join('')}</select>
    <div class="acts u-end"><button class="btn sec" data-cerrar>${t('common.cancel')}</button><button class="btn" id="muok">${t('common.save')}</button></div>`;
}

async function saveSamples(box: HTMLDialogElement): Promise<void> {
  const fromStock = (document.getElementById('murest') as HTMLInputElement | null)?.checked ?? false, product = (document.getElementById('muprod') as HTMLSelectElement | null)?.value ?? '';
  if (fromStock && !product) { notices.toast(t('visit.settings.chooseProduct'), true); return; }
  const { error } = await legacyDb().rpc('guardar_ajuste', { p_clave: 'muestras', p_valor: { producto_id: product || null, restar_stock: fromStock } });
  if (error) { notices.toast(t('visit.settings.couldNotSave'), true); return; }
  box.close(); notices.toast(t('visit.settings.saved'));
}

/** «Muestras y stock» (administration, from Productos). */
export async function editSamples(): Promise<void> {
  const [, products] = await Promise.all([cycleLegacy.loadSettings(), visitLegacy.reloadProducts()]);
  const setting: SamplesSetting = { producto_id: null, restar_stock: false, ...(cycleLegacy.setting('muestras') as Partial<SamplesSetting> | undefined) };
  const body = document.getElementById('dbody'), box = document.getElementById('dlg') as HTMLDialogElement | null;
  if (!body || !box) return;
  body.innerHTML = samplesHtml(setting, products);
  box.showModal();
  const ok = document.getElementById('muok'); if (ok) ok.onclick = (): void => { void saveSamples(box); };
}

/** Saves the user's notice of a recent visit in their preferences; false if it could not be saved. */
export async function saveRevisitNotice(notice: { on: boolean; dias: number }): Promise<boolean> {
  const preferences = { ...visitLegacy.preferences() };
  preferences.avisos = { ...(preferences.avisos as Record<string, unknown> | undefined), revisita: notice };
  const { data, error } = await legacyDb().rpc<Record<string, unknown>>('guardar_preferencias', { p: preferences });
  if (error) { notices.toast(t('visit.settings.couldNotSave'), true); return false; }
  visitLegacy.setPreferences(data ?? preferences);
  return true;
}
