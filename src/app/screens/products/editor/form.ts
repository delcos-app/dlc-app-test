/**
 * The product form (administration): price without and with VAT kept in step, the photo preview, and saving with the photo and the
 * custom fields. Part of the legacy editorProductoBase (v2.427.0).
 */
import { legacyDb, notices } from '../../../legacy/bridge';
import { billing2Legacy } from '../../../legacy/billing2-bridge';
import { t } from '../../../i18n';
import { readCustomFields, saveCustomFields } from '../../settings/custom-fields/form';
import { errorMessage } from '../model';
import { round2 } from '../../../services/money';

export interface Product {
  id?: string; nombre?: string | null; presentacion?: string | null; precio?: number | null; iva?: number | null; referencia?: string | null;
  codigo_barras?: string | null; unidades_envase?: number | null; coste?: number | null; foto_url?: string | null; activo?: boolean | null; estado?: string;
}

interface Storage { from(bucket: string): { upload(path: string, file: File, options: { upsert: boolean }): Promise<{ error: { message?: string } | null }>; getPublicUrl(path: string): { data: { publicUrl: string } } } }

const field = (id: string): HTMLInputElement | null => document.getElementById(id) as HTMLInputElement | null;
const valueOf = (id: string): string => field(id)?.value ?? '';

function bindPrices(): void {
  const vat = (): number => (Number(valueOf('priva')) || 0) / 100, net = field('prpr'), gross = field('prpvp'), rate = field('priva');
  if (net && gross) net.oninput = (): void => { gross.value = net.value === '' ? '' : String(round2(Number(net.value) * (1 + vat()))); };
  if (net && gross) gross.oninput = (): void => { net.value = gross.value === '' ? '' : String(Number((Number(gross.value) / (1 + vat())).toFixed(4))); };
  if (net && gross && rate) rate.oninput = (): void => { if (net.value !== '') gross.value = String(round2(Number(net.value) * (1 + vat()))); };
}

function bindPhoto(): void {
  const input = field('prfoto'), preview = document.getElementById('prfprev');
  if (!input || !preview) return;
  input.onchange = (): void => {
    const file = input.files?.[0]; if (!file) return;
    preview.style.backgroundImage = `url('${URL.createObjectURL(file)}')`; preview.textContent = '';
  };
}

/** Uploads the chosen photo; its public address, or undefined (with a notice if it failed). */
async function uploadPhoto(): Promise<string | undefined> {
  const file = field('prfoto')?.files?.[0]; if (!file) return undefined;
  const storage = (legacyDb() as unknown as { storage: Storage }).storage, path = `p-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
  const { error } = await storage.from('productos').upload(path, file, { upsert: true });
  if (error) { notices.toast(t('productsMore.editor.photoFailed', { error: error.message ?? '' }), true); return undefined; }
  return storage.from('productos').getPublicUrl(path).data.publicUrl;
}

function payload(product: Product, photo: string | undefined): Record<string, unknown> {
  const active = field('pract');
  return {
    id: product.id ?? null, nombre: valueOf('prn').trim(), presentacion: valueOf('prp').trim(), precio: valueOf('prpr'), iva: valueOf('priva'),
    referencia: valueOf('prref').trim(), codigo_barras: valueOf('prcb').trim(), unidades_envase: valueOf('prue'), coste: valueOf('prco'),
    ...(photo ? { foto_url: photo } : {}), ...(active ? { activo: active.checked } : {}),
  };
}

/** The custom fields read, or false (with a notice) when the name or a compulsory field is missing. */
function checked(body: HTMLElement): ReturnType<typeof readCustomFields> | false {
  if (!valueOf('prn').trim()) { notices.toast(t('productsMore.editor.writeName'), true); return false; }
  const fields = readCustomFields(body);
  if (fields?.falta.length) { notices.toast(t('productsMore.editor.fillField', { field: fields.falta[0] ?? '' }), true); return false; }
  return fields;
}

interface SaveResult { ok?: boolean; id?: string; error?: string }

async function store(product: Product, button: HTMLButtonElement): Promise<SaveResult | null> {
  button.disabled = true; button.textContent = t('productsMore.editor.saving');
  const photo = await uploadPhoto();
  const { data: result, error } = await legacyDb().rpc<SaveResult>('guardar_producto', { p: payload(product, photo) });
  button.disabled = false; button.textContent = t(product.id ? 'productsMore.editor.save' : 'productsMore.editor.create');
  if (!error && result?.ok !== false) return result ?? {};
  notices.toast(t('productsMore.editor.couldNotSave', { error: errorMessage(error) || (result?.error ?? '') }), true);
  return null;
}

async function save(body: HTMLElement, product: Product, button: HTMLButtonElement, after: () => void): Promise<void> {
  const fields = checked(body); if (fields === false) return;
  const result = await store(product, button); if (!result) return;
  if (fields && !await saveCustomFields(fields, result.id ?? product.id)) return;
  (document.getElementById('dlg') as HTMLDialogElement | null)?.close();
  notices.toast(t(product.id ? 'productsMore.editor.saved' : 'productsMore.editor.created'));
  await billing2Legacy.loadProducts(); after();
}

export function bindForm(body: HTMLElement, product: Product, after: () => void): void {
  bindPrices(); bindPhoto();
  const ok = document.getElementById('prok') as HTMLButtonElement | null;
  if (ok) ok.onclick = (): void => { void save(body, product, ok, after); };
}
