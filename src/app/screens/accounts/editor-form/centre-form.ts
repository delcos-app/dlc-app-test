/**
 * The form of a centre inside a consultation (new or corrected): name, phone, address located on the map and opening hours.
 * Saved with guardar_centro and chosen for the consultation. A private consultation opens its own form. Migrated from the legacy
 * formCentroBase and formCentro (v2.419.0).
 */
import { callRpc, notices, qualityLegacy } from '../../../legacy/bridge';
import { miscLegacy } from '../../../legacy/misc-bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { paintCentrePicker, setCentre } from './centre-picker';
import { isPrivateConsultation, type CentreData } from './model';
import { privateForm } from './private-form';
import { addressQuery } from '../../../core/organisation';

const WEEKDAYS = ['M', 'X', 'J', 'V'];

const pointOf = (value: number | string | null | undefined): number | null => (value !== null && value !== undefined && value !== '' ? Number(value) : null);

function formHtml(centre: CentreData, key: string, notice?: string): string {
  const hours = centre.horario ?? {}, input = (suffix: string, value: string | null | undefined, extra = ''): string => `<input id="${key}${suffix}" value="${escapeHtml(value ?? '')}"${extra}>`;
  const days = miscLegacy.weekDays().map(([day, name]) => `<div><span>${name}</span><input data-hd="${day}" value="${escapeHtml(hours[day] ?? '')}" placeholder="${day === 'D' ? t('accountsEditor.centreForm.closed') : t('accountsEditor.centreForm.hoursPlaceholder')}"></div>`).join('');
  return `<div class="cpform">
    <div class="cpformcab"><b>${t(centre.id ? 'accountsEditor.centreForm.editTitle' : 'accountsEditor.centreForm.newTitle')}</b>${notice ? `<span class="sm cpaviso">${escapeHtml(notice)}</span>` : ''}</div>
    <div class="g2"><div><label for="${key}n">${t('accountsEditor.centreForm.name')}</label>${input('n', centre.nombre, ` placeholder="${t('accountsEditor.centreForm.namePlaceholder')}"`)}</div>
      <div><label for="${key}t">${t('accountsEditor.centreForm.phone')}</label>${input('t', centre.telefono, ' inputmode="tel"')}</div></div>
    <div class="g2"><div><label for="${key}d">${t('accountsEditor.centreForm.address')}</label>${input('d', centre.direccion)}</div>
      <div><label for="${key}c">${t('accountsEditor.centreForm.postcode')}</label>${input('c', centre.cp, ' inputmode="numeric"')}</div></div>
    <div class="g2"><div><label for="${key}m">${t('accountsEditor.centreForm.town')}</label>${input('m', centre.municipio)}</div>
      <div><label for="${key}p">${t('accountsEditor.centreForm.province')}</label>${input('p', centre.provincia)}</div></div>
    <div class="cpubi sm">${centre.lat ? `<b class="u-ok">${t('accountsEditor.centreForm.located')}</b>` : t('accountsEditor.centreForm.notLocated')} <button type="button" class="lnk" data-cpgeo>${t('accountsEditor.centreForm.findOnMap')}</button></div>
    <label>${t('accountsEditor.centreForm.opening')}</label>
    <div class="cphor">${days}</div>
    <button type="button" class="lnk" data-cpcopiar>${t('accountsEditor.centreForm.copyMonday')}</button>
    <div class="acts u-end u-m-10-0-0"><button type="button" class="btn sec" data-cpcancel>${t('common.cancel')}</button><button type="button" class="btn" data-cpguardar>${t(centre.id ? 'accountsEditor.centreForm.save' : 'accountsEditor.centreForm.create')}</button></div></div>`;
}

interface FormContext { place: HTMLElement; box: HTMLElement; index: string; centre: CentreData; key: string; point: { lat: number | null; lon: number | null } }

const valueOf = (context: FormContext, suffix: string): string => ((document.getElementById(context.key + suffix) as HTMLInputElement | null)?.value ?? '').trim();

