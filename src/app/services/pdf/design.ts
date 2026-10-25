/**
 * The invoice PDF design: the default one, the company's (Facturación → Diseño del PDF) and the saved designs («plantillas»), one
 * of them the default. Migrated from the legacy PDF_DEF, cfgPDF, listaPDF, guardarPDFPlantillas and elegirPlantillaPDF (v2.427.0);
 * PDF_DEF, listaPDF and guardarPDFPlantillas stay as legacy names (Configuración, the portal and legado 156 use them).
 */
import { notices } from '../../legacy/bridge';
import { billing2Legacy } from '../../legacy/billing2-bridge';
import { t } from '../../i18n';

export interface InvoiceColumns { precio: boolean; unidades: boolean; subtotal: boolean; iva: boolean; total: boolean }
export interface InvoiceDesign {
  logo: boolean; logoPos: string; logoTam: string; color: string; titulo: string; fuente: string; empresaCab: boolean; clientePos: string;
  cols: InvoiceColumns; fotos: boolean; vencimiento: boolean; formaPago: boolean; iban: boolean; direccion: boolean;
  pieTel: boolean; pieWeb: boolean; pieTexto: boolean; paginas: boolean; qrPos: string;
  [key: string]: unknown;
}
export interface DesignTemplate { id: string; nombre: string; cfg?: Partial<InvoiceDesign> | null }
export interface DesignTemplates { lista: DesignTemplate[]; defecto: string }

export const DEFAULT_DESIGN: InvoiceDesign = {
  logo: true, logoPos: 'izq', logoTam: 'm', color: '#1C2733', titulo: t('billingMore.pdf.title'), fuente: 'helvetica', empresaCab: false, clientePos: 'der',
  cols: { precio: true, unidades: true, subtotal: true, iva: true, total: true }, fotos: true, vencimiento: true, formaPago: true, iban: true, direccion: true,
  pieTel: true, pieWeb: true, pieTexto: true, paginas: true, qrPos: 'abajo',
};

const settingsOf = (key: string): Record<string, unknown> => (billing2Legacy.settings()[key] ?? {}) as Record<string, unknown>;

/** A design completed with the default values (columns too). */
export function completeDesign(design: Partial<InvoiceDesign> | null | undefined): InvoiceDesign {
  const own = design ?? {};
  return { ...DEFAULT_DESIGN, ...own, cols: { ...DEFAULT_DESIGN.cols, ...own.cols } } as InvoiceDesign;
}

/** The company's design (the default template). */
export const currentDesign = (): InvoiceDesign => completeDesign(settingsOf('factura_pdf') as Partial<InvoiceDesign>);

/** The saved designs and the default one (one «Diseño principal» while there are none). */
export function templateList(): DesignTemplates {
  const saved = settingsOf('factura_pdf_plantillas') as { lista?: DesignTemplate[]; defecto?: string };
  const list = saved.lista ?? [];
  if (Array.isArray(list) && list.length) return { lista: list, defecto: saved.defecto ?? list[0]?.id ?? '' };
  return { lista: [{ id: 'base', nombre: t('billingMore.templates.designs'), cfg: settingsOf('factura_pdf') as Partial<InvoiceDesign> }], defecto: 'base' };
}

/** The design of a saved template, completed with the default values. */
export const designOfTemplate = (id: string): InvoiceDesign => completeDesign(templateList().lista.find(item => item.id === id)?.cfg);

export async function saveTemplates(value: DesignTemplates): Promise<boolean> {
  const { data: result, error } = await billing2Legacy.saveSettingEverywhere<{ ok?: boolean }>('guardar_ajuste', { p_clave: 'factura_pdf_plantillas', p_valor: value });
  if (error || result?.ok === false) { notices.toast(t('billingMore.templates.couldNotSave'), true); return false; }
  billing2Legacy.settings().factura_pdf_plantillas = value;
  return true;
}

/** With more than one design, asks which one (the default first); false if cancelled. The choice stays in PDF_ELEGIDO. */
export async function chooseTemplate(): Promise<boolean> {
  const { lista, defecto } = templateList();
  billing2Legacy.setPdfChosen(null);
  if (lista.length < 2) return true;
  const main = lista.find(item => item.id === defecto) ?? lista[0];
  if (!main) return true;
  const buttons = [main, ...lista.filter(item => item !== main)].map((item, index) => ({ k: item.id, t: item.nombre, cls: index ? 'sec' : '' }));
  const chosen = await notices.choose(t('billingMore.templates.whichTitle'), t('billingMore.templates.which', { count: lista.length, name: main.nombre }),
    [{ k: '', t: t('billingMore.templates.cancel'), cls: 'sec' }, ...buttons]);
  if (!chosen) return false;
  billing2Legacy.setPdfChosen(chosen);
  return true;
}
