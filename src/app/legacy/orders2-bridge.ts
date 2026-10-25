/**
 * Bridge of the order editor, the card payment (TPV), the subscription and the order cards to the legacy code (v2.417.0; kept apart
 * from bridge.ts, which is at its size limit). The catalog (PRODUCTOS, SERVICIOS), the contract prices of Concursos, the payment state
 * (PAGO_ESTADO, PLAN_ACTUAL: Configuración, the notices and the tests read them) and the distributors list (DISTRIBUIDORES, read by
 * the tests) stay in legacy.
 */
import * as legacyFreeCoreLeftovers from '../core/leftovers';
import * as legacyFreeCoreLegacyC from '../core/legacy-c';
import * as legacyFreeScreensSettingsShell from '../screens/settings/shell';
import * as legacyFreeCoreServices from '../core/services';
export interface EditorProduct { id: string; nombre?: string; precio?: number | null; iva?: number | null; contrato?: string | null }
export interface EditorService { id: string; nombre: string; activo?: boolean | null; por_defecto?: boolean | null; pvp?: number | null; iva?: number | null }
export interface PlanInfo { id: string; nombre: string; precio: number; anual?: number | null; minimo?: number | null }
export interface OrderReceipt { nombre: string }
export interface DistributorRow { id: string; nombre: string; email?: string | null; telefono?: string | null; activo?: boolean }

export const orderEditorLegacy = {
  loadProducts: async (): Promise<void> => { if (!PRODUCTOS.length) await cargarProductos(); },
  product: (id: string | null | undefined): EditorProduct =>
    conPrecioContrato((PRODUCTOS as EditorProduct[]).find(product => product.id === id) ?? ({} as EditorProduct)),
  services: (): readonly EditorService[] => SERVICIOS as readonly EditorService[],
  defaultProduct: (): string => productoPorDefecto(),
  productOptions: (id: string | null | undefined, name: string | null | undefined): string => opcionesProducto(id, name),
  /** The prices of the contract in force of the account (Concursos); true if it has one. */
  loadContractPrices: (accountId: string | null | undefined): Promise<unknown> => legacyFreeCoreLeftovers.loadContractPrices((accountId ?? null)),
  pickAccount: (element: HTMLElement | null, value: PickedAccount | null, onPick: (account: PickedAccount) => void, placeholder: string): void => {
    selectorMedico(element, { valor: value, alElegir: onPick, placeholder });
  },
  paymentMethods: (): readonly { valor: string }[] => CAT.forma_pago ?? [],
  help: (title: string, text: string): string => pmAyu(title, text),
  readReceipt: (file: File): Promise<OrderReceipt | null> => leerJustificante(file) as Promise<OrderReceipt | null>,
  uploadReceipts: (id: string, list: readonly OrderReceipt[]): Promise<boolean> => subirJustificantes(id, list),
  orderFields: (): readonly CustomField[] => CAMPOS.pedido ?? [],
  customerCardOpen: (): unknown => FICHA_PAC,
  openCustomer: (id: unknown): void => { void fichaPaciente(id as string); },
  repaintCustomers: (): void => { void listaPacientes(); },
  distributors: (): DistributorRow[] | null => DISTRIBUIDORES,
  setDistributors: (list: DistributorRow[]): void => { DISTRIBUIDORES = list; },
};

export const tpvLegacy = {
  settings: (): Record<string, unknown> => (AJUSTES.cobro_tpv as Record<string, unknown> | undefined) ?? {},
  setSettings: (value: Record<string, unknown>): void => { AJUSTES.cobro_tpv = value; },
  /** Only in the test environment until the bank terminal exists (legado 147). */
  visible: (): boolean => Boolean(TPV_VISIBLE),
  canUseSales: (): boolean => puedeModulo('ventas'),
  serverUrl: (): string => CFG.url,
  whileWorking: (button: HTMLElement | null, text: string, work: () => Promise<unknown>): Promise<unknown> => conCarga(button, text, work),
};

export const subscriptionLegacy = {
  state: (): PaymentState | null => PAGO_ESTADO as PaymentState | null,
  setState: (value: PaymentState): void => { PAGO_ESTADO = value as typeof PAGO_ESTADO; },
  plan: (): Record<string, unknown> => PLAN_ACTUAL,
  setPlan: (value: Record<string, unknown>): void => { PLAN_ACTUAL = value; },
  planOf: (id: string | null | undefined): PlanInfo => planDe(id) as PlanInfo,
  isDowngrade: (from: Record<string, unknown>, to: Record<string, unknown>): boolean => esBajada(from, to),
  losses: (from: string, to: string, data: Record<string, unknown>): string[] => perdidasPlan(from, to, data as { extras: string[]; facturas: boolean }),
  setupFee: (): number => PUESTA_EN_MARCHA,
  plans: (): readonly string[] => PAGO_PLANES,
  platformMode: (): boolean => MODO_PLATAFORMA,
  setPlatformMode: (value: boolean): void => { MODO_PLATAFORMA = value; },
  applyPlatformMode: (): void => { legacyFreeCoreLegacyC.applyPlatformMode(); },
  markBillingPlan: (): void => { legacyFreeScreensSettingsShell.markBillingPlan(); },
  canManageCompany: (): boolean => puedeOrganizacion(),
  openPortal: (button: HTMLElement): void => { void pagoPortal(button); },
  daysUntil: (isoDate: unknown): number | null => diasHasta(isoDate),
};

export const orderCardsLegacy = {
  isoPlus: (isoDate: string, days: number): string => isoMas(isoDate, days),
  easter: (year: number): string => legacyFreeCoreServices.calendar.easterSunday(year),
};

export const indicatorSettingsLegacy = {
  defaults: (): readonly string[] => KPI_DEF,
  save: (list: readonly Record<string, unknown>[]): Promise<boolean> => guardarKpis(list),
  reloadHome: (): void => { void cargarInicio(); },
  eye: (open: boolean): string => (open ? ICO.ojo : ICO.ojoNo) ?? '',
};

/** Field names that hold an amount (legacy ES_IMPORTE). */
export const amountFieldPattern = (): RegExp => ES_IMPORTE;

export interface PaymentState { solo_lectura?: boolean; plataforma?: boolean; usuarios?: number; plan?: Record<string, unknown> }
