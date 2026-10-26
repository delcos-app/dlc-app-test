/**
 * An account of type Centro has its own form: no consultations nor floor and room, no custom fields of professionals, and its
 * address in view (street, postcode, town, province) with its opening hours. Saved as the account's main place, located on the
 * map when the address changes. Migrated from the legacy abrirEditor of legado 128 (v2.419.0).
 */
import { notices, qualityLegacy } from '../../../legacy/bridge';
import { t } from '../../../i18n';
import { consultationField, fieldValue } from './model';
import type { SaveHooks } from './save';
import { addressQuery } from '../../../core/organisation';

const ADDRESS = ['direccion', 'cp', 'municipio', 'provincia'] as const;

const value = (id: string): string => ((document.getElementById(id) as HTMLInputElement | null)?.value ?? '').trim();

function addressHtml(index: string): string {
  return `<h3 class="edch">${t('accountsEditor.centreAccount.title')}</h3>
    <label for="edcd">${t('accountsEditor.centreAccount.street')}</label><input id="edcd" data-cf="${index}|direccion" value="" placeholder="${t('accountsEditor.centreAccount.streetPlaceholder')}">
    <div class="g2"><div><label for="edcc">${t('accountsEditor.centreForm.postcode')}</label><input id="edcc" data-cf="${index}|cp" inputmode="numeric" maxlength="5" value=""></div>
      <div><label for="edcm">${t('accountsEditor.centreForm.town')}</label><input id="edcm" data-cf="${index}|municipio" autocapitalize="characters"></div></div>
    <label for="edcp">${t('accountsEditor.centreForm.province')}</label><input id="edcp" data-cf="${index}|provincia" autocapitalize="characters">`;
}

/** Before saving: the place takes the centre's name and, if the address changed (or it has no point), it is located. */
function locateBeforeSaving(box: HTMLElement, index: string, saved: { address: string; town: string; located: boolean }): () => Promise<void> {
  return async () => {
    const name = value('en').toUpperCase(), field = consultationField(box, index, 'centro_nombre'); if (field) field.value = name;
    const address = value('edcd'), town = value('edcm');
    if (!address || (address === saved.address && town === saved.town && saved.located)) return;
    const found = await qualityLegacy.geocode(addressQuery([address, value('edcc'), town, value('edcp')]), { direccion: address, municipio: town, cp: value('edcc') }).catch(() => null);
    if (found && !found.fuera) {
      const lat = consultationField(box, index, 'lat'), lon = consultationField(box, index, 'lon');
      if (lat) lat.value = String(found.lat); if (lon) lon.value = String(found.lon);
    } else if (found?.fuera) notices.toast(t('accountsEditor.centreAccount.elsewhere', { place: found.fuera, town }), true);
    saved.address = address; saved.town = town;
  };
}

/** The address fields, in view (the same data-cf: saving reads them the same way). */
function showAddress(box: HTMLElement, index: string): void {
  const address = new Map<string, string>();
  ADDRESS.forEach(name => { address.set(name, fieldValue(box, index, name)); consultationField(box, index, name)?.remove(); });
  box.insertAdjacentHTML('afterbegin', addressHtml(index));
  const set = (fieldId: string, name: string): void => { const field = document.getElementById(fieldId) as HTMLInputElement | null; if (field) field.value = address.get(name) ?? ''; };
  set('edcd', 'direccion'); set('edcc', 'cp'); set('edcm', 'municipio'); set('edcp', 'provincia');
}

export function adaptForCentre(id: string | null, hooks: SaveHooks): void {
  const body = document.getElementById('dbody'), list = document.getElementById('econs');
  if (!body || !list || document.getElementById('ee') || document.getElementById('esr')) return;
  body.classList.add('edcentro');
  // The custom fields are of the professionals (position, team…)
  body.querySelectorAll('.cpersform[data-cpamb=medico]').forEach(block => { block.remove(); });
  if (!id) [...list.children].slice(1).forEach(box => { box.remove(); });
  const box = list.firstElementChild as HTMLElement | null; if (!box) return;
  const index = box.dataset.cons ?? '';
  showAddress(box, index);
  const label = [...box.querySelectorAll('label')].find(item => (item.textContent ?? '').startsWith(t('accountsEditor.consultation.daysStart')));
  if (label) label.textContent = t('accountsEditor.centreAccount.hours');
  document.getElementById('eadd')?.closest('.acts')?.classList.add('hide');
  hooks.before.push(locateBeforeSaving(box, index, { address: value('edcd'), town: value('edcm'), located: Boolean(box.dataset.lat) }));
}
