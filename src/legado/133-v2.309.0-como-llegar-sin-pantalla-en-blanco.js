/* ============================================================
   v2.309.0 · «Cómo llegar» sin pantalla en blanco al volver (aviso de Eric). En el móvil, con delcos instalado como app, el
   enlace web de Google Maps o Waze se abría en una ventana de navegador intermedia que saltaba a la app de mapas y se
   quedaba detrás, en blanco y con una ✕. Ahora, en el móvil, se abre directamente la app de mapas con su propio enlace
   (comgooglemaps://, google.navigation:, waze://, maps://); si esa app no está instalada y delcos sigue a la vista al cabo
   de un momento, se abre el enlace web como antes. En el ordenador no cambia nada.
   ============================================================ */
const ES_ANDROID = /Android/i.test(navigator.userAgent);
function enlaceNavApp(destino, paradas, n) {
  const d = Array.isArray(destino) ? destino.join(',') : String(destino);
  if (n === 'waze') return 'waze://?ll=' + encodeURIComponent(d) + '&navigate=yes';
  if (n === 'apple') return ES_IOS ? 'maps://?daddr=' + encodeURIComponent(d) + '&dirflg=d' : null;
  if (ES_IOS) return 'comgooglemaps://?daddr=' + [...(paradas || []).map(p => p.join(',')), d].map(encodeURIComponent).join('+to:') + '&directionsmode=driving';
  if (ES_ANDROID && !(paradas && paradas.length)) return 'google.navigation:q=' + encodeURIComponent(d) + '&mode=d';
  return null;   // Android con paradas: solo el enlace web admite la ruta entera
}
// (R-12: navegarA se definía aquí otra vez; ahora está en su sitio, más arriba)


