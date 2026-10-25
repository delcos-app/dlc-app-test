/** What the content catalogs (src/app/content) still read from legacy: the name of a commercial state, «todos los …», money formats. */
export const contentLegacy = {
  stateOf: (role: string): string => estadoPapel(role),
  allOf: (word: string): string => todosLos(word),
  roundEuros: (value: number): string => eurI(value),
  percent: (part: number | undefined, total: number | undefined): number => pct(part, total),
};
