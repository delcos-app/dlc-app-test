/**
 * The old «Administración» page and its sections (legado 004, v2.424.0): users with their actions, commissions, accesses and the
 * audit log; the [data-cs]/[data-as] buttons change the section of Configuración or Administración. cargarAdminBase stays as an
 * adapter (legado 080 wraps it as cargarAdmin).
 */
import { legacyDb, term } from '../../legacy/bridge';
import { adminLegacy, type AdminUser } from '../../legacy/legado-a-bridge';
import { t } from '../../i18n';
import { escapeHtml, formatNumber } from '../../services/format';

const box = (): HTMLElement => document.getElementById('admcuerpo') ?? document.createElement('div');

function headerHtml(section: string): string {
  const tab = (key: string, label: string): string => `<button data-as="${key}" aria-pressed="${String(section === key)}">${label}</button>`;
  return `
    <div class="saludo"><div><h1>${t('legacyA.admin.title')}</h1><div class="fecha">${t('legacyA.admin.subtitle')}</div></div>
      <div class="acts u-m-0">${section === 'usuarios' ? `<button class="btn" id="unuevo">${t('legacyA.admin.newUser')}</button>` : ''}</div></div>
    <div class="subnav">
      ${tab('usuarios', t('legacyA.admin.users'))}
      ${tab('comisiones', t('legacyA.admin.commissions'))}
      ${tab('accesos', t('legacyA.admin.accesses'))}
      ${tab('auditoria', t('legacyA.admin.audit'))}</div>
    <div class="card" id="admcuerpo"><div class="skel"></div><div class="skel" style="width:60%"></div></div>`;
}

function userRow(user: AdminUser): string {
  const details = `${escapeHtml(user.rol)} · ${escapeHtml(user.email ?? '')} · ${formatNumber(user.medicos)} ${term('medico', { number: 'p' })} · ${formatNumber(user.visitas)} ${term('visita', { number: 'p' })}`;
  return `<div class="item u-cursor-default">
      <span class="ic">${escapeHtml(adminLegacy.initials(user.nombre))}</span>
      <span class="tx"><b>${escapeHtml(user.nombre)}${user.activo ? '' : ` <span class="sm">${t('legacyA.admin.deactivated')}</span>`}</b>
        <span class="sm">${details}</span></span>
      <span class="acts u-m-0">
        <button class="btn sec" data-uedit="${user.id}">${t('legacyA.admin.edit')}</button>
        <button class="btn sec" data-uver="${user.id}">${t('legacyA.admin.seePortfolio')}</button>
        <button class="btn sec" data-ucart="${user.id}">${t('legacyA.admin.assign')}</button>
        <button class="btn sec" data-upass="${user.id}">${t('legacyA.admin.password')}</button>
        ${adminLegacy.canImpersonate(user) ? `<button class="btn sec" data-ucomo="${user.id}" title="${t('legacyA.admin.impersonateHint')}">${t('legacyA.admin.impersonate')}</button>` : ''}</span></div>`;
}

function bindUsers(): void {
  const each = (attribute: string, action: (id: string) => void): void => {
    box().querySelectorAll<HTMLElement>(`[data-${attribute}]`).forEach(button => { button.onclick = (): void => { action(button.getAttribute(`data-${attribute}`) ?? ''); }; });
  };
  each('uedit', id => { adminLegacy.editUser(id); });
  each('ucart', id => { adminLegacy.assignPortfolio(id); });
  each('uver', id => { adminLegacy.showPortfolio(id); });
  each('upass', id => { adminLegacy.resetPassword(adminLegacy.users().find(user => user.id === id) ?? {}); });
}

/** Paints Administración on its section (users by default). */
export async function loadAdmin(): Promise<void> {
  const view = document.getElementById('v-admin'), section = adminLegacy.section();
  if (view) view.innerHTML = headerHtml(section);
  const others: Readonly<Record<string, () => void>> = { comisiones: adminLegacy.paintCommissions, accesos: adminLegacy.paintAccesses, auditoria: adminLegacy.paintAudit };
  const other = others[section];
  if (other) { other(); return; }
  const add = document.getElementById('unuevo'); if (add) add.onclick = (): void => { adminLegacy.newUser(); };
  const { data, error } = await legacyDb().rpc<AdminUser[]>('usuarios_lista');
  if (error) { box().innerHTML = `<div class="vacio">${t('legacyA.admin.couldNotLoad', { error: escapeHtml((error as { message?: string }).message ?? '') })}</div>`; return; }
  const users = data ?? [];
  adminLegacy.setUsers(users);
  box().innerHTML = `<h2>${t('legacyA.admin.users')}<span class="n">${users.length}</span></h2>
    <div class="lista">${users.map(userRow).join('')}</div>`;
  bindUsers();
}

/** The [data-cs] and [data-as] buttons change the section of Configuración or Administración. */
export function listenToSectionButtons(): void {
  document.addEventListener('click', event => {
    const target = event.target as Element;
    const settingsButton = target.closest<HTMLElement>('[data-cs]');
    if (settingsButton) adminLegacy.openSettingsSection(settingsButton.dataset.cs ?? '');
    const adminButton = target.closest<HTMLElement>('[data-as]');
    if (adminButton) adminLegacy.openAdminSection(adminButton.dataset.as ?? '');
  });
}
