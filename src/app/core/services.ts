/**
 * The core services migrated from src/nucleo and src/servicios (v2.425.0), published as window.delcos.core for the legacy adapters
 * (hoyISO, TT, puede, escribir, rpcCache, registrarError…) that the rest of the legacy code still calls by name.
 */
export * as calendar from '../services/calendar';
export * as money from '../services/money';
export * as files from '../services/files';
export * as maps from '../services/maps';
export * as pdf from '../services/pdf';
export * as vocabulary from './vocabulary';
export * as states from './commercial-states';
export * as permissions from './permissions';
export * as plans from './plans';
export * as session from './session';
export * as errors from './errors';
export * as report from './problem-report';
export * as language from './language';
export * as live from './live';
export * as queue from './write-queue';
export * as reads from './read-cache';
export { byId, escapeText, withCatch, appName, hexToRgb } from './utilities';
