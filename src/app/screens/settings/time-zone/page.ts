/**
 * Organización → Zona horaria (plan 11.3, v2.447.0): the time zone of the organisation. The database uses it for «today» in every
 * request (SQL 188) and the screens for their «today». Without it, Spain's as before. Only who configures the organisation sees the tab.
 */
import { cycleLegacy, legacyDb, notices } from '../../../legacy/bridge';
import { t, type MessageKey } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { TIME_ZONES, organisationZone } from '../../../core/organisation';

const zoneOption = (zone: string, current: string): string =>
  `<option value="${escapeHtml(zone)}" ${zone === current ? 'selected' : ''}>${escapeHtml(t(`timeZone.zones.${zone.replace(/\//g, '_')}` as MessageKey))}</option>`;

function cardHtml(current: string): string {
  return `<div class="card cfgpanel"><h2>${t('timeZone.title')}</h2>
    <p class="sm">${t('timeZone.intro')}</p>
    <label for="zhzona">${t('timeZone.label')}</label>
    <select id="zhzona"><option value="" ${current ? '' : 'selected'}>${t('timeZone.default')}</option>${TIME_ZONES.map(zone => zoneOption(zone, current)).join('')}</select>
    <div class="acts u-end"><button class="btn" id="zhok">${t('common.save')}</button></div></div>`;
}

async function save(): Promise<void> {
  const zone = (document.getElementById('zhzona') as HTMLSelectElement | null)?.value ?? '';
  const value = { zona: zone || null };
  const { data, error } = await legacyDb().rpc('guardar_ajuste', { p_clave: 'zona_horaria', p_valor: value });
  if (error || (data as { ok?: boolean } | null)?.ok === false) { notices.toast(t('timeZone.couldNotSave'), true); return; }
  cycleLegacy.setSetting('zona_horaria', value); notices.toast(t('timeZone.saved'));
}

/** Paints the tab in Configuración's body (#cfgcuerpo). */
export async function paintTimeZone(): Promise<void> {
  await cycleLegacy.loadSettings();
  const box = document.getElementById('cfgcuerpo'); if (!box) return;
  box.innerHTML = cardHtml(organisationZone());
  const ok = document.getElementById('zhok'); if (ok) ok.onclick = (): void => { void save(); };
}
