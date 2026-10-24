/* ============================================================
   DLC OS 2.0 · v2.40.0 · Pantallas y ventanas que aparecen completas
   (con indicador de carga mientras llegan los datos), alertas que se
   pueden ocultar y recuperar, acceso y cierre de sesión sin menú y
   confirmación al volver a los datos de partida
   ============================================================ */

Object.assign(RPC_TTL, { mis_alertas_descartadas: 30 });

/* ---------------- carga en bloque ---------------- */


// Módulos: al entrar, la pantalla se muestra entera cuando han llegado todos sus datos (el menú se ve siempre)
let PEND = 0;
const RPC_V2390 = db.rpc;
db.rpc = function (fn, params, opts) {
  const b = RPC_V2390.call(db, fn, params, opts);
  // Se cuentan las consultas (no las que guardan o cambian datos)
  if (/^(guardar|registrar|marcar|asignar|emitir|borrar|eliminar|anular|vincular|descartar|restaurar|leer|validar|ordenar|aplazar|bloquear|desbloquear|recibir|rectificar|unificar|cambiar|crear|pruebas)_/.test(fn)) return b;
  PEND++; let hecho = false; const fin = () => { if (!hecho) { hecho = true; PEND = Math.max(0, PEND - 1); } };
  Promise.resolve(b).then(fin, fin); setTimeout(fin, 8000);
  return b;
};

/* ---------------- alertas: ocultar y recuperar ---------------- */

let ALERTAS_OCULTAS = null;
const tituloAlerta = s => s.textContent.replace(/\s+/g, ' ').replace(/^\s*\d+\s*/, '').replace(/\bequipo\b\s*$/, '').trim();
const normAl = t => String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').slice(0, 60);

// Ocultar desde la ventana de la alerta
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-aloc]'); if (!b) return;
  const card = b.closest('.alcard');
  if (b.dataset.aloc === 'menu') {
    card.querySelector('.alocmenu').classList.toggle('hide'); return;
  }
  const dias = b.dataset.aloc === 'siempre' ? null : +b.dataset.aloc;
  const { error } = await db.rpc('descartar_alerta', { p_clave: card.dataset.clave, p_dias: dias, p_titulo: card.dataset.titulo, p_detalle: card.querySelector('.alc1 b').textContent });
  if (error) { toast('No se ha podido ocultar', true); return; }
  ALERTAS_OCULTAS = null;
  card.remove(); toast(dias ? `Oculta ${dias} días` : 'Oculta para siempre');
  filtrarAlertasInicio();
});

/* ---------------- acceso y cierre de sesión: sin menú ---------------- */

mostrarLogin = (orig => function (...a) { document.body.classList.add('sin-sesion'); return orig.apply(this, a); })(mostrarLogin);
if (!PERFIL) document.body.classList.add('sin-sesion');

/* ---------------- pruebas: volver a los datos de partida con confirmación ---------------- */

if (EN_PRUEBAS) {
  pintarFranjaPruebas = (orig => async function () {
    await orig();
    await new Promise(r => setTimeout(r, 50));
    const b = $('prreset'); if (!b) return;
    b.onclick = async () => {
      if (!await preguntar('Se borrará todo lo creado o cambiado en el entorno de pruebas y los datos volverán a como se copiaron de producción. No se puede deshacer.',
        { titulo: '¿Seguro que quieres volver a los datos de partida?', ok: 'Sí, volver', cancelar: 'No', peligro: true })) return;
      pantallaCarga('Volviendo a los datos de partida…');
      let { data: r, error } = await RPC_ORIG('pruebas_resetear_responsable', { p_confirmacion: 'RESTABLECER' });
      if (error && /pruebas_resetear_responsable|PGRST202|not find/i.test(error.message || '')) ({ data: r, error } = await RPC_ORIG('pruebas_resetear', { p_confirmacion: 'RESTABLECER' }));
      if (error || !r || !r.ok) { quitarCarga(); toast(r && r.error === 'permiso' ? 'Solo la persona responsable del entorno puede hacerlo' : 'No se ha podido: ' + ((error && error.message) || (r && r.error) || ''), true); return; }
      limpiarDatosLocales(); location.reload();
    };
  })(pintarFranjaPruebas);
  if ($('prreset')) pintarFranjaPruebas();
}


