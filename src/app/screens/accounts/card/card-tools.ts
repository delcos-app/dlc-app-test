/** Small helpers shared by the sections of the account card. */
import { accountCardLegacy, legacyDb } from '../../../legacy/bridge';

/** The card still shows this account (the person may have opened another one while a section was loading). */
export const stillShown = (id: string): boolean => accountCardLegacy.shownId() === id;

/** The place of the custom fields: the related blocks go just before it. */
export const fieldsPlace = (): HTMLElement | null => document.getElementById('fzcampos');

/** Adds a block before the custom fields, if the card still shows `id` and the block is not there yet. */
export function addBeforeFields(id: string, blockId: string, html: string): HTMLElement | null {
  const place = fieldsPlace();
  if (!place || document.getElementById(blockId) || !stillShown(id)) return null;
  place.insertAdjacentHTML('beforebegin', html);
  return document.getElementById(blockId);
}

/** Closes the card and runs `open` (another window takes its place). */
export function closeCardAnd(open: () => void): void {
  (document.getElementById('ficha') as HTMLDialogElement | null)?.close();
  open();
}

/** Binds every `[data-<key>]` button inside `block` to `action(value)`. */
export function onEach(block: HTMLElement, key: string, action: (value: string) => void): void {
  block.querySelectorAll<HTMLElement>(`[data-${key}]`).forEach(button => {
    button.onclick = (): void => { action(button.getAttribute(`data-${key}`) ?? ''); };
  });
}

export interface AccountKind { readonly tipo?: string | null; readonly nombre?: string | null; readonly centro_id?: string | null; readonly archivado_en?: string | null }

/** The kind of account (centre or not), its name, its centre and whether it is archived. */
export async function accountKind(id: string): Promise<AccountKind | null> {
  const { data } = await legacyDb().from<AccountKind>('cuentas').select('tipo, nombre, centro_id, archivado_en').eq('id', id).maybeSingle();
  return data;
}

/** The rows of the visit history in the card (each with data-vrow = activity id). */
export const historyRows = (): HTMLElement[] => [...document.querySelectorAll<HTMLElement>('#fbody [data-vrow]')];
