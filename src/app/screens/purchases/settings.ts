/**
 * Configuración → Stock y material → «Compras» (plan 12.2, PRO-3, v2.463.0): the usual delivery lead time, the one a new supplier is
 * born with and the one a purchase order uses when its supplier has none. Saved in the setting «compras» (90 days without it).
 */
import { cycleLegacy, legacyDb, notices } from '../../legacy/bridge';
import { t } from '../../i18n';
import { DEFAULT_LEAD_DAYS, usualLeadDays } from '../../core/organisation';

const PURCHASES_SETTING = 'compras', MAX_DAYS = 3650;

async function save(): Promise<void> {
  const days = Number((document.getElementById('cmplazo') as HTMLInputElement | null)?.value);
  if (!Number.isInteger(days) || days < 1 || days > MAX_DAYS) { notices.toast(t('purchases.settings.wrongDays'), true); return; }
  const value = { plazo_dias: days };
  const { data, error } = await legacyDb().rpc('guardar_ajuste', { p_clave: PURCHASES_SETTING, p_valor: value });
  if (error || (data as { ok?: boolean } | null)?.ok === false) { notices.toast(t('purchases.settings.couldNotSave'), true); return; }
  cycleLegacy.setSetting(PURCHASES_SETTING, value); notices.toast(t('purchases.settings.saved'));
}

/** Paints the part in Configuración's body (#cfgcuerpo). */
export async function paintPurchaseSettings(): Promise<void> {
  await cycleLegacy.loadSettings();
  const box = document.getElementById('cfgcuerpo'); if (!box) return;
  box.innerHTML = `<div class="card cfgpanel"><h2>${t('purchases.settings.title')}</h2>
    <p class="sm">${t('purchases.settings.intro', { days: DEFAULT_LEAD_DAYS })}</p>
    <label for="cmplazo">${t('purchases.settings.leadTime')}</label>
    <input id="cmplazo" type="number" min="1" max="${MAX_DAYS}" step="1" value="${usualLeadDays()}">
    <div class="acts u-end"><button class="btn" id="cmplazook">${t('common.save')}</button></div></div>`;
  const ok = document.getElementById('cmplazook'); if (ok) ok.onclick = (): void => { void save(); };
}
