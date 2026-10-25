/**
 * Bridge of the Configuración shell and the in-panel windows (v2.422.0) to the legacy code, kept apart from bridge.ts (at its size
 * limit). The active panel, the window stack, the settings key and the tree of sections stay in legacy state: the dialogs' patches
 * (legado 039, 058 and 072), the tree layers (arbolCfgUnico*) and the tests read them.
 */
import * as legacyFreeScreensImport from '../screens/import';
import * as legacyFreeCoreLayers from '../core/layers';

/** The window or module page shown inside the panel instead of floating. */
export interface ActivePanel { tipo: 'dbody' | 'admin'; refrescar?: () => unknown }
/** A part of a section with parts (painted one under another). */
export interface SettingsPart { k: string; t: string; r: () => unknown }
/** An entry of the Configuración index. */
export interface SettingsItem { k: string; t: string; d?: string; ic?: string; mod?: string; gr?: string; r?: () => unknown; hijos?: SettingsPart[] }
export type SettingsTree = readonly (readonly [string, readonly SettingsItem[]])[];

export const shellLegacy = {
  activePanel: (): ActivePanel | null => PANEL_ACTIVO as ActivePanel | null,
  setActivePanel: (panel: ActivePanel | null): void => { PANEL_ACTIVO = panel; },
  setAdminSection: (section: string): void => { ADM_SEC = section; },
  loadAdmin: (): Promise<void> => cargarAdmin(),
  openingCard: (): boolean => Boolean(FX_FICHA),
  hasPage: (screen: string): boolean => Boolean(PAGINAS[screen]),
  /** The stacked windows (legado 058 gives the previous one back when the top one closes). */
  windowStack: (): { nodos: ChildNode[]; clases: string; titulo: string | undefined }[] => PILA_VENT,
  setStacking: (on: boolean): void => { APILANDO = on; },
  iconOf: (name: string | undefined): string => svgIco(ICON_NOM[name ?? ''] ?? ''),
  tree: (): SettingsTree => arbolCfgUnico() as SettingsTree,
  searchWords: (key: string): string => CFG_CLAVES[key] ?? '',
  normalise: (text: string): string => legacyFreeScreensImport.normaliseHeader(text),
  polish: (): void => { try { legacyFreeCoreLayers.polishSettings(); } catch { /* only tidies the section */ } },
  key: (): string => CFG_KEY,
  setKey: (key: string): void => { CFG_KEY = key; },
  detail: (): boolean => CFG_DETALLE,
  setDetail: (on: boolean): void => { CFG_DETALLE = on; },
  /** Configuración again, through its global name (other code may wrap it). */
  reload: (): void => { void cargarConfig(); },
  planIncludes: (module: string): boolean => planIncluye(module),
  planMinimum: (module: string): { nombre: string } | undefined => planMinimo(module),
  currentPlanName: (): string => planDe(PLAN_ACTUAL.plan as string | undefined).nombre,
  canManageOrganisation: (): boolean => puedeOrganizacion(),
  canUseModule: (module: string): boolean => puedeModulo(module),
  hasDeparture: (): boolean => Boolean(prefsActivas().salida),
  emailSettings: (): PromiseLike<{ data: { host?: string } | null }> => RPC_ORIG<{ host?: string }>('correo_config', {}),
  unsavedCount: (): number => PAG_SUCIO.size,
  orderAliases: (): Readonly<Record<string, string>> => ALIAS_PEDIDOS,
  orderSectionView: (): string => pedsecVista(),
  billingWithoutPlan: (): boolean => facSinPlan(),
  applyMenuPermissions: (): void => { aplicarPermisosMenu(); },
  platformTab: (): string => PAG_TAB.delcos ?? 'orgs',
};
