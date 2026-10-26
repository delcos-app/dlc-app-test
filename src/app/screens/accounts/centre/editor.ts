/**
 * «Editar centro»: name, phone, address and opening hours; the changes pass to the consultations linked to the centre. A new
 * address is located on the map (unless it falls in another town). Migrated from the legacy editarCentroFicha (v2.417.0).
 */
import { callRpc, notices, qualityLegacy, term } from '../../../legacy/bridge';
import { miscLegacy } from '../../../legacy/misc-bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { orFallback } from '../../../services/values';
import type { Centre } from './model';
import { addressQuery } from '../../../core/organisation';

const value = (id: string): string => ((document.getElementById(id) as HTMLInputElement | null)?.value ?? '').trim();

const field = (id: string, label: string, current: string | null | undefined, mode = ''): string =>
  `<div><label for="${id}">${label}</label><input id="${id}" value="${escapeHtml(orFallback(current, ''))}"${mode ? ` inputmode="${mode}"` : ''}></div>`;

function editorHtml(centre: Centre): string {
  const hours = centre.horario ?? {};
  const days = miscLegacy.weekDays().map(([day, name]) => `<div><span>${name}</span><input data-ech="${day}" value="${escapeHtml(hours[day] ?? '')}" placeholder="${day === 'D' ? t('accountsMore.centreEditor.closed') : t('accountsMore.centreEditor.hoursPlaceholder')}"></div>`).join('');
  return `
    <div class="fh"><div><h2>${t('accountsMore.centreEditor.title')}</h2><div class="sm">${t('accountsMore.centreEditor.subtitle', { consultations: term('consulta', { number: 'p', article: 'el' }) })}</div></div>
      <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
    <div class="g2">${field('ecn', t('accountsMore.centreEditor.name'), centre.nombre)}
      ${field('ect', t('accountsMore.centreEditor.phone'), centre.telefono, 'tel')}</div>
    <div class="g2">${field('ecd', t('accountsMore.centreEditor.address'), centre.direccion)}
      ${field('ecc', t('accountsMore.centreEditor.postcode'), centre.cp, 'numeric')}</div>
    <div class="g2">${field('ecm', t('accountsMore.centreEditor.town'), centre.municipio)}
      ${field('ecp', t('accountsMore.centreEditor.province'), centre.provincia)}</div>
    <label>${t('accountsMore.centreEditor.opening')}</label>
    <div class="cphor">${days}</div>
    <div class="acts u-end"><button type="button" class="btn sec" id="ecvolver">${t('accountsMore.centreEditor.back')}</button><button type="button" class="btn" id="ecok">${t('accountsMore.centreEditor.save')}</button></div>`;
}

/** The point on the map: located again only when the address changed. */
async function pointOf(centre: Centre): Promise<{ lat: Centre['lat']; lon: Centre['lon'] }> {
  const moved = value('ecd') !== orFallback(centre.direccion, '') || value('ecm') !== orFallback(centre.municipio, '') || value('ecc') !== orFallback(centre.cp, '');
  if (!moved || !(value('ecd') || value('ecm'))) return { lat: centre.lat, lon: centre.lon };
  const query = addressQuery([value('ecd'), value('ecc'), value('ecm'), value('ecp')]);
  const found = await qualityLegacy.geocode(query, { direccion: value('ecd'), municipio: value('ecm'), cp: value('ecc') }).catch(() => null);
  if (found && !found.fuera) return { lat: Number(found.lat), lon: Number(found.lon) };
  if (found?.fuera) notices.toast(t('accountsMore.centreEditor.elsewhere', { place: found.fuera, town: value('ecm') }), true);
  return { lat: centre.lat, lon: centre.lon };
}

async function save(centre: Centre, button: HTMLButtonElement, reopen: (id: string) => Promise<void>): Promise<void> {
  if (!value('ecn')) { notices.toast(t('accountsMore.centreEditor.writeName'), true); return; }
  const hours: Record<string, string> = {};
  document.querySelectorAll<HTMLInputElement>('#dbody [data-ech]').forEach(input => { if (input.value.trim()) hours[input.dataset.ech ?? ''] = input.value.trim(); });
  button.disabled = true;
  const { lat, lon } = await pointOf(centre);
  const { data: result, error } = await callRpc<{ ok?: boolean; error?: string }>('guardar_centro', { p: { id: centre.id, nombre: value('ecn'), telefono: value('ect'),
    direccion: value('ecd'), cp: value('ecc'), municipio: value('ecm'), provincia: value('ecp'), lat, lon, horario: hours } });
  button.disabled = false;
  if (error || !result?.ok) { notices.toast(orFallback(result?.error, t('accountsMore.centreEditor.couldNotSave')), true); return; }
  notices.toast(t('accountsMore.centreEditor.saved')); void reopen(centre.id);
}

/** Opens the editor of a centre; `reopen` goes back to its sheet. */
export function editCentre(centre: Centre, reopen: (id: string) => Promise<void>): void {
  const body = document.getElementById('dbody'); if (!body) return;
  body.innerHTML = editorHtml(centre);
  const back = document.getElementById('ecvolver'); if (back) back.onclick = (): void => { void reopen(centre.id); };
  const ok = document.getElementById('ecok') as HTMLButtonElement | null; if (ok) ok.onclick = (): void => { void save(centre, ok, reopen); };
}
