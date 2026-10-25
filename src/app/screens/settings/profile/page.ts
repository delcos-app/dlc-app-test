/**
 * Mi perfil → «Mis datos»: the person's card (modules and activity), their name, phone, language and what opens on entering, and
 * «Seguridad y sesión» (the password is changed through a link by email). In Configuración the three go in one card. Migrated from
 * the legacy pintarPerfil, pintarPerfilBase–Base3, pintarPerfilPaso1–4 and pintarPrefsPerfil(Base) (v2.420.0); pintarPerfil stays as
 * an adapter (the tree of Configuración and the «perfil» page use it).
 */
import { currentScreen, icon, initialsOf, legacyDb, notices } from '../../../legacy/bridge';
import { settingsExtraLegacy } from '../../../legacy/settings3-bridge';
import { profileLegacy } from '../../../legacy/settings4-bridge';
import { t, type MessageKey } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { showFullLoading } from '../../../components/loading';
import { paintProfile } from '../preferences/profile';

const START_SCREENS = ['inicio', 'agenda', 'rutas', 'directorio', 'ventas'];

const field = (id: string): HTMLInputElement | null => document.getElementById(id) as HTMLInputElement | null;

function dataCardHtml(): string {
  const me = profileLegacy.me(), preferences = (me.preferencias ?? {}) as { telefono?: string; inicio?: string };
  const starts = START_SCREENS.filter(screen => profileLegacy.canOpenModule(screen))
    .map(screen => `<option value="${screen}" ${(preferences.inicio ?? 'inicio') === screen ? 'selected' : ''}>${t(`settingsRest.profile.startScreens.${screen}` as MessageKey)}</option>`).join('');
  const languages = profileLegacy.languages().map(([id, name]) => `<option value="${id}" ${profileLegacy.language() === id ? 'selected' : ''}>${name}</option>`).join('');
  return `<div class="card cfgpanel"><h2>${t('settingsRest.profile.myData')}</h2>
      <div class="g2"><div><label for="pfn">${t('settingsRest.profile.visibleName')}</label><input id="pfn" value="${escapeHtml(me.nombre)}"></div>
        <div><label for="pft">${t('settingsRest.profile.phone')}</label><input id="pft" inputmode="tel" value="${escapeHtml(preferences.telefono ?? '')}" placeholder="${t('settingsRest.profile.phonePlaceholder')}"></div></div>
      <div class="g2"><div><label for="pfi">${t('settingsRest.profile.openOnStart')}</label><select id="pfi">${starts}</select></div><div><label for="pfl">${t('settingsRest.profile.language')}</label><select id="pfl" data-notr>${languages}</select></div></div>
      <div class="acts u-end"><button class="btn" id="pfok">${t('settingsRest.profile.save')}</button></div></div>`;
}

/** The new name in the header (first name and initials). */
function showName(name: string): void {
  profileLegacy.me().nombre = name;
  const user = document.getElementById('uname'), avatar = document.getElementById('av');
  if (user) user.textContent = settingsExtraLegacy.firstName(name);
  if (avatar) avatar.textContent = initialsOf(name);
}

/** Always with the current preferences (before, saving «Mis datos» could clear the chosen language). */
async function saveData(): Promise<void> {
  const name = field('pfn')?.value.trim() ?? ''; if (!name) { notices.toast(t('settingsRest.profile.emptyName'), true); return; }
  const me = profileLegacy.me(), preferences = { ...(me.preferencias ?? {}), telefono: field('pft')?.value.trim() ?? '', inicio: field('pfi')?.value ?? '' };
  const [saved, renamed] = await Promise.all([legacyDb().rpc<Record<string, unknown>>('guardar_preferencias', { p: preferences }), legacyDb().from('perfiles').update({ nombre: name }).eq('id', me.id)]);
  if (saved.error) { notices.toast(t('settingsRest.profile.couldNotSave'), true); return; }
  me.preferencias = saved.data ?? preferences;
  if (!renamed.error) showName(name);
  notices.toast(t('settingsRest.profile.saved'));
}

/** Another language reloads the app with it. */
async function changeLanguage(select: HTMLSelectElement): Promise<void> {
  const id = select.value, me = profileLegacy.me(), preferences = { ...(me.preferencias ?? {}), idioma: id };
  const { data, error } = await legacyDb().rpc<Record<string, unknown>>('guardar_preferencias', { p: preferences });
  if (error) { notices.toast(t('settingsRest.profile.couldNotSave'), true); return; }
  me.preferencias = data ?? preferences;
  try { localStorage.setItem('app-idioma', id); sessionStorage.removeItem('app-idioma-recarga'); } catch { /* the language is in the preferences anyway */ }
  showFullLoading(`${profileLegacy.languages().find(item => item[0] === id)?.[1] ?? ''}…`);
  location.reload();
}

