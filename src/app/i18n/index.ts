/**
 * Translation service: `t('navigation.notAllowed')` returns the text in the current language, with {placeholders} filled from the
 * parameters first and then from the company vocabulary (e.g. {visita} → «visita» or «reunión», depending on the company).
 */
import { es, type Messages } from './es';

type Join<K extends string, P extends string> = `${K}.${P}`;
type Leaves<T> = { [K in keyof T & string]: T[K] extends string ? K : Join<K, Leaves<T[K]>> }[keyof T & string];

/** Every valid message key, checked by the compiler: t('commn.save') does not compile. */
export type MessageKey = Leaves<Messages>;
export type Language = 'es';
export type Params = Readonly<Record<string, string | number>>;

const catalogs: Readonly<Record<Language, Messages>> = { es };
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

function lookup(catalog: Messages, key: MessageKey): string | undefined {
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
  const text = lookup(catalogs[currentLanguage], key) ?? lookup(es, key) ?? key;
  return fill(text, params);
}
