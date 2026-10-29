/** The company's lists (the legacy CAT: read at start, kept on the device and filled on demand by Oportunidades) that core reads. */
export interface CatalogValue { valor: string; extra?: string | null; papel?: string | null }

export const catalogLegacy = {
  values: (key: string): readonly CatalogValue[] => CAT[key] ?? [],
};
