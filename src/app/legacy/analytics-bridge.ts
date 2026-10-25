import * as components from '../components';
/**
 * Bridge of Analítica to the legacy code (kept apart from bridge.ts, which is at its size limit). The page, its filters and the
 * panel of indicators are still legacy: the professional chosen stays in AN_MED (legado 109 and the tests read it).
 */
export const analyticsLegacy = {
  professional: (): { id: string; nombre: string } | null => AN_MED,
  /** The range of a period picker (montarPeriodo). */
  period: (id: string): { desde: string | null; hasta: string | null } => {
    const range: unknown = Reflect.get(document.getElementById(id) ?? {}, '__rango');
    return typeof range === 'function' ? (range as () => { desde: string | null; hasta: string | null })() : { desde: null, hasta: null };
  },
  loading: (element: HTMLElement | null, text: string): void => { components.showLoading(element, text); },
  setTableExport: (rows: Record<string, unknown>[]): void => { Reflect.set(window, '__ANTABLA', rows); },
};
