// servicios/archivos.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

function descargar() { toast('La descarga de datos está desactivada para proteger la información.', true); }

async function imagenData(url) {
  try { const b = await (await fetch(url)).blob(); return await new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); }); }
  catch (e) { return null; }
}

async function cargarQR() {
  if (window.qrcode) return window.qrcode;
  await new Promise((ok, ko) => { const s = document.createElement('script'); s.src = new URL('qrcode.js', location.href).href; s.onload = ok; s.onerror = ko; document.head.appendChild(s); });
  return window.qrcode;
}

async function leerJustificante(f) {
  try {
    if (f.type === 'application/pdf') {
      if (f.size > JUSTIF_MAX) { toast('El PDF pesa más de 3 MB: haz una foto del justificante o reduce el PDF', true); return null; }
      return { nombre: f.name, tipo: f.type, tamano: f.size, datos: await aBase64(f) };
    }
    if (!/^image\//.test(f.type)) { toast('Adjunta una foto o un PDF', true); return null; }
    const url = URL.createObjectURL(f);
    const img = await new Promise((ok, mal) => { const i = new Image(); i.onload = () => ok(i); i.onerror = mal; i.src = url; });
    const k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
    const blob = await new Promise(ok => c.toBlob(ok, 'image/jpeg', 0.82));
    if (!blob || blob.size > JUSTIF_MAX) { toast('No se ha podido preparar la foto', true); return null; }
    return { nombre: f.name.replace(/\.[^.]+$/, '') + '.jpg', tipo: 'image/jpeg', tamano: blob.size, datos: await aBase64(blob) };
  } catch (e) { toast('No se ha podido leer el archivo', true); return null; }
}

async function subirJustificantes(pedido, lista) {
  // El pedido ya está guardado: si falla la subida se avisa, pero no se repite el guardado
  for (const j of lista) {
    const { error } = await db.from('pedidos_justificantes').insert({ pedido_id: pedido, nombre: j.nombre, tipo: j.tipo, tamano: j.tamano, datos: j.datos });
    if (error) { toast('El pedido se ha guardado, pero no se ha podido subir «' + j.nombre + '». Añádelo desde el pedido.', true); return true; }
  }
  return true;
}

function fotosIDB() {
  return new Promise((ok, mal) => { const r = indexedDB.open(FOTOS_IDB, 1); r.onupgradeneeded = () => r.result.createObjectStore('pend'); r.onsuccess = () => ok(r.result); r.onerror = () => mal(r.error); });
}

async function fotosGuardarPendientes(op, fotos) {
  if (!op || !fotos || !fotos.length) return;
  try {
    const b = await fotosIDB();
    await new Promise((ok, mal) => { const t = b.transaction('pend', 'readwrite'); t.objectStore('pend').put(fotos, op); t.oncomplete = ok; t.onerror = () => mal(t.error); });
    setTimeout(() => toast('Sin conexión: las fotos quedan en el móvil y se subirán con ' + TT('visita', 's', 'la', 'l', 'l')), 2600);
  } catch (e) { setTimeout(() => toast('Sin conexión: no se han podido guardar las fotos en el móvil. Añádelas desde su historial', true), 2600); }
}

async function fotosEnviarPendientes(op, id) {
  try {
    const b = await fotosIDB();
    const fotos = await new Promise(ok => { const r = b.transaction('pend').objectStore('pend').get(op); r.onsuccess = () => ok(r.result); r.onerror = () => ok(null); });
    if (!fotos || !fotos.length) return;
    if (await subirFotosVisita(id, fotos)) await new Promise(ok => { const t = b.transaction('pend', 'readwrite'); t.objectStore('pend').delete(op); t.oncomplete = ok; t.onerror = ok; });
  } catch (e) {}
}

/* v2.115.0 · Justificante del pago: una foto (se reduce a 1600 px en JPEG antes de subirla) o un PDF de hasta 3 MB,
   guardado en la tabla pedidos_justificantes. Lo ve quien ve el pedido. */
const JUSTIF_MAX = 3000000;

const aBase64 = blob => new Promise((ok, mal) => { const fr = new FileReader(); fr.onload = () => ok(String(fr.result).split(',')[1] || ''); fr.onerror = mal; fr.readAsDataURL(blob); });

const FOTOS_VISITA_MAX = 6;

// ---- Fotos de una visita guardada sin conexión: en el móvil hasta que la visita se envía
const FOTOS_IDB = 'delcos-fotos';

// Archivos: botón con el diseño de la plataforma, nombre del archivo y miniatura si es una imagen
function selectorArchivoBase(inp) {
  if (!inp || inp.dataset.fp || inp.id === 'mkfile') return;
  inp.dataset.fp = '1';
  const img = /image/.test(inp.accept || '');
  const w = document.createElement('div'); w.className = 'filepick';
  w.innerHTML = `<span class="fpmini">${svgIco(ICON_NOM[img ? 'image' : 'file'])}</span>
    <div class="fptx"><b>${img ? 'Ninguna imagen elegida' : 'Ningún archivo elegido'}</b><span class="sm">${img ? 'JPG o PNG. Mejor cuadrada y con buena luz.' : 'Elige un archivo de tu equipo.'}</span></div>
    <button type="button" class="btn sec">${svgIco(ICON_NOM.upload)} ${img ? 'Elegir imagen' : 'Elegir archivo'}</button>`;
  inp.parentNode.insertBefore(w, inp); inp.classList.add('hide'); w.appendChild(inp);
  w.querySelector('button').onclick = () => inp.click();
  inp.addEventListener('change', () => {
    const f = inp.files && inp.files[0]; if (!f) return;
    w.querySelector('.fptx b').textContent = f.name; w.querySelector('.fptx .sm').textContent = Math.round(f.size / 1024) + ' KB';
    if (img) { const u = URL.createObjectURL(f); w.querySelector('.fpmini').innerHTML = `<img src="${u}" alt="">`; }
  });
}

function selectorArchivo(inp) {
  selectorArchivoBase(inp);
  const w = inp && inp.closest('.filepick'); if (!w) return;
  // El recuadro de vista previa antiguo (al lado) se oculta: la miniatura ya está en el selector
  const cont = w.parentElement, prev = cont && cont.parentElement && [...cont.parentElement.children].find(x => x !== cont && !x.contains(w) && x.querySelector && (x.querySelector('img') || /foto|prev/i.test(x.className + x.id)) && x.getBoundingClientRect().width < 120);
  if (prev) { const im = prev.querySelector('img'); if (im && im.src) w.querySelector('.fpmini').innerHTML = `<img src="${im.src}" alt="">`; prev.classList.add('hide'); }
  const lab = cont.querySelector(`label[for="${inp.id}"]`); if (lab) lab.classList.add('hide');
}
