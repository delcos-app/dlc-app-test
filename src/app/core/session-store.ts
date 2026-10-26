/**
 * Session, vocabulary and network: its state in one object (plan 6.6, v2.439.0) instead of loose legacy globals. The legacy names (PERFIL, IDIOMA, MAPA_I18N…)
 * stay on window as accessors to this same object, for the remaining legacy code and the tests.
 */
import { exposeLegacyNames } from '../state/legacy-names';

export interface SessionStore {
  profile: unknown;
  language: string;
  translationMap: unknown;
  terms: Record<string, unknown> | null;
  commercialStates: readonly { valor: string; papel: string }[];
  plan: Record<string, unknown>;
  provinces: Record<string, unknown> | null;
  roundLogo: boolean;
  writes: number;
  cacheEpoch: number;
  lastNetworkEnd: number;
  networkInFlight: number;
  versionSeen: number;
  live: unknown;
  accessOut: boolean;
  accessChecked: number;
}

export const sessionStore: SessionStore = {
  profile: null,
  language: 'es',
  translationMap: null,
  terms: {},
  commercialStates: [],
  plan: { plan: 'medida' },
  provinces: null,
  roundLogo: false,
  writes: 0,
  cacheEpoch: 0,
  lastNetworkEnd: 0,
  networkInFlight: 0,
  versionSeen: 0,
  live: null,
  accessOut: false,
  accessChecked: 0,
};

exposeLegacyNames(sessionStore, [
  ['PERFIL', 'profile'],
  ['IDIOMA', 'language'],
  ['MAPA_I18N', 'translationMap'],
  ['TERMINOS', 'terms'],
  ['ESTADOS_DEF', 'commercialStates'],
  ['PLAN_ACTUAL', 'plan'],
  ['PROV_CCAA', 'provinces'],
  ['LOGO_CIRC', 'roundLogo'],
  ['ESCRITURAS', 'writes'],
  ['RC_EPOCA', 'cacheEpoch'],
  ['RED_ULT', 'lastNetworkEnd'],
  ['RED_VUELO', 'networkInFlight'],
  ['VERSION_VISTA', 'versionSeen'],
  ['VIVO', 'live'],
  ['ACCESO_FUERA', 'accessOut'],
  ['ACCESO_MIRADO', 'accessChecked'],
]);
