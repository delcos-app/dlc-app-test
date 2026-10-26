/**
 * Bridge of Configuración (fourth part: users, Mi perfil and «Plan y suscripción») to the legacy code, kept apart from bridge.ts (at
 * its size limit). The user list, the roles, the plan catalog and the payment state stay in legacy state: the start-up, the menu,
 * the permissions and other screens read them.
 */
import * as legacyFreeCoreSettings from '../core/settings';
import { settingsStore } from '../screens/settings/store';
import { homeStore } from '../screens/home/store';
import { sessionStore } from '../core/session-store';
import { ordersStore } from '../screens/orders/store';
export interface UserRow {
  id: string; nombre: string; email?: string | null; usuario?: string; rol: string; activo?: boolean; areas?: Record<string, number> | null;
  cartera?: number; visitas_mes?: number; ultima_actividad?: string | null; medico?: string | null; cuenta?: string | null; cuenta_id?: string | null;
  zonas?: string[] | null; comision_ver?: string;
}
export interface RoleDef { nombre: string; color?: string; capacidades?: string[]; plantilla?: Record<string, number>; por_defecto?: boolean }
export interface PlanDef {
  id: string; nombre: string; para: string; precio: number; anual: number; presupuesto?: boolean; ventajas: string[]; modulos: string[];
  medicos?: number | null; minimo?: number;
}
export interface CurrentPlan {
  plan?: string; usuarios?: number | null; pago?: string; estado?: string; prueba_hasta?: string; stripe_suscripcion?: string | null;
  stripe_cliente?: string | null; periodo_fin?: string; impago_desde?: string; cambio_previsto?: { plan: string; desde: string; usuarios: number; pago: string } | null;
  baja_al_final?: boolean; compromiso_hasta?: string; en_prueba?: boolean;
}
export interface Connection { ultima_conexion?: string | null; ultimo_acceso?: string | null }
export interface Scheme { id: string; nombre: string; personas?: string[] }
export type PlanRow = readonly [string, string | null | undefined, readonly string[] | null | undefined];

interface SignUpClient { auth: { signUp: (data: object) => Promise<{ data: { user?: { id: string } | null } | null; error: { message?: string } | null }> } }

interface Profile { id: string; nombre: string; email?: string; rol: string; telefono?: string; preferencias?: Record<string, unknown> | null }

export const usersLegacy = {
  list: (): UserRow[] => settingsStore.users as UserRow[],
  setList: (list: UserRow[]): void => { settingsStore.users = list; },
  setConnections: (connections: Record<string, Connection>): void => { USR_ACC = connections; },
  connections: (): Record<string, Connection> => (USR_ACC ?? {}) as Record<string, Connection>,
  role: (name: string): RoleDef | null => legacyFreeCoreSettings.roleDefinition(name) as RoleDef | null,
  roleCan: (role: string, capability: string): boolean => legacyFreeCoreSettings.roleCan(role, capability),
  roleNames: (): string[] => rolesNombres(),
  roleWith: (capability: string): string => legacyFreeCoreSettings.roleWith(capability),
  defaultRole: (): string => legacyFreeCoreSettings.defaultRole(),
  areas: (): readonly (readonly [string, string])[] => AREAS,
  levels: (): readonly string[] => NIVELES,
  levelText: (level: number): string => NIVEL_TXT[level] ?? '',
  moduleArea: (): Readonly<Record<string, string | undefined>> => MODULO_AREA,
  isGuest: (user: UserRow): boolean => esInvitado(user),
  guestSees: (user: UserRow): string => queVeInvitado(user),
  impersonate: (id: string): void => { void entrarComo(id); },
  assignPortfolio: (id: string): void => { void asignarCartera(id); },
  reloadAdmin: (): void => { void cargarAdmin(); },
  schemes: (): Scheme[] => homeStore.commissionSchemes as Scheme[],
  setSchemes: (list: Scheme[]): void => { homeStore.commissionSchemes = list; },
  provinces: (): Record<string, { p: string; n: number }[]> | null => sessionStore.provinces as Record<string, { p: string; n: number }[]> | null,
  setProvinces: (value: Record<string, { p: string; n: number }[]>): void => { sessionStore.provinces = value; },
  /** Configuración's open section (Usuarios repaints its list after creating or deleting). */
  section: (): string | null => settingsStore.section,
  settingsKey: (): string => CFG_KEY,
  /** Usuarios repaints through its legacy name (the page tabs and the tree of Configuración use it). */
  repaintList: (): void => { void pintarUsuarios2(); },
  /** A user is created with a separate client (no session kept); the id of the new user, if Supabase gives it. */
  signUp: async (email: string, password: string, name: string): Promise<{ error: { message?: string } | null; id: string | null }> => {
    const client = (window as unknown as { supabase: { createClient: (url: string, key: string, options: object) => SignUpClient } })
      .supabase.createClient(CFG.url, CFG.anon, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await client.auth.signUp({ email, password, options: { data: { nombre: name, usuario: email.split('@')[0] } } });
    return { error, id: data?.user?.id ?? null };
  },
  logError: (message: string, detail: Record<string, unknown>): void => { registrarError('api', message, detail); },
};

export const planLegacy = {
  current: (): CurrentPlan => (sessionStore.plan as CurrentPlan | null) ?? {},
  setCurrent: (plan: CurrentPlan): void => { sessionStore.plan = plan as Record<string, unknown>; },
  of: (id: string | null | undefined): PlanDef => planDe(id) as PlanDef,
  all: (): readonly PlanDef[] => PLANES as readonly PlanDef[],
  contractedUsers: (): number => legacyFreeCoreSettings.contractedUsers(),
  modules: (): readonly (readonly [string, string, string])[] => MOD_PLAN,
  rows: (): readonly PlanRow[] => PLAN_FILAS() as readonly PlanRow[],
  moduleAreas: (): Readonly<Record<string, string | undefined>> => MODULO_AREA,
  paymentPlans: (): readonly string[] => PAGO_PLANES,
  paymentState: (): { usuarios?: number; medicos?: number } => (ordersStore.paymentState ?? {}) as { usuarios?: number; medicos?: number },
  needs: (): readonly (readonly [string, string])[] => PRESU_NECESITA,
  whenOptions: (): readonly string[] => PRESU_CUANDO,
  requestState: (state: string): string => PRESU_ESTADO[state] ?? state,
  setupFee: (): number => PUESTA_EN_MARCHA,
  sections: (): Readonly<Record<string, readonly string[]>> => PLAN_SECCIONES,
  extras: (): Readonly<Record<string, readonly string[]>> => PLAN_EXTRAS,
  sectionTitle: (section: string): string | undefined => TITULO_PEDSEC[section]?.[0],
  vatOf: (amount: number): number => ivaDe(amount),
  euros: (value: number): string => eurI(value),
  brandName: (): string => ((settingsStore.settings.marca ?? {}) as { nombre?: string }).nombre ?? '',
};

export const profileLegacy = {
  me: (): Profile => sessionStore.profile as Profile,
  languages: (): readonly (readonly [string, string])[] => IDIOMAS,
  language: (): string => sessionStore.language,
  applyLanguage: (id: string): void => { aplicarIdioma(id); },
  canOpenModule: (screen: string): boolean => puedeModulo(screen),
  sendPasswordLink: (email: string): Promise<{ error: { message?: string } | null }> =>
    (db as unknown as { auth: { resetPasswordForEmail: (to: string, options: object) => Promise<{ error: { message?: string } | null }> } })
      .auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname }),
};
