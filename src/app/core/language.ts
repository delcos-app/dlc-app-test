/**
 * The person's language (v2.43.0): the screens are written in Spanish and, with another language, their texts are translated on the
 * page from the table of i18n/dom-translations.ts. Migrated from the legacy nucleo/idioma.js (v2.425.0); prepararIdioma, traducirTexto,
 * traducir, aplicarIdioma, IDIOMAS and LOCALES stay as adapters. The chosen language (IDIOMA) and the map (MAPA_I18N) stay in legacy.
 */
import { coreLegacy } from '../legacy/core-bridge';
import { I18N, LANGUAGES, LOCALES } from '../i18n/dom-translations';

export { LANGUAGES, LOCALES };

const MAX_TEXT = 90;
const GREETINGS = ['Buenos días', 'Buenas tardes', 'Buenas noches'];
const GREETING = /^(Buenos días|Buenas tardes|Buenas noches), (.+)$/;
const ATTRIBUTES = ['placeholder', 'title', 'aria-label'];

const upper = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);
const lower = (text: string): string => text.charAt(0).toLowerCase() + text.slice(1);

/** Chooses the language and builds the translation map (none for Spanish). */
export function prepareLanguage(id: string): void {
  const language = id in LOCALES ? id : 'es';
  coreLegacy.setLanguage(language);
  document.documentElement.lang = language;
  const index = LANGUAGES.findIndex(item => item[0] === language);
  coreLegacy.setTranslationMap(null);
  if (index <= 0) return;
  const map = new Map<string, string>();
  I18N.forEach(row => {
    const from = row[0] ?? '', to = row[index] ?? '';
    map.set(from, to); map.set(lower(from), lower(to)); map.set(upper(from), upper(to));
  });
  coreLegacy.setTranslationMap(map);
}

/** The translation of a text, or null if it has none. */
export function translateText(text: string): string | null {
  const map = coreLegacy.translationMap();
  if (!map) return null;
  const key = text.trim(); if (!key || key.length > MAX_TEXT) return null;
  const found = map.get(key); if (found) return text.replace(key, found);
  const greeting = GREETING.exec(key), greetings = coreLegacy.greetings()[coreLegacy.language()];
  if (greeting && greetings) return text.replace(key, `${greetings[GREETINGS.indexOf(greeting[1] ?? '')] ?? ''}, ${greeting[2] ?? ''}`);
  return null;
}

function translateAttributes(root: Element | Document): void {
  if (!('querySelectorAll' in root)) return;
  root.querySelectorAll('[placeholder],[title],[aria-label]').forEach(element => {
    ATTRIBUTES.forEach(attribute => {
      const value = element.getAttribute(attribute); if (!value) return;
      const translated = translateText(value); if (translated !== null && translated !== value) element.setAttribute(attribute, translated);
    });
  });
}

/** Translates the texts and attributes under `root` (not inside script, style, textarea or [data-notr]). */
export function translate(root: Element | Document | null | undefined): void {
  if (!coreLegacy.translationMap() || !root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: node => (node.parentElement?.closest('script,style,textarea,[data-notr]') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  const nodes: Node[] = []; while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node => { const translated = translateText(node.nodeValue ?? ''); if (translated !== null && translated !== node.nodeValue) node.nodeValue = translated; });
  translateAttributes(root);
}

/** Chooses a language, remembers it on this device and translates the page. */
export function applyLanguage(id: string): void {
  prepareLanguage(id);
  try { localStorage.setItem('app-idioma', coreLegacy.language()); } catch { /* not remembered */ }
  if (coreLegacy.translationMap()) translate(document.body);
}
