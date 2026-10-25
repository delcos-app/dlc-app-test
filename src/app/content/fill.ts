/** {placeholders} of the content catalogs, filled with the company's words. */
export const fill = (text: string, words: Readonly<Record<string, string>>): string =>
  text.replace(/\{(\w+)\}/g, (whole, name: string) => words[name] ?? whole);

/** A catalog with every text filled: always a new copy (legacy code still adds to some of them at run time). */
export function fillDeep<T>(value: T, words: Readonly<Record<string, string>>): T {
  if (typeof value === 'string') return fill(value, words) as T;
  if (Array.isArray(value)) return value.map(item => fillDeep(item as unknown, words)) as T;
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, fillDeep(item as unknown, words)])) as T;
  return value;
}
