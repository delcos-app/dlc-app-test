/**
 * Roles and their capabilities (v2.69.0): the code asks what a person can do, never what their role is called; the roles and
 * their capabilities are each company's data (tables roles and roles_capacidades). The list stays in the legacy ROLES_DEF (legado
 * 001 fills it from the device before signing in). Migrated from the legacy rolDef, rolPuede, rolesNombres, rolCon, rolPorDefecto,
 * plantillaRol and cargarRoles (v2.428.0).
 */
import { legacyDb } from '../../legacy/bridge';
import { settingsCoreLegacy, type RoleDefinition } from '../../legacy/settings-core-bridge';
import { STATES_KEY } from '../commercial-states';
import { TERMS_KEY } from '../vocabulary';

const ROLES_KEY = 'dlc-roles', ADMINISTER = 'administrar', RELOAD_KEY = 'dlc-terminos-recarga';

const roles = (): readonly RoleDefinition[] => settingsCoreLegacy.roles();
const capabilitiesOf = (role: RoleDefinition): readonly string[] => role.capacidades ?? [];

export { ROLES_KEY };

export const roleDefinition = (name: string): RoleDefinition | null => roles().find(role => role.nombre === name) ?? null;

export function roleCan(name: string, capability: string): boolean {
  const role = roleDefinition(name);
  return Boolean(role && capabilitiesOf(role).includes(capability));
}

export const roleNames = (): string[] => roles().map(role => role.nombre);

/** The first role with a capability ('' if none). */
export const roleWith = (capability: string): string => roles().find(role => capabilitiesOf(role).includes(capability))?.nombre ?? '';

/** The role a new person gets: the one marked by default, or the first that does not administer. */
export const defaultRole = (): string =>
  (roles().find(role => role.por_defecto) ?? roles().find(role => !capabilitiesOf(role).includes(ADMINISTER)))?.nombre ?? '';

/** What a role sees by default: its template, with the company's changes on top. */
export function roleTemplate(name: string): Record<string, unknown> {
  const own = (settingsCoreLegacy.settings().roles as Record<string, Record<string, unknown> | undefined> | undefined)?.[name];
  return { ...(roleDefinition(name)?.plantilla ?? {}), ...(own ?? {}) };
}

const remember = (key: string, value: string): void => { try { localStorage.setItem(key, value); } catch { /* not remembered */ } };

/** If the company words changed since they were stored, the page reloads once so that every text uses them. */
function reloadForNewWords(words: unknown): boolean {
  const fresh = JSON.stringify(words ?? {}), before = JSON.stringify(settingsCoreLegacy.terms() ?? {});
  if (fresh === before) return false;
  remember(TERMS_KEY, fresh);
  let already = false;
  try { already = sessionStorage.getItem(RELOAD_KEY) === fresh; sessionStorage.setItem(RELOAD_KEY, fresh); } catch { /* without session storage */ }
  if (already) return false;
  location.reload();
  return true;
}

interface RoleRow { nombre: string; orden: number; color?: string | null; plantilla?: Record<string, unknown> | null; por_defecto?: boolean | null; roles_capacidades?: { capacidad: string }[] | null }

/** Loads the roles, the commercial states and the company words (false if the roles could not be read or the page reloads). */
export async function loadRoles(): Promise<boolean> {
  const db = legacyDb();
  const [{ data, error }, { data: states, error: statesError }, words] = await Promise.all([
    db.from<RoleRow[]>('roles').select('nombre,orden,color,plantilla,por_defecto,roles_capacidades(capacidad)').order('orden').order('nombre'),
    db.rpc<{ valor: string; papel?: string | null }[]>('catalogo_papel', { p_papel: 'estado_comercial' }),
    db.from<{ valor?: unknown } | null>('ajustes').select('valor').eq('clave', 'terminos').maybeSingle()]);
  if (!words.error && reloadForNewWords(words.data?.valor)) return false;
  if (!statesError && Array.isArray(states)) {
    const list = states.map(state => ({ valor: state.valor, papel: state.papel ?? '' }));
    settingsCoreLegacy.setCommercialStates(list);
    remember(STATES_KEY, JSON.stringify(list));
  }
  if (error || !data) return false;
  const list: RoleDefinition[] = data.map(role => ({ nombre: role.nombre, orden: role.orden, color: role.color ?? null, plantilla: role.plantilla ?? {}, por_defecto: Boolean(role.por_defecto),
    capacidades: (role.roles_capacidades ?? []).map(item => item.capacidad) }));
  settingsCoreLegacy.setRoles(list);
  remember(ROLES_KEY, JSON.stringify(list));
  return !statesError;
}
