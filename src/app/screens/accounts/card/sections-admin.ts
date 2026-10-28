/**
 * Review sections of the account card: the change history with «Deshacer» (administration) and the data the professional
 * sent from their portal, to review. Migrated from the legacy fichaHistorial / fichaPropuesta (v2.403.0).
 */
import { agendaActions, cachedRpc, callRpc, cardSectionsLegacy, legacyDb, notices, permissions, term } from '../../../legacy/bridge';
import { t } from '../../../i18n';
import { capitalise } from '../../../services/date-format';
import { escapeHtml, formatNumber } from '../../../services/format';
import { orFallback } from '../../../services/values';
import { stillShown } from './card-tools';

const HISTORY_LIMIT = 100, VALUE_LENGTH = 40, EDIT = 'Edición';

function changeLines(entry: HistoryEntry): string {
  const detail = entry.detalle;
  if (entry.accion !== EDIT || !detail || typeof detail !== 'object') return `<span class="sm">${escapeHtml(cardSectionsLegacy.detailSummary(detail))}</span>`;
  const value = (raw: unknown): string => escapeHtml(orFallback(cardSectionsLegacy.valueText(raw).slice(0, VALUE_LENGTH), '—'));
  return Object.entries(detail as Record<string, unknown>).filter((pair): pair is [string, unknown[]] => Array.isArray(pair[1]) && pair[1].length === 2)
    .map(([field, [before, after]]) => `<span class="sm">${escapeHtml(cardSectionsLegacy.fieldName(field))}: ${value(before)} → ${value(after)}</span>`).join('');
}

