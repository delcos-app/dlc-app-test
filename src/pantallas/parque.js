// pantallas/parque.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

function menuParque() {
  const nav = document.querySelector('nav.main .in'); if (!nav) return;
  let b = nav.querySelector('[data-t="parque"]');
  if (!b) { const tras = nav.querySelector('[data-t="concursos"]') || nav.querySelector('[data-t="ventas"]'); if (!tras) return; tras.insertAdjacentHTML('afterend', '<button data-t="parque" aria-selected="false">Parque instalado</button>'); b = nav.querySelector('[data-t="parque"]'); }
  b.classList.toggle('hide', !!(ES_MEDICO() || !puedeModulo('ventas')));
}

async function pintarParque() {
  const caja = $('cfgcuerpo'); if (!caja) return;
  const [{ data, error }, { data: aj }] = await Promise.all([
    db.from('equipos').select('id,serie,ubicacion,instalado,contrato,contrato_fin,garantia_hasta,proxima_revision,estado,cuenta_id,cuentas(nombre),productos(nombre)').order('creado_en', { ascending: false }).limit(500),
    db.from('ajustes').select('valor').eq('clave', 'avisos_vencimiento').maybeSingle()]);
  if (!$('cfgcuerpo') || TAB !== 'parque') return;
  if (error) { caja.innerHTML = '<div class="vacio">No se ha podido cargar el parque instalado.</div>'; return; }
  if (aj && aj.valor && Array.isArray(aj.valor.dias)) CON_AVISOS = aj.valor.dias.map(Number).filter(n => n > 0);
  const l = data || [], act = l.filter(e => e.estado === 'Instalado'), hoy30 = isoMas(hoyISO(), 30), tope = Math.max(...CON_AVISOS, 0);
  const rev = act.filter(e => e.proxima_revision && e.proxima_revision <= hoy30).sort((a, b) => a.proxima_revision.localeCompare(b.proxima_revision));
  const ven = act.filter(e => { const d = eqDias(eqVence(e)); return d != null && d <= tope; }).sort((a, b) => String(eqVence(a)).localeCompare(String(eqVence(b))));
  const qn = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const todos = l.filter(e => !EQ_Q || qn([e.serie, (e.productos || {}).nombre, (e.cuentas || {}).nombre, e.ubicacion].join(' ')).includes(qn(EQ_Q)));
  const fila = e => `<button type="button" class="item conrow" data-eq="${e.id}"><span class="tx"><b>${esc((e.productos || {}).nombre || 'Equipo')}</b>
      <span class="sm">${esc([e.serie ? 'nº ' + e.serie : '', (e.cuentas || {}).nombre, e.ubicacion, e.contrato].filter(Boolean).join(' · '))} · desde el ${fechaCorta(e.instalado)}</span></span>
    <span class="cirest">${eqRevPill(e)}${eqVencePill(e)}</span></button>`;
  const bloque = (t, l2, vacio) => `<section class="card cirbloque"><h2>${t}</h2>${l2.length ? `<div class="lista">${l2.map(fila).join('')}</div>` : `<div class="vacio vlinea">${vacio}</div>`}</section>`;
  const yaQ = $('eqq') && document.activeElement === $('eqq');
  caja.innerHTML = `<div class="cirpag"><div class="evcab"><button type="button" class="btn" id="eqnuevo">+ Equipo</button></div>
    ${rev.length ? bloque('Revisiones en los próximos 30 días', rev, '') : ''}
    ${ven.length ? bloque('Contratos y garantías que vencen', ven, '') : ''}
    <section class="card cirbloque"><div class="cicbcab"><h2>Todos los equipos · ${num(l.length)}</h2><input id="eqq" type="search" placeholder="Nº de serie, equipo, centro…" value="${esc(EQ_Q)}" aria-label="Buscar un equipo"></div>
      ${todos.length ? `<div class="lista">${todos.map(fila).join('')}</div>` : `<div class="vacio vlinea">${l.length ? 'Ningún equipo con esa búsqueda.' : 'Todavía no hay equipos instalados: dalos de alta aquí, en la ficha del centro o al confirmar el pedido de un producto «equipo».'}</div>`}</section></div>`;
  $('eqnuevo').onclick = () => editarEquipo(null);
  let t = null;
  $('eqq').oninput = e => { clearTimeout(t); t = setTimeout(() => { EQ_Q = e.target.value.trim(); pintarParque(); }, 300); };
  if (yaQ) { const i = $('eqq'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
  caja.querySelectorAll('[data-eq]').forEach(b => b.onclick = () => verEquipo(b.dataset.eq));
}
