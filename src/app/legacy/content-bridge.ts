/** What the content catalogs (src/app/content) still read from legacy: the name of a commercial state, «todos los …», money formats. */
import * as legacyFreeCoreServices from '../core/services';
export const contentLegacy = {
  stateOf: (role: string): string => legacyFreeCoreServices.states.stateOfRole(role),
  allOf: (word: string): string => legacyFreeCoreServices.vocabulary.allOf(word),
  roundEuros: (value: number): string => legacyFreeCoreServices.money.eurosRounded(value),
  percent: (part: number | undefined, total: number | undefined): number => pct(part, total),
};
