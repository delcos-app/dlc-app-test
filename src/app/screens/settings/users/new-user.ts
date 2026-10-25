/**
 * New user: name, email, role and a temporary password. The plan's user limit is checked (portal roles do not count), a portal role
 * picks its professional from the directory and is linked to it, and the window ends with the access data to pass on. Migrated
 * from the legacy nuevoUsuario, nuevoUsuarioBase, nuevoUsuarioPlanYMedico and nuevoUsuarioResumen (v2.420.0): before, three layers
 * wrapped each other's «Crear usuario». nuevoUsuario stays as an adapter (legado 004, the account card and the tests use it).
 */
import { callRpc, currentScreen, editorLegacy, legacyDb, notices } from '../../../legacy/bridge';
import { planLegacy, usersLegacy } from '../../../legacy/settings4-bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { accessDataHtml, copyText, welcomeText } from './access';
import { dialog, dialogBody, input, isPrescriber, PRESCRIBER, roleOptions, valueOf, words } from './model';

const LINK_TRIES = 6, LINK_WAIT_MS = 700, MIN_PASSWORD = 6;

export interface NewUserPreset { medico?: PickedAccount | null; centro?: boolean; nombre?: string; email?: string }

interface Draft { nombre: string; email: string; pass: string; rol: string; medico: PickedAccount | null; linked: string | null }

const temporaryPassword = (): string => `Tmp-${Math.random().toString(36).slice(2, 8)}`;
const isPortalRole = (role: string): boolean => usersLegacy.roleCan(role, PRESCRIBER);
const message = (): HTMLElement | null => document.getElementById('nmsg');

function formHtml(): string {
  return `
    <div class="fh"><div><h2>${t('settingsRest.newUser.title')}</h2><div class="sm">${t('settingsRest.newUser.subtitle')}</div></div>
      <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
    <div class="g2">
      <div><label for="nn">${t('settingsRest.newUser.name')}</label><input id="nn" placeholder="${t('settingsRest.newUser.namePlaceholder')}"></div>
      <div><label for="ne">${t('settingsRest.newUser.email')}</label><input id="ne" type="email" placeholder="${t('settingsRest.newUser.emailPlaceholder')}"></div>
    </div>
    <div class="g2">
      <div><label for="nr">${t('settingsRest.newUser.role')}</label><select id="nr">${roleOptions(usersLegacy.defaultRole())}</select></div>
      <div><label for="np">${t('settingsRest.newUser.password')}</label><input id="np" value="${temporaryPassword()}"></div>
    </div>
    <div id="nmedw" class="hide"><label>${t('settingsRest.newUser.fromDirectory', words())}</label><div id="nmed"></div>
    <div class="sm u-mt-4">${t('settingsRest.newUser.directoryHint')}</div></div>
    <div class="acts u-end">
      <button class="btn sec" data-cerrar>${t('settingsRest.newUser.cancel')}</button>
      <button class="btn" id="ncrear">${t('settingsRest.newUser.create')}</button></div>
    <div id="nmsg" class="sm u-mt-10"></div>`;
}

/** The plan's limit and, for a portal role, the chosen professional. */
function allowed(draft: Draft): boolean {
  const plan = planLegacy.of(planLegacy.current().plan), max = planLegacy.contractedUsers();
  const active = usersLegacy.list().filter(user => user.activo && !isPrescriber(user)).length;
  if (!isPortalRole(draft.rol) && active >= max) { notices.toast(t('settingsRest.newUser.planLimit', { plan: plan.nombre, max }), true); return false; }
  if (isPortalRole(draft.rol) && !draft.medico) { notices.toast(t('settingsRest.newUser.chooseProfessional', words()), true); return false; }
  return true;
}

const showFailure = (key: 'couldNotInvite' | 'couldNotCreate', error: string): void => {
  const box = message(); if (box) box.innerHTML = `<span class="u-danger">${t(`settingsRest.newUser.${key}`, { error: escapeHtml(error) })}</span>`;
};

const ready = (button: HTMLButtonElement): void => { button.disabled = false; button.textContent = t('settingsRest.newUser.create'); };

/** v2.86.0: the invitation puts the person in your company with their role when they sign up. */
async function invite(draft: Draft): Promise<boolean> {
  const { data: invitation, error } = await legacyDb().rpc<{ ok?: boolean; error?: string }>('crear_invitacion', { p_email: draft.email, p_rol: draft.rol });
  if (!error && invitation?.ok) return true;
  showFailure('couldNotInvite', (error as { message?: string } | null)?.message ?? invitation?.error ?? '');
  return false;
}

/** A separate client keeps your session. */
async function create(draft: Draft, button: HTMLButtonElement): Promise<boolean> {
  if (!draft.email || !draft.nombre || draft.pass.length < MIN_PASSWORD) { notices.toast(t('settingsRest.newUser.complete'), true); return false; }
  button.disabled = true; button.textContent = t('settingsRest.newUser.creating');
  if (!await invite(draft)) { ready(button); return false; }
  const { error, id } = await usersLegacy.signUp(draft.email, draft.pass, draft.nombre);
  ready(button);
  if (error) { showFailure('couldNotCreate', error.message ?? ''); return false; }
  if (id) await legacyDb().rpc('guardar_perfil', { p: { id, nombre: draft.nombre, usuario: draft.email.split('@')[0], rol: draft.rol } });
  const box = message(); if (box) box.innerHTML = t('settingsRest.newUser.created', { password: escapeHtml(draft.pass) });
  usersLegacy.reloadAdmin();
  return true;
}

