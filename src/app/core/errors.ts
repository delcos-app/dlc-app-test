/**
 * The error log of the platform: each different error is sent once per session (with the screen and the version), network failures
 * are not errors, and in read-only mode a refused write is explained, not logged. Migrated from the legacy nucleo/errores.js
 * (v2.425.0); registrarError, esErrorRed and reportarProblema stay as adapters.
 */
import { coreLegacy } from '../legacy/core-bridge';
import { SESSION_ERRORS } from './session';

const MAX_MESSAGE = 500, KEPT_ERRORS = 20;
const NETWORK = /failed to fetch|load failed|networkerror|network request failed|aborterror|fetch is aborted|internet connection|err_internet|err_network/i;
const TIMEOUT = /ha tardado demasiado|tiempo agotado|timeout|timed out/i;
const READ_ONLY_REFUSAL = /row-level security|violates row-level/i;

const sent = new Set<string>();

const textOf = (error: unknown): string => {
  if (error && typeof error === 'object' && 'message' in error) return String((error as { message?: unknown }).message ?? '') || String(error);
  return String(error ?? '');
};

/**
 * «Load failed» or «Fetch is aborted» on an iPhone without coverage is not a failure of the platform: it is not logged, and a visit is
 * kept on the device and sent later.
 */
export const isNetworkError = (error: unknown): boolean => NETWORK.test(textOf(error)) || TIMEOUT.test(textOf(error));

/** Logs an error once per session (network failures of the API and read-only refusals are not logged). */
export function registerError(type: string, message: unknown, detail?: unknown): void {
  if (coreLegacy.paymentState()?.solo_lectura && READ_ONLY_REFUSAL.test(String(message))) return;
  if (type === 'api' && isNetworkError(message)) return;
  try {
    const text = String(message ?? '').slice(0, MAX_MESSAGE), screen = coreLegacy.currentScreen();
    SESSION_ERRORS.push({ t: new Date().toISOString(), tipo: type, m: text, pantalla: screen });
    if (SESSION_ERRORS.length > KEPT_ERRORS) SESSION_ERRORS.shift();
    const key = `${type}|${text}`;
    if (sent.has(key) || !coreLegacy.profile()) return;
    sent.add(key);
    // The query is only sent when its result is awaited
    Promise.resolve(coreLegacy.rpc('registrar_error', { p: { tipo: type, mensaje: text, detalle: detail ?? null, pantalla: screen, version: coreLegacy.appVersion(), navegador: navigator.userAgent } }))
      .then(() => undefined, () => undefined);
  } catch { /* logging never breaks the app */ }
}
