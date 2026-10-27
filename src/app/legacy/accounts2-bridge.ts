/**
 * Bridge of the account editor, the saved filters, the timetable helpers, the portfolio window and the directory bar to the legacy
 * code (v2.419.0; kept apart from bridge.ts, which is at its size limit). What stays in legacy: the catalogues (CAT), the
 * commercial state roles, the hour lists, the day letters, the reverse geocoding and «Estoy aquí» (servicios/mapas.js), the team
 * users of Configuración, the filter options that legado 014 reads (OPF) and the directory filters (F).
 */
import { accountListLegacy } from './bridge';
import { sessionStore } from '../core/session-store';
import { accountsStore } from '../screens/accounts/store';
import { settingsStore } from '../screens/settings/store';
import * as legacyFreeCoreServices from '../core/services';

export interface FilterOption { v: string; n: number }
export interface FilterOptions { provincias: FilterOption[]; municipios: FilterOption[]; especialidades: FilterOption[]; estados: FilterOption[]; centros?: FilterOption[] }
export interface ReverseAddress { address?: Record<string, string | undefined>; display_name?: string; name?: string }
export interface TeamUser { id: string; nombre?: string; medicos?: number }

export const accountsEditorLegacy = {
  filters: (): AccountFilters => accountListLegacy.filters(),
  initialState: (): string => legacyFreeCoreServices.states.stateOfRole(('inicial')),
  catalog: (name: string): readonly { valor: string; padre?: string | null }[] => CAT[name] ?? [],
  morningHours: (): readonly string[] => HM,
  afternoonHours: (): readonly string[] => HT,
  dayLetters: (): readonly string[] => DIAS,
  dayName: (letter: string): string => DIAN[letter] ?? '',
  todayLetter: (): string => legacyFreeCoreServices.calendar.todayLetter(),
  directions: (point: [number, number]): string => legacyFreeCoreServices.maps.navigationAttribute(point, undefined),
  reverseGeocode: (lat: number, lon: number): Promise<ReverseAddress | null> => legacyFreeCoreServices.maps.reverseGeocode(lat, lon) as Promise<ReverseAddress | null>,
  /** «Estoy aquí» in a consultation: nearby centres or a new one with the device location (servicios/mapas.js). */
  imHere: (box: HTMLElement, index: string, button: HTMLElement): void => { void legacyFreeCoreServices.maps.hereNow(box, index, button as HTMLButtonElement); },
  hasOwnTerm: (): boolean => Boolean((sessionStore.terms?.medico as { s?: string } | undefined)?.s),
  allOf: (word: string): string => legacyFreeCoreServices.vocabulary.allOf(word),
  filterOptions: (): FilterOptions => accountsStore.filterOptions as FilterOptions,
  setFilterOptions: (options: FilterOptions): void => { accountsStore.filterOptions = options; },
  teamUsers: (): readonly TeamUser[] => settingsStore.users as TeamUser[],
  reloadAdmin: (): void => { void cargarAdmin(); },
  assignPortfolio: (userId: string): void => { void asignarCartera(userId); },
  /** The «Ver en el mapa» icon of the directory, changed by the map mode. */
  iconOf: (name: string): string => svgIco(ICON_NOM[name] ?? ''),
};
