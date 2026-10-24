// @ts-check
// servicios/catalogos.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función y constantes de valor puro: su sitio no cambia lo que hace la app. Normas: docs/normas_codigo.md.

// Catálogos por su papel en la plataforma (clasificadores.papel), nunca por la clave que les ponga cada cliente
const CAT = { resultado_visita: [], especialidad: [], area: [], motivo_urgencia: [], forma_pago: [] };

let PROV_CCAA = null;