/** v2.291: the profile may take a moment to exist after creating the user, so linking is retried; if it fails, it is said. */
async function link(draft: Draft, professional: PickedAccount): Promise<void> {
  let ok = false;
  for (let attempt = 0; attempt < LINK_TRIES && !ok; attempt++) {
    if (attempt) await new Promise(resolve => { setTimeout(resolve, LINK_WAIT_MS); });
    const { data: user } = await legacyDb().from<{ id: string }>('perfiles').select('id').eq('email', draft.email).maybeSingle();
    if (!user) continue;
    const { data: result, error } = await legacyDb().rpc<{ ok?: boolean }>('vincular_cuenta', { p_usuario: user.id, p_medico: professional.id });
    ok = !error && result?.ok !== false;
  }
  const name = escapeHtml(professional.nombre ?? '');
  message()?.insertAdjacentHTML('beforeend', ok ? t('settingsRest.newUser.linked', { name }) : t('settingsRest.newUser.notLinked', { ...words(), name }));
  if (ok) draft.linked = professional.nombre ?? '';
}

/** The access data to pass on to the person (v2.279.0: also saved to see them again later). */
function paintSummary(draft: Draft): void {
  void Promise.resolve(callRpc('guardar_acceso_temporal', { p_email: draft.email, p_pass: draft.pass })).then(() => undefined, () => undefined);
  const box = dialog(), body = dialogBody(); if (!box || !body) return;
  delete box.dataset.sucio;
  body.innerHTML = `<div class="fh"><div><h2>${t('settingsRest.newUser.doneTitle')}</h2><div class="sm">${t('settingsRest.newUser.doneSubtitle')}</div></div><button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
      ${accessDataHtml({ nombre: draft.nombre, rol: draft.rol, email: draft.email, pass: draft.pass, vinculado: draft.linked })}
      <p class="sm">${t('settingsRest.newUser.confirmEmail')}</p>
      <div class="acts u-end u-wrap"><button class="btn sec" id="usrcop">${t('settingsRest.newUser.copy')}</button><button class="btn" data-cerrar>${t('settingsRest.newUser.done')}</button></div>`;
  delete box.dataset.sucio;
  const copy = document.getElementById('usrcop'); if (copy) copy.onclick = (): void => { void copyText(welcomeText(draft.nombre, draft.email, draft.pass)); };
}

async function createUser(professional: PickedAccount | null, button: HTMLButtonElement): Promise<void> {
  const draft: Draft = { nombre: valueOf('nn').trim(), email: valueOf('ne').trim(), pass: valueOf('np'), rol: valueOf('nr'), medico: professional, linked: null };
  if (!allowed(draft) || !await create(draft, button)) return;
  if (isPortalRole(draft.rol) && professional) await link(draft, professional);
  if (currentScreen() === 'config' && usersLegacy.section() === 'usuarios') usersLegacy.repaintList();
  paintSummary(draft);
}

/** Fills name and email from the chosen professional's card. */
async function fillFrom(professional: PickedAccount): Promise<void> {
  const { data: card } = await legacyDb().rpc<{ medico?: { nombre?: string; email?: string | null } }>('ficha_cuenta', { p_id: professional.id });
  const name = input('nn'), email = input('ne');
  if (card?.medico && name && email) { if (!name.value) name.value = card.medico.nombre ?? ''; if (!email.value && card.medico.email) email.value = card.medico.email; }
}

/** A centre's role for a centre; else a portal role that is not a centre's, or the first portal role. */
function presetRole(preset: NewUserPreset): string {
  const centre = preset.centro ? usersLegacy.roleWith('portal_centro') : '';
  if (centre) return centre;
  return usersLegacy.roleNames().find(role => isPortalRole(role) && !usersLegacy.roleCan(role, 'portal_centro')) ?? usersLegacy.roleWith(PRESCRIBER);
}

/** From a professional's card: their role, name and email already filled in. */
function applyPreset(preset: NewUserPreset, role: HTMLSelectElement, toggle: () => void): void {
  role.value = presetRole(preset);
  const name = input('nn'), email = input('ne');
  if (name) name.value = preset.nombre ?? '';
  if (email) email.value = preset.email ?? '';
  toggle();
}

export function newUser(preset: NewUserPreset | null = null): void {
  const body = dialogBody(), box = dialog(); if (!body || !box) return;
  body.innerHTML = formHtml();
  let professional: PickedAccount | null = preset?.medico ?? null;
  editorLegacy.pickAccount(document.getElementById('nmed'), professional, async account => { professional = account; await fillFrom(account); }, t('settingsRest.newUser.findProfessional', words()));
  const role = document.getElementById('nr') as HTMLSelectElement | null;
  const toggle = (): void => { document.getElementById('nmedw')?.classList.toggle('hide', !isPortalRole(role?.value ?? '')); };
  role?.addEventListener('change', toggle);
  if (preset?.medico && role) applyPreset(preset, role, toggle);
  const ok = document.getElementById('ncrear') as HTMLButtonElement | null;
  if (ok) ok.onclick = (): void => { void createUser(professional, ok); };
  box.showModal();
}
