/**
 * Spanish texts (default language). Every user-facing text lives here, under a dotted key; code never writes texts inline.
 * Other languages (en.ts, ca.ts…) must define the same keys: the `Messages` type makes the compiler check it.
 * Business words (profesional, visita, cliente…) are written with {placeholders} and resolved per company by the vocabulary
 * (see i18n/index.ts), so each company sees its own words.
 */
export const es = {
  common: {
    save: 'Guardar',
    cancel: 'Cancelar',
    close: 'Cerrar',
    back: 'Volver',
    loading: 'Cargando…',
    retry: 'Reintentar',
  },
  navigation: {
    notInPlan: 'No está incluido en tu plan',
    notAllowed: 'No tienes permiso para entrar aquí',
    unknownScreen: 'Esa pantalla no existe',
  },
  errors: {
    network: 'Sin conexión: se guardará al volver la red',
    generic: 'Algo ha fallado. Inténtalo de nuevo',
  },
} as const;

type Widen<T> = { readonly [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };

/** Shape every language file must have (same keys as Spanish, any text). */
export type Messages = Widen<typeof es>;
