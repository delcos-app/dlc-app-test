/** Formatting shared by every screen. Spanish conventions, identical to the legacy helpers (num, esc) so screens look the same. */

const HTML_ESCAPES: Readonly<Record<string, string>> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Text safe to put inside HTML. */
export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, char => HTML_ESCAPES[char] ?? char);
}

/** 1234.5 → «1.234,5». */
export function formatNumber(value: unknown): string {
  return Number(value ?? 0).toLocaleString('es');
}

/** Rounded euros: 1234.4 → «1.234 €». */
export function formatEuros(value: unknown): string {
  return `${Math.round(Number(value) || 0).toLocaleString('es-ES')} €`;
}

/** Text compared without accents, case or punctuation («Clínica  Sur» = «clinica sur»). */
export function looseText(text: string | null | undefined): string {
  return String(text ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

/** 1234.5 → «1.234,50 €» (up to two decimals). */
export function formatCurrency(value: unknown): string {
  return (Number(value) || 0).toLocaleString('es', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });
}
