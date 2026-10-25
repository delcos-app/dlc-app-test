/** Small value helpers shared by every module. */

/** `value`, or `fallback` when it is empty (undefined, null or ''): the behaviour of the legacy `value || fallback` for texts. */
export function orFallback(value: string | null | undefined, fallback: string): string {
  return value === undefined || value === null || value === '' ? fallback : value;
}

/** `value`, or `fallback` when it is missing or zero: the legacy `count || fallback` for numbers. */
export function nonZeroOr(value: number | null | undefined, fallback: number): number {
  return value === undefined || value === null || value === 0 || Number.isNaN(value) ? fallback : value;
}
