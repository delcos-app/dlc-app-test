/**
 * «Editar ficha» and the new account or centre: name, speciality, area, phone, email, contact, «Sin reporting», note, custom
 * fields and the consultations; for who administers, the assigned salesperson; a centre has its own address form. Before
 * creating, it warns of possible duplicates. Migrated from the legacy abrirEditorBase (legado 002), abrirEditorBase2 (legado
 * 019) and abrirEditor (legado 128) (v2.419.0); abrirEditor stays as an adapter (the card, «‹ Volver» and the tests open it).
 */
import { legacyDb, notices, term } from '../../../legacy/bridge';
import { accountsEditorLegacy } from '../../../legacy/accounts2-bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { customFieldsHtml } from '../../settings/custom-fields';
import { paintNewPickers } from './centre-picker';
import { adaptForCentre } from './centre-account';
import { bindConsultationList, consultationHtml, nextIndex, type ConsultationData } from './consultation';
import { catalogOptions, newAccountNames } from './model';
import { addSalesperson } from './salesperson';
import { bindSave, type EditedAccount } from './save';

export const CENTRE = 'Centro';

function headHtml(account: EditedAccount, id: string | null, isCentre: boolean): string {
  const title = id ? t('accountsEditor.editor.editTitle') : isCentre ? t('accountsEditor.editor.newCentre') : escapeHtml(newAccountNames().nueva);
  const subtitle = id ? escapeHtml(account.nombre ?? '') : isCentre ? t('accountsEditor.editor.centreSubtitle') : t('accountsEditor.editor.personSubtitle', { professional: term('medico', { capital: 'C' }) });
  return `<div class="fh"><div><h2>${title}</h2>
      <div class="sm">${subtitle}</div></div>
      <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>`;
}

function personFields(account: EditedAccount): string {
  return `<div class="g2">
      <div><label for="ee">${term('especialidad', { capital: 'C' })}</label><select id="ee">${catalogOptions('especialidad', account.especialidad)}</select></div>
      <div><label for="ea">${t('accountsEditor.editor.area')}</label><select id="ea">${catalogOptions('area', account.area)}</select></div></div>`;
}

function formHtml(account: EditedAccount, consultations: readonly ConsultationData[], id: string | null): string {
  const isCentre = account.tipo === CENTRE, value = (text: string | null | undefined): string => escapeHtml(text ?? '');
  return `
    ${headHtml(account, id, isCentre)}
    <label for="en">${t(isCentre ? 'accountsEditor.editor.centreName' : 'accountsEditor.editor.personName')}</label>
    <input id="en" value="${value(account.nombre)}" placeholder="${t(isCentre ? 'accountsEditor.editor.centreNamePlaceholder' : 'accountsEditor.editor.personNamePlaceholder')}" autocapitalize="characters">
    ${isCentre ? '' : personFields(account)}
    <div class="g2">
      <div><label for="et">${t('accountsEditor.editor.phone')}</label><input id="et" value="${value(account.telefono)}" inputmode="tel"></div>
      <div><label for="em">${t('accountsEditor.editor.email')}</label><input id="em" type="email" value="${value(account.email)}"></div>
    </div>
    <label for="ect">${t('accountsEditor.editor.contact')}</label><input id="ect" value="${value(account.contacto)}">
    ${isCentre ? '' : `<label class="chksr"><input type="checkbox" id="esr" ${account.sin_reporting ? 'checked' : ''}><span><b>${t('accountsEditor.editor.noReporting')}</b><span class="sm">${t('accountsEditor.editor.noReportingHint', { visit: term('visita') })}</span></span></label>`}
    <label for="eno">${t('accountsEditor.editor.note')}</label><textarea id="eno" rows="3">${value(account.nota)}</textarea>
    ${customFieldsHtml('medico', account.clasificadores)}
    <div id="econs">${consultations.map((item, index) => consultationHtml(item, String(index))).join('')}</div>
    <div class="acts"><button type="button" class="btn sec" id="eadd">${t('accountsEditor.editor.addConsultation', { consultation: term('consulta') })}</button></div>
    <div id="edup"></div>
    <div class="acts u-end">
      <button class="btn sec" data-cerrar>${t('common.cancel')}</button>
      <button class="btn" id="eguardar">${t(id ? 'accountsEditor.editor.saveChanges' : 'accountsEditor.editor.create')}</button>
    </div>`;
}

async function loadAccount(id: string | null, type: string | null | undefined): Promise<{ account: EditedAccount; consultations: ConsultationData[] } | null> {
  if (!id) return { account: { tipo: type ?? 'Persona', estado_comercial: accountsEditorLegacy.initialState() }, consultations: [{}] };
  const { data, error } = await legacyDb().rpc<{ medico: EditedAccount; consultas?: ConsultationData[] }>('ficha_cuenta', { p_id: id });
  if (error || !data) { notices.toast(t('accountsEditor.editor.couldNotOpen', { error: (error as { message?: string } | null)?.message ?? '' }), true); return null; }
  return { account: data.medico, consultations: data.consultas?.length ? data.consultas : [{}] };
}

/** Opens the editor of account `id`, or a new account of `type` (Persona or Centro). */
export async function openEditor(id: string | null, type?: string | null): Promise<void> {
  const loaded = await loadAccount(id, type);
  const body = document.getElementById('dbody'), dialog = document.getElementById('dlg') as HTMLDialogElement | null;
  if (!loaded || !body || !dialog) return;
  body.innerHTML = formHtml(loaded.account, loaded.consultations, id);
  const list = document.getElementById('econs'), add = document.getElementById('eadd');
  if (list) {
    bindConsultationList(list); paintNewPickers(list);
    if (add) add.onclick = (): void => { list.insertAdjacentHTML('beforeend', consultationHtml({}, nextIndex(list))); paintNewPickers(list); };
  }
  const save = bindSave(id, loaded.account);
  dialog.showModal();
  if (id) await addSalesperson(id, save);
  if (loaded.account.tipo === CENTRE) adaptForCentre(id, save);
}
