/**
 * The window to create or edit a route by list or by criteria: what it holds while it is open (head fields, mode, accounts and
 * centres chosen, searches, filter options and rules) and how it repaints itself (index.ts sets `repaint`, because the parts cannot
 * import it back). Migrated from the legacy editorRuta (v2.418.0).
 */
export interface EditorMember { id: string; nombre: string; especialidad?: string | null; centro_nombre?: string | null; municipio?: string | null; centro_ruta?: string | null }
export interface EditorCentre { id: string; nombre: string; municipio?: string | null }
export interface FilterOption { v: string }
export interface FilterOptions { provincias?: FilterOption[]; municipios?: FilterOption[]; centros?: FilterOption[]; especialidades?: FilterOption[]; estados?: FilterOption[] }
export interface RouteRules { provincia?: string; municipio?: string; centro?: string; especialidad?: string; estado?: string; sinVisita?: number; dia?: string; urgentes?: boolean }
export interface EditorHead { nombre: string; tipo: string; desde: string; salida: string; vuelta: string }

export interface EditorState {
  id: string | null; route: SavedRoute | null; mode: 'lista' | 'crit'; codes: string[]; members: EditorMember[]; centres: EditorCentre[];
  search: string; centreSearch: string; head: EditorHead; options: FilterOptions; rules: RouteRules;
}

export const editorHooks = { repaint: (): void => undefined };

const field = (id: string): string | undefined => (document.getElementById(id) as HTMLInputElement | null)?.value;

/** Keeps what was written in the head fields before a repaint. */
export function readHead(state: EditorState): void {
  if (!document.getElementById('rn')) return;
  state.head = { nombre: field('rn') ?? '', tipo: field('rt') ?? '', desde: field('rd') ?? '', salida: field('rsal') ?? '', vuelta: field('rvue') ?? '' };
}
