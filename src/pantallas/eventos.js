// @ts-check
// pantallas/eventos.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.



/* v2.195.0 · Eventos, formación e informe de gastos (última pieza de la primera tanda del estudio por sectores, SQL 121). Decisiones de Eric:
   sección propia «Eventos» (en el bloque Cartera del menú), importe por concepto por asistente con informe anual de gastos, y en los
   planes Comercial, Empresa y A medida (candado en Campo, como Compras).
   - Eventos → «Eventos»: próximos y pasados; «+ Nuevo evento» (título, tipo, fecha, hora, lugar o en línea, nota); al abrir uno, sus
     asistentes con su estado y lo que se le da a cada uno (inscripción, viaje y alojamiento, comidas, honorarios), con aviso si una comida
     pasa de 60 € por persona.
   - Eventos → «Informe de gastos» (administración o quien ve todo el equipo): por año, lo dado a cada profesional por concepto, para descargar.
   - Ficha: bloque «Eventos» con los últimos a los que ha ido o está invitado. */

const verTransparencia = () => puede('administrar') || VE_TODO();

// Eventos está en src/app/screens/events (v2.407.0). Estos nombres se quedan: las pestañas de la página (legado 079),
// «‹ Volver» (envuelve las ventanas por su nombre) y las pruebas los usan.
function pintarEventos() { return window.delcos.screens.events.paintEvents(); }
function pintarTransparencia(anio) { return window.delcos.screens.events.paintExpenseReport(anio); }
function editarEvento(ev) { window.delcos.screens.events.editEvent(ev || null); }
function verEvento(id) { return window.delcos.screens.events.showEvent(id); }
