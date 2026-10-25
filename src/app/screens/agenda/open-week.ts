/**
 * The whole week under the strip («Ver la semana»): a column per day with its appointments (drag one to another day to move it),
 * blocked days, the estimated end of each day, the «⋯» menu, «Repartir la semana» and the unsaved proposal of the planner.
 * Migrated from the legacy pintarSemanaAgenda / agPintarSemanaExp(Base, Base2) (v2.396.0). Before, it painted by swapping the
 * ids of «Tu día» and the week for a moment and pretending the mode was «semana»; now it paints straight into #agsemexp.
 */
import { agendaActions, agendaSources, appointments, cachedRpc, commercialStates, initialsOf, legacyAgenda, legacyAgendaParts, legacyDb, notices, reloadAgenda, agendaState, stripState, term, weekPlanner } from '../../legacy/bridge';
import { t } from '../../i18n';
import { addDays, formatMinutes, fromIsoDate, mondayOf, todayIso } from '../../services/dates';
import { formatShortDate } from '../../services/date-format';
import { escapeHtml, formatNumber } from '../../services/format';
import { range } from '../../services/values';
import { weekLoads, withData } from './preload';
import { planWeek, saveWeekDraft } from '../routes/planner/week';
import { openDayMenu } from './day-menu';

const WEEK_DAYS = 7, SHOWN_PER_DAY = 9, SHOWN_WITHOUT_DAY = 25;
const NOT_SHOWN = ['Descartada', 'Aplazada'];

interface WeekData {
  readonly monday: string; readonly days: readonly string[]; readonly today: string; readonly owner: string;
  readonly list: readonly WeekAppointment[]; readonly perDay: Record<string, WeekAppointment[]>;
  readonly blocked: Readonly<Record<string, string>>; readonly draft: WeekDraft | null;
}

const firstName = (name: string | null | undefined): string => String(name).split(',')[0] ?? '';

function loadEstimate(day: string, mine: readonly WeekAppointment[], proposed: readonly WeekDraftItem[], data: WeekData): string {
  if (!(mine.some(item => appointments.isOpen(item.estado)) || proposed.length) || day < data.today) return '';
  const planned = proposed.map(item => ({ estado: 'Planificada', ...(data.draft?.horario ?? {}), ...item.cita }));
  const { fin: end, tope: limit } = weekPlanner.estimateDay([...mine, ...planned], day);
  const title = t('agenda.openWeek.estimatedEnd') + (end > limit ? t('agenda.openWeek.overReturn', { time: formatMinutes(limit) }) : '');
  return `<span class="semcarga ${end > limit ? 'pasa' : ''}" title="${title}">~${formatMinutes(end)}</span>`;
}

function appointmentChip(item: WeekAppointment, data: WeekData): string {
  const movable = item.usuario_id === data.owner && appointments.isOpen(item.estado) && item.fecha >= data.today;
  const title = `${escapeHtml(item.nombre)} · ${escapeHtml(item.estado)}${movable ? t('agenda.openWeek.dragToMove') : ''}`;
  const time = item.hora ? `<i>${escapeHtml(String(item.hora).slice(0, 5))}</i>` : '';
  const other = item.usuario_id !== data.owner && item.usuario ? ` <em>${escapeHtml(initialsOf(item.usuario))}</em>` : '';
  return `<span class="semcita" data-semficha="${item.cuenta_id}" ${movable ? `draggable="true" data-semcid="${item.id}"` : ''}
              title="${title}" style="border-left-color:${commercialStates.color(item.estado) ?? 'var(--muted)'}">
              ${time}${escapeHtml(firstName(item.nombre))}${other}</span>`;
}

function proposedChip(item: WeekDraftItem): string {
  const start = item.ini === null || item.ini === undefined ? '' : formatMinutes(item.ini);
  return `<span class="semcita nueva" title="${t('agenda.openWeek.proposal', { name: escapeHtml(item.m.nombre) })}${start ? ` · ~${start}` : ''}"><i>~${start}</i>${escapeHtml(firstName(item.m.nombre))}</span>`;
}

