import * as components from '../components';
import * as legacyFreeComponentsEmbeddedWindow from '../components/embedded-window';
import { accountsStore } from '../screens/accounts/store';
import { productsStore } from '../screens/products/store';
import { sessionStore } from '../core/session-store';
import * as legacyFreeCoreServices from '../core/services';
import * as legacyFreeCoreLeftovers from '../core/leftovers';
import * as legacyFreeScreensProducts from '../screens/products';
import * as legacyFreeScreensHome from '../screens/home';
/**
 * Bridge of the visit windows to the legacy code (kept apart from bridge.ts, which is at its size limit). The open visit stays in
 * the legacy VISITA_ACTUAL: the legacy escribirRpc adds its mode, photos, samples and products when it is saved, and the tests read
 * it. The presentation material stays in PRES_MAT (the tests and Productos use it).
 */
export const visitLegacy = {
  setCurrent: (draft: VisitDraft): void => { accountsStore.currentVisit = draft; },
  /** The day chosen in the Agenda for the visit (used once). */
  takeDate: (): string => { const date = VISITA_FECHA; VISITA_FECHA = ''; return date; },
  withLoading: <T>(work: () => Promise<T>): Promise<T> => legacyFreeComponentsEmbeddedWindow.withDialogLoading(work),
  saveCopy: (key: string, data: unknown): void => { legacyFreeCoreServices.reads.saveCopy(key, data); },
  readCopy: (key: string): unknown => legacyFreeCoreServices.reads.readCopy(key)?.d ?? null,
  resultValues: (): readonly { valor: string; extra?: string | null }[] => CAT.resultado_visita ?? [],
  dataField: (value: object, key: string): string => legacyFreeCoreLeftovers.valueDataField(value, key, undefined),
  signaturePad: (canvas: HTMLCanvasElement): SignaturePad => components.signaturePad(canvas),
  promotedProducts: (): Promise<readonly { id: string; nombre: string }[]> => legacyFreeScreensProducts.promotedProducts(),
  reloadProducts: async (): Promise<readonly CatalogProduct[]> => { await cargarProductos(); return productsStore.products; },
  readPhoto: (file: File): Promise<VisitPhoto | null> => legacyFreeCoreServices.files.readReceipt(file),
  photosMax: (): number => FOTOS_VISITA_MAX,
  normalise: (text: string): string => components.normalise(text),
  weekdayLetter: (): string => legacyFreeCoreServices.calendar.todayLetter(),
  /** The write queue: without connection the call is kept and `data.encolada` is true. */
  writeRpc: (name: string, payload: Record<string, unknown>): Promise<{ data?: unknown; error?: { message?: string } | null }> =>
    legacyFreeCoreServices.reads.writeQueued(name, payload) as Promise<{ data?: unknown; error?: { message?: string } | null }>,
  reloadHome: (): void => { void legacyFreeScreensHome.loadWithCache(); },
  loading: (element: HTMLElement, text: string): void => { components.showLoading(element, text); },
  materials: (): readonly PresentationMaterial[] | null => productsStore.presentationMaterials,
  materialsTime: (): number => productsStore.presentationTime,
  setMaterials: (list: PresentationMaterial[], time: number): void => { productsStore.presentationMaterials = list; productsStore.presentationTime = time; },
  /** Downloaded material files by id (Productos forgets one when it is removed). */
  materialFiles: (): Map<string, string> => PRES_DATOS,
  preferences: (): Record<string, unknown> => (sessionStore.profile as { preferencias?: Record<string, unknown> | null }).preferencias ?? {},
  setPreferences: (value: Record<string, unknown>): void => { (sessionStore.profile as { preferencias?: Record<string, unknown> }).preferencias = value; },
};
