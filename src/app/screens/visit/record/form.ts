/**
 * The HTML of «Registrar visita», with every part in its place from the start: notices, date and centre, how it was, products
 * presented and «Presentar», results (the ones of other states hidden behind «Ver…»), the other classifiers, next action, samples
 * with signature, note and photos.
 */
import { icon, term } from '../../../legacy/bridge';
import { visitLegacy } from '../../../legacy/visit-bridge';
import { t } from '../../../i18n';
import { formatShortDate } from '../../../services/date-format';
import { todayIso } from '../../../services/dates';
import { escapeHtml } from '../../../services/format';
import { orFallback } from '../../../services/values';
import { modeButtons, NEGATIVE } from '../model';
import type { ResultGroup, ResultValue, SampleLeft, VisitData } from './data';
import { privateConsultation } from '../../accounts/editor-form/model';

/** Each result button by its key (classifier::value). */
export type ButtonIndex = Map<string, { group: string; value: ResultValue }>;

export const RESULT_ROLE = 'resultado_visita';

/** The results group (the default catalog if the company has none) and the others. */
export function splitGroups(groups: readonly ResultGroup[]): { results: ResultGroup; others: ResultGroup[] } {
  const filled = groups.filter(group => group.valores.length);
  const results = filled.find(group => group.papel === RESULT_ROLE) ?? { clave: '', papel: RESULT_ROLE, nombre: t('visit.record.result'), valores: [...visitLegacy.resultValues()] };
  return { results, others: filled.filter(group => group !== results) };
}

function button(index: ButtonIndex, group: ResultGroup, value: ResultValue, isResult: boolean): string {
  const key = `${group.clave}::${value.valor}`, negative = isResult && value.extra === NEGATIVE;
  index.set(key, { group: group.clave, value });
  return `<span class="optw"${value.oculto ? ' data-oculto="1"' : ''}><button type="button" class="opt ${negative ? 'neg' : ''}" data-vk="${escapeHtml(key)}" ${isResult ? `data-res="${escapeHtml(value.valor)}"` : ''} ${negative ? 'data-neg="1"' : ''} aria-pressed="false">
      <span class="mk"></span>${escapeHtml(value.valor)}${value.dato_tipo ? ` <span class="datom">${t('visit.record.withData')}</span>` : ''}</button>
      ${value.dato_tipo ? `<span class="datobox hide" data-box="${escapeHtml(key)}">${visitLegacy.dataField(value, key)}</span>` : ''}</span>`;
}

/** «Ver los N resultados de otros estados»: counts the hidden values of every group. */
function hiddenButton(groups: readonly ResultGroup[]): string {
  const hidden = groups.flatMap(group => group.valores).filter(value => value.oculto).length;
  if (!hidden) return '';
  return `<button type="button" class="lnk" id="vtodos">${hidden === 1 ? t('visit.record.showOneHidden') : t('visit.record.showHidden', { count: hidden })}</button>`;
}

function resultsHtml(index: ButtonIndex, results: ResultGroup, others: readonly ResultGroup[]): string {
  const positive = results.valores.filter(value => value.extra !== NEGATIVE), negative = results.valores.filter(value => value.extra === NEGATIVE);
  // «Ver…» goes after the last list with results (the negative one, unless it is empty)
  const more = hiddenButton([results, ...others]);
  return `<label>${t('visit.record.resultLabel')} <span class="sm">${t('visit.record.severalResults', { done: term('visita', { adjective: 'realizado' }) })}</span></label>
    <div class="opciones">${positive.map(value => button(index, results, value, true)).join('')}</div>${negative.length ? '' : more}
    <div class="opciones u-mt-8">${negative.map(value => button(index, results, value, true)).join('')}</div>${negative.length ? more : ''}
    ${others.map(group => `<label>${escapeHtml(group.nombre)}${group.descripcion ? ` <span class="sm">· ${escapeHtml(group.descripcion)}</span>` : ''}</label>
      <div class="opciones">${group.valores.map(value => button(index, group, value, false)).join('')}</div>`).join('')}`;
}

function sampleRow(sample: SampleLeft): string {
  const available = sample.en_plazo && sample.quedan;
  const text = !sample.en_plazo ? t('visit.samples.expired', { date: formatShortDate(sample.hasta ?? '') })
    : t('visit.samples.left', { left: sample.quedan, max: sample.max }) + (sample.hasta ? t('visit.samples.until', { date: formatShortDate(sample.hasta) }) : '');
  return `<div class="vmrow ${available ? '' : 'agotada'}"><span><b>${escapeHtml(sample.nombre)}</b><span class="sm">${text}</span></span>
      <input type="number" min="0" max="${sample.en_plazo ? sample.quedan : 0}" step="1" value="0" data-vmprod="${sample.producto_id}" aria-label="${t('visit.samples.of', { name: escapeHtml(sample.nombre) })}" ${available ? '' : 'disabled'}></div>`;
}

