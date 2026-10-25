/**
 * The opportunity window, step 3: make the order (the opportunity stays open and the order closes it), save it without order, or
 * save the changes of an existing one.
 */
import { currentScreen, legacyDb, notices, opportunitiesLegacy } from '../../../legacy/bridge';
import { t } from '../../../i18n';
import { orFallback } from '../../../services/values';
import { isPhone, ORDER_DONE, orderLineAmount } from '../model';
import { fieldValue, typedQuery, type Draft } from './draft';

interface SaveResult { ok?: boolean; id?: string; motivo?: string }

const closeWindow = (): void => { (document.getElementById('dlg') as HTMLDialogElement | null)?.close(); };

/** The Oportunidades tab repaints if it is open behind the window. */
export const refreshList = (): void => { if (currentScreen() === 'ventas' && opportunitiesLegacy.ordersSection() === 'llamadas') opportunitiesLegacy.repaintList(); };

const wantedLines = (draft: Draft): { producto_id: string; unidades: number }[] =>
  draft.lines.filter(line => line.producto_id && Number(line.unidades) > 0).map(line => ({ producto_id: line.producto_id, unidades: Number(line.unidades) }));

function who(draft: Draft): { nombre: string; telefono: string } {
  const typed = typedQuery(), phone = isPhone(typed), source = draft.source;
  if (draft.client) return { nombre: orFallback(draft.client.nombre, ''), telefono: orFallback(draft.client.movil, orFallback(draft.client.telefono, orFallback(draft.client.tel, ''))) };
  return { nombre: orFallback(phone ? '' : typed, orFallback(source.nombre, '')), telefono: phone ? typed : orFallback(source.telefono, '') };
}

/** The professional or centre of reference, or the name typed when it is not in the base. */
function reference(draft: Draft): Record<string, unknown> {
  const freeText = String(Reflect.get(document.getElementById('nvmed') ?? {}, '__texto') ?? '');
  return { cuenta_id: draft.reference ? draft.reference.id : null, cuenta_texto: draft.reference ? '' : freeText.trim() };
}

/** When to call again, only for an opportunity that ends without order. */
function nextStep(result: string): Record<string, unknown> {
  const followUp = Boolean(result) && result !== ORDER_DONE;
  return { proxima_fecha: followUp ? fieldValue('nvpf') ?? '' : '', proxima_accion: followUp ? (fieldValue('nvpa') ?? '').trim() : '' };
}

function payload(draft: Draft, result: string): Record<string, unknown> {
  const source = draft.source, date = fieldValue('nvf');
  return {
    id: source.id ?? null, fecha: date ? new Date(date).toISOString() : source.fecha, ...who(draft), contacto_id: draft.client ? draft.client.id : null,
    ...reference(draft), origen: draft.origin, motivo: draft.reason, resultado: result, ...nextStep(result),
    nota: fieldValue('nvno')?.trim() ?? orFallback(source.nota, ''), pedido_id: source.pedido_id ?? null,
    llamada_origen: draft.previous ? draft.previous.id : source.llamada_origen ?? null, interes: wantedLines(draft),
  };
}

function failure(error: unknown, result: SaveResult | null): string {
  if (error) return t('opportunities.editor.couldNotSaveError', { error: (error as { message?: string }).message ?? '' });
  return t(result?.motivo === 'extra' ? 'opportunities.editor.noExtra' : 'opportunities.editor.couldNotSave');
}

/** Saves the opportunity; an empty result keeps it open. */
async function save(draft: Draft, result: string): Promise<SaveResult | null> {
  const { data, error } = await legacyDb().rpc<SaveResult>('guardar_llamada', { p: payload(draft, result) });
  if (error || !data || data.ok === false) { notices.toast(failure(error, data), true); return null; }
  return data;
}

async function makeOrder(draft: Draft, button: HTMLButtonElement): Promise<void> {
  const client = draft.client;
  if (!client) { notices.toast(t('opportunities.editor.findClient'), true); return; }
  button.disabled = true;
  let saved: SaveResult | null = null;
  if (draft.recording) { saved = await save(draft, ''); if (!saved) { button.disabled = false; return; } }
  const { data: contact } = await legacyDb().from<Record<string, unknown> | null>('contactos').select('id,nombre,nif,email,telefono,movil,cuenta_id').eq('id', client.id).maybeSingle();
  closeWindow(); refreshList();
  if (saved?.id) opportunitiesLegacy.setPendingCall(saved.id);
  const lines = draft.recording ? wantedLines(draft).map(line => ({ ...line, importe: orderLineAmount(line.producto_id, line.unidades) })) : [];
  const reference = draft.reference;
  opportunitiesLegacy.editOrder({
    contacto: { ...(contact ?? client), medico: reference ? orFallback(reference.nombre, '') : '' }, medico: reference ? { id: reference.id, nombre: reference.nombre } : null,
    lineas: lines.length ? lines : undefined, origen: /web/i.test(draft.origin) ? 'web' : undefined,
  });
}

async function saveWithoutOrder(draft: Draft, button: HTMLButtonElement): Promise<void> {
  if (!draft.result) { notices.toast(t('opportunities.editor.markWhy'), true); return; }
  if (!draft.client && !typedQuery() && !draft.source.nombre && !draft.source.telefono) { notices.toast(t('opportunities.editor.nameOrPhone'), true); return; }
  button.disabled = true;
  const saved = await save(draft, draft.result);
  button.disabled = false;
  if (!saved) return;
  closeWindow(); notices.toast(t('opportunities.editor.savedNoOrder')); refreshList();
}

async function saveChanges(draft: Draft): Promise<void> {
  const result = draft.closed ? orFallback(draft.source.resultado, ORDER_DONE) : draft.noSale ? draft.result : '';
  if (!await save(draft, result)) return;
  closeWindow(); notices.toast(t('opportunities.editor.saved')); refreshList();
}

export function bindOutcome(draft: Draft): void {
  const order = document.getElementById('nvped') as HTMLButtonElement | null;
  if (order) order.onclick = (): void => { void makeOrder(draft, order); };
  const noOrder = document.getElementById('nvnook') as HTMLButtonElement | null;
  if (noOrder) noOrder.onclick = (): void => { void saveWithoutOrder(draft, noOrder); };
  const changes = document.getElementById('nvguar');
  if (changes) changes.onclick = (): void => { void saveChanges(draft); };
}
