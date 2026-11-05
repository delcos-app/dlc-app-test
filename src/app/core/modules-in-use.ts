/**
 * Sector modules in use (plan 12.2, CFG-1, D1 A, v2.469.0): Intervenciones, Depósito, Concursos and Parque instalado appear when
 * the plan includes them AND the company has the minimum data to use them (a surgery, a consignment store, a tender, a product
 * installed with a serial number) or its sector template brings them. SQL 194 computes it (modulos_en_uso) and sends it with the
 * settings at start-up. Without SQL 194 the settings do not bring it and every module counts as in use: the plan alone decides,
 * as before. The menu is painted before the settings arrive, so the last answer is kept on the device and used until then (no entry
 * appears and then goes); when the settings arrive and something changed, the menu is applied again.
 */
import { organisationLegacy } from '../legacy/organisation-bridge';
import { planIncludesSection } from './plans';

/** The sector modules, by their menu key (also their plan section). */
export const SECTOR_MODULES = ['cirugias', 'deposito', 'concursos', 'parque'] as const;
export type SectorModule = typeof SECTOR_MODULES[number];

/** The setting SQL 194 adds to ajustes_lista (computed, never saved). */
export const SETTING_IN_USE = 'modulos_en_uso';

export const isSectorModule = (key: string): key is SectorModule => (SECTOR_MODULES as readonly string[]).includes(key);

type InUse = Readonly<Record<string, unknown>>;
const CACHE_KEY = 'dlc-modulos-en-uso';
let settingsHere = false;

const asInUse = (value: unknown): InUse | null => (value && typeof value === 'object' && !Array.isArray(value) ? value as InUse : null);
function cached(): InUse | null {
  try { return asInUse(JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null')); } catch { return null; /* private mode or a broken copy: plan only */ }
}
const inUseSetting = (): InUse | null => asInUse(organisationLegacy.setting(SETTING_IN_USE)) ?? (settingsHere ? null : cached());

/** Which sector modules are in use now, in one text (to see whether something changed). */
export const inUseSignature = (): string => SECTOR_MODULES.map(moduleInUse).join();

/** The settings have arrived: their answer is kept for the next start. */
export function settingsArrived(): void {
  settingsHere = true;
  const value = asInUse(organisationLegacy.setting(SETTING_IN_USE));
  try { if (value) localStorage.setItem(CACHE_KEY, JSON.stringify(value)); else localStorage.removeItem(CACHE_KEY); } catch { /* not kept: the next start uses the plan until the settings arrive */ }
}

/** Whether the database says what is in use (false without SQL 194). */
export const knowsModulesInUse = (): boolean => inUseSetting() !== null;

/** Whether the company uses the module; any other key, and every module without SQL 194, counts as in use. */
export function moduleInUse(key: string): boolean {
  if (!isSectorModule(key)) return true;
  const inUse = inUseSetting();
  return inUse === null || inUse[key] === true;
}

/** Shown in the menu, Inicio and the account card: in the plan and in use. Out of the plan it keeps its padlock (planIncludesSection). */
export const sectionShown = (key: string): boolean => planIncludesSection(key) && moduleInUse(key);