function historyRow(entry: HistoryEntry): string {
  const when = new Date(entry.creado_en).toLocaleString(t('dates.locale'), { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  return `<div class="item u-cursor-default"><span class="tx">
        <b>${escapeHtml(entry.accion)}${entry.entidad === 'ubicaciones' ? ` · ${term('consulta')}` : ''}</b>
        <span class="sm">${escapeHtml(entry.usuario)} · ${when}</span>
        ${changeLines(entry)}</span>${entry.deshacible ? `<button type="button" class="btn sec" data-fhx="${entry.id}">${t('accounts.history.undo')}</button>` : ''}</div>`;
}

/** The change history of the account, with «Deshacer» where possible (administration). */
export async function changeHistory(id: string): Promise<void> {
  if (!cardSectionsLegacy.can('administrar') || !stillShown(id) || !document.getElementById('fbody') || document.getElementById('fhist')) return;
  const { data } = await callRpc<HistoryEntry[]>('historial_entidad', { p_entidad: 'cuentas', p_id: id, lim: HISTORY_LIMIT });
  const list = Array.isArray(data) ? data : [], body = document.getElementById('fbody');
  if (!stillShown(id) || !body || document.getElementById('fhist')) return;
  body.insertAdjacentHTML('beforeend', `<details class="blk" id="fhist"><summary>${t('accounts.history.title')} <span class="n">${formatNumber(list.length)}</span></summary>
    <div class="lista">${list.map(historyRow).join('') || `<div class="sm">${t('accounts.history.none')}</div>`}</div></details>`);
  document.querySelectorAll<HTMLElement>('#fhist [data-fhx]').forEach(button => {
    button.onclick = (): void => { cardSectionsLegacy.undo(Number(button.dataset.fhx), () => { agendaActions.openAccount(id); }); };
  });
}

interface ProposalConsultation { nombre?: string | null; centro_id?: string | null; ubicacion_id?: string | null; direccion?: string | null; municipio?: string | null; dias?: Record<string, string | null> | null }
interface Proposal { id: string; quien?: string | null; modificado_en: string; datos?: { telefono?: string | null; email?: string | null; consultas?: ProposalConsultation[]; visitas?: { como?: string | null; momento?: string | null } | null; notas?: string | null } | null }

const PORTAL_DAYS = ['L', 'M', 'X', 'J', 'V', 'S'];

function timetableText(days: ProposalConsultation['dias']): string {
  const names = t('dates.weekdaysLong').split(',');
  return PORTAL_DAYS.map((day, index) => (days?.[day] ? `${capitalise(names[index] ?? '').slice(0, 3)} ${escapeHtml(days[day])}` : '')).filter(Boolean).join(' · ') || t('accounts.proposal.noTimetable');
}

const difference = (label: string, now: string | null | undefined, proposed: string | null | undefined): string =>
  (proposed && proposed !== now ? `<div class="fpdif"><span class="sm">${label}</span><span>${now ? `<s>${escapeHtml(now)}</s> → ` : ''}<b>${escapeHtml(proposed)}</b></span></div>` : '');

function proposalHtml(proposal: Proposal, account: CardAccount & { telefono?: string | null }, canEdit: boolean): string {
  const data = proposal.datos ?? {}, visits = data.visitas;
  const sentAt = new Date(proposal.modificado_en).toLocaleString(t('dates.locale'), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const consultations = (data.consultas ?? []).map(item => `<div class="fpcon"><b>${escapeHtml(orFallback(item.nombre, term('consulta', { capital: 'C' })))}</b> ${item.centro_id || item.ubicacion_id ? '' : `<span class="pill p-per">${t('accounts.proposal.newCentre')}</span>`}
      <span class="sm">${escapeHtml([item.direccion, item.municipio].filter(Boolean).join(' · '))}</span><span class="sm">${timetableText(item.dias)}</span></div>`).join('');
  const visitWay = visits && (visits.como || visits.momento) ? `<div class="fpdif"><span class="sm">${term('visita', { number: 'p', capital: 'C' })}</span><span>${escapeHtml([visits.como, visits.momento].filter(Boolean).join(' · '))}</span></div>` : '';
  return `<section class="blk fprop" id="fprop"><h3>${t('accounts.proposal.title')} <span class="pill p-warn">${t('accounts.proposal.toReview')}</span></h3>
    <p class="sm">${t('accounts.proposal.sent', { who: escapeHtml(orFallback(proposal.quien, term('medico', { article: 'el', capital: 'C' }))), date: sentAt })}</p>
    ${difference(t('accounts.proposal.phone'), account.telefono, data.telefono)}${difference(t('accounts.proposal.email'), account.email, data.email)}
    ${consultations}
    ${visitWay}
    ${data.notas ? `<div class="fpdif"><span class="sm">${t('accounts.proposal.notes')}</span><span>${escapeHtml(data.notas)}</span></div>` : ''}
    <div class="acts u-start u-m-8-0-0">${canEdit ? `<button type="button" class="btn sec" id="fpropedit">${t('accounts.proposal.edit')}</button>` : ''}
      <button type="button" class="btn" id="fpropok">${t('accounts.proposal.reviewed')}</button></div></section>`;
}

async function markReviewed(proposal: Proposal): Promise<void> {
  const { data: result } = await legacyDb().rpc<{ ok?: boolean; error?: string }>('revisar_propuesta', { p_id: proposal.id });
  if (!result?.ok) { notices.toast(t(result?.error === 'permiso' ? 'accounts.proposal.noPermission' : 'accounts.proposal.couldNotMark'), true); return; }
  notices.toast(t('accounts.proposal.marked')); document.getElementById('fprop')?.remove();
}

/** The data the professional sent from their portal, under the header, to pass to the card and mark as reviewed. */
const canShowProposal = (id: string): boolean => stillShown(id) && Boolean(document.getElementById('fbody')) && !document.getElementById('fprop');

export async function portalProposal(id: string): Promise<void> {
  if (permissions.isProfessionalPortal() || !canShowProposal(id)) return;
  const { data: proposal } = await callRpc<Proposal>('ficha_propuesta', { p_cuenta: id });
  if (!proposal || !canShowProposal(id)) return;
  const card = await cachedRpc<CardData>('ficha_cuenta', { p_id: id }, `ficha-${id}`), body = document.getElementById('fbody');
  if (!body) return;
  const edit = body.querySelector<HTMLElement>('[data-act=editar]');
  const html = proposalHtml(proposal, (card.data?.medico ?? {}) as CardAccount, Boolean(edit));
  // Under the header of the card (name and buttons), before the first block
  const first = [...body.children].find(child => child.matches('.blk, section, .card') && child.id !== 'fprop');
  if (first) first.insertAdjacentHTML('beforebegin', html); else body.insertAdjacentHTML('beforeend', html);
  bindProposal(body, proposal);
}

function bindProposal(body: HTMLElement, proposal: Proposal): void {
  const editButton = document.getElementById('fpropedit'); if (editButton) editButton.onclick = (): void => { body.querySelector<HTMLElement>('[data-act=editar]')?.click(); };
  const ok = document.getElementById('fpropok'); if (ok) ok.onclick = (): void => { void markReviewed(proposal); };
}
