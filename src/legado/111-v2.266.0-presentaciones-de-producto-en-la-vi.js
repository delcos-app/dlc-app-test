/* ============================================================
   v2.266.0 · Presentaciones de producto en la visita (grupo 4 del plan del 11/10/2026; necesita el SQL 143).
   - Ficha del producto (administración): «Material para presentar», imágenes o PDF (fichas técnicas, estudios, catálogo).
   - «Registrar visita»: bajo «Productos presentados», «Presentar» con los productos que tienen material; se ve a pantalla completa
     (con flechas y teclado) y el producto queda marcado como presentado (cuenta en la cobertura del ciclo).
   - El material se descarga al enseñarlo y se queda en memoria mientras la app está abierta; sin conexión, solo lo ya visto.
   ============================================================ */
const PRES_MAX = 8 * 1024 * 1024;
let PRES_MAT = null, PRES_T = 0;           // [{id, producto_id, nombre, tipo, orden}] · cuándo se leyó
const PRES_DATOS = new Map();               // id → datos (base64) ya descargados
// La lista de material se pide a la vez que los productos promocionados (así «Presentar» sale con ellos, no después)
productosPromocionados = (orig => async function (...a) {
  const [r] = await Promise.all([orig.apply(this, a), presMateriales()]);
  return r;
})(productosPromocionados);
abrirVisitaBase = (orig => async function (id, ...r) {
  const res = await orig.call(this, id, ...r);
  try {
    const v = $('vprods'); if (!v || $('vpres') || !PRES_MAT || !PRES_MAT.length) return res;
    const con = [...v.querySelectorAll('[data-vprod]')].filter(b => PRES_MAT.some(m => m.producto_id === b.dataset.vprod));
    if (!con.length) return res;
    v.insertAdjacentHTML('afterend', `<div class="vpres" id="vpres"><span class="sm">Presentar</span>${con.map(b => `<button type="button" class="chip" data-vpres="${b.dataset.vprod}">▶ ${esc(b.textContent.trim())}</button>`).join('')}</div>`);
    $('vpres').querySelectorAll('[data-vpres]').forEach(b => b.onclick = () => presentarProducto(b.dataset.vpres));
  } catch (e) {}
  return res;
})(abrirVisitaBase);
let PRES = null;   // { l, i, urls }

// Ficha del producto: el material para presentar
editorProducto = (orig => function (p, ...r) {
  const x = orig.call(this, p, ...r);
  setTimeout(async () => {
    if (!puede('administrar') || !$('dbody') || !$('prok') || $('prmat') || !p || !p.id) return;
    const ref = $('dbody').querySelector('.acts:last-of-type'); if (!ref) return;
    const l = (await presMateriales(true)).filter(m => m.producto_id === p.id);
    if (!$('dbody') || $('prmat') || !$('prok')) return;
    ref.insertAdjacentHTML('beforebegin', `<div class="blk" id="prmat"><h3>Material para presentar</h3>
      <p class="sm">Imágenes o PDF (fichas técnicas, estudios, catálogo) que se enseñan a pantalla completa al registrar ${esc(TT('visita', 's', 'una', 'l', 'l'))}. Hasta 8 MB cada uno. Con «Para los centros», los centros que tienen el producto lo descargan desde su portal.</p>
      <div class="prmatl" id="prmatl"></div>
      <label class="btn sec prmatadd">+ Añadir imagen o PDF<input type="file" id="prmatf" accept="image/*,application/pdf" data-fp="1" multiple hidden></label></div>`);
    const pinta = lista => {
      $('prmatl').innerHTML = lista.length ? lista.map(m => `<div class="prmati"><span>${m.tipo === 'application/pdf' ? 'PDF' : 'Imagen'} · ${esc(m.nombre)}</span><label class="prmatpp"><input type="checkbox" data-prmatpp="${m.id}" ${m.para_portal ? 'checked' : ''}> Para los centros</label>
          <button type="button" class="lnk" data-prmatver="${m.id}">Ver</button><button type="button" class="lnk" data-prmatdel="${m.id}" aria-label="Quitar ${esc(m.nombre)}">Quitar</button></div>`).join('')
        : '<p class="sm">Todavía no tiene material.</p>';
      $('prmatl').querySelectorAll('[data-prmatver]').forEach(b => b.onclick = async () => {
        await presMateriales(); presentarSolo(p, b.dataset.prmatver);
      });
      $('prmatl').querySelectorAll('[data-prmatdel]').forEach(b => b.onclick = async () => {
        const m = lista.find(y => y.id === b.dataset.prmatdel); if (!m) return;
        if (!await preguntar(`Se quita «${m.nombre}» del material de este producto.`, { titulo: '¿Quitar el material?', ok: 'Quitar', peligro: true })) return;
        const { error } = await db.from('producto_materiales').delete().eq('id', m.id);
        if (error) { toast('No se ha podido quitar: ' + error.message, true); return; }
        PRES_DATOS.delete(m.id); pinta((await presMateriales(true)).filter(y => y.producto_id === p.id)); toast('Material quitado');
      });
    };
    pinta(l);
    $('prmatf').onchange = async e => {
      const fs = [...e.target.files]; e.target.value = '';
      let n = 0, orden = l.length;
      for (const f of fs) {
        let a = null;
        if (f.type === 'application/pdf') {
          if (f.size > PRES_MAX) { toast(`«${f.name}» pesa más de 8 MB`, true); continue; }
          a = { nombre: f.name, tipo: f.type, tamano: f.size, datos: await aBase64(f) };
        } else if (/^image\//.test(f.type)) a = await leerJustificante(f);
        else { toast(`«${f.name}» no es una imagen ni un PDF`, true); continue; }
        if (!a) continue;
        const { error } = await db.from('producto_materiales').insert({ producto_id: p.id, nombre: a.nombre, tipo: a.tipo, tamano: a.tamano, datos: a.datos, orden: orden++ });
        if (error) { toast(`No se ha podido subir «${f.name}»: ${error.message}`, true); continue; }
        n++;
      }
      if (n) toast(n === 1 ? 'Material añadido' : `${n} archivos añadidos`);
      if ($('prmatl')) pinta((await presMateriales(true)).filter(y => y.producto_id === p.id));
    };
  }, 160);
  return x;
})(editorProducto);




