/** What the opportunity window is editing: the opportunity (or its starting data) and what the user chooses in it. */
import type { InterestLine } from '../model';

export interface Client { id: string; nombre?: string | null; movil?: string | null; telefono?: string | null; tel?: string | null; nif?: string | null; cuenta_id?: string | null; medico?: string | null }
export interface Reference { id: string; nombre?: string }

/** An opportunity as listed, or the data to start one ({ contacto, medico, interes, origen… }). */
export interface Opportunity {
  id?: string | null; fecha?: string | null; pedido_id?: string | null; pedido?: string | null; contacto?: Client | null; contacto_id?: string | null;
  cliente?: string | null; nombre?: string | null; tel_cliente?: string | null; telefono?: string | null; medico?: Reference | string | null; cuenta_id?: string | null;
  cuenta_texto?: string | null; interes?: { producto_id: string; unidades: number }[] | null; origen?: string | null; motivo?: string | null; resultado?: string | null;
  nota?: string | null; proxima_fecha?: string | null; proxima_accion?: string | null; llamada_origen?: string | null; direccion?: string | null;
}

/** The opportunity this one follows up (a «Volver a llamar»). */
export interface Previous { id: string; cliente?: string | null; nombre?: string | null }

export interface Draft {
  readonly source: Opportunity;
  readonly previous: Previous | null;
  /** The organisation records opportunities (the extra); otherwise the window only finds the client and makes the order. */
  readonly recording: boolean;
  /** Closed with an order. */
  readonly closed: boolean;
  client: Client | null;
  reference: Reference | null;
  lines: InterestLine[];
  origin: string;
  reason: string;
  result: string;
  noSale: boolean;
}

/** What is typed in the client search. */
export const typedQuery = (): string => (document.getElementById('nvq') as HTMLInputElement | null)?.value.trim() ?? '';

export const fieldValue = (id: string): string | null => {
  const field = document.getElementById(id) as HTMLInputElement | null;
  return field ? field.value : null;
};
