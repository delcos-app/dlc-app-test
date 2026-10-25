/** Small value helpers shared by every module. */

/** `value`, or `fallback` when it is empty (undefined, null or ''): the behaviour of the legacy `value || fallback` for texts. */
export function orFallback(value: string | null | undefined, fallback: string): string {
  return value === undefined || value === null || value === '' ? fallback : value;
}
