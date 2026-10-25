/** Small value helpers shared by every module. */

/** `value`, or `fallback` when it is empty (undefined, null or ''): the behaviour of the legacy `value || fallback` for texts. */
export function orFallback(value: string | null | undefined, fallback: string): string {
  return value === undefined || value === null || value === '' ? fallback : value;
}

/** `value`, or `fallback` when it is missing or zero: the legacy `count || fallback` for numbers. */
export function nonZeroOr(value: number | null | undefined, fallback: number): number {
  return value === undefined || value === null || value === 0 || Number.isNaN(value) ? fallback : value;
}

/** 0, 1, … length − 1. */
export const range = (length: number): number[] => [...Array(length).keys()];

export const sum = (values: readonly number[]): number => values.reduce((total, value) => total + value, 0);

/** Neither null nor undefined (0 and '' count as present). */
export const isPresent = <T>(value: T | null | undefined): value is T => value !== null && value !== undefined;
