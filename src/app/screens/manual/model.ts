/**
 * The manual content the professional portal still shows (sections, help, first steps, frequent questions; legacy data for now)
 * and the access level of each section. Migrated from the helpers of the legacy cargarManualBase and infoManual (v2.410.0).
 */
import { manualLegacy, permissions } from '../../legacy/bridge';
import { t } from '../../i18n';

const FULL = 3;
/** Sections whose help is under another screen's key */
const HELP_KEY = new Map([['visitas', 'agenda'], ['centros', 'directorio']]);
/** Sections of the portal manual that belong to a module of the plan */
export const PLAN_MODULES = new Set(['agenda', 'rutas', 'directorio', 'ventas', 'facturacion', 'analitica', 'productos', 'pacientes', 'seguimiento']);

/** The first steps of the user's profile (sales rep, telesales or the default ones). */
export function firstSteps(): readonly FirstStep[] {
  const steps = manualLegacy.firstSteps(), kind = ['cartera', 'televenta'].find(capability => manualLegacy.can(capability));
  return (kind ? steps[kind] : undefined) ?? steps.default ?? [];
}

/** The level the user has in a section, as the page cards show it. */
export function cardLevel(section: ManualSection): number {
  if (section.a) return permissions.levelOf(section.a);
  if (manualLegacy.can('administrar')) return FULL;
  return section.id === 'roles' || section.id === 'permisos' ? 1 : 0;
}

/** The level the user has in a section, as the section window shows it. */
export function sheetLevel(section: ManualSection): number {
  if (section.a) return permissions.levelOf(section.a);
  return manualLegacy.can('administrar') ? FULL : 1;
}

export function accessText(section: ManualSection): string {
  if (section.a) return manualLegacy.levelText(permissions.levelOf(section.a));
  return manualLegacy.can('administrar') ? t('manual.portal.full') : '—';
}

/** «How it works» lines of a section (HTML from the help texts); `byScreen` looks visits and centres up under their screen. */
export const helpLines = (id: string, byScreen = true): readonly string[] => manualLegacy.help(byScreen ? HELP_KEY.get(id) ?? id : id)?.[2] ?? [];

export const sectionIcon = (id: string): string => manualLegacy.icon(id) ?? '📘';

export const findSection = (id: string | null | undefined): ManualSection | undefined => manualLegacy.sections().find(section => section.id === id);
