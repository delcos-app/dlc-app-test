/**
 * Translation service: `t('navigation.notAllowed')` returns the text in the current language, with {placeholders} filled from the
 * parameters first and then from the company vocabulary (e.g. {visita} → «visita» or «reunión», depending on the company).
 * The core catalog (es.ts) is here from the start; the texts only a lazy chunk uses arrive with it (registerMessages, plan 7.3 cut F).
 * herramientas/text-guard.mjs checks on every build that no code asks for a key before its text can be here.
 */
import { es, type Messages } from './es';

type Join<K extends string, P extends string> = `${K}.${P}`;
type Leaves<T> = { [K in keyof T & string]: T[K] extends string ? K : Join<K, Leaves<T[K]>> }[keyof T & string];

/** Every valid message key, checked by the compiler: t('commn.save') does not compile. */
export type MessageKey = Leaves<Messages>;
export type Language = 'es';
export type Params = Readonly<Record<string, string | number>>;

/** The core catalog of each language (the texts that are here from the start). */
const catalogs: Readonly<Record<Language, object>> = { es };
/** The texts registered by the lazy chunks, by language: looked up after the core catalog. */
const registered: Record<Language, Record<string, unknown>> = { es: {} };
let currentLanguage: Language = 'es';
let vocabulary: Readonly<Record<string, string>> = {};
let resolveWord: ((name: string) => string | undefined) | null = null;

export function setLanguage(language: Language): void {
  currentLanguage = language;
}

/**
 * Words that depend on the company's vocabulary at the moment of each text ({surgery}, {surgeryThe}…): core/vocabulary.ts
 * registers the resolver, so a text follows the company's word without each caller passing it (v2.436.0).
 */
export function setVocabularyResolver(resolver: (name: string) => string | undefined): void {
  resolveWord = resolver;
}

/** Company words ({visita}, {profesional}…), loaded with the company settings. */
export function setVocabulary(words: Readonly<Record<string, string>>): void {
  vocabulary = { ...words };
}

/** Some of the texts of a language, with the same key paths (what a chunk brings). */
export type MessagesPart<T = Messages> = { readonly [K in keyof T]?: T[K] extends string ? string : MessagesPart<T[K]> };

function merge(target: Record<string, unknown>, source: object): void {
  for (const [name, value] of Object.entries(source)) {
    if (typeof value === 'string') { target[name] = value; continue; }
    const node = target[name];
    const inner: Record<string, unknown> = typeof node === 'object' && node !== null ? node as Record<string, unknown> : {};
    target[name] = inner;
    merge(inner, value as object);
  }
}

/**
 * Adds the texts a lazy chunk brings (screens/<…>/texts.ts, the first thing the chunk runs): from then on t() finds them like the
 * core ones. The objects passed are not changed.
 */
export function registerMessages(texts: MessagesPart, language: Language = 'es'): void {
  merge(registered[language], texts);
}

function lookup(catalog: object, key: MessageKey): string | undefined {
  let node: unknown = catalog;
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string' ? node : undefined;
}

function fill(text: string, params: Params): string {
  return text.replace(/\{(\w+)\}/g, (whole, name: string) => {
    const value = params[name] ?? vocabulary[name] ?? resolveWord?.(name);
    return value === undefined ? whole : String(value);
  });
}

/** Text for `key` in the current language (Spanish if missing), with placeholders filled. */
export function t(key: MessageKey, params: Params = {}): string {
  const text = lookup(catalogs[currentLanguage], key) ?? lookup(registered[currentLanguage], key)
    ?? lookup(es, key) ?? lookup(registered.es, key) ?? key;
  return fill(text, params);
}
