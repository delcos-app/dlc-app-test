/**
 * The professional portal home, second part: «Mi semana», «Ventas del mes» (against the same days of last month), «Alertas» and,
 * for who sees the whole team, «Equipo esta semana». Migrated from the legacy inicioResumenSemanaYVentas (v2.417.0).
 */
import { agendaActions, agendaState, appLegacy, appointments, callRpc, currentScreen, goTo, legacyDb, permissions, portalLegacy, qualityLegacy, salesTeam, term } from '../../../legacy/bridge';
import { miscLegacy } from '../../../legacy/misc-bridge';
import { cardSkeleton } from '../../../components';
import { t } from '../../../i18n';
import { addDays, fromIsoDate, mondayOf, todayIso, toIsoDate } from '../../../services/dates';
import { formatNumber } from '../../../services/format';
import { sum } from '../../../services/values';
import { alertsHtml, type Alert } from './alerts';

interface Totals { unidades?: number | string; importe?: number | string; medicos?: number | string }
interface WeekAppointment { fecha: string; estado: string }
type TeamRow = Record<string, number | string | undefined>;
interface WeekData { week: WeekAppointment[]; now: Totals; before: Totals; alerts: Alert[]; team: TeamRow[]; due: number }

const VISITED = 'Visitada', DISCARDED = 'Descartada', LOW_COMPLIANCE = 60, DUE_LIMIT = 300, CROSS_DAYS = 30, PLAN_WAIT_MS = 900;
const TEAM_KEYS = ['visitadas', 'no_estaba', 'aplazadas', 'sin_hacer', 'atrasados'];

/** The first day of last month and the same day of the month as today (or its last day). */
function lastMonth(today: string): { from: string; to: string } {
  const monthStart = `${today.slice(0, 8)}01`, previous = fromIsoDate(monthStart);
  previous.setMonth(previous.getMonth() - 1);
  const from = toIsoDate(previous), end = addDays(monthStart, -1), sameDay = addDays(from, Number(today.slice(8, 10)) - 1);
  return { from, to: sameDay > end ? end : sameDay };
}

const rows = <T>(answer: { data: T[] | null }): T[] => answer.data ?? [];

async function crossAlerts(): Promise<Alert[]> {
  const [cross, stock] = await Promise.all([legacyDb().rpc<Alert[]>('alertas_cruce', { p_dias: CROSS_DAYS }),
    miscLegacy.canBuy() || permissions.seesEverything() ? legacyDb().rpc<Alert[]>('alertas_stock') : Promise.resolve({ data: [] as Alert[] })]);
  return [...rows(cross), ...rows(stock)];
}

async function loadWeek(): Promise<WeekData> {
  const isTop = permissions.seesEverything(), today = todayIso(), monday = mondayOf(today), previous = lastMonth(today), me = salesTeam.currentUserId();
  const totals = (from: string, to: string): Promise<Totals> => Promise.resolve(legacyDb().rpc<{ totales?: Totals }>('analitica_v2', { p_dim: 'producto', p_desde: from, p_hasta: to }).then(answer => answer.data?.totales ?? {}));
  const [week, now, before, mine, cross, team, due] = await Promise.all([
    callRpc<WeekAppointment[]>('agenda_rango', { p_desde: monday, p_hasta: addDays(monday, 6), p_usuario: me }).then(rows),
    totals(`${today.slice(0, 8)}01`, today), totals(previous.from, previous.to),
    legacyDb().rpc<Alert[]>('alertas_mias').then(rows),
    isTop ? crossAlerts() : Promise.resolve([]),
    isTop ? legacyDb().rpc<TeamRow[]>('supervision_equipo', { p_desde: monday, p_hasta: addDays(monday, 6) }).then(rows) : Promise.resolve([]),
    legacyDb().rpc<unknown[]>('toca_actividad', { p_usuario: me, lim: DUE_LIMIT }).then(answer => (answer.data ?? []).length),
  ]);
  return { week, now, before, alerts: [...cross.map(alert => ({ equipo: true, ...alert })), ...mine], team, due };
}

const delta = (now: number, before: number): string => (!before ? ''
  : `<span class="delta ${now >= before ? 'up' : 'down'}">${now >= before ? '▲' : '▼'} ${Math.abs(Math.round((now - before) / before * 100))}%</span>`);
const warn = (on: boolean): string => (on ? 'color:var(--warn)' : '');
const mini = (value: string, label: string, style = ''): string => `<div><b${style ? ` style="${style}"` : ''}>${value}</b><span>${label}</span></div>`;

