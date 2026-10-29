/** Organización → Zona horaria (plan 11.3, v2.447.0; part of es.ts). The zone keys are the IANA names with «_» for «/». */
export const timeZone = {
  title: 'Zona horaria',
  /** v2.463.0 (PED-4): the tab and the index entry hold the holidays too */
  tabTitle: 'Zona horaria y festivos',
  treeHint: 'Qué día es «hoy» y qué días son festivos',
  intro: 'La hora de la empresa: decide qué día es «hoy» en la agenda, en Inicio, en los avisos y en los periodos de la analítica, para todo el equipo.',
  label: 'Zona horaria de la empresa',
  default: 'España peninsular (la de siempre)',
  saved: 'Zona horaria guardada. El equipo la verá al volver a entrar.',
  couldNotSave: 'No se ha podido guardar la zona horaria',
  zones: {
    Europe_Madrid: 'España peninsular y Baleares (Madrid)',
    Atlantic_Canary: 'Canarias',
    Europe_Lisbon: 'Portugal (Lisboa)',
    Europe_London: 'Reino Unido (Londres)',
    Europe_Paris: 'Francia (París)',
    Europe_Rome: 'Italia (Roma)',
    Europe_Berlin: 'Alemania (Berlín)',
    America_Mexico_City: 'México (Ciudad de México)',
    America_Bogota: 'Colombia (Bogotá)',
    America_Lima: 'Perú (Lima)',
    America_Santiago: 'Chile (Santiago)',
    America_Argentina_Buenos_Aires: 'Argentina (Buenos Aires)',
    America_New_York: 'Estados Unidos, costa este (Nueva York)',
  },
  /** v2.463.0 (PED-4): the days the Pedidos cards skip */
  holidays: {
    title: 'Festivos',
    intro: 'Los días que no se trabaja, además de sábados y domingos. Las tarjetas de avisos de Pedidos se los saltan al contar días laborables. De partida, los nacionales de España.',
    label: 'Un festivo por línea: «DD/MM» se repite cada año y «DD/MM/AAAA» es solo ese día',
    placeholder: 'p. ej. 11/09',
    goodFriday: 'Viernes Santo (cambia cada año)',
    wrongDate: 'No se entiende la fecha «{date}». Escríbela como 25/12 o 25/12/2027',
    saved: 'Festivos guardados',
    couldNotSave: 'No se han podido guardar los festivos',
  },
};
