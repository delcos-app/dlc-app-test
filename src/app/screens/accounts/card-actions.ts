/**
 * Actions from the account card and the «Crear nuevo» button (legado 002, v2.424.0): record a visit, edit, mark or unmark as
 * urgent, the close buttons of both windows and the choice between a professional and a centre. alternarUrgenteBase stays as an
 * adapter (legado 117 wraps it).
 */
import { legacyDb, notices, term } from '../../legacy/bridge';
import { cardActionsLegacy } from '../../legacy/legado-a-bridge';
import { t } from '../../i18n';
import { escapeHtml } from '../../services/format';
import { orFallback } from '../../services/values';

const PERSON = 'Persona', CENTRE = 'Centro';
const dialog = (id: string): HTMLDialogElement | null => document.getElementById(id) as HTMLDialogElement | null;

/** Marks an account as urgent (asking an optional reason) or removes the mark. */
export async function toggleUrgent(id: string, isUrgent: boolean): Promise<void> {
  let reason: string | null = null;
  if (!isUrgent) {
    reason = await cardActionsLegacy.askText(t('legacyA.urgent.reasonQuestion'), { titulo: t('legacyA.urgent.title'), ok: t('legacyA.urgent.mark'), opciones: cardActionsLegacy.urgencyReasons() });
    if (reason === null) return;
  }
  const { error } = await legacyDb().from('cuentas').update({ urgente: !isUrgent, urgente_motivo: isUrgent ? null : orFallback(reason, t('legacyA.urgent.defaultReason')) }).eq('id', id);
  if (error) { notices.toast(t('legacyA.urgent.couldNotChange', { error: (error as { message?: string }).message ?? '' }), true); return; }
  notices.toast(t(isUrgent ? 'legacyA.urgent.noLonger' : 'legacyA.urgent.marked'));
  cardActionsLegacy.openAccount(id); cardActionsLegacy.search(); cardActionsLegacy.reloadHome();
}

function documentClick(event: Event): void {
  const target = event.target as Element;
  if (target.closest('.x[data-cerrar]')) cardActionsLegacy.tryClose(dialog('dlg'));
  else if (target.closest('[data-cerrar]')) dialog('dlg')?.close();
  const action = target.closest<HTMLElement>('[data-act]');
  if (!action) return;
  const id = action.dataset.id ?? '';
  if (action.dataset.act === 'visita') cardActionsLegacy.recordVisit(id);
  if (action.dataset.act === 'editar') cardActionsLegacy.edit(id);
  if (action.dataset.act === 'urgente') cardActionsLegacy.toggleUrgent(id, action.dataset.urg === '1');
}

function newChoiceHtml(): string {
  const option = (kind: string, title: string, hint: string): string => `<button class="opt ${cardActionsLegacy.canCreateType(kind) ? '' : 'hide'}" data-crear="${kind}" style="flex-direction:column;align-items:flex-start;gap:4px;padding:16px">
        <b style="font-size:16px;color:var(--navy)">${title}</b><span class="sm">${hint}</span></button>`;
  return `
    <div class="fh"><div><h2>${t('legacyA.create.title')}</h2><div class="sm">${t('legacyA.create.question')}</div></div>
      <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
    <div class="opciones u-mt-10">
      ${option(PERSON, escapeHtml(cardActionsLegacy.newAccountName()), t('legacyA.create.personHint', { Professional: term('medico', { capital: 'C' }) }))}
      ${option(CENTRE, t('legacyA.create.centre'), t('legacyA.create.centreHint'))}
    </div>`;
}

function createNew(): void {
  if (!cardActionsLegacy.canCreate()) { notices.toast(t('legacyA.create.noPermission'), true); return; }
  const body = document.getElementById('dbody'); if (!body) return;
  body.innerHTML = newChoiceHtml();
  body.querySelectorAll<HTMLElement>('[data-crear]').forEach(button => { button.onclick = (): void => { cardActionsLegacy.create(button.dataset.crear ?? ''); }; });
  dialog('dlg')?.showModal();
}

/** Registers the card actions, the close buttons of the second window and «Crear nuevo» (legado 002). */
export function listenToCardActions(): void {
  document.addEventListener('click', documentClick);
  document.getElementById('dlg2')?.addEventListener('click', event => {
    const target = event.target as Element;
    if (target.closest('.x[data-cerrar2]')) cardActionsLegacy.tryClose(dialog('dlg2'));
    else if (target.closest('[data-cerrar2]')) dialog('dlg2')?.close();
  });
  document.getElementById('nuevoBtn')?.addEventListener('click', createNew);
}
