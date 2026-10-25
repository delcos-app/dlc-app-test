/**
 * Startup: the session and the profile (the saved profile shows the app at once; the network one replaces it if it changed), and what
 * runs when the app opens, in order. Migrated from the legacy arrancar and arrancarBase, nucleo/arranque.js and ES_MOVIL (v2.426.0);
 * arrancar and ES_MOVIL stay as adapters, and arranque.js calls `openApp` at its place in the load order (the last piece of app.js).
 */
import { t } from '../../i18n';
import { navLegacy } from '../../legacy/nav-bridge';
import * as legacyFreeCoreServices from '../services';
import * as legacyFreeCoreSettings from '../settings';

const RETRIES = 2, RETRY_WAIT_MS = 1500, NOT_FOUND = 'PGRST116', MOBILE_QUERY = '(max-width: 760px)';

interface Profile { activo?: boolean; capacidades?: unknown[] }
interface OrganizationAccess { bloqueada?: boolean; motivo?: string; organizacion?: string; prueba_hasta?: string }

/** Phone width (the layout of the phone). */
export const isMobileWidth = (): boolean => matchMedia(MOBILE_QUERY).matches;

function savedProfile(): Profile | null {
  let saved: Profile | null = null;
  try { saved = JSON.parse(localStorage.getItem(PKEY) ?? 'null') as Profile | null; } catch { saved = null; }
  // v2.69.0: the saved profile only helps if it already has its capabilities
  return saved && Array.isArray(saved.capacidades) ? saved : null;
}

async function readProfile(userId: string): Promise<{ profile: Profile | null; error: { code?: string } | null }> {
  const read = (): PromiseLike<LegacyResult<Profile>> => db.from<Profile>('perfiles').select('*,capacidades').eq('id', userId).single();
  let { data, error } = await read();
  // A connection failure does not close the session: it is tried again
  for (let attempt = 0; attempt < RETRIES && error && (error as { code?: string }).code !== NOT_FOUND; attempt++) {
    await new Promise(resolve => { setTimeout(resolve, RETRY_WAIT_MS); });
    ({ data, error } = await read());
  }
  return { profile: data ?? null, error: error as { code?: string } | null };
}

/** v2.117.0: if the company is blocked (trial ended or deactivated), that is what is said. */
async function refusalText(profile: Profile | null): Promise<string> {
  const { data: access } = await Promise.resolve(RPC_ORIG<OrganizationAccess>('acceso_organizacion', {})).catch(() => ({ data: null }));
  if (access?.bloqueada) {
    const organization = access.organizacion ?? '';
    return access.motivo === 'prueba_terminada' ? t('navigationCore.session.trialEnded', { organization, date: legacyFreeCoreServices.calendar.shortDate((access.prueba_hasta ?? '')) })
      : t('navigationCore.session.deactivatedCompany', { organization });
  }
  return t(profile && !profile.activo ? 'navigationCore.session.deactivatedUser' : 'navigationCore.session.noProfile');
}

async function refuse(profile: Profile | null): Promise<void> {
  const text = await refusalText(profile);
  localStorage.removeItem(PKEY);
  await db.auth.signOut();
  mostrarLogin(text);
}

async function enter(profile: Profile, saved: Profile | null, roles: Promise<unknown>): Promise<void> {
  try { localStorage.setItem(PKEY, JSON.stringify(profile)); } catch { /* not remembered on this device */ }
  if (!(await roles) && !(ROLES_DEF.length && ESTADOS_DEF.length)) await cargarRoles().catch(() => false);
  const changed = !saved || JSON.stringify(saved) !== JSON.stringify(profile);
  if (!APP_VISIBLE) mostrarApp(profile);
  else if (changed) { mostrarApp(profile); if (TAB === 'inicio') void cargarInicio(); }
  Promise.resolve(db.rpc('registrar_acceso', { p_evento: 'Entrada', p_agente: navigator.userAgent })).catch(() => undefined);
}

/** Starts the app with the session. With the recovery link the platform neither starts nor paints. */
/** The saved profile shows the app at once, if roles and states are already loaded. */
function showSaved(saved: Profile | null): void {
  if (saved && ROLES_DEF.length && ESTADOS_DEF.length && localStorage.getItem('dlc-os-sesion') && !APP_VISIBLE) { mostrarApp(saved); marca('app visible con el perfil guardado'); }
}

export async function start(): Promise<void> {
  if (RECUPERANDO) { pantallaRecuperacion(); return; }
  marca('inicio del arranque');
  const saved = savedProfile();
  showSaved(saved);
  const { data: { session } } = await navLegacy.auth().getSession();
  marca('sesión comprobada');
  if (!session) {
    if (!navigator.onLine && saved && APP_VISIBLE) return;   // v2.259.0: offline, the saved profile goes on
    localStorage.removeItem(PKEY); mostrarLogin(); return;
  }
  const roles = cargarRoles().catch(() => false);
  const { profile, error } = await profileOrSaved(session.user.id, saved);
  marca('perfil recibido');
  if (error || !profile?.activo) { await refuse(profile); return; }
  await enter(profile, saved, roles);
}

/** A connection failure enters with the saved profile. */
async function profileOrSaved(userId: string, saved: Profile | null): Promise<{ profile: Profile | null; error: { code?: string } | null }> {
  const read = await readProfile(userId);
  return read.error && read.error.code !== NOT_FOUND && saved ? { profile: saved, error: null } : read;
}

/** What runs when the app opens, in this order (the last piece of app.js: every function already has its final form). */
export function openApp(): void {
  navLegacy.improveFields();
  legacyFreeCoreSettings.applyBrand(); legacyFreeCoreSettings.applyBrand();
  if (RECUPERANDO) pantallaRecuperacion();
  pintarBnav(); pintarConexion(); vaciarCola();
  void start();
  if (PERFIL) menuOrganizacion();
  // Back from Stripe (v2.167.0): if the app already entered (saved profile), it goes to «Plan y suscripción»
  if (PAGO_IR_PLAN && PERFIL) setTimeout(() => { if (PAGO_IR_PLAN) ir('plan'); }, 0);
}
