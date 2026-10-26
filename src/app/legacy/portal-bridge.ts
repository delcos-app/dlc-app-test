import * as components from '../components';
import { sessionStore } from '../core/session-store';
/**
 * Bridge of the professional and centre portal to the legacy code (kept apart from bridge.ts, which is at its size limit): charts,
 * the period selector, the plan, the company words, the invoice PDF and the colours of the centre's order states.
 */
export interface InvoiceData { ok?: boolean; motivo?: string; numero?: string; concepto?: string; rectifica_num?: string | null; diseno?: Partial<PdfDesign> | null }

export const portalPageLegacy = {
  barChart: (items: { n: string; v: number }[], format: (value: number) => string): string => components.rankingBars(items, format),
  emptyChart: (text: string): string => components.emptyChart(text),
  donut: (items: { n: string; v: number }[]): string => components.donut(items),
  monthsBetween: (from: string, to: string): string[] => mesesEntre(from, to),
  skeletonCard: (title: string): string => components.cardSkeleton(title),
  /** A company word with its singular, plural and gender. */
  wordOf: (key: string): { s: string; p: string; g?: string } => terminoDe(key) as { s: string; p: string; g?: string },
  userName: (): string => (sessionStore.profile as { nombre?: string } | null)?.nombre ?? '',
  mountPeriod: (element: HTMLElement | null, options: { id: string; valor: string; alCambiar: () => void }): void => { montarPeriodo(element, options); },
  periodOf: (element: HTMLElement | null): { desde: string | null; hasta: string | null } =>
    (Reflect.get(element ?? {}, '__rango') as (() => { desde: string | null; hasta: string | null }) | undefined)?.() ?? { desde: null, hasta: null },
  /** On entering the portal the period is always «Esta semana»: the remembered one is forgotten. */
  forgetPeriod: (): void => { try { localStorage.removeItem(`dlc-per-informe-${(sessionStore.profile as { id?: string } | null)?.id ?? ''}`); } catch { /* not remembered */ } },
  /** At start the plan may not have arrived yet. */
  loadPlan: async (): Promise<void> => {
    if ('estado' in sessionStore.plan) return;
    const { data } = await RPC_ORIG<{ plan?: typeof sessionStore.plan }>('plan_uso', {});
    if (data?.plan) sessionStore.plan = data.plan;
  },
  /** Saves the invoice as PDF with the company design (and `overrides`, e.g. the proforma title). */
  saveInvoice: async (invoice: InvoiceData, rectifies: string, overrides: Partial<PdfDesign>, fileName: string | null): Promise<void> => {
    const design = invoice.diseno ?? {};
    const doc = await facturaPDF(invoice, rectifies, { ...PDF_DEF, ...design, cols: { ...PDF_DEF.cols, ...design.cols }, ...overrides });
    doc.save(fileName ?? nombrePDF(invoice));
  },
  reportError: (message: string, error: unknown): void => { registrarError('app', message, { e: String(error) }); },
  centreStateClass: (state: string): string => NOMBRE_ESTADO_CENTRO[state] ?? '',
};
