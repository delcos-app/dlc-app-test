/**
 * «Quién cobra con este esquema» inside the scheme window: each assignment, locked once saved, with «Terminar hoy» or «Anular»
 * for administration, and adding a person from today, from a date or for their whole history. Migrated from the legacy
 * personasEsquema (v2.411.0).
 */
import { cardSectionsLegacy, legacyDb, notices, salesTeam } from '../../legacy/bridge';
import { commissionsLegacy } from '../../legacy/commissions-bridge';
import { t } from '../../i18n';
import { formatShortDate } from '../../services/date-format';
import { addDays, todayIso } from '../../services/dates';
import { escapeHtml } from '../../services/format';
import { ALL_HISTORY, assignmentState, forgetSchemes, type Assignment } from './model';

const block = (inner: string): string => `<div class="blk" id="esqpers"><h3>${t('commissions.people.title')}</h3>${inner}</div>`;

function rowHtml(item: Assignment, admin: boolean): string {
  const state = assignmentState(item), today = todayIso();
  const since = item.desde <= ALL_HISTORY ? t('commissions.people.allHistory') : t('commissions.people.since', { date: formatShortDate(item.desde) });
  return `<div class="esqfila"><span class="candado" title="${t('commissions.people.locked')}">🔒</span>
        <span class="ef1"><b>${escapeHtml(item.persona)}</b><span class="sm">${since}${item.hasta ? t('commissions.people.until', { date: formatShortDate(item.hasta) }) : ''}</span></span>
        <span class="pill ${state.pill}">${state.text}</span>
        ${admin && item.vigente ? `<button type="button" class="kcfg" data-efin="${item.usuario_id}">${t('commissions.people.endToday')}</button>` : ''}
        ${admin && item.desde > today ? `<button type="button" class="kcfg" data-equi="${item.usuario_id}" data-edesde="${item.desde}">${t('commissions.people.cancelIt')}</button>` : ''}</div>`;
}

function addHtml(): string {
  const people = commissionsLegacy.team().filter(member => cardSectionsLegacy.roleCan(member.rol, 'cobrar_comision'));
  return `<div class="esqadd"><select id="eap"><option value="">${t('commissions.people.addPerson')}</option>${people.map(member => `<option value="${member.id}">${escapeHtml(member.nombre)}</option>`).join('')}</select>
      <select id="eadm"><option value="hoy">${t('commissions.people.fromToday')}</option><option value="todo">${t('commissions.people.wholeHistory')}</option><option value="fecha">${t('commissions.people.fromDate')}</option></select>
      <span id="eadfw" class="hide"><input id="eadf" type="date" value="${todayIso()}"></span>
      <button type="button" class="btn sec" id="eaok">${t('commissions.people.assign')}</button></div>
      <p class="sm u-mt-6">${t('commissions.people.lockedHint')}</p>`;
}

const value = (id: string): string => (document.getElementById(id) as HTMLInputElement | null)?.value ?? '';

async function assign(schemeId: string, repaint: () => void): Promise<void> {
  const user = value('eap'); if (!user) { notices.toast(t('commissions.people.choosePerson'), true); return; }
  const mode = value('eadm'), since = mode === 'todo' ? ALL_HISTORY : mode === 'fecha' ? value('eadf') : todayIso();
  const name = commissionsLegacy.team().find(member => member.id === user)?.nombre ?? '';
  const when = mode === 'todo' ? t('commissions.people.inAllHistory') : t('commissions.people.sinceDate', { date: formatShortDate(since) });
  if (!await notices.confirm(t('commissions.people.assignText', { name, when }), { titulo: t('commissions.people.assignTitle'), ok: t('commissions.people.assign') })) return;
  const { data: result, error } = await legacyDb().rpc<{ ok?: boolean }>('asignar_esquema', { p_usuario: user, p_esquema: schemeId, p_quitar: false, p_desde: since });
  if (error || result?.ok === false) { notices.toast(t('commissions.people.couldNotAssign'), true); return; }
  notices.toast(t('commissions.people.assigned', { name })); forgetSchemes(); repaint();
}

/** Ends an assignment from `since` (tomorrow to end it today; its own start to cancel a scheduled one). */
async function remove(user: string, since: string, ending: boolean): Promise<void> {
  const asked = ending ? { text: 'commissions.people.endText', titulo: 'commissions.people.endTitle', ok: 'commissions.people.endOk' } as const
    : { text: 'commissions.people.cancelText', titulo: 'commissions.people.cancelTitle', ok: 'commissions.people.cancelIt' } as const;
  if (!await notices.confirm(t(asked.text), { titulo: t(asked.titulo), ok: t(asked.ok), peligro: true })) return;
  await legacyDb().rpc('asignar_esquema', { p_usuario: user, p_esquema: null, p_quitar: true, p_desde: since });
}

function bind(schemeId: string, list: HTMLElement, repaint: () => void): void {
  const mode = document.getElementById('eadm') as HTMLSelectElement | null;
  if (mode) mode.onchange = (): void => { document.getElementById('eadfw')?.classList.toggle('hide', mode.value !== 'fecha'); };
  const ok = document.getElementById('eaok'); if (ok) ok.onclick = (): void => { void assign(schemeId, repaint); };
  list.querySelectorAll<HTMLElement>('[data-efin]').forEach(button => {
    button.onclick = async (): Promise<void> => { await remove(button.dataset.efin ?? '', addDays(todayIso(), 1), true); repaint(); };
  });
  list.querySelectorAll<HTMLElement>('[data-equi]').forEach(button => {
    button.onclick = async (): Promise<void> => { await remove(button.dataset.equi ?? '', button.dataset.edesde ?? '', false); repaint(); };
  });
}

async function paintList(schemeId: string): Promise<void> {
  const { data } = await legacyDb().rpc<Assignment[]>('asignaciones_esquema_lista');
  const list = document.getElementById('esqlista'); if (!list) return;
  const assignments = (data ?? []).filter(item => item.esquema_id === schemeId), admin = cardSectionsLegacy.can('administrar');
  list.innerHTML = `${assignments.length ? `<div class="esqfilas">${assignments.map(item => rowHtml(item, admin)).join('')}</div>` : `<p class="sm">${t('commissions.people.nobody')}</p>`}
    ${admin ? addHtml() : ''}`;
  if (admin) bind(schemeId, list, () => { void paintList(schemeId); });
}

/** Adds the block before the window buttons (a new scheme only says to save it first). */
export async function paintSchemePeople(schemeId: string | null): Promise<void> {
  const buttons = document.getElementById('eguardaresq')?.closest('.acts');
  if (!buttons || document.getElementById('esqpers')) return;
  if (!schemeId) { buttons.insertAdjacentHTML('beforebegin', block(`<p class="sm">${t('commissions.people.saveFirst')}</p>`)); return; }
  buttons.insertAdjacentHTML('beforebegin', block(`<div id="esqlista" class="sm">${t('commissions.people.loading')}</div>`));
  if (!salesTeam.members().length) await salesTeam.load();
  await paintList(schemeId);
}
