/**
 * Email templates to customers (setting plantillas_correo.lista = [{ id, nombre, uso, asunto, texto, defecto }]): the list (the two
 * of always when nothing is saved), the one chosen when sending and filling its [gaps]. Migrated from the legacy listaCorreos,
 * plantillaCorreo, varsCorreo, guardarCorreos and elegirPlantillaCorreo (v2.417.0); those names stay as adapters (Pedidos,
 * Facturación and the tests use them).
 */
import { legacyDb, notices } from '../../../legacy/bridge';
import { settingsExtraLegacy } from '../../../legacy/settings3-bridge';
import { t, type MessageKey } from '../../../i18n';
import { orFallback } from '../../../services/values';

export interface EmailTemplate { id: string; nombre: string; uso: string; asunto: string; texto: string; defecto: boolean }
type TemplateField = 'asunto' | 'texto';
interface TemplateSettings { lista?: EmailTemplate[]; [use: string]: unknown }

export const USES = ['pago', 'factura'] as const;

export const useLabel = (use: string): string => t(`settingsExtra.templates.uses.${use === 'factura' ? 'factura' : 'pago'}` as MessageKey);

/** The texts of always of a use (title, subject and text). */
export function defaultTemplate(use: string): { titulo: string; asunto: string; texto: string } {
  const key = use === 'factura' ? 'factura' : 'pago';
  return {
    titulo: t(`settingsExtra.templates.defaults.${key}Title` as MessageKey),
    asunto: t(`settingsExtra.templates.defaults.${key}Subject` as MessageKey),
    texto: t(`settingsExtra.templates.defaults.${key}Text` as MessageKey),
  };
}

/** The gaps a template can have, with what each one is. */
export const VARIABLES: readonly (readonly [string, MessageKey])[] = [
  ['nombre', 'settingsExtra.templates.variables.nombre'], ['nombre_pila', 'settingsExtra.templates.variables.nombrePila'],
  ['empresa', 'settingsExtra.templates.variables.empresa'], ['documento', 'settingsExtra.templates.variables.documento'],
  ['Documento', 'settingsExtra.templates.variables.documentoCapital'], ['numero', 'settingsExtra.templates.variables.numero'],
  ['importe', 'settingsExtra.templates.variables.importe'], ['beneficiario', 'settingsExtra.templates.variables.beneficiario'],
  ['iban', 'settingsExtra.templates.variables.iban'],
];

export const newTemplateId = (): string => `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

const saved = (): TemplateSettings => (settingsExtraLegacy.setting('plantillas_correo') ?? {}) as TemplateSettings;

/** Every template; without a saved list, the two of always (with the texts saved before the list existed). */
export function templateList(): EmailTemplate[] {
  const settings = saved();
  if (Array.isArray(settings.lista) && settings.lista.length) return settings.lista;
  return USES.map(use => {
    const old = (settings[use] ?? {}) as { asunto?: string; texto?: string }, base = defaultTemplate(use);
    return { id: use, nombre: base.titulo, uso: use, asunto: orFallback(old.asunto, base.asunto), texto: orFallback(old.texto, base.texto), defecto: true };
  });
}

export const templatesFor = (use: string): EmailTemplate[] => templateList().filter(template => template.uso === use);

export async function saveTemplates(list: EmailTemplate[]): Promise<boolean> {
  const value = { ...saved(), lista: list };
  const { data: result, error } = await legacyDb().rpc<{ ok?: boolean }>('guardar_ajuste', { p_clave: 'plantillas_correo', p_valor: value });
  if (error || result?.ok === false) { notices.toast(t('settingsExtra.templates.couldNotSave'), true); return false; }
  settingsExtraLegacy.setSetting('plantillas_correo', value); return true;
}

export interface EmailValues { nombre?: string | null; documento?: string; numero?: string | null; importe?: number | null }

/** The values of the gaps for a document and a customer. */
export function emailVariables(values: EmailValues): Record<string, string> {
  const company = (settingsExtraLegacy.setting('empresa') ?? {}) as { razon_social?: string; iban?: string };
  const name = orFallback(company.razon_social, settingsExtraLegacy.appName()), document = values.documento ?? t('settingsExtra.templates.order');
  return {
    nombre: values.nombre ?? '', nombre_pila: values.nombre ? settingsExtraLegacy.firstName(values.nombre) : '', empresa: name, documento: document,
    Documento: document.charAt(0).toUpperCase() + document.slice(1), numero: values.numero ?? '', importe: settingsExtraLegacy.euros(values.importe ?? 0),
    beneficiario: name, iban: company.iban ?? '',
  };
}

/** The subject or the text of the chosen (or default) template of a use, with its gaps filled. */
export function fillTemplate(use: string, field: TemplateField, values: Readonly<Record<string, string>>): string {
  const list = templatesFor(use), chosen = settingsExtraLegacy.chosenTemplate(use);
  const template = list.find(item => item.id === chosen) ?? list.find(item => item.defecto) ?? list[0];
  const text = (template?.[field] ?? '').trim() || defaultTemplate(use)[field];
  return text.replace(/\[(\w+)\]/g, (whole, name: string) => (name in values ? values[name] ?? '' : whole)).replace(/ {2,}/g, ' ').trim();
}

/** When there is more than one template for a use, asks which one; false if cancelled. */
export async function chooseTemplate(use: string): Promise<boolean> {
  const list = templatesFor(use); settingsExtraLegacy.chooseTemplate(use, null);
  if (list.length < 2) return true;
  const byDefault = list.find(item => item.defecto) ?? list[0];
  if (!byDefault) return true;
  const ordered = [byDefault, ...list.filter(item => item !== byDefault)];
  const chosen = await notices.choose(t('settingsExtra.templates.whichTitle'), t('settingsExtra.templates.whichText', { count: list.length, use: useLabel(use), name: byDefault.nombre }),
    [{ k: '', t: t('settingsExtra.templates.cancel'), cls: 'sec' }, ...ordered.map((item, index) => ({ k: item.id, t: item.nombre, cls: index ? 'sec' : '' }))]);
  if (!chosen) return false;
  settingsExtraLegacy.chooseTemplate(use, chosen); return true;
}
