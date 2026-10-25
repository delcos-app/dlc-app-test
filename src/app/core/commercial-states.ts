/**
 * Commercial states as a catalogue: the code knows their role (inicial, avance, interes, positivo, negativo), never their name. Migrated
 * from the legacy servicios/estados.js (v2.425.0); estados, estadoPapel, papelEstado, colEstado and the constants stay as adapters.
 * The company's states (ESTADOS_DEF) stay in legacy state.
 */
import { coreLegacy } from '../legacy/core-bridge';
import { t } from '../i18n';

export const STATES_KEY = 'dlc-estados';

/** Colours of the design system by role (pending amber, progress blue, interest navy, positive green, negative grey). */
export const ROLE_COLOURS: Readonly<Record<string, string>> = { inicial: '#8A4B0B', avance: '#3F82C0', interes: '#17457A', positivo: '#0E6B4C', negativo: '#4A5868' };

/** Colours of the appointment states (the values stored in the database). */
export const APPOINTMENT_COLOURS: Record<string, string> = { Planificada: 'var(--navy)', Visitada: 'var(--ok)', Pendiente: 'var(--warn)', Reprogramada: 'var(--sky)', Descartada: 'var(--muted)' };

/** Each role, its name and what it means. */
export const STATE_ROLES: readonly (readonly [string, string, string])[] = [
  ['inicial', t('core.states.initial'), t('core.states.initialHint')],
  ['avance', t('core.states.progress'), t('core.states.progressHint')],
  ['interes', t('core.states.interest'), t('core.states.interestHint')],
  ['positivo', t('core.states.positive'), t('core.states.positiveHint')],
  ['negativo', t('core.states.negative'), t('core.states.negativeHint')],
];

export const stateNames = (): string[] => coreLegacy.commercialStates().map(state => state.valor);

/** The state with a role ('' if none). */
export const stateOfRole = (role: string): string => coreLegacy.commercialStates().find(state => state.papel === role)?.valor ?? '';

/** The role of a state ('' if none). */
export const roleOfState = (value: string): string => coreLegacy.commercialStates().find(state => state.valor === value)?.papel ?? '';

export const stateColour = (value: string): string => ROLE_COLOURS[roleOfState(value)] ?? '';
