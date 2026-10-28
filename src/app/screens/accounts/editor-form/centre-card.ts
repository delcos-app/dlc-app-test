/**
 * The card of the chosen centre in a consultation: address, phone, today's and the week's opening hours, a warning without a
 * location, «Cómo llegar», «Editar centro» (or «Enlazar con un centro») and «Cambiar»; a private consultation has its own card.
 * Migrated from the legacy tarjetaCentroBase and tarjetaCentro (v2.419.0).
 */
import { term } from '../../../legacy/bridge';
import { accountsEditorLegacy } from '../../../legacy/accounts2-bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { orFallback } from '../../../services/values';
import { hoursText, isPrivateConsultation, privateConsultation, type CentreData } from './model';

const placeOf = (centre: CentreData): string => [centre.direccion, [centre.cp, centre.municipio].filter(Boolean).join(' ')].filter(Boolean).join(' · ');

const directionsButton = (centre: CentreData): string =>
  (centre.lat ? `<button type="button" class="btn sec" data-nav="${accountsEditorLegacy.directions([Number(centre.lat), Number(centre.lon)])}">${t('accountsEditor.centre.directions')}</button>` : '');

function hoursLine(centre: CentreData, linked: boolean): string {
  const hours = centre.horario && Object.keys(centre.horario).length ? centre.horario : null;
  if (!hours) return linked ? `<span class="sm" style="color:var(--muted)">${t('accountsEditor.centre.noOpening')}</span>` : '';
  const today = hours[accountsEditorLegacy.todayLetter()];
  return `<span class="sm">🕘 ${today ? `<b>${t('accountsEditor.centre.today', { hours: escapeHtml(today) })}</b> · ` : ''}${escapeHtml(hoursText(hours))}</span>`;
}

function centreCardHtml(centre: CentreData, linked: boolean): string {
  const unlinked = linked ? '' : `<span class="pill p-warn" title="${t('accountsEditor.centre.unlinkedTitle', { thisConsultation: term('consulta', { article: 'este', articleCapital: 'C' }) })}">${t('accountsEditor.centre.unlinked')}</span>`;
  return `<div class="cpcard"><div class="cpcab"><b>${escapeHtml(orFallback(centre.nombre, t('accountsEditor.centre.noName')))}</b>
      ${unlinked}</div>
    <span class="sm">${escapeHtml(placeOf(centre) || t('accountsEditor.centre.noAddress'))}</span>
    ${centre.telefono ? `<span class="sm">☎ <a href="tel:${escapeHtml(centre.telefono)}">${escapeHtml(centre.telefono)}</a></span>` : ''}
    ${hoursLine(centre, linked)}
    ${centre.lat ? '' : `<span class="sm u-warn">${t('accountsEditor.centre.noLocation')}</span>`}
    <div class="acts u-m-8-0-0 u-wrap">
      ${directionsButton(centre)}
      ${linked ? `<button type="button" class="btn sec" data-cpeditar>${t('accountsEditor.centre.edit')}</button>` : `<button type="button" class="btn" data-cpenlazar>${t('accountsEditor.centre.link')}</button>`}
      <button type="button" class="btn sec" data-cpcambiar>${t('accountsEditor.centre.change')}</button></div></div>`;
}

function privateCardHtml(centre: CentreData): string {
  const place = placeOf(centre);
  const warning = place ? t('accountsEditor.centre.noLocation') : t('accountsEditor.private.addAddressHint');
  return `<div class="cpcard cppriv"><div class="cpcab"><b>${privateConsultation()}</b><span class="pill p-est">${t('accountsEditor.private.noCentre')}</span></div>
    <span class="sm">${escapeHtml(place || t('accountsEditor.private.noAddressYet'))}</span>
    ${centre.lat ? '' : `<span class="sm u-warn">${warning}</span>`}
    <div class="acts u-m-8-0-0 u-wrap">
      ${directionsButton(centre)}
      <button type="button" class="btn ${place ? 'sec' : ''}" data-cpeditar>${place ? t('accountsEditor.private.edit', { theConsultation: term('consulta', { article: 'el' }) }) : t('accountsEditor.private.addAddress')}</button>
      <button type="button" class="btn sec" data-cpcambiar>${t('accountsEditor.centre.change')}</button></div></div>`;
}

/** The card of a centre (linked: chosen from the database) or of a private consultation. */
export const centreCard = (centre: CentreData, linked: boolean): string =>
  (linked || !isPrivateConsultation(centre) ? centreCardHtml(centre, linked) : privateCardHtml(centre));