function samplesHtml(samples: readonly SampleLeft[], name: string): string {
  if (!samples.length) return '';
  return `<div class="vmuestras" id="vmuestras"><label>${t('visit.samples.title')}</label>
    ${samples.map(sampleRow).join('')}
    <div class="vmfirma hide" id="vmfirma"><label>${t('visit.samples.signature')} <span class="sm">${t('visit.samples.signatureHint')}</span></label>
      <canvas id="vmcanvas" aria-label="${t('visit.samples.signatureArea')}"></canvas>
      <div class="vmfpie"><input id="vmfirmante" value="${escapeHtml(name)}" aria-label="${t('visit.samples.signer')}" placeholder="${t('visit.samples.signer')}"><button type="button" class="lnk" id="vmborrar">${t('visit.samples.clear')}</button></div></div></div>`;
}

/** Products presented, and «Presentar» for the ones with material. */
function productsHtml(products: readonly { id: string; nombre: string }[]): string {
  if (!products.length) return '';
  const materials = visitLegacy.materials() ?? [], withMaterial = products.filter(product => materials.some(material => material.producto_id === product.id));
  return `<label>${t('visit.record.products')}</label>
      <div class="opciones" id="vprods">${products.map(product => `<button type="button" class="opt" data-vprod="${product.id}" aria-pressed="false"><span class="mk"></span>${escapeHtml(product.nombre)}</button>`).join('')}</div>
      ${withMaterial.length ? `<div class="vpres" id="vpres"><span class="sm">${t('visit.record.present')}</span>${withMaterial.map(product => `<button type="button" class="chip" data-vpres="${product.id}">▶ ${escapeHtml(product.nombre)}</button>`).join('')}</div>` : ''}`;
}

function noticesHtml(data: VisitData): string {
  const timetable = data.missingTimetable ? `<div class="avisoh" id="vhorario"><span>${t('visit.record.missingTimetable', { visit: term('visita', { article: 'el' }) })}</span></div>` : '';
  const offline = navigator.onLine ? '' : `<div class="banda-aviso vsinred"><b>${t('visit.record.offlineTitle')}</b> ${t('visit.record.offline', { visit: escapeHtml(term('visita', { article: 'la', capital: 'C' })) })}</div>`;
  return timetable + offline;
}

function centreOptions(consultations: readonly CardConsultation[]): string {
  return consultations.map(item => `<option value="${(item as { id?: string }).id ?? ''}">${escapeHtml(orFallback(item.centro_nombre, privateConsultation()))}${item.municipio ? ` · ${escapeHtml(item.municipio)}` : ''}</option>`).join('');
}

/** The whole window; `index` is filled with the result buttons. */
export function visitHtml(data: VisitData, index: ButtonIndex): string {
  const { results, others } = splitGroups(data.groups), visit = term('visita');
  return `
    <div class="fh"><div><h2>${t('visit.record.title', { visit })}</h2><div class="sm">${escapeHtml(data.account.nombre)}</div></div>
      <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>${noticesHtml(data)}
    <div class="g2">
      <div><label for="vf">${t('visit.edit.date')}</label><input id="vf" type="date" value="${todayIso()}"></div>
      <div><label for="vc">${t('visit.record.centre', { visit: term('visita', { article: 'del' }) })}</label><select id="vc">
        ${centreOptions(data.consultations)}
      </select></div>
    </div><label>${t('visit.record.howItWas')}</label>
    <div class="segs" id="vmodo" role="group" aria-label="${t('visit.record.howItWas')}">${modeButtons('vmodo', 'presencial')}</div>${productsHtml(data.products)}
    ${resultsHtml(index, results, others)}
    <div class="g2 u-mt-6">
      <div><label for="vpa">${t('visit.edit.nextAction')}</label><input id="vpa" placeholder="${t('visit.record.nextActionPlaceholder')}"></div>
      <div><label for="vpf">${t('visit.record.nextActionDate')}</label><input id="vpf" type="date"></div>
    </div>
    ${samplesHtml(data.samples, data.account.nombre)}<label for="vn">${t('visit.edit.note')}</label><textarea id="vn" rows="3"></textarea><div class="vfotosw"><label class="btn sec u-inline-flex" id="vfotobtn">${icon('camera')} ${t('visit.photos.add')}<input type="file" id="vfotof" accept="image/*" data-fp="1" hidden multiple></label>
    <span class="sm">${t('visit.photos.hint', { max: visitLegacy.photosMax() })}</span><div class="vfotos" id="vfotos"></div></div>
    <div class="acts u-end">
      <button class="btn sec" data-cerrar>${t('common.cancel')}</button>
      <button class="btn" id="vguardar">${t('visit.record.save', { visit })}</button>
    </div>`;
}
