/**
 * What the signed-in person can do: capabilities of their role and levels by area (0 no access, 1 see, 2 edit, 3 full). Migrated from
 * the legacy servicios/permisos.js and verImportes/MODULO_AREA of servicios/planes.js (v2.425.0); every legacy name (puede,
 * puedeEditar, nivelDe2, VE_TODO, puedeModulo…) stays as an adapter. The profile (PERFIL) stays in legacy state.
 */
import { coreLegacy, type LegacyProfile } from '../legacy/core-bridge';
import { t } from '../i18n';
import { impersonating, isGuest } from './session';

const FULL = 3, EDIT = 2, SEE = 1, CENTRE = 'Centro';

/** Which area opens each module. */
export const MODULE_AREA: Record<string, string> = {
  inicio: 'H', agenda: 'G', rutas: 'R', directorio: 'M', pacientes: 'L', productos: 'P', seguimiento: 'Q', ventas: 'V', analitica: 'A', facturacion: 'F',
};

/** Names of the levels, from 0 to 3. */
export const LEVEL_NAMES: readonly string[] = [t('core.levels.none'), t('core.levels.see'), t('core.levels.edit'), t('core.levels.full')];

const profile = (): LegacyProfile | null => coreLegacy.profile();
const areaLevel = (area: string): number => Number(profile()?.areas?.[area] ?? 0);

export const can = (capability: string): boolean => Boolean(profile()?.capacidades?.includes(capability));
const isAdmin = (): boolean => can('administrar');

/** Level in an area (3 for administration). */
export const levelOf = (area: string): number => (isAdmin() ? FULL : areaLevel(area));

/** Same, 0 without a session. */
export const levelOrNone = (area: string): number => (!profile() ? 0 : levelOf(area));

export const seesEverything = (): boolean => can('ver_todo');

const withProfile = (check: () => boolean): boolean => Boolean(profile()) && check();

export const canEdit = (): boolean => withProfile(() => isAdmin() || areaLevel('M') >= EDIT);
export const canEditType = (type: string | null | undefined): boolean => withProfile(() => isAdmin() || areaLevel(type === CENTRE ? 'C' : 'M') >= EDIT);
export const canCreateType = (type: string | null | undefined): boolean => withProfile(() => isAdmin() || areaLevel(type === CENTRE ? 'C' : 'M') >= FULL);
export const canCreate = (): boolean => canCreateType('Persona') || canCreateType(CENTRE);
export const canRecord = (): boolean => withProfile(() => isAdmin() || areaLevel('S') >= EDIT);
/** Lists (clasificadores) are a permission of the role. */
export const canManageLists = (): boolean => withProfile(() => can('gestionar_clasificadores'));
/** Create or change orders and customers: administration and telesales (the sales rep only looks at their own). */
export const canSell = (): boolean => withProfile(() => isAdmin() || (areaLevel('V') >= EDIT && can('televenta')));
export const canUseFreeAccount = (): boolean => isAdmin() || levelOrNone('V') >= EDIT;
export const canBuy = (): boolean => withProfile(() => isAdmin() || areaLevel('V') >= FULL);
export const canInvoice = (): boolean => withProfile(() => isAdmin() || (seesEverything() && areaLevel('V') >= EDIT));
export const canManageOrganization = (): boolean => can('configurar_organizacion') || can('gestionar_plataforma');
export const canReviewDuplicates = (): boolean => isAdmin() || areaLevel('M') >= FULL;
export const canAttribute = (): boolean => isAdmin() || levelOrNone('V') >= EDIT;
export const canDeleteProduct = (): boolean => isAdmin() || levelOrNone('P') >= EDIT;
export const canSeeAmounts = (): boolean => levelOrNone('E') >= SEE;

/** A module is open with any level in its area (Facturación also needs to see the whole team). */
export function canUseModule(module: string): boolean {
  if (!profile()) return false;
  if (module === 'facturacion' && !seesEverything()) return false;
  const area = MODULE_AREA[module];
  return !area || levelOrNone(area) >= SEE;
}

/** The module is in the menu and not locked. */
export const canSeeArea = (module: string): boolean => {
  const button = document.querySelector(`nav.main [data-t="${module}"]`);
  return Boolean(button) && !button?.classList.contains('hide') && !button?.classList.contains('bloq');
};

const canImpersonateAnyone = (): boolean => withProfile(() => (isAdmin() || areaLevel('U') >= FULL) && !impersonating());

/** «Impersonalizar» the team is of the plan A medida (guests, with any plan). */
export const canImpersonate = (): boolean => canImpersonateAnyone() && coreLegacy.currentPlan().plan === 'medida';

/** Whether this person can be impersonated by the signed-in one. */
export function canImpersonateUser(user: { id: string; rol: string; activo?: boolean } | null | undefined): boolean {
  if (!user || !canImpersonateAnyone() || user.id === profile()?.id || !user.activo || coreLegacy.roleCan(user.rol, 'administrar')) return false;
  return coreLegacy.currentPlan().plan === 'medida' || isGuest(user);
}