async function locate(context: FormContext, button: HTMLElement): Promise<void> {
  const value = (suffix: string): string => valueOf(context, suffix);
  if (!value('d') && !value('m')) { notices.toast(t('accountsEditor.centreForm.writeAddress'), true); return; }
  button.textContent = t('accountsEditor.centreForm.searching');
  const query = addressQuery([value('d'), value('c'), value('m'), value('p')]);
  const found = await qualityLegacy.geocode(query, { direccion: value('d'), municipio: value('m'), cp: value('c') }).catch(() => null);
  button.textContent = t('accountsEditor.centreForm.findOnMap');
  if (!found) { notices.toast(t('accountsEditor.centreForm.notFound'), true); return; }
  if (found.fuera) { notices.toast(t('accountsEditor.centreForm.elsewhere', { place: found.fuera, town: value('m') }), true); return; }
  context.point = { lat: Number(found.lat), lon: Number(found.lon) };
  const address = (found as { address?: Record<string, string | undefined> }).address ?? {}, first = (...values: (string | undefined)[]): string => values.find(Boolean) ?? '';
  const set = (suffix: string, text: string): void => { const field = document.getElementById(context.key + suffix) as HTMLInputElement | null; if (field && !field.value.trim()) field.value = text; };
  if (address.postcode) set('c', address.postcode);
  set('m', first(address.city, address.town, address.village, address.municipality).toUpperCase());
  set('p', first(address.province, address.state_district, address.county).toUpperCase());
  context.place.querySelector('.cpubi')?.firstChild?.replaceWith(Object.assign(document.createElement('b'), { style: 'color:var(--ok)', textContent: `${t('accountsEditor.centreForm.located')} ` }));
}

async function save(context: FormContext, button: HTMLButtonElement): Promise<void> {
  const value = (suffix: string): string => valueOf(context, suffix);
  if (!value('n')) { notices.toast(t('accountsEditor.centreForm.writeName'), true); document.getElementById(context.key + 'n')?.focus(); return; }
  const hours: Record<string, string> = {};
  context.place.querySelectorAll<HTMLInputElement>('[data-hd]').forEach(field => { if (field.value.trim()) hours[field.dataset.hd ?? ''] = field.value.trim(); });
  button.disabled = true;
  const { data, error } = await callRpc<{ ok?: boolean; error?: string; centro?: CentreData }>('guardar_centro', { p: {
    id: context.centre.id ?? null, nombre: value('n'), telefono: value('t'), direccion: value('d'), cp: value('c'), municipio: value('m'), provincia: value('p'), ...context.point, horario: hours,
  } });
  button.disabled = false;
  if (error || !data?.ok || !data.centro) {
    const reason = data?.error ? `: ${data.error === 'permiso' ? t('accountsEditor.centreForm.noPermission') : data.error}` : '';
    notices.toast(t('accountsEditor.centreForm.couldNotSave') + reason, true); return;
  }
  setCentre(context.box, context.index, data.centro); void paintCentrePicker(context.box, context.index);
  notices.toast(t(context.centre.id ? 'accountsEditor.centreForm.updated' : 'accountsEditor.centreForm.created'));
}

function bind(context: FormContext): void {
  const { place } = context, on = (selector: string, action: (button: HTMLButtonElement) => void): void => {
    const button = place.querySelector<HTMLButtonElement>(selector); if (button) button.onclick = (): void => { action(button); };
  };
  on('[data-cpcopiar]', () => {
    const monday = place.querySelector<HTMLInputElement>('[data-hd="L"]')?.value ?? '';
    WEEKDAYS.forEach(day => { const field = place.querySelector<HTMLInputElement>(`[data-hd="${day}"]`); if (field) field.value = monday; });
  });
  on('[data-cpgeo]', button => { void locate(context, button); });
  on('[data-cpcancel]', () => { void paintCentrePicker(context.box, context.index, context.centre.id ? undefined : 'buscar'); });
  on('[data-cpguardar]', button => { void save(context, button); });
}

/** Opens the centre form in consultation `index` (a private consultation opens its own form). */
export function centreForm(box: HTMLElement, index: string, centre: CentreData | null, notice?: string): void {
  if (centre && (centre.privada || isPrivateConsultation(centre))) { privateForm(box, index); return; }
  const place = box.querySelector<HTMLElement>(`[data-cp="${index}"]`); if (!place) return;
  const current = centre ?? {}, key = `cf${index}_`;
  place.innerHTML = formHtml(current, key, notice);
  bind({ place, box, index, centre: current, key, point: { lat: pointOf(current.lat), lon: pointOf(current.lon) } });
  document.getElementById(key + 'n')?.focus();
}
