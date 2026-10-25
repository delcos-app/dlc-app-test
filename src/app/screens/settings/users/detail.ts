/**
 * A user's window in Usuarios: what they may see and do in each module, their activity and the actions (edit, portfolio, access
 * data, password, activation email, impersonate, delete). Migrated from the legacy detalleUsuario (v2.420.0); detalleUsuario stays
 * as an adapter (the tests use it).
 */
import { accessLegacy, accountListLegacy, cardSectionsLegacy, icon, initialsOf } from '../../../legacy/bridge';
import { settingsLegacy } from '../../../legacy/settings1-bridge';
import { usersLegacy, type UserRow } from '../../../legacy/settings4-bridge';
import { t, type MessageKey } from '../../../i18n';
import { escapeHtml, formatNumber } from '../../../services/format';
import { resendActivation, resetPassword } from '../../access';
import { connectionText } from '../more/access-log';
import { showTemporaryAccess } from './access';
import { editUser } from './editor';
import { dialog, dialogBody, isPrescriber, words } from './model';
import { deleteUser } from './remove';

const MODULE_ORDER = ['inicio', 'agenda', 'rutas', 'directorio', 'ventas', 'pacientes', 'productos', 'facturacion', 'analitica', 'seguimiento'];
const FULL_LEVEL = 3;

const moduleName = (module: string): string =>
  (module === 'directorio' ? accountListLegacy.contactsLabel() : t(`settingsRest.detail.modules.${module}` as MessageKey));

function permissionsHtml(user: UserRow): string {
  const area = usersLegacy.moduleArea(), admin = usersLegacy.roleCan(user.rol, 'administrar');
  const level = (module: string): number => (admin ? FULL_LEVEL : Number(user.areas?.[area[module] ?? ''] ?? 0));
  const amounts = admin || Number(user.areas?.E ?? 0) >= 1;
  const rows = MODULE_ORDER.filter(module => module in area).map(module => {
    const value = level(module);
    return `<div class="permfila ${value ? '' : 'no'}">
        <span class="permmod">${icon(value ? 'check' : 'minus')}${escapeHtml(moduleName(module))}</span><span class="permniv nv${value}">${escapeHtml(usersLegacy.levelText(value))}</span></div>`;
  }).join('');
  return `<div class="blk"><h3>${t('settingsRest.detail.whatCanDo')}</h3>
      <div class="permtabla">${rows}</div>
      <div class="sm u-mt-8">${t(amounts ? 'settingsRest.detail.seesAmounts' : 'settingsRest.detail.unitsOnly')}</div></div>`;
}

function activityHtml(user: UserRow): string {
  const zones = (user.zonas ?? []).map(zone => zone.charAt(0) + zone.slice(1).toLowerCase()).join(', ');
  const counts = isPrescriber(user) ? `<p class="sm">${t('settingsRest.detail.linkedTo', { name: escapeHtml(user.medico ?? t('settingsRest.detail.noCardLinked')) })}</p>` : `
      <div class="uper" style="grid-template-columns:repeat(2,minmax(0,1fr))"><div><b>${formatNumber(user.cartera)}</b><span>${t('settingsRest.users.inPortfolio')}</span></div><div><b>${formatNumber(user.visitas_mes)}</b><span>${t('settingsRest.detail.visitsThisMonth', words())}</span></div></div>
      ${zones ? `<div class="sm">${escapeHtml(t('settingsRest.detail.zone', { zones }))}</div>` : ''}`;
  const connection = cardSectionsLegacy.can('administrar') ? `${escapeHtml(connectionText(usersLegacy.connections()[user.id], true))}<br>` : '';
  const when = user.ultima_actividad ? new Date(user.ultima_actividad).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' }) : t('settingsRest.detail.noneRecorded');
  return `<div class="blk"><h3>${t('settingsRest.detail.activity')}</h3>${counts}
      <div class="sm u-mt-6">${connection}${t('settingsRest.detail.lastActivity', { when })}</div></div>`;
}

function actionsHtml(user: UserRow): string {
  const admin = cardSectionsLegacy.can('administrar'), notMe = user.id !== settingsLegacy.user().id;
  const impersonate = accessLegacy.canImpersonate(user) ? `<button class="btn${usersLegacy.isGuest(user) ? '' : ' sec'}" data-uacc="como">${t('settingsRest.users.impersonate')}</button>` : '';
  return `<div class="usracc">
      <button class="btn" data-uacc="editar">${t('settingsRest.detail.edit')}</button>
      ${isPrescriber(user) ? '' : `<button class="btn sec" data-uacc="cartera">${t('settingsRest.detail.assignPortfolio')}</button>`}
      ${admin && notMe ? `<button class="btn sec" data-uacc="acceso">${t('settingsRest.detail.accessData')}</button>` : ''}
      <button class="btn sec" data-uacc="pass">${t('settingsRest.detail.sendPassword')}</button>
      <button class="btn sec" data-uacc="activar">${t('settingsRest.detail.resendActivation')}</button>
      ${impersonate}
      ${admin && notMe ? `<button class="btn sec dang" data-uacc="borrar">${t('settingsRest.detail.deleteUser')}</button>` : ''}</div>`;
}

const closeAnd = (action: () => void): void => { dialog()?.close(); action(); };

function actionFor(user: UserRow, action: string): void {
  const actions = new Map<string, () => void>([
    ['editar', (): void => { void editUser(user.id); }],
    ['cartera', (): void => { closeAnd(() => { usersLegacy.assignPortfolio(user.id); }); }],
    ['pass', (): void => { closeAnd(() => { void resetPassword(user); }); }],
    ['activar', (): void => { void resendActivation(user.email); }],
    ['acceso', (): void => { void showTemporaryAccess(user); }],
    ['como', (): void => { closeAnd(() => { usersLegacy.impersonate(user.id); }); }],
    ['borrar', (): void => { closeAnd(() => { deleteUser(user); }); }],
  ]);
  actions.get(action)?.();
}

export function showUser(user: UserRow): void {
  const body = dialogBody(); if (!body) return;
  body.innerHTML = `<div class="fh"><div class="usrcab"><span class="usrav grande">${escapeHtml(initialsOf(user.nombre))}</span>
      <div><h2>${escapeHtml(user.nombre)}</h2><div class="sm">${escapeHtml(user.email ?? '')}</div>
        <div class="usrchips"><span class="pill p-est">${escapeHtml(user.rol)}</span>${user.activo ? '' : `<span class="pill p-anu">${t('settingsRest.users.deactivated')}</span>`}</div></div></div>
    <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
    ${permissionsHtml(user)}
    ${activityHtml(user)}
    ${actionsHtml(user)}`;
  dialog()?.showModal();
  body.querySelectorAll<HTMLElement>('[data-uacc]').forEach(button => { button.onclick = (): void => { actionFor(user, button.dataset.uacc ?? ''); }; });
}
