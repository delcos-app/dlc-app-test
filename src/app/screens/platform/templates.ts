/**
 * The sector templates of a new company (plan 12.2, CFG-1, v2.469.0; SQL 194, plantillas_sector): «Genérica» is the platform's base
 * (roles, permissions, catalogs and series, no sector modules) and «Distribución sanitaria» adds its starting settings and its four
 * sector modules. Without SQL 194 the list is empty and there is nothing to choose.
 */
import { legacyDb } from '../../legacy/bridge';
import { t, type MessageKey } from '../../i18n';

export interface SectorTemplate { clave: string; nombre: string; modulos: string[]; ajustes: Record<string, unknown> }

const KNOWN = ['generica', 'distribucion_sanitaria'] as const;
const known = (key: string): key is typeof KNOWN[number] => (KNOWN as readonly string[]).includes(key);

/** The templates the platform offers (empty without SQL 194 or without permission). */
export async function loadTemplates(): Promise<SectorTemplate[]> {
  try {
    const { data, error } = await legacyDb().rpc<SectorTemplate[]>('plantillas_sector');
    return !error && Array.isArray(data) ? data.filter(item => typeof item.clave === 'string') : [];
  } catch { return []; /* without SQL 194: no templates, the company is born as before */ }
}

/** The name in the app's words (the database's name for one it does not know). */
export const templateName = (template: SectorTemplate): string =>
  (known(template.clave) ? t(`platform.templates.${template.clave}.name` as MessageKey) : template.nombre);

/** What the template brings, in plain words: the sector modules and the starting settings it changes. */
export function templateBrings(template: SectorTemplate): string[] {
  const modules = template.modulos.map(key => t(`platform.templates.modules.${key}` as MessageKey));
  const settings = Object.keys(template.ajustes).map(key => t(`platform.templates.settings.${key}` as MessageKey));
  return [...modules, ...settings];
}
