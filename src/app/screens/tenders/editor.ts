/**
 * The window to create or change a tender: title, who it is sold to, file number, public body, dates, amount and responsible.
 * Migrated from the legacy editarConcurso (v2.409.0).
 */
import { appLegacy, editorLegacy, legacyDb, notices, relatedLegacy, salesTeam } from '../../legacy/bridge';
import { t } from '../../i18n';
import { escapeHtml } from '../../services/format';
import { isPresent } from '../../services/values';
import { STATES, writeFailure, type Tender } from './model';

interface Person { id: string; nombre: string }

const field = (id: string): string => (document.getElementById(id) as HTMLInputElement | null)?.value ?? '';
const textOrNull = (id: string): string | null => field(id).trim() || null;

async function team(): Promise<readonly Person[]> {
  if (!salesTeam.members().length) await salesTeam.load().catch(() => undefined);
  const me = salesTeam.currentUserId(), members = salesTeam.members();
  return members.some(member => member.id === me) ? members : [{ id: me, nombre: appLegacy.currentUserName() }, ...members];
}

function editorHtml(tender: Partial<Tender>, existing: Tender | null, people: readonly Person[]): string {
  const value = (text: string | null | undefined): string => escapeHtml(text ?? '');
  return `<div class="fh"><div><h2>${t(existing ? 'tenders.editor.changeTitle' : 'tenders.editor.newTitle')}</h2><div class="sm">${t('tenders.editor.subtitle')}</div></div>
      <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
    <label for="cont">${t('tenders.editor.title')}</label><input id="cont" value="${value(tender.titulo)}" placeholder="${t('tenders.editor.titlePlaceholder')}">
    <label>${t('tenders.editor.soldTo')}</label><div id="concta"></div>
    <div class="g2"><div><label for="conexp">${t('tenders.editor.file')}</label><input id="conexp" value="${value(tender.expediente)}"></div>
      <div><label for="conorg">${t('tenders.editor.body')}</label><input id="conorg" value="${value(tender.organismo)}" placeholder="${t('tenders.editor.bodyPlaceholder')}"></div></div>
    <div class="g2"><div><label for="conpub">${t('tenders.editor.published')}</label><input id="conpub" type="date" value="${value(tender.publicado)}"></div>
      <div><label for="conlim">${t('tenders.editor.submitBy')}</label><input id="conlim" type="date" value="${value(tender.limite)}"></div></div>
    <div class="g2"><div><label for="conimp">${t('tenders.editor.amount')}</label><input id="conimp" type="number" min="0" step="0.01" value="${isPresent(tender.importe_licitacion) ? Number(tender.importe_licitacion) : ''}"></div>
      <div><label for="conres">${t('tenders.editor.responsible')}</label><select id="conres">${people.map(person => `<option value="${person.id}" ${person.id === tender.responsable_id ? 'selected' : ''}>${escapeHtml(person.nombre)}</option>`).join('')}</select></div></div>
    <label for="conn">${t('tenders.editor.note')}</label><textarea id="conn" rows="2">${value(tender.nota)}</textarea>
    <div class="acts u-end">${existing ? `<button type="button" class="btn sec peligro" id="conborrar">${t('tenders.editor.delete')}</button>` : ''}
      <button type="button" class="btn sec" data-cerrar>${t('tenders.editor.cancel')}</button><button type="button" class="btn" id="conok">${t(existing ? 'tenders.editor.save' : 'tenders.editor.create')}</button></div>`;
}

function row(title: string, account: PickedAccount): Record<string, unknown> {
  const amount = field('conimp');
  return {
    titulo: title, cuenta_id: account.id, expediente: textOrNull('conexp'), organismo: textOrNull('conorg'),
    publicado: field('conpub') || null, limite: field('conlim') || null, importe_licitacion: amount === '' ? null : Math.max(0, Number(amount)),
    responsable_id: field('conres') || null, nota: textOrNull('conn'),
  };
}

async function save(existing: Tender | null, account: PickedAccount | null, button: HTMLButtonElement): Promise<void> {
  const title = field('cont').trim();
  if (!title || !account) { notices.toast(t('tenders.editor.missing'), true); return; }
  button.disabled = true;
  const table = legacyDb().from<{ id: string }>('concursos'), values = row(title, account);
  const result = existing ? await table.update(values).eq('id', existing.id).select('id').single() : await table.insert(values).select('id').single();
  button.disabled = false;
  if (result.error) { notices.toast(writeFailure(result.error as { message?: string }, t('tenders.editor.noPermission')), true); return; }
  notices.toast(t(existing ? 'tenders.editor.saved' : 'tenders.editor.created'));
  relatedLegacy.openTender(result.data?.id ?? '');
}

async function remove(existing: Tender): Promise<void> {
  if (!await notices.confirm(t('tenders.editor.deleteText'), { titulo: t('tenders.editor.deleteTitle'), ok: t('tenders.editor.delete'), peligro: true })) return;
  const { error } = await legacyDb().from('concursos').delete().eq('id', existing.id);
  if (error) { notices.toast(t('tenders.editor.couldNotDelete'), true); return; }
  (document.getElementById('dlg') as HTMLDialogElement | null)?.close(); notices.toast(t('tenders.editor.deleted'));
}

/** Opens the editor of `existing`, or a new tender (in study, with the user as responsible). */
export async function editTender(existing: Tender | null): Promise<void> {
  const tender: Partial<Tender> = existing ?? { estado: STATES.studying, responsable_id: salesTeam.currentUserId() };
  const people = await team();
  const body = document.getElementById('dbody'), box = document.getElementById('dlg') as HTMLDialogElement | null;
  if (!body || !box) return;
  body.innerHTML = editorHtml(tender, existing, people);
  if (!box.open) box.showModal();
  let account: PickedAccount | null = existing ? { id: existing.cuenta_id ?? '', nombre: existing.cuentas?.nombre ?? '' } : null;
  editorLegacy.pickAccount(document.getElementById('concta'), account, picked => { account = picked; }, t('tenders.editor.soldToPlaceholder'));
  const ok = document.getElementById('conok') as HTMLButtonElement | null;
  if (ok) ok.onclick = (): void => { void save(existing, account, ok); };
  const erase = document.getElementById('conborrar');
  if (erase && existing) erase.onclick = (): void => { void remove(existing); };
}
