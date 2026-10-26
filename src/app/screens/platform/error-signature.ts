/**
 * Panel delcos → Errores, computed in the page from the groups the server already sends (errores_resumen groups by fingerprint and
 * screen): the same error seen on several screens goes together under one signature (normalised message + first frame of the app),
 * and the view by version says which errors each version has. Pure functions (v2.440.0).
 */
import { stackFrames } from '../../services/source-map';

/** What errores_resumen returns for each fingerprint and screen. */
export interface ServerGroup {
  tipo: string; pantalla?: string | null; veces: number; personas: number; ultima: string; primera: string; estado: string; mensaje: string; huella: string;
  resuelto_en_version?: string | null; resuelto_auto?: boolean; versiones?: string | null; detalle?: unknown;
}

/** Several server groups with the same signature. */
export interface MergedError {
  signature: string; tipo: string; mensaje: string; veces: number; personas: number; primera: string; ultima: string; estado: string;
  pantallas: string[]; versiones: string[]; detalle: unknown; members: ServerGroup[];
}

const STATE_ORDER = ['Nuevo', 'Revisado', 'Resuelto'];

/**
 * The message without what changes between occurrences: ids, numbers, quoted values and addresses («Cannot read 'x' of 3f2a…» and
 * «Cannot read 'y' of 9b1c…» are the same error).
 */
export function normaliseMessage(message: string): string {
  return message
    .replace(/https?:\/\/\S+/g, '<url>')
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '<id>')
    .replace(/(["'«`])[^"'»`]{0,120}(["'»`])/g, '$1…$2')
    .replace(/\d+([.,]\d+)?/g, '<n>')
    .replace(/\s+/g, ' ')
    .trim();
}

const stackOf = (detail: unknown): string => {
  if (!detail || typeof detail !== 'object') return '';
  const stack = (detail as { pila?: unknown }).pila;
  return typeof stack === 'string' ? stack : '';
};

/**
 * The first frame of the app in the stack, by function name when the browser gives one («at loadAgenda (…)»): minified positions
 * change with every version, names of the legacy functions do not.
 */
export function firstAppFrame(detail: unknown): string {
  const frame = stackFrames(stackOf(detail))[0];
  if (!frame) return '';
  const name = /^\s*(?:at\s+)?([\w$.<>]+)\s*[(@]/.exec(frame.text)?.[1];
  return name && name !== 'at' ? name : frame.file;
}

/** Type, normalised message and first frame of the app. */
export const signatureOf = (group: ServerGroup): string => `${group.tipo}|${normaliseMessage(group.mensaje)}|${firstAppFrame(group.detalle)}`;

/** «2.430.0, 2.431.0» → ['2.430.0', '2.431.0'] (empty values left out). */
export const versionsOf = (group: ServerGroup): string[] => String(group.versiones ?? '').split(',').map(version => version.trim()).filter(Boolean);

/** Newer versions first (2.440.0 before 2.439.0 before 2.99.0). */
export function compareVersions(first: string, second: string): number {
  const parts = (version: string): number[] => version.replace(/^v/, '').split('.').map(Number);
  const one = parts(first), other = parts(second);
  for (let index = 0; index < Math.max(one.length, other.length); index++) {
    const difference = (other[index] ?? 0) - (one[index] ?? 0);
    if (difference) return difference;
  }
  return 0;
}

const earliest = (first: string, second: string): string => (first <= second ? first : second);
const openest = (first: string, second: string): string => (STATE_ORDER.indexOf(first) <= STATE_ORDER.indexOf(second) ? first : second);

function mergeInto(target: MergedError, group: ServerGroup): void {
  target.veces += group.veces;
  // The same person may be counted on two screens: the sum is an upper bound, the largest group a lower one
  target.personas = Math.max(target.personas, group.personas);
  target.primera = earliest(target.primera, group.primera);
  if (group.ultima > target.ultima) { target.ultima = group.ultima; target.detalle = group.detalle; target.mensaje = group.mensaje; }
  target.estado = openest(target.estado, group.estado);
  if (group.pantalla && !target.pantallas.includes(group.pantalla)) target.pantallas.push(group.pantalla);
  versionsOf(group).forEach(version => { if (!target.versiones.includes(version)) target.versiones.push(version); });
  target.members.push(group);
}

/** The groups of the server joined by signature, most recent first. */
export function mergeBySignature(groups: readonly ServerGroup[]): MergedError[] {
  const bySignature = new Map<string, MergedError>();
  groups.forEach(group => {
    const signature = signatureOf(group), found = bySignature.get(signature);
    if (found) { mergeInto(found, group); return; }
    bySignature.set(signature, {
      signature, tipo: group.tipo, mensaje: group.mensaje, veces: group.veces, personas: group.personas, primera: group.primera, ultima: group.ultima,
      estado: group.estado, pantallas: group.pantalla ? [group.pantalla] : [], versiones: versionsOf(group), detalle: group.detalle, members: [group],
    });
  });
  const merged = [...bySignature.values()];
  merged.forEach(error => { error.versiones.sort(compareVersions); });
  return merged.sort((first, second) => second.ultima.localeCompare(first.ultima));
}

/** Which errors each version has, newest version first (an error seen in several versions is under each). */
export function byVersion(errors: readonly MergedError[]): [string, MergedError[]][] {
  const versions = new Map<string, MergedError[]>();
  errors.forEach(error => {
    (error.versiones.length ? error.versiones : ['?']).forEach(version => {
      const list = versions.get(version);
      if (list) list.push(error); else versions.set(version, [error]);
    });
  });
  return [...versions.entries()].sort(([first], [second]) => compareVersions(first, second));
}
