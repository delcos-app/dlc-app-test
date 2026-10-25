/**
 * Company vocabulary: texts never write «profesional», «cliente» or «visita»; they ask term() / the legacy TT(), which takes them from
 * each company's words (setting «terminos») with plural, gender and the agreeing article. Also people's names without a title.
 * Migrated from the legacy servicios/vocabulario.js and part of nucleo/utilidades.js (v2.425.0); TT, terminoDe, todosLos,
 * etiquetaContactos, partesNombre, nombrePila and iniciales stay as adapters. The company words (TERMINOS) stay in legacy state.
 */
import { coreLegacy } from '../legacy/core-bridge';
import { t } from '../i18n';

export interface Term { s: string; p: string; g: 'm' | 'f' }

/** Default words (generic; each company can change them). */
export const DEFAULT_TERMS: Readonly<Record<string, Term>> = {
  medico: { s: t('core.terms.professional'), p: t('core.terms.professionals'), g: 'm' },
  paciente: { s: t('core.terms.customer'), p: t('core.terms.customers'), g: 'm' },
  visita: { s: t('core.terms.visit'), p: t('core.terms.visits'), g: 'f' },
  pauta: { s: t('core.terms.request'), p: t('core.terms.requests'), g: 'f' },
  consulta: { s: t('core.terms.location'), p: t('core.terms.locations'), g: 'f' },
  especialidad: { s: t('core.terms.segment'), p: t('core.terms.segments'), g: 'm' },
};

/** Articles and determiners: [masculine singular, masculine plural, feminine singular, feminine plural]. */
export const DETERMINERS: Readonly<Record<string, readonly [string, string, string, string]>> = {
  el: ['el', 'los', 'la', 'las'], un: ['un', 'unos', 'una', 'unas'], del: ['del', 'de los', 'de la', 'de las'], al: ['al', 'a los', 'a la', 'a las'],
  este: ['este', 'estos', 'esta', 'estas'], ningun: ['ningún', 'ningunos', 'ninguna', 'ningunas'], otro: ['otro', 'otros', 'otra', 'otras'],
  nuevo: ['nuevo', 'nuevos', 'nueva', 'nuevas'], primer: ['primer', 'primeros', 'primera', 'primeras'], ultimo: ['último', 'últimos', 'última', 'últimas'],
  proximo: ['próximo', 'próximos', 'próxima', 'próximas'],
};

export const TERMS_KEY = 'dlc-terminos';

/** A title before a name («Dr. Gonzalo Serrano» → Gonzalo, initials GS). */
export const TITLE = /^(dr|dra|d|dña|dª|sr|sra|srta|prof|profa|lic|ldo|lda)\.?$/i;

/** The company's word for `key`, with the defaults where it has none. */
export function termOf(key: string): Term {
  const fallback = DEFAULT_TERMS[key] ?? { s: key, p: `${key}s`, g: 'm' }, own = coreLegacy.terms()[key] ?? {};
  return { s: String(own.s ?? '').trim() || fallback.s, p: String(own.p ?? '').trim() || fallback.p, g: own.g === 'f' || own.g === 'm' ? own.g : fallback.g };
}

/** 'U' upper case, 'C' first letter capital, anything else as it is. */
export const withCase = (text: string, mode: string | undefined): string =>
  (mode === 'U' ? text.toUpperCase() : mode === 'C' ? text.charAt(0).toUpperCase() + text.slice(1) : text);

/**
 * The legacy TT(word, 's'|'p', determiner, determiner case, noun case[, adjective in masculine singular]) as a form: «la visita»,
 * «los profesionales nuevos».
 */
export interface WordForm { determiner?: string | undefined; determinerCase?: string | undefined; nounCase?: string | undefined; adjective?: string | undefined }

export function wordFor(key: string, number: string, form: WordForm = {}): string {
  const { determiner, determinerCase, nounCase, adjective } = form;
  const term = termOf(key), plural = number === 'p', noun = withCase(plural ? term.p : term.s, nounCase);
  // The adjective agrees in gender and number
  const agreed = adjective ? ` ${term.g === 'f' ? adjective.replace(/o$/, 'a') : adjective}${plural ? 's' : ''}` : '';
  const forms = determiner ? DETERMINERS[determiner] : undefined;
  if (!forms) return noun + agreed;
  return `${withCase(forms[(term.g === 'f' ? 2 : 0) + (plural ? 1 : 0)] ?? '', determinerCase)} ${noun}${agreed}`;
}

/** «Todos los segmentos» / «Todas las especialidades». */
export const allOf = (key: string): string => `${t(termOf(key).g === 'f' ? 'core.terms.allFeminine' : 'core.terms.allMasculine')} ${wordFor(key, 'p', { determiner: 'el' })}`;

/** The name of the contacts list: the brand's own label or, without it, the company's word («Profesionales»). */
export const contactsLabel = (): string => (coreLegacy.brandLabel() ?? '') || wordFor('medico', 'p', { nounCase: 'C' });

/** «Venta a centro», «Venta al cliente» or «Entrega sin cargo». */
export const channelLabel = (order: { canal?: string | null }, total: unknown): string => {
  if (coreLegacy.isFree(order, total)) return t('core.terms.freeDelivery');
  return order.canal === 'centro' ? t('core.terms.saleToCentre') : t('core.terms.saleTo', { customer: wordFor('paciente', 's', { determiner: 'al' }) });
};

/** The words of a name without the title in front. */
export const nameParts = (name: unknown): string[] => {
  const parts = String(name ?? '').trim().split(/\s+/);
  while (parts.length > 1 && TITLE.test(parts[0] ?? '')) parts.shift();
  return parts;
};

export const firstName = (name: unknown): string => nameParts(name)[0] ?? '';

export const initials = (name: unknown): string => nameParts(name).slice(0, 2).map(part => part[0] ?? '').join('').toUpperCase();
