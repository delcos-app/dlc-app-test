/** The templates bar of the PDF designer: choose, new, rename, use by default and remove. Part of the legacy disenoPDF (v2.427.0). */
import { notices } from '../../legacy/bridge';
import { billing2Legacy } from '../../legacy/billing2-bridge';
import { t } from '../../i18n';
import { saveTemplates, type DesignTemplate, type DesignTemplates } from './design';

const button = (id: string): HTMLElement | null => document.getElementById(id);

/** Opens the designer on another template (through the legacy name, which the wide window wraps). */
const openTemplate = (id: string): void => { billing2Legacy.setPdfEditing(id); billing2Legacy.openDesigner(); };

const askName = (value: string, title: string, ok: string): Promise<string | null> =>
  billing2Legacy.askText(t('billingMore.templates.name'), value, { titulo: title, ok });

async function addTemplate(templates: DesignTemplates, current: DesignTemplate): Promise<void> {
  const name = await askName(t('billingMore.templates.copy', { name: current.nombre }), t('billingMore.templates.newTitle'), t('billingMore.templates.create'));
  if (!name?.trim()) return;
  const id = billing2Legacy.newTemplateId();
  templates.lista.push({ id, nombre: name.trim(), cfg: JSON.parse(JSON.stringify(current.cfg ?? {})) as NonNullable<DesignTemplate['cfg']> });
  if (await saveTemplates({ lista: templates.lista, defecto: templates.defecto })) openTemplate(id);
}

async function renameTemplate(templates: DesignTemplates, current: DesignTemplate): Promise<void> {
  const name = await askName(current.nombre, t('billingMore.templates.renameTitle'), t('billingMore.templates.save'));
  if (!name?.trim()) return;
  current.nombre = name.trim();
  if (await saveTemplates({ lista: templates.lista, defecto: templates.defecto })) openTemplate(current.id);
}

/** The company's design (factura_pdf) follows the default template. */
async function saveCompanyDesign(design: DesignTemplate['cfg']): Promise<boolean> {
  const { data: result } = await billing2Legacy.saveSettingEverywhere<{ ok?: boolean }>('guardar_ajuste', { p_clave: 'factura_pdf', p_valor: design ?? {} });
  return result !== null && result.ok !== false;
}

async function makeDefault(templates: DesignTemplates, current: DesignTemplate): Promise<void> {
  if (!await saveTemplates({ lista: templates.lista, defecto: current.id })) return;
  if (await saveCompanyDesign(current.cfg)) billing2Legacy.settings().factura_pdf = current.cfg ?? {};
  notices.toast(t('billingMore.templates.nowDefault', { name: current.nombre })); openTemplate(current.id);
}

async function removeTemplate(templates: DesignTemplates, current: DesignTemplate): Promise<void> {
  if (!await notices.confirm(t('billingMore.templates.removeText', { name: current.nombre }), { titulo: t('billingMore.templates.removeTitle'), ok: t('billingMore.templates.remove') })) return;
  const rest = templates.lista.filter(item => item !== current), first = rest[0];
  if (!first) return;
  const main = current.id === templates.defecto ? first.id : templates.defecto;
  if (!await saveTemplates({ lista: rest, defecto: main })) return;
  if (main !== templates.defecto) { await saveCompanyDesign(first.cfg); billing2Legacy.settings().factura_pdf = first.cfg ?? {}; }
  notices.toast(t('billingMore.templates.removed')); openTemplate(main);
}

export function bindTemplates(templates: DesignTemplates, current: DesignTemplate): void {
  const select = button('pdfplsel') as HTMLSelectElement | null;
  if (select) select.onchange = (): void => { openTemplate(select.value); };
  const actions: readonly (readonly [string, (all: DesignTemplates, chosen: DesignTemplate) => Promise<void>])[] = [
    ['pdfplnueva', addTemplate], ['pdfplren', renameTemplate], ['pdfpldef', makeDefault], ['pdfplx', removeTemplate],
  ];
  actions.forEach(([id, action]) => { const element = button(id); if (element) element.onclick = (): void => { void action(templates, current); }; });
}
