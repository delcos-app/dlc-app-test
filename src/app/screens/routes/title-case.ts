/** «SANT CUGAT DEL VALLÈS» → «Sant Cugat Del Vallès»: each word with a capital. Migrated from the legacy rpTitulo (v2.418.0); the name
 * stays as an adapter (Analítica uses it for the towns). */
export const titleCase = (text: string | null | undefined): string =>
  String(text ?? '').toLowerCase().replace(/(^|[\s\-'·])(\p{L})/gu, (...groups: string[]) => (groups[1] ?? '') + (groups[2] ?? '').toUpperCase());
