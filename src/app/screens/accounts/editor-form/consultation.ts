/**
 * A consultation in the account editor: its centre (hidden fields the centre picker fills), floor, room, directions, phone and
 * days of visit; it can be moved up or down (the first is the main one) and removed. Migrated from the legacy consHTML and the
 * consultation part of abrirEditorBase (v2.419.0).
 */
import { term } from '../../../legacy/bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { dayPickerHtml, readDays } from './day-picker';
import { fieldValue } from './model';

export interface ConsultationData {
  id?: string | null; centro_id?: string | null; centro_nombre?: string | null; municipio?: string | null; provincia?: string | null;
  direccion?: string | null; cp?: string | null; lat?: number | string | null; lon?: number | string | null; planta?: string | null;
  sala?: string | null; indicaciones?: string | null; telefono?: string | null; dias?: Record<string, string> | null;
}

const HIDDEN = ['centro_id', 'centro_nombre', 'municipio', 'provincia', 'direccion', 'cp', 'lat', 'lon'] as const;

const hidden = (index: string, name: string, value: unknown): string =>
  `<input type="hidden" data-cf="${index}|${name}" value="${escapeHtml(value ?? '')}">`;

const input = (index: string, name: string, value: string | null | undefined, extra: string): string =>
  `<input data-cf="${index}|${name}" value="${escapeHtml(value ?? '')}" ${extra}>`;

export function consultationHtml(item: ConsultationData, index: string): string {
  return `<div class="cons" data-cons="${index}" ${item.lat ? `data-lat="${escapeHtml(item.lat)}"` : ''}>
    <span class="consbar"><span class="consprio">${t('accountsEditor.consultation.main')}</span>
      <button type="button" class="kmv" data-cmov="-1" title="${t('accountsEditor.consultation.upTitle')}" aria-label="${t('accountsEditor.consultation.up')}">↑</button>
      <button type="button" class="kmv" data-cmov="1" title="${t('accountsEditor.consultation.downTitle')}" aria-label="${t('accountsEditor.consultation.down')}">↓</button>
      <button type="button" class="quitar" data-quitar="${index}">${t('accountsEditor.consultation.remove')}</button></span>
    <input type="hidden" data-cid="${index}" value="${escapeHtml(item.id ?? '')}">
    ${HIDDEN.map(name => hidden(index, name, item[name])).join('')}
    <label>${t('accountsEditor.consultation.centre')}</label><div class="cenpick" data-cp="${index}"></div>
    <div class="g2 u-mt-10">
      <div><label>${t('accountsEditor.consultation.floor')}</label>${input(index, 'planta', item.planta, `maxlength="60" placeholder="${t('accountsEditor.consultation.floorPlaceholder')}"`)}</div>
      <div><label>${t('accountsEditor.consultation.room')}</label>${input(index, 'sala', item.sala, `maxlength="60" placeholder="${t('accountsEditor.consultation.roomPlaceholder')}"`)}</div>
    </div>
    <label>${t('accountsEditor.consultation.directions')}</label>${input(index, 'indicaciones', item.indicaciones, `maxlength="300" placeholder="${t('accountsEditor.consultation.directionsPlaceholder')}"`)}
    <div class="g2 u-mt-10">
      <div><label>${t('accountsEditor.consultation.phone', { ofTheConsultation: term('consulta', { article: 'del' }) })}</label>${input(index, 'telefono', item.telefono, `inputmode="tel" placeholder="${t('accountsEditor.consultation.phonePlaceholder')}"`)}</div><div></div>
    </div>
    <label>${t('accountsEditor.consultation.days', { visit: term('visita') })}</label>${dayPickerHtml(item.dias ?? {}, index)}
  </div>`;
}

/** The next free index for a new consultation. */
export const nextIndex = (list: Element): string => String(1 + Math.max(-1, ...[...list.children].map(box => Number((box as HTMLElement).dataset.cons) || 0)));

/** Up (-1) gives more priority; the first one is the main one. */
function moveConsultation(move: HTMLElement): void {
  const box = move.closest('.cons'), parent = box?.parentElement;
  if (!box || !parent) return;
  if (move.dataset.cmov === '-1' && box.previousElementSibling) parent.insertBefore(box, box.previousElementSibling);
  else if (move.dataset.cmov === '1' && box.nextElementSibling) parent.insertBefore(box.nextElementSibling, box);
}

/** Remove (a list is never left empty) and move up or down. */
export function bindConsultationList(list: HTMLElement): void {
  list.onclick = (event): void => {
    const target = event.target as Element | null, remove = target?.closest('[data-quitar]'), move = target?.closest<HTMLElement>('[data-cmov]');
    if (remove) {
      remove.closest('.cons')?.remove();
      if (!list.children.length) list.insertAdjacentHTML('beforeend', consultationHtml({}, nextIndex(list)));
    } else if (move) moveConsultation(move);
  };
}

const orNull = (text: string | undefined): string | null => (text ? text : null);

function readConsultation(box: Element): Record<string, unknown> {
  const index = (box as HTMLElement).dataset.cons ?? '', value = (name: string): string => fieldValue(box, index, name);
  return {
      id: orNull(box.querySelector<HTMLInputElement>(`[data-cid="${index}"]`)?.value), centro_id: orNull(value('centro_id')),
      centro_nombre: value('centro_nombre').toUpperCase(), municipio: value('municipio').toUpperCase(),
      provincia: value('provincia').toUpperCase(), direccion: value('direccion'), cp: value('cp'),
      telefono: value('telefono'), dias: readDays(box, index), lat: orNull(value('lat')), lon: orNull(value('lon')),
      planta: value('planta').trim(), sala: value('sala').trim(), indicaciones: value('indicaciones').trim(),
  };
}

/** The consultations as guardar_cuenta takes them, in their order (the first is the main one). */
export const readConsultations = (list: Element): Record<string, unknown>[] => [...list.children].map(readConsultation);
