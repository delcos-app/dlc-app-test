/** Month names the charts write: «oct 26» under a bar, «octubre 2026» in a title. */
import { t } from '../../i18n';

const shortMonths = (): string[] => t('dates.monthsShort').split(',');

/** «2026-10» → «oct 26». */
export const monthLabel = (month: string): string => `${shortMonths()[Number(month.slice(5, 7)) - 1] ?? ''} ${month.slice(2, 4)}`;

/** «2026-10» → «oct». */
export const shortMonthOf = (month: string): string => shortMonths()[Number(month.slice(5, 7)) - 1] ?? '';

/** «2026-10» → «octubre 2026». */
export function periodLabel(month: string): string {
  const [year = '', number = ''] = month.split('-');
  return `${t('dates.monthsLong').split(',')[Number(number) - 1] ?? ''} ${year}`;
}
