/**
 * Sections about the account itself: its visit cycle under «Estado», the link from a centre to the professionals who attend
 * there, and «Dar de baja» / «Eliminar la ficha». Migrated from the legacy abrirFichaBase11, abrirFichaBase17 and abrirFicha.
 * The buttons are answered by the listeners of legado 134 (data-fcver) and 135 (data-fbaja, data-falta, data-felim).
 */
import { accountCardLegacy, permissions, term } from '../../../legacy/bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { accountKind, stillShown } from './card-tools';
import { paintCardCycle } from '../../cycle/card';

const CENTRE = 'Centro', DELETE_LEVEL = 3;

/** The visit cycle (A/B/C) of the account, inside the «Estado» block. */
export async function cycle(id: string): Promise<void> {
  if (permissions.isProfessionalPortal() || document.getElementById('fciclo') || !stillShown(id)) return;
  const state = [...document.querySelectorAll('#fbody .blk > h3')].find(heading => heading.textContent?.trim() === t('accounts.card.stateTitle'));
  if (!state?.parentElement) return;
  state.parentElement.insertAdjacentHTML('beforeend', '<div class="fciclo" id="fciclo"></div>');
  await paintCardCycle(id);
}

/** A centre linked to a place: the professionals who attend there and their timetable. */
export async function centreProfessionals(id: string): Promise<void> {
  const account = await accountKind(id), body = document.getElementById('fbody');
  if (account?.tipo !== CENTRE || !account.centro_id || !body || !stillShown(id) || document.getElementById('fcentrop')) return;
  const professionals = escapeHtml(term('medico', { number: 'p' }));
  (body.querySelector('.fh') ?? body.firstElementChild)?.insertAdjacentHTML('afterend', `<div class="blk" id="fcentrop"><div class="fcentropf"><span>${t('accounts.card.centreProfessionals', { professionals })}</span>
        <button type="button" class="btn sec chico" data-fcver="${account.centro_id}">${t('accounts.card.seeCentreProfessionals', { professionals })}</button></div></div>`);
}

/** «Dar de baja» or «Volver a dar de alta», and «Eliminar la ficha» for whoever manages accounts fully. */
export async function archiveButtons(id: string): Promise<void> {
  const account = await accountKind(id), body = document.getElementById('fbody');
  if (!account || !body || !stillShown(id) || document.getElementById('fbajablk') || !accountCardLegacy.canEditType(account.tipo)) return;
  const status = account.archivado_en
    ? `<button type="button" class="btn sec chico" data-falta="${id}">${t('accounts.card.reactivate')}</button>`
    : `<button type="button" class="btn sec chico" data-fbaja="${id}">${t('accounts.card.archive')}</button>`;
  body.insertAdjacentHTML('beforeend', `<div class="blk fbajablk" id="fbajablk"><div class="acts">
      ${status}
      ${permissions.levelOf('M') >= DELETE_LEVEL ? `<button type="button" class="btn sec dang chico" data-felim="${id}">${t('accounts.card.delete')}</button>` : ''}</div></div>`);
}
