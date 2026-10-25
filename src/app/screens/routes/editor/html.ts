/**
 * The HTML of the route window: head fields, «Cómo se eligen», the accounts grouped by centre (by list) or the criteria (by
 * criteria). Migrated from the legacy editorRuta and rutaCentrosHTML (v2.418.0).
 */
import { term } from '../../../legacy/bridge';
import { routes2Legacy } from '../../../legacy/routes2-bridge';
import { t } from '../../../i18n';
import { escapeHtml, formatNumber } from '../../../services/format';
import type { EditorCentre, EditorMember, EditorState, FilterOption } from './state';

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V'];

const professionals = (count: number): string => term('medico', { number: count === 1 ? 's' : 'p' });

const chip = (member: EditorMember): string => `<span class="chip">${escapeHtml(member.nombre)}
    <button type="button" data-rq="${member.id}" aria-label="${t('routesMore.editor.remove', { name: escapeHtml(member.nombre) })}" style="border:0;background:none;color:var(--dang);cursor:pointer;font-weight:700">✕</button></span>`;

function centreGroup(centre: EditorCentre, members: readonly EditorMember[]): string {
  const inside = members.filter(member => member.centro_ruta === centre.id);
  return `<div class="rcentro"><div class="rcentrocab"><span class="rcentronom">${routes2Legacy.iconOrEmpty('building-2')}<b>${escapeHtml(centre.nombre)}</b>
        <span class="sm">${escapeHtml(centre.municipio ?? '')}${centre.municipio ? ' · ' : ''}${formatNumber(inside.length)} ${professionals(inside.length)}</span></span>
      <button type="button" class="lnk" data-rqc="${centre.id}">${t('routesMore.editor.removeCentre')}</button></div>
      <div class="chips">${inside.map(chip).join('')}</div></div>`;
}

/** The accounts of the route grouped by its centres, and the others apart. */
export function centresHtml(centres: readonly EditorCentre[], members: readonly EditorMember[]): string {
  if (!members.length) return `<div class="chips"><span class="sm">${t('routesMore.editor.noneYet', { professionals: term('medico', { number: 'p' }) })}</span></div>`;
  const loose = members.filter(member => !centres.some(centre => centre.id === member.centro_ruta));
  const others = loose.length ? `${centres.length ? `<div class="sm rcentrootros">${t('routesMore.editor.others', { professionals: term('medico', { number: 'p' }) })}</div>` : ''}<div class="chips">${loose.map(chip).join('')}</div>` : '';
  return centres.map(centre => centreGroup(centre, members)).join('') + others;
}

const options = (list: readonly FilterOption[] | undefined, value: string | undefined): string =>
  `<option value=""></option>${(list ?? []).map(option => `<option ${value === option.v ? 'selected' : ''}>${escapeHtml(option.v)}</option>`).join('')}`;

function listHtml(state: EditorState): string {
  return `
        ${centresHtml(state.centres, state.members)}
        <label for="rbuscacen">${t('routesMore.editor.addCentre')}</label>
        <input id="rbuscacen" value="${escapeHtml(state.centreSearch)}" placeholder="${t('routesMore.editor.centrePlaceholder', { professionals: term('medico', { number: 'p' }) })}" autocomplete="off">
        <div id="rrescen" class="lista"></div>
        <label for="rbusca">${t('routesMore.editor.addAccounts', { professionals: term('medico', { number: 'p' }) })}</label>
        <input id="rbusca" value="${escapeHtml(state.search)}" placeholder="${t('routesMore.editor.accountPlaceholder')}" autocomplete="off">
        <div id="rres" class="lista"></div>`;
}

