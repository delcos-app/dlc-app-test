/** What a single-item function answered, in words for the summary (D-048): null when it was done, otherwise why not. */
import { t } from '../../../i18n';
import type { ItemOutcome } from './types';

export interface RpcAnswer { readonly data: unknown; readonly error: unknown }

const COMMON = (): Record<string, string> => ({ permiso: t('listSelection.refused.permission'), no_encontrado: t('listSelection.refused.notFound') });

/** `reasons` turns the function's own error codes into words (as its window says them). */
export function outcomeOf(answer: RpcAnswer, reasons: Readonly<Record<string, string>> = {}): ItemOutcome {
  if (answer.error) return t('listSelection.refused.other', { error: (answer.error as { message?: string }).message ?? '' });
  const result = answer.data as { ok?: boolean; error?: string } | null;
  if (result?.ok !== false) return null;
  const code = result.error ?? '';
  return reasons[code] ?? COMMON()[code] ?? t('listSelection.refused.other', { error: code });
}
