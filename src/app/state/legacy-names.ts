/**
 * Plan 6.6: each screen keeps its state in one typed object in src/app. The remaining legacy code and the tests still use the old
 * global names (AG_FECHA, PEDSEC…): they become accessors on window that read and write the same object, so both always agree.
 * They are installed while the bundle loads, before any legacy piece of app.js runs (src/generated/core.js goes first).
 */
export function exposeLegacyNames<T extends object>(state: T, names: readonly (readonly [string, keyof T])[]): void {
  for (const [name, key] of names) {
    Object.defineProperty(window, name, {
      get: (): T[keyof T] => state[key],
      set: (value: T[keyof T]): void => { state[key] = value; },
      configurable: true,
      enumerable: true,
    });
  }
}