function criteriaHtml(state: EditorState): string {
  const { options: found, rules } = state;
  const days = WEEKDAYS.map(letter => `<option value="${letter}" ${rules.dia === letter ? 'selected' : ''}>${routes2Legacy.weekdayOf(letter)}</option>`).join('');
  return `
        <div class="g2">
          <div><label for="cprov">${t('routesMore.editor.province')}</label><select id="cprov">${options(found.provincias, rules.provincia)}</select></div>
          <div><label for="cmuni">${t('routesMore.editor.municipality')}</label><select id="cmuni">${options(found.municipios, rules.municipio)}</select></div>
        </div>
        <div class="g2">
          <div><label for="ccen">${t('routesMore.editor.centre')}</label><select id="ccen">${options(found.centros, rules.centro)}</select></div>
          <div><label for="cesp">${term('especialidad', { capital: 'C' })}</label><select id="cesp">${options(found.especialidades, rules.especialidad)}</select></div>
        </div>
        <div class="g2">
          <div><label for="cest">${t('routesMore.editor.commercialState')}</label><select id="cest">${options(found.estados, rules.estado)}</select></div>
        </div>
        <div class="g2">
          <div><label for="csv">${t('routesMore.editor.notVisitedFor')}</label><input id="csv" type="number" min="1" max="365" value="${rules.sinVisita ?? ''}"></div>
          <div><label for="cdia">${t('routesMore.editor.attend')}</label><select id="cdia"><option value=""></option>
            ${days}</select></div>
        </div>
        <label class="opt u-mt-10"><input type="checkbox" id="curg" ${rules.urgentes ? 'checked' : ''}> ${t('routesMore.editor.onlyUrgent')}</label>
        <div id="rprev" class="sm u-mt-10"></div>`;
}

export function editorHtml(state: EditorState): string {
  const { head, id, mode } = state, accounts = term('medico', { number: 'p' });
  return `
      <div class="fh"><div><h2>${t(id ? 'routesMore.editor.editTitle' : 'routesMore.editor.newTitle')}</h2>
        <div class="sm">${t('routesMore.editor.subtitle', { professionals: accounts })}</div></div>
        <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
      <label for="rn">${t('routesMore.editor.name')}</label><input id="rn" value="${escapeHtml(head.nombre)}" placeholder="${t('routesMore.editor.namePlaceholder')}">
      <div class="g2">
        <div><label for="rt">${t('routesMore.editor.type')}</label><select id="rt">
          <option ${head.tipo !== 'Urgente' ? 'selected' : ''}>Normal</option>
          <option ${head.tipo === 'Urgente' ? 'selected' : ''}>Urgente</option></select></div>
        <div><label for="rd">${t('routesMore.editor.countFrom', { visits: term('visita', { number: 'p' }) })}</label><input id="rd" type="date" value="${escapeHtml(head.desde)}"></div>
        <div><label for="rsal">${t('routesMore.editor.leave')}</label><input id="rsal" type="time" value="${escapeHtml(head.salida)}"></div>
        <div><label for="rvue">${t('routesMore.editor.back')}</label><input id="rvue" type="time" value="${escapeHtml(head.vuelta)}"></div>
      </div>
      <label>${t('routesMore.editor.howChosen', { theProfessionals: term('medico', { number: 'p', article: 'el' }) })}</label>
      <div class="subnav" style="margin:6px 0 10px">
        <button type="button" data-rm="lista" aria-pressed="${String(mode === 'lista')}">${t('routesMore.editor.byList', { professionals: accounts })}</button>
        <button type="button" data-rm="crit" aria-pressed="${String(mode === 'crit')}">${t('routesMore.editor.byCriteria')}</button></div>

      ${mode === 'lista' ? listHtml(state) : criteriaHtml(state)}

      <div class="acts u-end">
        <button class="btn sec" data-cerrar>${t('common.cancel')}</button>
        ${mode === 'crit' ? `<button class="btn sec" id="rprob">${t('routesMore.editor.howMany')}</button>` : ''}
        <button class="btn" id="rguardar">${t(id ? 'routesMore.editor.save' : 'routesMore.editor.create')}</button></div>`;
}
