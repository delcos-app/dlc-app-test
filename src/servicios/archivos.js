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
