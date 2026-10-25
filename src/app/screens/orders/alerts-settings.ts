/**
 * «Avisos de pedidos» (the gear of the Pedidos alerts): which alerts each person sees and, for administration, which are mandatory
 * for each role. Migrated from the legacy configurarAvisosPedidos (v2.414.0); the name stays as an adapter (legado 073 opens it).
 */
import { cardSectionsLegacy, legacyDb, notices } from '../../legacy/bridge';
import { orderMailLegacy, ordersLegacy } from '../../legacy/orders-bridge';
import { t, type MessageKey } from '../../i18n';
import { escapeHtml } from '../../services/format';

/** The alerts: [key, label, icon]. */
const ALERTS: readonly (readonly [string, MessageKey, string])[] = [
  ['pago', 'orders.alerts.toCollect', '💳'], ['paquete', 'orders.alerts.toPack', '📦'], ['email_factura', 'orders.alerts.invoicesToSend', '🧾'], ['email_pago', 'orders.alerts.paymentToSend', '✉️'],
];
const PORTAL_ROLE_CAPABILITY = 'portal_prescriptor';

type Mandatory = Record<string, string[]>;

function ownHtml(mandatory: readonly string[], preferences: Record<string, boolean>): string {
  return `<div class="lista">${ALERTS.map(([key, label, icon]) => `<label class="item u-cursor-default"><input type="checkbox" data-avp="${key}" ${mandatory.includes(key) || preferences[key] !== false ? 'checked' : ''} ${mandatory.includes(key) ? 'disabled' : ''}>
        <span class="tx"><b>${icon} ${t(label)}</b>${mandatory.includes(key) ? `<span class="sm">${t('orders.alerts.mandatoryForRole')}</span>` : ''}</span></label>`).join('')}</div>`;
}

function rolesHtml(fixed: Mandatory, roles: readonly string[]): string {
  return `<h3 style="margin:14px 0 4px">${t('orders.alerts.byRole')}</h3><p class="sm">${t('orders.alerts.byRoleHint')}</p>
      <div class="dgrid-wrap"><table class="tabla avrol"><thead><tr><th>${t('orders.alerts.role')}</th>${ALERTS.map(([, label]) => `<th>${t(label)}</th>`).join('')}</tr></thead>
        <tbody>${roles.map(role => `<tr><td>${escapeHtml(role)}</td>${ALERTS.map(([key]) => `<td style="text-align:center"><input type="checkbox" data-avr="${escapeHtml(role)}|${key}" ${(fixed[role] ?? []).includes(key) ? 'checked' : ''} aria-label="${t('orders.alerts.mandatoryLabel', { role: escapeHtml(role) })}"></td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

async function save(body: HTMLElement, admin: boolean): Promise<void> {
  const own: Record<string, boolean> = {};
  body.querySelectorAll<HTMLInputElement>('[data-avp]').forEach(box => { if (!box.disabled) own[box.dataset.avp ?? ''] = box.checked; });
  if (!await orderMailLegacy.saveAlertPreferences(own)) return;
  if (admin) {
    const mandatory: Mandatory = {};
    body.querySelectorAll<HTMLInputElement>('[data-avr]:checked').forEach(box => { const [role = '', key = ''] = (box.dataset.avr ?? '').split('|'); (mandatory[role] ??= []).push(key); });
    const { data: result, error } = await legacyDb().rpc<{ ok?: boolean }>('guardar_ajuste', { p_clave: 'avisos_pedidos', p_valor: { obligatorios: mandatory } });
    if (error || result?.ok === false) { notices.toast(t('orders.alerts.couldNotSaveMandatory'), true); return; }
  }
  (document.getElementById('dlg') as HTMLDialogElement | null)?.close(); notices.toast(t('orders.alerts.saved')); ordersLegacy.paintOperations();
}

/** Opens the window; `mandatory` are the alerts the user's role cannot hide. */
export async function configureAlerts(mandatory: readonly string[]): Promise<void> {
  const preferences = orderMailLegacy.alertPreferences(), admin = cardSectionsLegacy.can('administrar');
  const { data: settings } = admin ? await legacyDb().from<{ valor?: { obligatorios?: Mandatory } | null }>('ajustes').select('valor').eq('clave', 'avisos_pedidos').maybeSingle() : { data: null };
  const fixed = settings?.valor?.obligatorios ?? {}, roles = admin ? orderMailLegacy.roleNames().filter(role => !cardSectionsLegacy.roleCan(role, PORTAL_ROLE_CAPABILITY)) : [];
  const body = document.getElementById('dbody'), box = document.getElementById('dlg') as HTMLDialogElement | null;
  if (!body || !box) return;
  body.innerHTML = `<div class="fh"><div><h2>${t('orders.alerts.title')}</h2><div class="sm">${t('orders.alerts.subtitle')}</div></div>
      <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
    ${ownHtml(mandatory, preferences)}
    ${admin ? rolesHtml(fixed, roles) : ''}
    <div class="acts u-end"><button class="btn sec" data-cerrar>${t('common.cancel')}</button><button class="btn" id="avpok">${t('common.save')}</button></div>`;
  box.showModal();
  const ok = document.getElementById('avpok'); if (ok) ok.onclick = (): void => { void save(body, admin); };
}