/** v2.340.0: the person's card goes straight to its place (#perfilcab); a frozen copy keeps its own without the id. */
function placePersonCard(): void {
  document.querySelectorAll('#miperfil, #mpextra').forEach(item => { if (item.closest('.congelada')) item.removeAttribute('id'); else item.remove(); });
  if (!document.getElementById('perfilcab')) return;
  void paintProfile();
  const card = document.getElementById('miperfil'), place = document.getElementById('perfilcab');
  if (card && place) place.replaceWith(card); else place?.remove();
}

function securityHtml(): string {
  const me = profileLegacy.me();
  return `<div class="card cfgpanel perfseg"><h2 style="padding:0 0 4px">${icon('shield')} ${t('settingsRest.profile.security')}</h2>
    <p class="sm">${t('settingsRest.profile.securityHint')}</p>
    <div class="perfsegf"><div><span class="sm">${t('settingsRest.profile.accessEmail')}</span><b>${escapeHtml(me.email ?? '')}</b></div><div><span class="sm">${t('settingsRest.profile.role')}</span><b>${escapeHtml(me.rol)}</b></div></div>
    <div class="acts u-start u-wrap"><button class="btn sec" id="perfclave">${icon('key-round')} ${t('settingsRest.profile.sendLink')}</button>
      <button class="btn sec" id="perfsalir">${icon('log-out')} ${t('settingsRest.profile.signOut')}</button></div></div>`;
}

/** «Seguridad y sesión», at the end of the page's container. */
function addSecurity(): void {
  const container = document.querySelector('#v-perfil .pagcuerpo') ?? (currentScreen() === 'config' ? document.querySelector('#v-config #cfgcuerpo-real, #v-config #cfgcuerpo') : null);
  if (!container || container.querySelector('.perfseg')) return;
  container.classList.add('perfil2');
  container.insertAdjacentHTML('beforeend', securityHtml());
  const me = profileLegacy.me(), link = document.getElementById('perfclave') as HTMLButtonElement | null;
  if (link) link.onclick = (): void => {
    void settingsExtraLegacy.withButtonLoading(link, t('settingsRest.profile.sending'), async () => {
      const { error } = await profileLegacy.sendPasswordLink(me.email ?? '');
      notices.toast(error ? t('settingsRest.profile.couldNotSend', { error: error.message ?? '' }) : t('settingsRest.profile.linkSent', { email: me.email ?? '' }), Boolean(error));
    });
  };
  const signOut = document.getElementById('perfsalir');
  if (signOut) signOut.onclick = (): void => { document.querySelector<HTMLElement>('[data-u="salir"]')?.click(); };
}

/** Configuración: one card with the person, their data and the security. */
function joinInConfig(): void {
  const box = document.getElementById('cfgcuerpo'); if (!box || box.querySelector('.perfuno')) return;
  const person = box.querySelector('#miperfil'), data = [...box.children].find(child => child.querySelector('#pfn')), security = box.querySelector('.perfseg');
  if (!data) return;
  const joined = document.createElement('div'); joined.className = 'card cfgpanel perfuno';
  joined.innerHTML = '<div class="perfunorow"></div>';
  const row = joined.firstElementChild;
  [person, data].forEach(part => { if (!part) return; part.classList.remove('card', 'cfgpanel'); part.classList.add('perfparte'); row?.appendChild(part); });
  if (security) { security.classList.remove('card', 'cfgpanel'); security.classList.add('perfparte'); joined.appendChild(security); }
  box.prepend(joined);
}

export function paintMyProfile(): void {
  const box = document.getElementById('cfgcuerpo'); if (!box) return;
  box.innerHTML = `<div id="perfilcab"></div>
    ${dataCardHtml()}`;
  const ok = document.getElementById('pfok'); if (ok) ok.onclick = (): void => { void saveData(); };
  const language = document.getElementById('pfl') as HTMLSelectElement | null; if (language) language.onchange = (): void => { void changeLanguage(language); };
  placePersonCard();
  addSecurity();
  if (currentScreen() === 'config') joinInConfig();
}
