/**
 * Row selection and bulk actions of a list (D-048, v2.472.0; docs/seleccion_listas.md, variant A). A list declares `seleccion` in
 * its list-bar configuration (its actions and how its table is made); the screen publishes, each time it paints a page, the rows
 * of that page with their data, the filter they belong to and how to bring every row of the filter (publishPage, source.ts).
 */

/** One selectable row: its id, the words that name it in the summary («5 nov · Pablo Navarro») and the screen's own data. */
export interface SelectableRow { readonly id: string; readonly label: string; readonly data: unknown }

/** What one item answered: null when it was done, otherwise the reason in words. */
export type ItemOutcome = string | null;

/** A value of an exported cell: text, a number (to add up in Excel), a date or nothing. */
export type ExportCell = string | number | Date | null;

/** The confirmation of an action: title, text and the button. */
export interface Confirmation { readonly titulo: string; readonly texto: string; readonly ok: string }

/** The answer to a question asked once for all the rows (the reason to void, the user to assign…): its value and its words. */
export interface Answer { readonly value: string | null; readonly label: string }

/** An action over the selected rows. */
export interface BulkAction {
  readonly id: string;
  /** Button text, the verb in infinitive («Marcar preparado») */
  readonly label: string;
  /** Destructive (red; the confirmation says it cannot be undone) */
  readonly danger?: boolean;
  /** Who may use it (the database checks it again for each row) */
  readonly allowed: () => boolean;
  /** Why a row cannot take the action (null = it can): such rows are skipped and listed in the confirmation and the summary */
  readonly blocker: (row: SelectableRow) => string | null;
  /** A question asked once, before the confirmation (null = cancelled) */
  readonly ask?: () => Promise<Answer | null>;
  /** The confirmation for `count` rows; `skipped` says which are left out and why; `answer` is what was asked */
  readonly confirm: (count: number, skipped: string, answer: Answer | null) => Confirmation;
  /** Runs it on one row with the existing single-item function */
  readonly runOne: (row: SelectableRow, answer: Answer | null) => Promise<ItemOutcome>;
  /** Present tense for the progress line («Marcando como preparados») */
  readonly progress: string;
  /** Past tense for the summary («marcados como preparados») */
  readonly done: string;
}

/** Where the rows and the header of the list table are, inside its section. */
export interface TableShape {
  /** The table element that gets the checkbox column («.dgrid», «#tabla») */
  readonly table: string;
  /** The header row inside the section */
  readonly head: string;
  /** The rows inside the section */
  readonly rows: string;
  /** The data attribute with the row id («ped» for data-ped) */
  readonly idKey: string;
}

/** The selection of a list (the `seleccion` of its list-bar configuration). */
export interface SelectionConfig {
  /** The key of the published pages and of the export record («pedidos») */
  readonly key: string;
  readonly shape: TableShape;
  /** The list in plural, lower case («pedidos»), and whether its noun is feminine («facturas seleccionadas») */
  readonly what: () => string;
  /** The same in singular («pedido»), for «1 pedido seleccionado» */
  readonly one: () => string;
  readonly feminine?: boolean;
  /** The actions of this list (Exportar is added by the mechanism) */
  readonly actions: () => readonly BulkAction[];
  /** After an action: the list and its figures are asked for again */
  readonly reload: () => void;
}

/** What a screen publishes each time it paints a page of the list. */
export interface PageSource {
  /** The filter the page belongs to (search, period, filters…): when it changes, the selection is emptied */
  readonly filter: string;
  /** The rows of the page */
  readonly rows: readonly SelectableRow[];
  /** How many rows the filter has (every page) */
  readonly total: number;
  /** Every row of the filter, up to `limit` («Seleccionar los N del filtro») */
  readonly all?: (limit: number) => Promise<readonly SelectableRow[]>;
  /** The values of a row for Exportar, one per column of the table header in its order (hidden columns included) */
  readonly values?: (row: SelectableRow) => readonly ExportCell[];
}
