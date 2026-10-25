/** The customer editor window: person or company, tax id, the professional who treats them, address, phones, email and note. */
import { term } from '../../../legacy/bridge';
import { leftoversLegacy } from '../../../legacy/leftovers-bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { canUseFreeAccount } from '../../../core/permissions';
import { callRecordHtml } from '../../opportunities/call-record';
import { TYPES, words } from '../model';
import { isCompany, type EditorState } from './state';

const input = (id: string, value: string | null | undefined, extra = ''): string => `<input id="${id}" value="${escapeHtml(value ?? '')}"${extra}>`;
const pair = (first: string, second: string): string => `<div class="g2">
      ${first}
      ${second}
    </div>`;

/** The labels that change with the type (person or company). */
export const typeTexts = (company: boolean): { name: string; taxId: string; placeholder: string } => ({
  name: t(company ? 'leftovers.customer.companyName' : 'leftovers.customer.personName'),
  taxId: t(company ? 'leftovers.customer.cif' : 'leftovers.customer.dni'),
  placeholder: company ? 'B12345678' : '12345678Z',
});

function headerHtml(state: EditorState): string {
  const customer = state.customer, company = isCompany(state), texts = typeTexts(company);
  const types = [TYPES.person, TYPES.company].map(type => `<button type="button" data-ktipo="${type}" aria-pressed="${String(state.type === type)}">${t(type === TYPES.company ? 'leftovers.customer.company' : 'leftovers.customer.person')}</button>`);
  return `
    <div class="fh"><div><h2>${t(customer.id ? 'leftovers.customer.editTitle' : 'leftovers.customer.newTitle', { ...words(), newPatient: term('paciente', { article: 'nuevo', articleCapital: 'C' }) })}</h2>
      <div class="sm">${t('leftovers.customer.subtitle')}</div></div>
      <button class="x" data-cerrar2 aria-label="${t('common.close')}">✕</button></div>
    <div class="subnav" style="margin:6px 0 4px">${types[0] ?? ''}
      ${types[1] ?? ''}</div>
    ${pair(`<div><label for="konom" id="konoml">${texts.name}</label>${input('konom', customer.nombre)}</div>`,
    `<div><label for="konif" id="konifl">${texts.taxId}</label>
        ${input('konif', customer.nif, ` placeholder="${texts.placeholder}" autocapitalize="characters"`)}
        <div class="sm u-mt-4" id="konifm"></div></div>`)}`;
}

function accountHtml(): string {
  const free = canUseFreeAccount()
    ? `<label class="opt prepbox"><input type="checkbox" id="komlibre"> ${t('leftovers.customer.freeAccount', { Professional: escapeHtml(term('medico', { capital: 'C' })) })}</label>` : '';
  return `<label>${t('leftovers.customer.treatedBy', words())}</label><div id="kosel"></div>
    <div class="sm u-mt-4" id="komsm">${t('leftovers.customer.attribution', { thisProfessional: term('medico', { article: 'este' }) })}</div>
    ${free}`;
}

function contactHtml(state: EditorState): string {
  const customer = state.customer;
  const companyHelp = leftoversLegacy.helpButton(t('leftovers.customer.company'), t('leftovers.customer.companyHelp'));
  return `${pair(`<div><label for="kodir">${t('leftovers.customer.address')}</label>${input('kodir', customer.direccion)}</div>`,
    `<div><label for="kocp">${t('leftovers.customer.postcode')}</label>${input('kocp', customer.cp, ' inputmode="numeric"')}</div>`)}
    ${pair(`<div><label for="komun">${t('leftovers.customer.town')}</label>${input('komun', customer.municipio)}</div>`,
    `<div><label for="kopro">${t('leftovers.customer.province')}</label>${input('kopro', customer.provincia)}</div>`)}
    ${pair(`<div><label for="kotel">${t('leftovers.customer.phone')}</label>${input('kotel', customer.telefono, ' inputmode="tel"')}</div>`,
    `<div><label for="komov">${t('leftovers.customer.mobile')}</label>${input('komov', customer.movil, ' inputmode="tel"')}</div>`)}
    ${pair(`<div><label for="komail">${t('leftovers.customer.email')}</label><input id="komail" type="email" value="${escapeHtml(customer.email ?? '')}"></div>`,
    `<div id="koempw" class="${isCompany(state) ? 'koinv' : ''}"><label for="koemp">${t('leftovers.customer.company')} ${companyHelp}</label>${input('koemp', customer.empresa)}</div>`)}
    <label for="konota">${t('leftovers.customer.note')}</label>${input('konota', customer.nota)}`;
}

function actionsHtml(state: EditorState): string {
  const call = state.withCall && Boolean(state.options.llamada);
  const save = state.customer.id ? t('common.save') : t('leftovers.customer.create', words());
  return `${state.withCall ? callRecordHtml(state.options.llamada) : ''}
    <div class="acts u-end u-wrap">
      <button class="btn sec" id="kocancel">${t('common.cancel')}</button>
      <button class="btn ${call ? 'sec' : ''}" id="kook">${save}</button>
      ${call ? `<button class="btn" id="kopedido">${t('leftovers.customer.createAndOrder')}</button>` : ''}</div>`;
}

export const editorHtml = (state: EditorState): string => `${headerHtml(state)}
    ${accountHtml()}
    ${contactHtml(state)}
    ${actionsHtml(state)}`;