function dayColumn(day: string, data: WeekData): string {
  const all = (data.perDay[day] ?? []).filter(item => !NOT_SHOWN.includes(item.estado));
  const mine = all.filter(item => item.usuario_id === data.owner), proposed = data.draft?.dias[day] ?? [];
  const done = all.filter(item => item.estado === 'Visitada').length, date = fromIsoDate(day), reason = data.blocked[day];
  const classes = ['mesdia semdia', day === data.today ? 'hoy' : '', date.getDay() === 0 || date.getDay() === 6 ? 'finde' : '', reason ? 'bloq' : ''].filter(Boolean).join(' ');
  return `<div class="${classes}" data-semdia="${day}" role="button" tabindex="0">
          <div class="semcab"><b>${date.getDate()}</b>${all.length ? `<span class="mespunto">${done}/${all.length}</span>` : ''}${loadEstimate(day, mine, proposed, data)}
            <button class="semmas" data-semmenu="${day}" aria-label="${t('agenda.openWeek.dayOptions', { date: formatShortDate(day) })}" title="${t('agenda.openWeek.dayOptionsTitle')}">⋯</button></div>
          ${reason ? `<span class="sembloq">🚫 ${escapeHtml(reason)}</span>` : ''}
          <div class="semcitas">${all.slice(0, SHOWN_PER_DAY).map(item => appointmentChip(item, data)).join('')}
            ${proposed.map(proposedChip).join('')}
            ${all.length > SHOWN_PER_DAY ? `<span class="sm">${t('agenda.openWeek.andMore', { count: all.length - SHOWN_PER_DAY })}</span>` : ''}</div>
        </div>`;
}

function draftHtml(draft: WeekDraft): string {
  const days = Object.keys(draft.dias).filter(day => draft.dias[day]?.length).length;
  const summary = t('agenda.openWeek.draftSummary', { count: formatNumber(draft.total), visits: term('visita', { number: 'p', adjective: 'nuevo' }), days })
    + (draft.sinDia.length ? t('agenda.openWeek.draftWithoutDay', { count: draft.sinDia.length }) : '');
  return `<div class="semborr">
      <span><b>${t('agenda.openWeek.draft')}</b> · ${summary}</span>
      <span class="acts u-m-0"><button class="btn sec" id="semdescartar">${t('agenda.openWeek.discard')}</button><button class="btn" id="semguardar">${t('agenda.openWeek.save')}</button></span></div>`;
}

function withoutDayHtml(draft: WeekDraft | null): string {
  if (!draft?.sinDia.length) return '';
  const rows = draft.sinDia.slice(0, SHOWN_WITHOUT_DAY).map(item => `<div class="item u-cursor-default"><span class="ic w">!</span>
        <span class="tx"><b>${escapeHtml(item.m.nombre)}</b><span class="sm">${escapeHtml(item.motivo)}${item.m.municipio ? ` · ${escapeHtml(item.m.municipio)}` : ''}</span></span></div>`).join('');
  const more = draft.sinDia.length > SHOWN_WITHOUT_DAY ? `<div class="sm" style="padding:6px 12px">${t('agenda.openWeek.andMore', { count: draft.sinDia.length - SHOWN_WITHOUT_DAY })}</div>` : '';
  return `<div class="planfuera" style="margin:0 16px 16px"><h3>${t('agenda.openWeek.withoutDay', { count: draft.sinDia.length })}</h3>
      <div class="lista">${rows}
        ${more}</div></div>`;
}

function weekHtml(data: WeekData): string {
  const canPlan = data.days.some(day => day >= data.today) && !data.draft;
  return `
    <div class="semhead"><span class="sm">${t('agenda.openWeek.hint')}</span>
      ${canPlan ? `<button class="btn" id="semplan">${t('agenda.openWeek.share')}</button>` : ''}</div>
    ${data.draft ? draftHtml(data.draft) : ''}
    <div class="semwrap"><div class="mes sem">
      ${t('dates.weekdayLetters').split(',').map(letter => `<span class="mesdow">${letter}</span>`).join('')}
      ${data.days.map(day => dayColumn(day, data)).join('')}
    </div></div>
    ${withoutDayHtml(data.draft)}`;
}

/** Moves a dragged appointment to another day (with a confirmation when that day is blocked or they do not attend). */
async function moveTo(item: WeekAppointment, day: string, data: WeekData): Promise<void> {
  if (item.fecha === day) return;
  if (day < todayIso()) { notices.toast(t('agenda.openWeek.notToPast'), true); return; }
  const warnings: string[] = [];
  const reason = data.blocked[day]; if (reason) warnings.push(t('agenda.openWeek.blockedDay', { reason }));
  const windows = weekPlanner.attendanceWindows(item.dias, day);
  if (windows && !windows.length) warnings.push(t('agenda.openWeek.notAttending'));
  if (warnings.length && !await notices.confirm(`${item.nombre ?? ''}: ${warnings.join(' y ')}.`, { titulo: t('agenda.openWeek.moveAnyway'), ok: t('agenda.openWeek.move') })) return;
  const { data: result, error } = await legacyDb().rpc<{ ok?: boolean }>('estado_cita', { p_id: item.id, p_estado: item.estado, p_fecha: day });
  if (error || result?.ok === false) { notices.toast(t('agenda.openWeek.couldNotMove'), true); return; }
  notices.toast(t('agenda.openWeek.movedTo', { date: formatShortDate(day) })); reloadAgenda();
}

