// servicios/estados.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función y constantes de valor puro: su sitio no cambia lo que hace la app. Normas: docs/normas_codigo.md.

/* v2.70.0 · Estados comerciales como catálogo: el código conoce su papel (inicial, avance, interes, positivo, negativo), no su nombre */
const ESTKEY = 'dlc-estados';

let ESTADOS_DEF = [];

const estados = () => ESTADOS_DEF.map(x => x.valor);

const estadoPapel = p => (ESTADOS_DEF.find(x => x.papel === p) || {}).valor || '';

const papelEstado = v => (ESTADOS_DEF.find(x => x.valor === v) || {}).papel || '';

// v2.97.0: colores del sistema de diseño por papel (pendiente ámbar, avance azul, interés marino, positivo verde, negativo gris)
const COL_PAPEL = { inicial: '#8A4B0B', avance: '#3F82C0', interes: '#17457A', positivo: '#0E6B4C', negativo: '#4A5868' };

const colEstado = v => COL_PAPEL[papelEstado(v)] || '';

const EST_COL = { Planificada: 'var(--navy)', Visitada: 'var(--ok)', Pendiente: 'var(--warn)', Reprogramada: 'var(--sky)', Descartada: 'var(--muted)' };

// Estados comerciales: el papel de cada uno
const PAPELES_ESTADO = [
  ['inicial', 'Inicial', 'El de las fichas nuevas. Solo hay uno.'],
  ['avance', 'En avance', 'Ya hay contacto, pero todavía sin interés claro.'],
  ['interes', 'Con interés', 'Interesado: se le sigue de cerca.'],
  ['positivo', 'Ya es cliente', 'El objetivo: ya compra o trabaja con vosotros.'],
  ['negativo', 'Ya no interesa', 'No le interesa o se ha perdido.']];
