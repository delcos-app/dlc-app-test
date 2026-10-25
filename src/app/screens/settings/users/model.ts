/**
 * Configuración → Usuarios, shared parts: the list filters, the user list read (usuarios_resumen), the role colour, the dialog and
 * the company words. Migrated from the legacy USR_F, asegurarUsuario and helpers of pantallas/configuracion.js (v2.420.0).
 */
import { callRpc, term } from '../../../legacy/bridge';
import { usersLegacy, type UserRow } from '../../../legacy/settings4-bridge';
import { escapeHtml } from '../../../services/format';

export const DEFAULT_ROLE_COLOUR = '#17457A';
export const PRESCRIBER = 'portal_prescriptor';

/** What the Usuarios list remembers while the page is open. */
export const userFilters = { q: '', rol: '', est: 'activos' };

/** The user list as the legacy code keeps it (cartera and visits also under their old names). */
export const withOldNames = (list: readonly UserRow[]): UserRow[] =>
  list.map(user => ({ medicos: user.cartera, visitas: user.visitas_mes, ...user }) as UserRow);

/** Editing a user or assigning a portfolio works before the list is loaded (for example, from a notification). */
export async function ensureUser(id: string): Promise<void> {
  if (usersLegacy.list().some(user => user.id === id)) return;
  const { data } = await callRpc<UserRow[]>('usuarios_resumen', {});
  usersLegacy.setList(withOldNames(data ?? []));
}

export const userById = (id: string): UserRow | undefined => usersLegacy.list().find(user => user.id === id);

export const isPrescriber = (user: UserRow): boolean => usersLegacy.roleCan(user.rol, PRESCRIBER);

export const roleColour = (role: string): string => escapeHtml(usersLegacy.role(role)?.color ?? DEFAULT_ROLE_COLOUR);

export const dialog = (): HTMLDialogElement | null => document.getElementById('dlg') as HTMLDialogElement | null;
export const dialogBody = (): HTMLElement | null => document.getElementById('dbody');
export const input = (id: string): HTMLInputElement | null => document.getElementById(id) as HTMLInputElement | null;
export const valueOf = (id: string): string => input(id)?.value ?? '';

/** The company words these windows use. */
export const words = (): Record<string, string> => ({
  professional: term('medico'), Professional: term('medico', { capital: 'C' }), professionals: term('medico', { number: 'p' }),
  Professionals: term('medico', { number: 'p', capital: 'C' }), theProfessionals: term('medico', { number: 'p', article: 'el' }),
  theProfessional: term('medico', { article: 'el' }), toTheProfessional: term('medico', { article: 'al' }),
  newProfessionals: term('medico', { number: 'p', adjective: 'nuevo' }), thisProfessional: term('medico', { article: 'este' }),
  visits: term('visita', { number: 'p' }), guideline: term('pauta'), guidelines: term('pauta', { number: 'p' }), patients: term('paciente', { number: 'p' }),
});

/** Roles as the options of a select, with `selected` marked. */
export const roleOptions = (selected: string): string =>
  usersLegacy.roleNames().map(role => `<option ${role === selected ? 'selected' : ''}>${escapeHtml(role)}</option>`).join('');