function onDayClick(event: Event, column: HTMLElement, data: WeekData): void {
  const target = event.target instanceof Element ? event.target : null;
  const menu = target?.closest<HTMLElement>('[data-semmenu]');
  if (menu) { const day = menu.dataset.semmenu ?? ''; openDayMenu(menu, day, Boolean(data.blocked[day])); return; }
  if (target?.closest('.semcita.nueva')) return;
  const account = target?.closest<HTMLElement>('[data-semficha]');
  if (account) { agendaActions.openAccount(account.dataset.semficha ?? ''); return; }
  agendaState.setSelectedDate(column.dataset.semdia ?? ''); agendaState.setMode('dia'); reloadAgenda();
}

function bindDay(column: HTMLElement, data: WeekData): void {
  column.onclick = (event): void => { onDayClick(event, column, data); };
  column.onkeydown = (event): void => { if (event.key === 'Enter') onDayClick(event, column, data); };
  column.ondragover = (event): void => { if (event.dataTransfer?.types.includes('text/cita')) { event.preventDefault(); column.classList.add('sobre'); } };
  column.ondragleave = (): void => { column.classList.remove('sobre'); };
  column.ondrop = (event): void => {
    event.preventDefault(); column.classList.remove('sobre');
    const id = event.dataTransfer?.getData('text/cita'), item = data.list.find(entry => entry.id === id);
    if (item) void moveTo(item, column.dataset.semdia ?? '', data);
  };
}

function bind(box: HTMLElement, data: WeekData): void {
  const plan = box.querySelector<HTMLElement>('#semplan');
  if (plan) plan.onclick = (): void => { void planWeek(data.monday, data.days, { ...data.blocked }, data.perDay as unknown as Record<string, RouteAppointment[]>); };
  const discard = box.querySelector<HTMLElement>('#semdescartar');
  if (discard) discard.onclick = (): void => { weekPlanner.discardDraft(); reloadAgenda(); };
  const save = box.querySelector<HTMLElement>('#semguardar');
  if (save) save.onclick = (): void => { void saveWeekDraft(save); };
  box.querySelectorAll<HTMLElement>('[data-semdia]').forEach(column => { bindDay(column, data); });
  box.querySelectorAll<HTMLElement>('[data-semcid]').forEach(chip => {
    chip.ondragstart = (event): void => { event.dataTransfer?.setData('text/cita', chip.dataset.semcid ?? ''); if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'; chip.classList.add('arrastrando'); };
    chip.ondragend = (): void => { chip.classList.remove('arrastrando'); };
  });
}

async function weekData(): Promise<WeekData> {
  const monday = mondayOf(legacyAgenda.selectedDate() ?? todayIso()), sunday = addDays(monday, WEEK_DAYS - 1), owner = agendaSources.ownerId();
  const [result, blocked] = await Promise.all([
    cachedRpc<WeekAppointment[]>('agenda_rango', { p_desde: monday, p_hasta: sunday, p_usuario: legacyAgenda.userFilter() }, `agenda-${monday}`),
    legacyAgendaParts.blockedDays(monday, WEEK_DAYS),
  ]);
  const list = result.data ?? [], perDay: Record<string, WeekAppointment[]> = {};
  list.forEach(item => { (perDay[item.fecha] ??= []).push(item); });
  const draft = weekPlanner.draft(), ownDraft = draft?.semana === monday && draft.uid === owner ? draft : null;
  return { monday, days: range(WEEK_DAYS).map(index => addDays(monday, index)), today: todayIso(), owner, list, perDay, blocked, draft: ownDraft };
}

async function render(): Promise<void> {
  const strip = document.getElementById('agcinta');
  if (!strip || !stripState.weekOpen()) { document.getElementById('agsemexp')?.remove(); return; }
  if (!document.getElementById('agsemexp')) strip.insertAdjacentHTML('beforeend', '<div id="agsemexp" class="agsemexp"></div>');
  if (!document.getElementById('agcuerpo')) return;
  const data = await weekData();
  const box = document.getElementById('agsemexp');
  if (!box || !stripState.weekOpen()) return;
  box.innerHTML = weekHtml(data);
  bind(box, data);
}

/** Paints the open week once its data is preloaded (hidden until painted the first time, so it does not appear empty). */
export function paintOpenWeek(): Promise<void> {
  const paint = async (): Promise<void> => {
    const strip = document.getElementById('agcinta');
    if (!legacyAgenda.isDayView() || !strip || !stripState.weekOpen() || document.getElementById('agsemexp')) { await render(); return; }
    strip.insertAdjacentHTML('beforeend', '<div id="agsemexp" class="agsemexp" style="display:none"></div>');
    try { await render(); } finally { const box = document.getElementById('agsemexp'); if (box) box.style.display = ''; }
  };
  return legacyAgenda.isDayView() ? withData(stripState.weekOpen() ? weekLoads(legacyAgenda.selectedDate()) : [], paint) : paint();
}
