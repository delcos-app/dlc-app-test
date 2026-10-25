/**
 * «Diseño del PDF de la factura»: the options with a live preview, saving the design, going back to the original one, and the
 * templates bar (choose, new, rename, use by default, remove). Inside the Configuración panel (computer) it stays open; on the phone
 * it is a window that leaves a card behind. Migrated from the legacy disenoPDFBase and disenoPDF (v2.427.0); disenoPDF stays as
 * an adapter (Organización, Configuración and the billing tab bar open it by that name).
 */
import { currentScreen, legacyDb, notices } from '../../legacy/bridge';
import { billing2Legacy } from '../../legacy/billing2-bridge';
import { t } from '../../i18n';
import { withLoading } from '../../components/loading-button';
import { completeDesign, DEFAULT_DESIGN, templateList, type InvoiceDesign } from './design';
import { designerCardHtml, designerHtml, templatesBarHtml } from './designer-form';
import { sampleInvoice } from './download';
import { bindTemplates } from './designer-templates';
import { invoicePdf } from './invoice';

const PREVIEW_WAIT_MS = 250, REOPEN_WAIT_MS = 50, PREVIEW_HASH = '#toolbar=0&navpanes=0&view=FitH';

const byId = (id: string): HTMLElement | null => document.getElementById(id);
const dialog = (): HTMLDialogElement | null => byId('dlg') as HTMLDialogElement | null;
const copy = (design: InvoiceDesign): InvoiceDesign => JSON.parse(JSON.stringify(design)) as InvoiceDesign;

const onDesignPage = (): boolean => {
  const screen = currentScreen();
  return (screen === 'organizacion' && billing2Legacy.pageTab('organizacion') === 'pdf') || (screen === 'config' && billing2Legacy.configKey() === 'o.pdf');
};

let previewTimer: ReturnType<typeof setTimeout> | undefined;

function preview(design: InvoiceDesign): void {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(() => {
    void invoicePdf(sampleInvoice(), '', design).then(doc => { const frame = byId('pdfif') as HTMLIFrameElement | null; if (frame) frame.src = doc.output('bloburl') + PREVIEW_HASH; });
  }, PREVIEW_WAIT_MS);
}

/** On the phone the designer is a window; closing it leaves the tab with a card to open it again (not the spinner). */
function leaveCardOnClose(box: HTMLDialogElement): void {
  box.dataset.depagina = '1';
  box.addEventListener('close', () => {
    delete box.dataset.depagina;
    const area = document.querySelector('#v-organizacion .pagcuerpo') ?? (currentScreen() === 'config' ? byId('cfgcuerpo') : null);
    if (!area || !onDesignPage()) return;
    area.innerHTML = designerCardHtml();
    const open = byId('pdfabrir'); if (open) open.onclick = (): void => { billing2Legacy.openDesigner(); };
  }, { once: true });
}

/** Inside the panel (computer): no closing; «Descartar cambios» goes back to what is saved. */
function stayInPage(body: HTMLElement, box: HTMLDialogElement): void {
  box.dataset.fija = '1';
  body.querySelector('.fh .x')?.remove();
  const cancel = body.querySelector<HTMLButtonElement>('.acts [data-cerrar]');
  if (!cancel) return;
  cancel.removeAttribute('data-cerrar'); cancel.textContent = t('billingMore.designer.discard');
  cancel.onclick = (): void => { billing2Legacy.openDesigner(); };
}

function bindOptions(body: HTMLElement, design: InvoiceDesign): void {
  body.querySelectorAll<HTMLElement>('[data-pk]').forEach(group => {
    group.querySelectorAll<HTMLButtonElement>('button').forEach(button => {
      button.onclick = (): void => {
        design[group.dataset.pk ?? ''] = button.dataset.v;
        group.querySelectorAll('button').forEach(other => { other.classList.toggle('on', other === button); }); preview(design);
      };
    });
  });
  body.querySelectorAll<HTMLInputElement>('[data-pc]').forEach(input => {
    input.onchange = (): void => {
      const [key = '', column] = (input.dataset.pc ?? '').split('.');
      if (column) design.cols[column as keyof InvoiceDesign['cols']] = input.checked; else design[key] = input.checked;
      preview(design);
    };
  });
  const colour = byId('pcol') as HTMLInputElement | null; if (colour) colour.oninput = (): void => { design.color = colour.value; preview(design); };
  const title = byId('ptit') as HTMLInputElement | null; if (title) title.oninput = (): void => { design.titulo = title.value.trim() || t('billingMore.pdf.title'); preview(design); };
}

/** guardar_ajuste through db: legado 156 saves it into the template being edited. */
async function save(design: InvoiceDesign, inPage: boolean): Promise<void> {
  const { data: result, error } = await legacyDb().rpc<{ ok?: boolean }>('guardar_ajuste', { p_clave: 'factura_pdf', p_valor: design });
  if (error || !result?.ok) { notices.toast(t('billingMore.designer.couldNotSave'), true); return; }
  billing2Legacy.settings().factura_pdf = copy(design);
  const box = dialog(); if (box) delete box.dataset.sucio;
  if (!inPage) box?.close();
  notices.toast(t('billingMore.designer.saved'));
}

function bindButtons(design: InvoiceDesign, inPage: boolean): void {
  const original = byId('pdfdef');
  if (original) original.onclick = (): void => {
    Object.assign(design, copy(DEFAULT_DESIGN));
    dialog()?.close();
    setTimeout(() => { void paintDesigner(design); }, REOPEN_WAIT_MS);
  };
  const ok = byId('pdfok') as HTMLButtonElement | null;
  if (ok) ok.onclick = (): void => { void withLoading(ok, t('billingMore.designer.saving'), () => save(design, inPage)); };
}

/** Paints the designer with a design (the template being edited, or a provisional one). */
async function paintDesigner(design: InvoiceDesign): Promise<void> {
  await billing2Legacy.loadSettings();
  const body = byId('dbody'), box = dialog();
  if (!body || !box) return;
  body.innerHTML = designerHtml(design);
  box.classList.add('amplia'); if (!box.open) box.showModal();
  const inPage = box.classList.contains('encajada');
  if (inPage) stayInPage(body, box);
  else if (onDesignPage()) leaveCardOnClose(box);
  bindOptions(body, design);
  bindButtons(design, inPage);
  preview(design);
  const templates = templateList(), current = templates.lista.find(item => item.id === billing2Legacy.pdfEditing()) ?? templates.lista[0];
  const header = body.querySelector('.fh');
  if (!current || !header || byId('pdfplbar')) return;
  header.insertAdjacentHTML('afterend', templatesBarHtml(templates, current));
  bindTemplates(templates, current);
}

/** Opens the designer on the template being edited (the default one the first time). */
export async function openDesigner(): Promise<void> {
  const templates = templateList(), editing = billing2Legacy.pdfEditing();
  if (!editing || !templates.lista.some(item => item.id === editing)) billing2Legacy.setPdfEditing(templates.defecto);
  const template = templates.lista.find(item => item.id === billing2Legacy.pdfEditing());
  await paintDesigner(completeDesign(template?.cfg ?? (billing2Legacy.settings().factura_pdf as Partial<InvoiceDesign> | undefined)));
}
