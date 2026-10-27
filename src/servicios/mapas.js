// @ts-check
// servicios/mapas.js · está en src/app/services/maps.ts (v2.425.0). Estos nombres se quedan: Agenda, Rutas, Calidad, la ficha y los
// puentes los usan. rutasMapa sigue aquí: envuelve el mapa de hoy de Rutas (rutasMapaBase). Normas: docs/normas_codigo.md.

function navegarA(destino, paradas) { return window.delcos.core.maps.navigateTo(destino, paradas); }
// «Estoy aquí»: primero los centros que ya tenemos a menos de 250 m; si no, centro nuevo con los datos del mapa
function minutosEntre(a, b) { return window.delcos.core.maps.minutesBetween(a, b); }
// Cada navegación pregunta con qué app abrirla (Google Maps admite la ruta con todas sus paradas)
function geocodificar(q, o) { return window.delcos.core.maps.geocode(q, o); }

async function rutasMapa(...a) { if (RN) return; const r = await rutasMapaBase.apply(this, a); const m = $('rmapa'), g = $('rngrid'); if (m && g && g.nextElementSibling !== m) { g.after(m); if (RM_MAPA) setTimeout(() => { try { RM_MAPA.resize(); } catch (e) {} }, 50); } return r; }

// El mapa de Cuentas está en src/app/screens/accounts/map (v2.414.0); el nombre se queda: lo llama «Ver mapa» (legado 006).
