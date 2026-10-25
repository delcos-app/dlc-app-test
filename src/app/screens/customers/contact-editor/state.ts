/**
 * What the customer editor keeps while it is open: the customer being changed (or a new one), what to do after saving, the call it
 * comes from, the person or company type, the professional who treats them and whether that professional changes on each order.
 */
import type { CallState } from '../../opportunities/call-record';
import { TYPES } from '../model';

export interface EditedCustomer {
  id?: string | null; nombre?: string | null; tipo?: string | null; nif?: string | null; direccion?: string | null; cp?: string | null; municipio?: string | null;
  provincia?: string | null; telefono?: string | null; movil?: string | null; email?: string | null; empresa?: string | null; nota?: string | null;
  cuenta_id?: string | null; medico?: string | null; medico_codigo?: string | null;
}
export interface TreatingAccount { id: string; nombre?: string; codigo?: string | null }
export interface SavedCustomer { id: string; nombre: string; movil?: string | null; telefono?: string | null; cuenta_id?: string | null; medico?: string; medico_codigo?: string | null }
export interface EditorOptions { llamada?: CallState | null }

export interface EditorState {
  customer: EditedCustomer; onSave: ((customer: SavedCustomer) => void) | null; options: EditorOptions;
  /** v2.119.0: a new customer from an old call shows its «Registro de llamada» */
  withCall: boolean; type: string; account: TreatingAccount | null; freeBefore: boolean;
}

export const isCompany = (state: EditorState): boolean => state.type === TYPES.company;

export const field = (id: string): HTMLInputElement | null => document.getElementById(id) as HTMLInputElement | null;
export const fieldValue = (id: string): string => field(id)?.value.trim() ?? '';
/** v2.329.0: the professional changes on each order (it is not kept in the customer). */
export const freeAccount = (): boolean => Boolean(field('komlibre')?.checked);
