// @ts-check
// componentes/filtros.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.


const HT = ['15:00-19:00', '16:00-19:00', '16:00-20:00', '17:00-20:00'];

 // v2.440.0: HERR_CTX → estado de src/app (plan 6.6), accesible en window

// Pantallas con filtros propios que pasan al panel (la búsqueda por texto sigue a la vista)
const HT_FILTROS = { pacientes: '#v-pacientes .filtros', facturacion: '#v-facturacion .filtros', analitica: '#anper' };

const HT_ESTADO = {};   // por tabla: { texto, facetas: {col: valor} }

let HT_PEND = false;

let HT2_PEND = false;

/* v2.227.0 · Ordenar cualquier tabla por su columna y filtros por columna según su tipo (lista de Eric del 9/10/2026).
   - Pulsar el nombre de una columna ordena (▲), volver a pulsar invierte (▼) y una tercera vez quita el orden. Se recuerda por tabla.
   - Las tablas que se cargan por páginas se ordenan en la base para que valga para todas las páginas (SQL 135): Profesionales
     (buscar_cuentas: orden), Pedidos (pedidos_pagina: p_orden) y Clientes (clientes_lista: p_orden). El resto, en la pantalla.
   - «Filtros y columnas»: cada columna con el filtro de su tipo: texto («contiene»), número (desde/hasta) o fecha (desde/hasta, y nada si la
     pantalla ya tiene su «Periodo»). Fuera los desplegables inventados con lo que se ve: las listas de valores fijos son las de Clasificadores
     (su apartado propio). Tampoco se repiten columnas que la pantalla ya filtra con lo suyo (Estado, Canal…). */

const HT_ORDEN = {};   // por tabla: { i, dir: 1 | -1, k }

const htGuardarOrden = () => { try { localStorage.setItem('delcos-orden', JSON.stringify(HT_ORDEN)); } catch (e) {} };


// Los indicadores se piden aparte (RPC_ORIG): las listas «solo la última» descartarían las consultas paralelas
// Clics de la barra, los indicadores y el menú «⋯»


// Ordenar y filtrar tablas y la memoria de filtros están en src/app/components/filters (v2.416.0). Estos nombres se quedan: el
// panel «Filtros y columnas», legado 057/082/107/113, Inicio y las pruebas los usan.

// El panel «Filtros y columnas» está en src/app/components/filters-panel (v2.419.0). Estos nombres se quedan: los observadores de
// legado 054–057, la barra de las listas y el puente de componentes los llaman.
