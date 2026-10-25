// pantallas/eventos.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

function detalleEvento(d) {
  if (!d || typeof d !== 'object') return d ? String(d) : '—';
  const partes = Object.keys(d).filter(k => d[k] != null && d[k] !== '' && k !== 'valor' && !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(String(d[k]))).map(k => {
    const v = d[k]; const n = NOMBRES_DETALLE[k] || (k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, ' '));
    return `${n}: ${typeof v === 'number' && /importe|total/.test(k) ? eur(v) : textoValor(v)}`;
  });
  return partes.join(' · ').slice(0, 160) || '—';
}

function menuEventos() {
  const nav = document.querySelector('nav.main .in'); if (!nav) return;
  let b = nav.querySelector('[data-t="eventos"]');
  if (!b) { const tras = nav.querySelector('[data-t="directorio"]'); if (!tras) return; tras.insertAdjacentHTML('afterend', '<button data-t="eventos" aria-selected="false">Eventos</button>'); b = nav.querySelector('[data-t="eventos"]'); }
  b.classList.toggle('hide', !!(ES_MEDICO() || !puedeModulo('directorio')));
}





/* v2.195.0 · Eventos, formación e informe de gastos (última pieza de la primera tanda del estudio por sectores, SQL 121). Decisiones de Eric:
   sección propia «Eventos» (en el bloque Cartera del menú), importe por concepto por asistente con informe anual de gastos, y en los
   planes Comercial, Empresa y A medida (candado en Campo, como Compras).
   - Eventos → «Eventos»: próximos y pasados; «+ Nuevo evento» (título, tipo, fecha, hora, lugar o en línea, nota); al abrir uno, sus
     asistentes con su estado y lo que se le da a cada uno (inscripción, viaje y alojamiento, comidas, honorarios), con aviso si una comida
     pasa de 60 € por persona.
   - Eventos → «Informe de gastos» (administración o quien ve todo el equipo): por año, lo dado a cada profesional por concepto, para descargar.
   - Ficha: bloque «Eventos» con los últimos a los que ha ido o está invitado. */





const verTransparencia = () => puede('administrar') || VE_TODO();

// Editar una visita: cómo fue y productos presentados (actualizar_actividad los guarda desde el SQL 128)
let EV_EXTRA = null;

// Eventos está en src/app/screens/events (v2.407.0). Estos nombres se quedan: las pestañas de la página (legado 079),
// «‹ Volver» (envuelve las ventanas por su nombre) y las pruebas los usan.
function pintarEventos() { return window.delcos.screens.events.paintEvents(); }
function pintarTransparencia(anio) { return window.delcos.screens.events.paintExpenseReport(anio); }
function editarEvento(ev) { window.delcos.screens.events.editEvent(ev || null); }
function verEvento(id) { return window.delcos.screens.events.showEvent(id); }