function myWeekHtml(data: WeekData): string {
  const today = todayIso(), past = data.week.filter(item => item.fecha < today && item.estado !== DISCARDED);
  const compliance = past.length ? Math.round(past.filter(item => item.estado === VISITED).length / past.length * 100) : null;
  const visited = data.week.filter(item => item.estado === VISITED).length, open = data.week.filter(item => appointments.isOpen(item.estado) && item.fecha >= today).length;
  return `<div class="card"><h2>${t('homeMore.week.myWeek')}</h2>
      <div class="minis">${mini(formatNumber(visited), t('homeMore.week.visited'))}${mini(formatNumber(open), t('homeMore.week.toDo'))}
        ${mini(compliance === null ? '—' : `${compliance}%`, t('homeMore.week.compliance'), warn(compliance !== null && compliance < LOW_COMPLIANCE))}
        ${mini(formatNumber(data.due), t('homeMore.week.due', { visit: term('visita') }), warn(data.due > 0))}</div>
      <div class="acts" style="padding:0 16px 14px"><button class="btn sec" data-inisem="semana">${t('homeMore.week.seeMyWeek')}</button>${data.due ? `<button class="btn sec" data-inisem="plan">${t('homeMore.week.planThem')}</button>` : ''}</div></div>`;
}

function salesHtml(data: WeekData): string {
  const units = Number(data.now.unidades ?? 0), unitsBefore = Number(data.before.unidades ?? 0), amount = Number(data.now.importe ?? 0);
  return `<div class="card"><h2>${t('homeMore.week.salesOfMonth')}</h2>
      <div class="minis">${mini(formatNumber(units), `${t('homeMore.week.units')} ${delta(units, unitsBefore)}`)}
        ${permissions.canSeeAmounts() ? mini(portalLegacy.euros(amount), `${t('homeMore.week.withoutVat')} ${delta(amount, Number(data.before.importe ?? 0))}`) : ''}
        ${mini(formatNumber(data.now.medicos ?? 0), t('homeMore.week.withSales', { professionals: term('medico', { number: 'p' }) }))}</div>
      <p class="sm" style="padding:0 16px 14px">${t('homeMore.week.compared', { units: formatNumber(unitsBefore) })}</p></div>`;
}

function teamHtml(team: readonly TeamRow[]): string {
  const total = (key: string): number => sum(team.map(row => Number(row[key]) || 0));
  const totals = Object.fromEntries(TEAM_KEYS.map(key => [key, total(key)])) as Record<string, number>;
  const base = sum(['visitadas', 'no_estaba', 'aplazadas', 'sin_hacer'].map(key => totals[key] ?? 0));
  const value = (key: string): number => totals[key] ?? 0;
  return `<div class="card"><h2>${t('homeMore.week.teamThisWeek')}</h2>
      <div class="minis">${mini(base ? `${Math.round(value('visitadas') / base * 100)}%` : '—', t('homeMore.week.compliance'))}
        ${mini(formatNumber(value('visitadas')), t('homeMore.week.visited'))}
        ${mini(formatNumber(value('sin_hacer')), t('homeMore.week.notDone'), warn(value('sin_hacer') > 0))}
        ${mini(formatNumber(value('atrasados')), t('homeMore.week.dueShort'), warn(value('atrasados') > 0))}</div>
      <div class="acts" style="padding:0 16px 14px"><button class="btn sec" id="iniequipo">${t('homeMore.week.seeTeam')}</button></div></div>`;
}

function bind(box: HTMLElement): void {
  const each = (attribute: string, action: (button: HTMLElement) => void): void => { box.querySelectorAll<HTMLElement>(`[${attribute}]`).forEach(button => { button.onclick = (): void => { action(button); }; }); };
  each('data-inificha', button => { agendaActions.openAccount(button.dataset.inificha ?? ''); });
  each('data-iniped', button => { appLegacy.openOrder(button.dataset.iniped ?? ''); });
  each('data-inistock', () => { miscLegacy.openStock(); });
  each('data-inicomp', button => { miscLegacy.openPurchase(button.dataset.inicomp ?? ''); });
  each('data-inisem', button => {
    agendaState.setMode('semana'); agendaState.setSelectedDate(todayIso()); goTo('agenda');
    if (button.dataset.inisem === 'plan') setTimeout(() => { document.getElementById('semplan')?.click(); }, PLAN_WAIT_MS);
  });
  const team = document.getElementById('iniequipo'); if (team) team.onclick = (): void => { agendaState.setMode('equipo'); goTo('agenda'); };
}

/** Paints the four cards under the indicators (each one with its skeleton until the data arrives). */
export async function paintWeekAndSales(): Promise<void> {
  if (currentScreen() !== 'inicio') return;
  if (!document.getElementById('iniextra')) document.getElementById('kpis')?.insertAdjacentHTML('afterend', '<div class="iniextra" id="iniextra"></div>');
  const box = document.getElementById('iniextra'); if (!box) return;
  const isTop = permissions.seesEverything(), sales = qualityLegacy.canUseModule('ventas');
  const titles = [t('homeMore.week.myWeek'), ...(sales ? [t('homeMore.week.salesOfMonth')] : []), t('homeMore.week.alerts'), ...(isTop ? [t('homeMore.week.teamThisWeek')] : [])];
  box.innerHTML = titles.map(title => `<div class="card">${cardSkeleton(title)}</div>`).join('');
  const data = await loadWeek();
  const current = document.getElementById('iniextra');
  if (currentScreen() !== 'inicio' || !current) return;
  current.innerHTML = `
    ${myWeekHtml(data)}
    ${sales ? salesHtml(data) : ''}
    ${alertsHtml(data.alerts)}
    ${isTop ? teamHtml(data.team) : ''}`;
  bind(current);
}
