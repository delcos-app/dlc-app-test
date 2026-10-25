/**
 * Panel delcos → Cobros y suscripciones: who pays, who is in trial, what each pays a month and what needs attention (unpaid,
 * blocked, leaving at the end of the period, planned changes, commitments). Migrated from the legacy pintarCobrosDelcos (v2.413.0).
 */
import { callRpc } from '../../legacy/bridge';
import { platformLegacy } from '../../legacy/platform-bridge';
import { t, type MessageKey } from '../../i18n';
import { escapeHtml } from '../../services/format';
import { sum } from '../../services/values';
import { errorMessage, type Organization, panelBox, type PlanData, planOf, stillOnTab } from './model';

interface Row { organization: Organization; plan: PlanData; state: [string, string, string] }

const UP_TO_DATE = 'Al día', TRIAL = 'En prueba', UNPAID = 'Impago', BLOCKED = 'Bloqueada';
const FILTERS: readonly (readonly [string, MessageKey])[] = [['todas', 'platform.billing.all'], ['atencion', 'platform.billing.attention'], [UP_TO_DATE, 'platform.billing.upToDate'], [TRIAL, 'platform.billing.trial'], [UNPAID, 'platform.billing.unpaid']];

const stripeUrl = (id: string): string => `https://dashboard.stripe.com/${platformLegacy.isTestEnvironment() ? 'test/' : ''}customers/${encodeURIComponent(id)}`;

function shownIn(filter: string, row: Row): boolean {
  if (filter === 'todas') return true;
  if (filter === 'atencion') return [UNPAID, BLOCKED].includes(row.state[0]) || Boolean(row.plan.baja_al_final) || Boolean(row.plan.cambio_previsto);
  return row.state[0] === filter;
}

function notes(plan: PlanData): string[] {
  const change = plan.cambio_previsto;
  const planned = change ? t('platform.billing.planned', { plan: platformLegacy.planName(change.plan ?? plan.plan) }) + (change.usuarios ? t('platform.billing.plannedUsers', { users: change.usuarios }) : '')
    + (change.desde ? t('platform.billing.plannedOn', { date: platformLegacy.shortDate(change.desde) }) : '') : '';
  return [plan.baja_al_final ? t('platform.billing.leaving') : '', planned, plan.compromiso_hasta ? t('platform.billing.commitment', { date: platformLegacy.shortDate(plan.compromiso_hasta) }) : ''].filter(Boolean);
}

function rowHtml({ organization, plan, state }: Row): string {
  const monthly = platformLegacy.monthlyAmount(plan), users = plan.plan === 'medida' ? '' : (plan.usuarios ? t('platform.billing.hired', { count: plan.usuarios }) : '') + t(plan.pago === 'anual' ? 'platform.billing.yearly' : 'platform.billing.monthly');
  return `<tr><td><b>${escapeHtml(organization.nombre)}</b><div class="sm">${t('platform.billing.activeUsers', { count: organization.usuarios })}${plan.origen === 'web' ? t('platform.billing.fromWeb') : ''}</div></td>
          <td>${escapeHtml(platformLegacy.planName(plan.plan))}<div class="sm">${users}</div></td>
          <td><span class="pill ${state[1]}">${state[0]}</span><div class="sm">${escapeHtml(state[2])}</div></td>
          <td class="num">${monthly ? platformLegacy.euros(monthly) : '—'}</td>
          <td>${notes(plan).map(note => `<div class="sm">${escapeHtml(note)}</div>`).join('') || '<span class="sm">—</span>'}</td>
          <td>${plan.stripe_cliente ? `<a class="btn sec" href="${stripeUrl(plan.stripe_cliente)}" target="_blank" rel="noopener">${t('platform.billing.seeInStripe')}</a>` : ''}</td></tr>`;
}

function paintRows(rows: readonly Row[], filter: string): void {
  const box = document.getElementById('pdcobl'); if (!box) return;
  const shown = rows.filter(row => shownIn(filter, row));
  const head = ['company', 'plan', 'state', 'perMonth', 'pending'].map(key => `<th>${t(`platform.billing.${key}` as MessageKey)}</th>`).join('');
  box.innerHTML = shown.length ? `<div class="tablawrap"><table class="pdtabla"><thead><tr>${head}<th></th></tr></thead><tbody>
      ${shown.map(rowHtml).join('')}</tbody></table></div>` : `<div class="vacio">${t('platform.billing.empty')}</div>`;
}

function pageHtml(rows: readonly Row[], error: unknown): string {
  const count = (state: string): number => rows.filter(row => row.state[0] === state).length;
  const income = sum(rows.filter(row => row.state[0] === UP_TO_DATE).map(row => platformLegacy.monthlyAmount(row.plan)));
  const figures: [string | number, string, string?][] = [[count(UP_TO_DATE), t('platform.billing.kpiUpToDate')], [count(TRIAL), t('platform.billing.kpiTrial')],
    [count(UNPAID), t('platform.billing.kpiUnpaid'), count(UNPAID) ? 'mal' : ''], [rows.filter(row => row.plan.baja_al_final).length, t('platform.billing.kpiLeaving')],
    [platformLegacy.euros(income), t('platform.billing.kpiIncome')]];
  return `<div class="card cfgpanel">
    ${error ? `<div class="banda-peligro">${t('platform.billing.couldNotRead', { error: escapeHtml(errorMessage(error)) })}</div>` : ''}
    ${platformLegacy.kpis(figures)}
    <div class="segs" id="pdcobf">${FILTERS.map(([key, label]) => `<button type="button" data-pdf="${escapeHtml(key)}" class="${key === 'todas' ? 'on' : ''}">${t(label)}</button>`).join('')}</div>
    <div id="pdcobl"></div>
    <p class="sm">${t('platform.billing.footer')}</p></div>`;
}

export async function paintBilling(): Promise<void> {
  const start = panelBox(); if (!start) return;
  start.innerHTML = platformLegacy.skeleton();
  const { data, error } = await callRpc<Organization[]>('organizaciones_lista', {});
  if (!stillOnTab('cobros')) return;
  const box = panelBox(); if (!box) return;
  const rows: Row[] = (error ? [] : data ?? []).map(organization => ({ organization, plan: planOf(organization), state: platformLegacy.billingState(organization) }));
  box.innerHTML = pageHtml(rows, error);
  box.querySelectorAll<HTMLElement>('[data-pdf]').forEach(button => {
    button.onclick = (): void => { box.querySelectorAll('[data-pdf]').forEach(other => { other.classList.toggle('on', other === button); }); paintRows(rows, button.dataset.pdf ?? 'todas'); };
  });
  paintRows(rows, 'todas');
}
