/**
 * Panel delcos → Altas: companies signed up from www.delcos.app, completed (with their company and whether they have entered) and
 * half done (they started paying and did not finish). Migrated from the legacy pintarAltasDelcos (v2.413.0).
 */
import { callRpc } from '../../legacy/bridge';
import { platformLegacy } from '../../legacy/platform-bridge';
import { t } from '../../i18n';
import { escapeHtml } from '../../services/format';
import { nonZeroOr, orFallback } from '../../services/values';
import { errorMessage, panelBox, stillOnTab } from './model';

const COMPLETED = 'completada', WEEK_MS = 7 * 864e5, DEFAULT_USERS = 3;

interface Signup {
  estado: string; entro?: boolean; creado_en: string; invitado_en?: string | null; organizacion?: string | null;
  datos?: { empresa?: string; plan?: string; usuarios?: number; pago?: string; nombre?: string; email?: string; telefono?: string; nif?: string } | null;
}

function stateOf(signup: Signup): [string, string, string] {
  if (signup.estado !== COMPLETED) return [t('platform.signups.half'), 'p-warn', t('platform.signups.halfText', { ago: platformLegacy.timeAgo(signup.creado_en) })];
  if (signup.entro) return [t('platform.signups.inside'), 'p-est', t('platform.signups.insideText')];
  return [t('platform.signups.invited'), 'p-per', signup.invitado_en ? t('platform.signups.invitedText', { ago: platformLegacy.timeAgo(signup.invitado_en) }) : t('platform.signups.noInvitation')];
}

function contactHtml(data: NonNullable<Signup['datos']>): string {
  return escapeHtml(data.nombre ?? '') + (data.email ? ` · <a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a>` : '')
    + (data.telefono ? ` · <a href="tel:${escapeHtml(data.telefono)}">${escapeHtml(data.telefono)}</a>` : '') + (data.nif ? ` · ${escapeHtml(data.nif)}` : '');
}

function rowHtml(signup: Signup): string {
  const data = signup.datos ?? {}, [label, pill, text] = stateOf(signup);
  const plan = t('platform.signups.plan', { plan: platformLegacy.planName(data.plan), users: nonZeroOr(data.usuarios, DEFAULT_USERS), payment: t(data.pago === 'anual' ? 'platform.billing.yearly' : 'platform.billing.monthly') });
  return `<div class="pdalta"><div class="pdaltacab"><b>${escapeHtml(orFallback(orFallback(signup.organizacion, data.empresa ?? ''), t('platform.signups.noName')))}</b> <span class="pill ${pill}">${label}</span>
        <span class="pill p-per">${escapeHtml(plan)}</span></div>
      <div class="sm">${contactHtml(data)}</div>
      <div class="sm">${escapeHtml(text)} · ${t('platform.signups.started', { date: platformLegacy.shortDate(signup.creado_en) })}</div></div>`;
}

function pageHtml(list: readonly Signup[], error: unknown): string {
  const done = list.filter(signup => signup.estado === COMPLETED), half = list.filter(signup => signup.estado !== COMPLETED);
  const week = list.filter(signup => Date.now() - new Date(signup.creado_en).getTime() < WEEK_MS);
  const figures: [string | number, string, string?][] = [[done.length, t('platform.signups.kpiDone')], [done.filter(signup => signup.entro).length, t('platform.signups.kpiInside')],
    [half.length, t('platform.signups.kpiHalf'), half.length ? 'aviso' : ''], [week.length, t('platform.signups.kpiWeek')]];
  return `<div class="card cfgpanel">
    ${error ? `<div class="banda-peligro">${t('platform.billing.couldNotRead', { error: escapeHtml(errorMessage(error)) })}</div>` : ''}
    ${platformLegacy.kpis(figures)}
    ${half.length ? `<h3 class="pdh3">${t('platform.signups.half')}</h3><p class="sm">${t('platform.signups.halfHelp')}</p>${half.map(rowHtml).join('')}` : ''}
    <h3 class="pdh3">${t('platform.signups.completed')}</h3>${done.map(rowHtml).join('') || `<div class="vacio">${t('platform.signups.none')}</div>`}</div>`;
}

export async function paintSignups(): Promise<void> {
  const start = panelBox(); if (!start) return;
  start.innerHTML = platformLegacy.skeleton();
  const { data, error } = await callRpc<Signup[]>('altas_lista', {});
  if (!stillOnTab('altas')) return;
  const box = panelBox(); if (box) box.innerHTML = pageHtml(error ? [] : data ?? [], error);
}
