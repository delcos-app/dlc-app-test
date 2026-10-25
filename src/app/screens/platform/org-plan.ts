/**
 * Panel delcos → Clientes → Plan: only the platform changes a company's plan (paid or trial with its end date, users, payment),
 * with the A medida commitment date, what it loses when going down and a warning when it pays through Stripe. Migrated from the
 * legacy orgAccionesBase and orgAccionesBase2 (v2.413.0).
 */
import { legacyDb, notices } from '../../legacy/bridge';
import { platformLegacy } from '../../legacy/platform-bridge';
import { t, type MessageKey } from '../../i18n';
import { formatShortDate } from '../../services/date-format';
import { addDays, todayIso } from '../../services/dates';
import { escapeHtml } from '../../services/format';
import { planOf, type Organization } from './model';

const MEDIDA = 'medida', TRIAL = 'prueba', TRIAL_DAYS = 30;
const field = (id: string): HTMLInputElement | null => document.getElementById(id) as HTMLInputElement | null;
const value = (id: string): string => field(id)?.value ?? '';

function formHtml(organization: Organization): string {
  const data = planOf(organization), current = data.plan ?? organization.plan, end = data.prueba_hasta ?? addDays(todayIso(), TRIAL_DAYS);
  const plans = platformLegacy.plans().map(plan => `<option value="${plan.id}" ${plan.id === current ? 'selected' : ''}>${escapeHtml(plan.nombre)}</option>`).join('');
  return `<div class="fh"><div><h2>${t('platform.plan.title', { name: escapeHtml(organization.nombre) })}</h2><div class="sm">${t('platform.plan.subtitle')}</div></div>
        <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
      <div class="g2"><div><label for="opplan">${t('platform.newOrg.plan')}</label><select id="opplan">${plans}</select></div>
        <div><label for="opusu">${t('platform.newOrg.users')}</label><input id="opusu" type="number" min="3" value="${escapeHtml(data.usuarios ?? '')}" placeholder="${t('platform.plan.noLimit')}"></div>
        <div><label for="oppago">${t('platform.newOrg.payment')}</label><select id="oppago"><option value="mensual">${t('platform.newOrg.monthly')}</option><option value="anual" ${data.pago === 'anual' ? 'selected' : ''}>${t('platform.newOrg.yearly')}</option></select></div>
        <div><label for="opest">${t('platform.plan.state')}</label><select id="opest"><option value="activo">${t('platform.plan.paid')}</option><option value="prueba" ${data.estado === TRIAL ? 'selected' : ''}>${t('platform.plan.trial')}</option></select></div>
        <div id="opfinw" class="${data.estado === TRIAL ? '' : 'hide'}"><label for="opfin">${t('platform.plan.trialUntil')}</label><input id="opfin" type="date" value="${escapeHtml(end)}"></div><div id="opcompw"><label for="opcomp">${t('platform.plan.commitment')}</label>
        <input id="opcomp" type="date" value="${escapeHtml(data.compromiso_hasta ?? '')}"><span class="sm">${t('platform.plan.commitmentHint')}</span></div></div>
      ${data.stripe_suscripcion ? `<div class="banda-aviso" id="opstripe">${t('platform.plan.stripe')}</div>` : ''}<div id="opperd"></div>
      <div class="acts u-end"><button class="btn sec" data-cerrar>${t('common.cancel')}</button><button class="btn" id="opok">${t('platform.plan.save')}</button></div>`;
}

/** A medida with a commitment still running cannot go down yet. */
const isCommitted = (data: ReturnType<typeof planOf>, from: string, to: string): boolean =>
  from === MEDIDA && to !== MEDIDA && Boolean(data.compromiso_hasta) && (data.compromiso_hasta ?? '') > todayIso();

/** The commitment field only for A medida, and what it would lose (or why it cannot go down yet). */
function paintLosses(organization: Organization): void {
  const data = planOf(organization), from = data.plan ?? organization.plan ?? '', to = value('opplan');
  field('opcompw')?.classList.toggle('hide', to !== MEDIDA);
  const box = document.getElementById('opperd'); if (!box) return;
  if (isCommitted(data, from, to)) { box.innerHTML = `<div class="banda-peligro">${t('platform.plan.committed', { date: formatShortDate(data.compromiso_hasta ?? '') })}</div>`; return; }
  const losses = platformLegacy.planLosses(from, to, { extras: data.extras ?? [], facturas: Number(organization.facturas) > 0 });
  box.innerHTML = platformLegacy.planRank(to) < platformLegacy.planRank(from) && losses.length
    ? `<div class="banda-aviso">${t('platform.plan.willLose', { plan: escapeHtml(platformLegacy.planName(to)) })}<ul>${losses.map(loss => `<li>${escapeHtml(loss)}</li>`).join('')}</ul></div>` : '';
}

const PLAN_ERRORS = new Map<string, MessageKey>([['permiso', 'platform.orgs.noPermission'], ['minimo', 'platform.plan.minimum'], ['prueba_hasta', 'platform.plan.noTrialEnd'], ['plan', 'platform.plan.invalid'], ['compromiso', 'platform.plan.committedUntil']]);

function payload(): Record<string, unknown> {
  const trial = value('opest') === TRIAL, plan = value('opplan');
  const result: Record<string, unknown> = { plan, usuarios: value('opusu') === '' ? null : Number(value('opusu')), pago: value('oppago'), estado: value('opest'), prueba_hasta: trial ? value('opfin') : null };
  if (plan === MEDIDA) result.compromiso_hasta = value('opcomp') || null;
  return result;
}

async function save(organization: Organization, button: HTMLButtonElement, repaint: () => Promise<void>): Promise<void> {
  button.disabled = true;
  const { data: result, error } = await legacyDb().rpc<{ ok?: boolean; error?: string; hasta?: string }>('guardar_plan_organizacion', { p_org: organization.id, p: payload() });
  button.disabled = false;
  if (error || !result?.ok) {
    const key = PLAN_ERRORS.get(result?.error ?? '');
    notices.toast(key ? t(key, { date: formatShortDate(result?.hasta ?? '') }) : t('platform.plan.couldNotSave'), true);
    return;
  }
  (document.getElementById('dlg') as HTMLDialogElement | null)?.close(); notices.toast(t('platform.plan.saved')); void repaint();
}

export function editPlan(organization: Organization, repaint: () => Promise<void>): void {
  const body = document.getElementById('dbody'), box = document.getElementById('dlg') as HTMLDialogElement | null;
  if (!body || !box) return;
  body.innerHTML = formHtml(organization);
  const state = field('opest'); if (state) state.onchange = (): void => { field('opfinw')?.classList.toggle('hide', value('opest') !== TRIAL); };
  field('opplan')?.addEventListener('change', () => { paintLosses(organization); });
  paintLosses(organization);
  const ok = document.getElementById('opok') as HTMLButtonElement | null; if (ok) ok.onclick = (): void => { void save(organization, ok, repaint); };
  box.showModal();
}
