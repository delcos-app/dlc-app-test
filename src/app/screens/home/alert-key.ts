/**
 * The key that remembers a hidden Inicio alert: its title and its record (or its text), normalised. Migrated from the legacy
 * claveAlerta of pantallas/acceso.js and normAl of pantallas/inicio.js (v2.427.0); claveAlerta stays as an adapter (the hidden
 * alerts of the portal home and legado 040 call it). The key is stored with the hidden alerts: it must not change.
 */
const MAX_LENGTH = 60;

export const normaliseAlert = (text: unknown): string =>
  String(text).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').slice(0, MAX_LENGTH);

export function alertKey(title: string, item: HTMLElement): string {
  const { inificha, iniped, inistock, inicomp } = item.dataset, id = [inificha, iniped, inistock, inicomp].find(Boolean);
  return `${normaliseAlert(title)}:${id ?? normaliseAlert((item.querySelector('.tx b') ?? item).textContent)}`;
}
