/* ============================================================
   v2.65.0 · Importar datos: clientes, productos, prescriptores y
   ventas desde Excel o CSV, con correspondencia de columnas,
   campos personalizados (clasificadores del módulo), revisión
   previa, registro de importaciones y deshacer
   ============================================================ */

Object.assign(ICON_NOM, {"file-spreadsheet": "<path d=\"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z\" /> <path d=\"M14 2v4a2 2 0 0 0 2 2h4\" /> <path d=\"M8 13h2\" /> <path d=\"M14 13h2\" /> <path d=\"M8 17h2\" /> <path d=\"M14 17h2\" />", "users": "<path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\" /> <circle cx=\"9\" cy=\"7\" r=\"4\" /> <path d=\"M22 21v-2a4 4 0 0 0-3-3.87\" /> <path d=\"M16 3.13a4 4 0 0 1 0 7.75\" />", "package": "<path d=\"M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z\" /> <path d=\"M12 22V12\" /> <path d=\"m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7\" /> <path d=\"m7.5 4.27 9 5.15\" />", "stethoscope": "<path d=\"M11 2v2\" /> <path d=\"M5 2v2\" /> <path d=\"M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1\" /> <path d=\"M8 15a6 6 0 0 0 12 0v-3\" /> <circle cx=\"20\" cy=\"10\" r=\"2\" />", "shopping-cart": "<circle cx=\"8\" cy=\"21\" r=\"1\" /> <circle cx=\"19\" cy=\"21\" r=\"1\" /> <path d=\"M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12\" />", "check": "<path d=\"M20 6 9 17l-5-5\" />", "undo-2": "<path d=\"M9 14 4 9l5-5\" /> <path d=\"M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11\" />", "history": "<path d=\"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8\" /> <path d=\"M3 3v5h5\" /> <path d=\"M12 7v5l4 2\" />"});

// Campos estándar de cada tipo de datos: [clave, etiqueta, obligatorio, sinónimos para reconocer la columna]
const IMP_CAMPOS = {
  clientes: [
    ['nombre', 'Nombre o razón social', 1, ['nombre', 'cliente', 'razon social', 'name', 'nombre completo', 'denominacion', 'nombre cliente']],
    ['nif', 'NIF / CIF / DNI', 0, ['nif', 'cif', 'dni', 'nie', 'vat', 'tax id', 'nif cif', 'identificacion fiscal', 'documento']],
    ['email', 'Email', 0, ['email', 'correo', 'e mail', 'mail', 'correo electronico']],
    ['telefono', 'Teléfono', 0, ['telefono', 'tel', 'phone', 'telefono fijo', 'tlf', 'tfno', 'telf', 'tlfno', 'tfn']],
    ['movil', 'Móvil', 0, ['movil', 'mobile', 'celular', 'telefono movil', 'mvl']],
    ['direccion', 'Dirección', 0, ['direccion', 'domicilio', 'address', 'calle']],
    ['cp', 'Código postal', 0, ['codigo postal', 'cp', 'postal', 'zip', 'c p']],
    ['municipio', 'Población', 0, ['poblacion', 'municipio', 'ciudad', 'localidad', 'city']],
    ['provincia', 'Provincia', 0, ['provincia', 'state', 'region']],
    ['pais', 'País', 0, ['pais', 'country']],
    ['empresa', 'Empresa', 0, ['empresa', 'company', 'compania']],
    ['tipo', 'Tipo (Persona o Empresa)', 0, ['tipo', 'tipo cliente', 'tipo de cliente']],
    ['medico', `${TT('medico', 's', '', 'l', 'C')} de referencia`, 0, ['medico', 'prescriptor', 'doctor', 'recomendado por']],
    ['nota', 'Notas', 0, ['notas', 'nota', 'observaciones', 'comentarios']]],
  productos: [
    ['nombre', 'Nombre', 1, ['nombre', 'producto', 'articulo', 'name', 'descripcion corta']],
    ['referencia', 'Referencia', 0, ['referencia', 'ref', 'sku', 'codigo', 'codigo interno', 'cod']],
    ['codigo_barras', 'Código de barras (EAN)', 0, ['ean', 'codigo de barras', 'barcode', 'gtin', 'ean13']],
    ['precio', 'Precio sin IVA', 0, ['precio', 'pvp', 'price', 'precio venta', 'subtotal', 'precio sin iva']],
    ['iva', 'IVA (%)', 0, ['iva', 'impuesto', 'impuestos', 'tax', 'tipo iva', 'iva']],
    ['coste', 'Coste', 0, ['coste', 'costo', 'cost', 'precio compra', 'precio de compra']],
    ['presentacion', 'Presentación', 0, ['presentacion', 'formato', 'descripcion']],
    ['unidades_envase', 'Unidades por envase', 0, ['unidades por envase', 'uds envase', 'pack', 'unidades envase']],
    ['stock_minimo', 'Stock mínimo', 0, ['stock minimo', 'minimo']],
    ['tipo', 'Tipo (producto o servicio)', 0, ['tipo']]],
  prescriptores: [
    ['nombre', 'Nombre', 1, ['nombre', 'medico', 'doctor', 'prescriptor', 'nombre completo', 'name']],
    ['especialidad', TT('especialidad', 's', '', 'l', 'C'), 0, ['especialidad', 'specialty', 'especialitat', 'segmento', 'categoria']],
    ['area', 'Área', 0, ['area', 'zona']],
    ['cargo', 'Cargo', 0, ['cargo', 'puesto']],
    ['telefono', 'Teléfono', 0, ['telefono', 'tel', 'phone', 'movil', 'tfno', 'telf', 'tlf']],
    ['email', 'Email', 0, ['email', 'correo', 'e mail', 'mail']],
    ['centro', 'Centro o lugar de trabajo', 0, ['centro', 'clinica', 'hospital', 'centro de trabajo', 'consulta']],
    ['direccion', `Dirección ${TT('consulta', 's', 'del', 'l', 'l')}`, 0, ['direccion', 'domicilio', 'address']],
    ['cp', 'Código postal', 0, ['codigo postal', 'cp', 'postal']],
    ['municipio', 'Población', 0, ['poblacion', 'municipio', 'ciudad', 'localidad']],
    ['provincia', 'Provincia', 0, ['provincia']],
    ['nota', 'Notas', 0, ['notas', 'nota', 'observaciones']]],
  ventas: [
    ['numero', 'Número de pedido o factura', 0, ['numero', 'num factura', 'factura', 'n pedido', 'pedido', 'num', 'numero factura', 'numero pedido', 'n factura']],
    ['fecha', 'Fecha', 1, ['fecha', 'date', 'fecha factura', 'fecha pedido']],
    ['cliente', 'Cliente', 1, ['cliente', 'contacto', 'nombre cliente', 'razon social', 'customer']],
    ['nif', 'NIF del cliente', 0, ['nif', 'cif', 'dni']],
    ['producto', 'Producto', 1, ['producto', 'item', 'articulo', 'concepto', 'descripcion producto']],
    ['referencia', 'Referencia del producto', 0, ['referencia', 'sku', 'ref', 'codigo']],
    ['unidades', 'Unidades', 0, ['unidades', 'uds', 'cantidad', 'qty', 'unidad']],
    ['precio', 'Precio unitario', 0, ['precio', 'precio unitario', 'pvp']],
    ['importe', 'Importe de la línea (sin IVA)', 0, ['importe', 'subtotal', 'base', 'total linea', 'base imponible']],
    ['iva', 'IVA (%)', 0, ['iva', 'impuesto', 'tipo iva']],
    ['medico', `${TT('medico', 's', '', 'l', 'C')}`, 0, ['medico', 'prescriptor', 'doctor']],
    ['forma_pago', 'Forma de pago', 0, ['forma de pago', 'f pago', 'metodo de pago', 'pago']],
    ['cobrado', 'Cobrado (sí o no)', 0, ['cobrado', 'pagado', 'estado cobro']],
    ['canal', 'Canal', 0, ['canal']]]
};
const IMP_TIPOS = () => [
  ['clientes', 'Clientes', `${TT('paciente', 'p', '', 'l', 'C')} y empresas: datos de contacto y facturación`, 'users'],
  ['productos', 'Productos', 'Catálogo: referencias, precios, IVA y costes', 'package'],
  ['prescriptores', etiquetaContactos(), `${TT('medico', 'p', '', 'l', 'C')} y sus centros`, 'stethoscope'],
  ['ventas', 'Ventas', 'Histórico de ventas con sus líneas de producto', 'shopping-cart']];
const impNorm = t => String(t == null ? '' : t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const impClave = t => impNorm(t).toUpperCase().replace(/ /g, '_').slice(0, 40) || 'CAMPO';
const impHash = s => { let h = 5381; for (const c of s) h = ((h << 5) + h + c.charCodeAt(0)) | 0; return (h >>> 0).toString(36); };
let IMP = null;   // estado del asistente

// Lector de Excel y CSV (se carga solo al usarlo)
async function cargarLectorExcel() {
  if (window.XLSX) return window.XLSX;
  await new Promise((ok, ko) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; s.onload = ok; s.onerror = ko; document.head.appendChild(s); });
  return window.XLSX;
}
// La fila de títulos es la primera con muchos textos (las exportaciones suelen traer filas de encabezado antes)
function detectarTitulos(filas) {
  const puntos = filas.slice(0, 15).map(f => f.filter(c => typeof c === 'string' && c.trim() && isNaN(Number(c.replace(',', '.')))).length);
  const max = Math.max(0, ...puntos); if (max < 2) return 0;
  return puntos.findIndex(p => p >= max * 0.8);
}
// Propone el campo de cada columna: sinónimo exacto, contenido, o parecido
function proponerCampo(cab, entidad, usados) {
  const n = impNorm(cab); let mejor = null;
  const bigr = s => { const r = new Set(); for (let i = 0; i < s.length - 1; i++) r.add(s.slice(i, i + 2)); return r; };
  const dice = (a, b) => { const A = bigr(a), B = bigr(b); if (!A.size || !B.size) return 0; let c = 0; A.forEach(x => { if (B.has(x)) c++; }); return 2 * c / (A.size + B.size); };
  for (const [k, , , sin] of IMP_CAMPOS[entidad]) {
    if (usados.has(k)) continue;
    let p = 0;
    for (const s of sin.concat([k])) {
      const sn = impNorm(s);
      if (n === sn) p = Math.max(p, 100);
      else if (n.split(' ').includes(sn) || (sn.length > 3 && n.includes(sn))) p = Math.max(p, 75);
      else p = Math.max(p, Math.round(dice(n, sn) * 70));
    }
    if (p >= 55 && (!mejor || p > mejor.p)) mejor = { k, p };
  }
  return mejor ? mejor.k : null;
}
function valorCelda(v) {
  if (v == null) return '';
  if (v instanceof Date) return isNaN(v) ? '' : `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, '0')}-${String(v.getDate()).padStart(2, '0')}`;
  return String(v).trim();
}

/* ---------- pantalla ---------- */
function impPasos(n) {
  const p = ['Qué importar', 'Archivo', 'Columnas', 'Revisión'];
  return `<div class="imppasos">${p.map((t, i) => `<span class="${i + 1 < n ? 'hecho' : i + 1 === n ? 'actual' : ''}"><b>${i + 1 < n ? svgIco(ICON_NOM.check) : i + 1}</b>${t}</span>`).join('')}</div>`;
}
function pintarImportar() {
  IMP = { paso: 1 };
  $('cfgcuerpo').innerHTML = `<div class="card cfgpanel impcaja">${impPasos(1)}
    <h2 style="padding:0 0 4px">¿Qué quieres importar?</h2>
    <p class="sm">Carga un Excel o un CSV. La plataforma reconocerá sus columnas y te propondrá con qué campo se corresponde cada una. Las columnas que no tengamos se pueden guardar como campos personalizados.</p>
    <div class="imptipos">${IMP_TIPOS().map(([k, t, d, ic]) => `<button class="imptipo" type="button" data-impt="${k}"><span class="imptic">${svgIco(ICON_NOM[ic])}</span><b>${esc(t)}</b><span class="sm">${esc(d)}</span></button>`).join('')}</div></div>`;
  $('cfgcuerpo').querySelectorAll('[data-impt]').forEach(b => b.onclick = () => { IMP.entidad = b.dataset.impt; impArchivo(); });
}
function impArchivo() {
  const nom = IMP_TIPOS().find(x => x[0] === IMP.entidad)[1];
  $('cfgcuerpo').innerHTML = `<div class="card cfgpanel impcaja">${impPasos(2)}
    <h2 style="padding:0 0 4px">Archivo de ${esc(nom.toLowerCase())}</h2>
    <p class="sm">Excel (.xlsx, .xls) o CSV. La primera fila con títulos se detecta sola, aunque el archivo tenga filas de encabezado antes.${IMP.entidad === 'ventas' ? ' En ventas, cada fila es una línea de producto: las filas con el mismo número forman un pedido. Los productos deben existir ya (impórtalos antes).' : ''}</p>
    <label class="impzona" id="impzona"><input type="file" id="impfile" accept=".xlsx,.xls,.csv,.txt" hidden>
      ${svgIco(ICON_NOM['file-spreadsheet'])}<b>Arrastra aquí el archivo o pulsa para elegirlo</b><span class="sm">Hasta 20.000 filas</span></label>
    <div id="imphojas"></div>
    <div class="acts" style="justify-content:space-between"><button class="btn sec" type="button" id="impvolver">‹ Volver</button></div></div>`;
  $('impvolver').onclick = pintarImportar;
  const zona = $('impzona');
  zona.ondragover = e => { e.preventDefault(); zona.classList.add('sobre'); };
  zona.ondragleave = () => zona.classList.remove('sobre');
  zona.ondrop = e => { e.preventDefault(); zona.classList.remove('sobre'); if (e.dataTransfer.files[0]) impLeer(e.dataTransfer.files[0]); };
  $('impfile').onchange = e => { if (e.target.files[0]) impLeer(e.target.files[0]); };
}
async function impLeer(file) {
  const zona = $('impzona'); zona.classList.add('leyendo'); zona.querySelector('b').textContent = 'Leyendo ' + file.name + '…';
  try {
    const X = await cargarLectorExcel();
    const buf = await file.arrayBuffer();
    const wb = /\.(csv|txt)$/i.test(file.name) ? X.read(new TextDecoder('utf-8').decode(buf), { type: 'string', cellDates: true, raw: false }) : X.read(buf, { type: 'array', cellDates: true });
    IMP.archivo = file.name; IMP.libro = wb;
    if (wb.SheetNames.length > 1) {
      $('imphojas').innerHTML = `<label for="imphoja">El archivo tiene varias hojas: ¿cuál importamos?</label><select id="imphoja">${wb.SheetNames.map(n => `<option>${esc(n)}</option>`).join('')}</select>
        <div class="acts"><button class="btn" type="button" id="imphojaok">Continuar</button></div>`;
      zona.querySelector('b').textContent = file.name; zona.classList.remove('leyendo');
      $('imphojaok').onclick = () => impHoja($('imphoja').value);
    } else impHoja(wb.SheetNames[0]);
  } catch (e) {
    zona.classList.remove('leyendo'); zona.querySelector('b').textContent = 'No se ha podido leer el archivo. ¿Es un Excel o un CSV?';
    registrarError('error', 'Importar: ' + (e.message || e));
  }
}
async function impHoja(nombre) {
  const X = window.XLSX, ws = IMP.libro.Sheets[nombre];
  const filas = X.utils.sheet_to_json(ws, { header: 1, raw: true, defval: '' }).map(f => f.map(valorCelda));
  const h = detectarTitulos(filas);
  IMP.cabeceras = filas[h].map((c, i) => c || `Columna ${i + 1}`);
  IMP.datos = filas.slice(h + 1).map((f, i) => ({ fila: h + i + 2, v: f })).filter(r => r.v.some(c => c !== ''));
  if (!IMP.datos.length) { toast('El archivo no tiene filas con datos', true); return; }
  if (IMP.datos.length > 20000) { toast('El archivo tiene más de 20.000 filas: divídelo en varios', true); return; }
  // Correspondencia: la recordada para un archivo con las mismas columnas o la propuesta
  IMP.firma = impHash(IMP.entidad + '|' + IMP.cabeceras.map(impNorm).join('|'));
  const { data: plantilla } = await RPC_ORIG('plantilla_importacion', { p_entidad: IMP.entidad, p_firma: IMP.firma });
  const usados = new Set();
  IMP.mapa = IMP.cabeceras.map(c => {
    if (plantilla && plantilla[c]) { const d = plantilla[c]; if (d.startsWith('std:')) usados.add(d.slice(4)); return d; }
    const k = proponerCampo(c, IMP.entidad, usados); if (k) { usados.add(k); return 'std:' + k; }
    const i = IMP.cabeceras.indexOf(c);
    return IMP.datos.some(r => r.v[i] !== '') ? 'extra' : 'no';
  });
  IMP.recordada = !!plantilla;
  impColumnas();
}
function impColumnas() {
  const campos = IMP_CAMPOS[IMP.entidad];
  const ejemplos = i => [...new Set(IMP.datos.slice(0, 40).map(r => r.v[i]).filter(Boolean))].slice(0, 3);
  $('cfgcuerpo').innerHTML = `<div class="card cfgpanel impcaja">${impPasos(3)}
    <h2 style="padding:0 0 4px">Columnas de «${esc(IMP.archivo)}»</h2>
    <p class="sm">${num(IMP.datos.length)} filas · ${IMP.cabeceras.length} columnas. ${IMP.recordada ? '<b>Se ha aplicado la correspondencia que usaste la última vez con un archivo con estas columnas.</b>' : 'Te proponemos el campo de cada columna: revísalo.'} Las columnas sin equivalente se proponen como <b>campo personalizado</b>: se crearán en Clasificadores (${esc(IMP_TIPOS().find(x => x[0] === IMP.entidad)[1])}).</p>
    <div class="impmapa">${IMP.cabeceras.map((c, i) => `<div class="impcol ${IMP.mapa[i] === 'no' ? 'ignorada' : ''}">
      <div><b>${esc(c)}</b><span class="sm">${ejemplos(i).map(esc).join(' · ') || 'vacía'}</span></div>
      <span class="impflecha">→</span>
      <select data-impc="${i}"><option value="no" ${IMP.mapa[i] === 'no' ? 'selected' : ''}>No importar</option>
        <optgroup label="Campos de la plataforma">${campos.map(([k, t, ob]) => `<option value="std:${k}" ${IMP.mapa[i] === 'std:' + k ? 'selected' : ''}>${esc(t)}${ob ? ' *' : ''}</option>`).join('')}</optgroup>
        <option value="extra" ${IMP.mapa[i] === 'extra' ? 'selected' : ''}>Campo personalizado: «${esc(c)}»</option></select></div>`).join('')}</div>
    <div id="impaviso" class="sm" style="margin-top:10px"></div>
    <div class="acts" style="justify-content:space-between"><button class="btn sec" type="button" id="impvolver">‹ Volver</button><button class="btn" type="button" id="impsig">Revisar la importación ›</button></div></div>`;
  const validar = () => {
    const std = IMP.mapa.filter(m => m.startsWith('std:')).map(m => m.slice(4));
    const falta = campos.filter(c => c[2] && !std.includes(c[0]) && !(IMP.entidad === 'ventas' && c[0] === 'producto' && std.includes('referencia')));
    const rep = std.filter((k, i) => std.indexOf(k) !== i);
    $('impaviso').innerHTML = falta.length ? `<span style="color:var(--dang)">Falta asignar: ${falta.map(c => esc(c[1])).join(', ')}.</span>`
      : rep.length ? `<span style="color:var(--dang)">Hay dos columnas asignadas al mismo campo: ${[...new Set(rep)].map(k => esc(campos.find(c => c[0] === k)[1])).join(', ')}.</span>` : '';
    $('impsig').disabled = !!(falta.length || rep.length);
  };
  $('cfgcuerpo').querySelectorAll('[data-impc]').forEach(s => s.onchange = () => { IMP.mapa[+s.dataset.impc] = s.value; s.closest('.impcol').classList.toggle('ignorada', s.value === 'no'); validar(); });
  $('impvolver').onclick = impArchivo; $('impsig').onclick = impRevisar;
  validar();
}
// Convierte las filas del archivo en lo que espera la base de datos
function impFilas() {
  const std = {}, extra = {};
  IMP.mapa.forEach((m, i) => { if (m.startsWith('std:')) std[m.slice(4)] = i; else if (m === 'extra') extra[impClave(IMP.cabeceras[i])] = i; });
  const obj = r => { const o = { _fila: r.fila }; for (const k in std) o[k] = r.v[std[k]] ?? ''; const ex = {}; for (const k in extra) if (r.v[extra[k]] !== '') ex[k] = r.v[extra[k]]; o.extra = ex; return o; };
  if (IMP.entidad !== 'ventas') return IMP.datos.map(obj);
  // Ventas: las filas con el mismo número (o misma fecha y cliente) forman un pedido
  const peds = new Map();
  IMP.datos.forEach(r => {
    const o = obj(r), k = o.numero ? 'n:' + o.numero : 'f:' + o.fecha + '|' + o.cliente;
    if (!peds.has(k)) peds.set(k, { _fila: o._fila, numero: o.numero || '', fecha: o.fecha, cliente: o.cliente, nif: o.nif || '', medico: o.medico || '',
      forma_pago: o.forma_pago || '', cobrado: o.cobrado || '', canal: o.canal || '', extra: o.extra, lineas: [] });
    peds.get(k).lineas.push({ producto: o.producto || '', referencia: o.referencia || '', unidades: o.unidades, precio: o.precio, importe: o.importe, iva: o.iva, medico: o.medico || '' });
  });
  return [...peds.values()];
}
async function impLotes(filas, modo, simular, imp, avance) {
  const res = { creados: 0, actualizados: 0, omitidos: 0, errores: [], filas: [] };
  for (let i = 0; i < filas.length; i += 200) {
    const { data, error } = await RPC_ORIG('importar_lote', { p_imp: imp || null, p_entidad: IMP.entidad, p_filas: filas.slice(i, i + 200), p_modo: modo, p_simular: simular });
    if (error || !data || !data.ok) throw new Error(error ? error.message : (data && data.error) || 'sin respuesta');
    res.creados += data.creados; res.actualizados += data.actualizados; res.omitidos += data.omitidos;
    res.errores.push(...data.errores); res.filas.push(...data.filas);
    if (avance) avance(Math.min(filas.length, i + 200), filas.length);
  }
  return res;
}
async function impRevisar() {
  const filas = impFilas();
  $('cfgcuerpo').innerHTML = `<div class="card cfgpanel impcaja">${impPasos(4)}<h2 style="padding:0 0 4px">Revisando…</h2><p class="sm">Comprobamos cada fila sin guardar nada todavía.</p><div class="impbarra"><i style="width:0"></i></div></div>`;
  let sim;
  try { sim = await impLotes(filas, 'actualizar', true, null, (a, t) => { const b = $('cfgcuerpo').querySelector('.impbarra i'); if (b) b.style.width = Math.round(a / t * 100) + '%'; }); }
  catch (e) { toast('No se ha podido revisar: ' + e.message, true); impColumnas(); return; }
  const existen = sim.filas.filter(f => f.accion === 'actualizado').length;
  const nuevos = sim.filas.filter(f => f.accion === 'nuevo').length, omitidos = sim.filas.filter(f => f.accion === 'omitido').length;
  const extras = IMP.mapa.map((m, i) => m === 'extra' ? IMP.cabeceras[i] : null).filter(Boolean);
  const unidad = IMP.entidad === 'ventas' ? 'pedidos' : 'registros';
  $('cfgcuerpo').innerHTML = `<div class="card cfgpanel impcaja">${impPasos(4)}
    <h2 style="padding:0 0 4px">Revisión de «${esc(IMP.archivo)}»</h2>
    <div class="impres"><div class="ok"><b>${num(nuevos)}</b><span>${unidad} nuevos</span></div>
      <div><b>${num(existen + omitidos)}</b><span>ya existen${IMP.entidad === 'ventas' ? ' (no se tocan)' : ''}</span></div>
      <div class="${sim.errores.length ? 'mal' : ''}"><b>${num(sim.errores.length)}</b><span>con errores (no se importarán)</span></div></div>
    ${existen && IMP.entidad !== 'ventas' ? `<label>Los que ya existen</label><div class="segs" id="impmodo"><button type="button" data-v="actualizar" class="on">Actualizar con los datos del archivo</button><button type="button" data-v="omitir">Dejarlos como están</button></div>
      <p class="sm">Se reconocen por ${IMP.entidad === 'clientes' ? 'NIF, email o nombre' : IMP.entidad === 'productos' ? 'referencia, código de barras o nombre' : 'nombre'}. Al actualizar solo se rellenan los datos que trae el archivo; los demás se conservan.</p>` : ''}
    ${extras.length ? `<p class="sm">Campos personalizados que se crearán en Clasificadores: <b>${extras.map(esc).join(', ')}</b>.</p>` : ''}
    ${sim.errores.length ? `<details class="imperr" ${sim.errores.length <= 10 ? 'open' : ''}><summary>Ver las filas con errores</summary><div>${sim.errores.slice(0, 200).map(e => `<div><b>Fila ${e.fila}</b> · ${esc(e.error)}</div>`).join('')}</div></details>` : ''}
    <div class="acts" style="justify-content:space-between"><button class="btn sec" type="button" id="impvolver">‹ Columnas</button>
      <button class="btn" type="button" id="impok" ${nuevos + existen ? '' : 'disabled'}>Importar ${num(nuevos + existen)} ${unidad}</button></div></div>`;
  let modo = 'actualizar';
  const segs = $('impmodo'); if (segs) segs.querySelectorAll('button').forEach(b => b.onclick = () => { modo = b.dataset.v; segs.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); $('impok').textContent = `Importar ${num(nuevos + (modo === 'actualizar' ? existen : 0))} ${unidad}`; });
  $('impvolver').onclick = impColumnas;
  $('impok').onclick = () => impEjecutar(filas, IMP.entidad === 'ventas' ? 'omitir' : modo);
}
async function impEjecutar(filas, modo) {
  const mapeo = {}; IMP.cabeceras.forEach((c, i) => { mapeo[c] = IMP.mapa[i]; });
  const { data: ini } = await RPC_ORIG('importar_iniciar', { p_entidad: IMP.entidad, p_archivo: IMP.archivo, p_filas: filas.length, p_mapeo: mapeo, p_firma: IMP.firma });
  if (!ini || !ini.ok) { toast('No se ha podido iniciar la importación', true); return; }
  // Campos personalizados → clasificadores del módulo (con sus valores si son pocos)
  const campos = IMP.mapa.map((m, i) => m === 'extra' ? i : null).filter(i => i != null).map(i => {
    const vals = [...new Set(IMP.datos.map(r => r.v[i]).filter(Boolean))];
    return { clave: impClave(IMP.cabeceras[i]), nombre: IMP.cabeceras[i], valores: vals.length <= 30 ? vals : [] };
  });
  if (campos.length) await RPC_ORIG('importar_campos', { p_entidad: IMP.entidad, p_campos: campos });
  $('cfgcuerpo').innerHTML = `<div class="card cfgpanel impcaja">${impPasos(4)}<h2 style="padding:0 0 4px">Importando…</h2><p class="sm" id="impav">0 de ${num(filas.length)}</p><div class="impbarra"><i style="width:0"></i></div></div>`;
  let r;
  try { r = await impLotes(filas, modo, false, ini.id, (a, t) => { const b = $('cfgcuerpo').querySelector('.impbarra i'); if (b) b.style.width = Math.round(a / t * 100) + '%'; if ($('impav')) $('impav').textContent = `${num(a)} de ${num(t)}`; }); }
  catch (e) { toast('La importación se ha interrumpido: ' + e.message + '. Lo importado hasta ahora se puede deshacer desde «Importaciones».', true); return; }
  await RPC_ORIG('importar_terminar', { p_imp: ini.id });
  ESCRITURAS++;
  const destino = { clientes: 'pacientes', productos: 'productos', prescriptores: 'directorio', ventas: 'ventas' }[IMP.entidad];
  $('cfgcuerpo').innerHTML = `<div class="card cfgpanel impcaja"><div class="impfin">${svgIco(ICON_NOM.check)}</div>
    <h2 style="padding:0 0 4px;text-align:center">Importación terminada</h2>
    <div class="impres"><div class="ok"><b>${num(r.creados)}</b><span>creados</span></div><div><b>${num(r.actualizados)}</b><span>actualizados</span></div>
      <div><b>${num(r.omitidos)}</b><span>sin cambios</span></div><div class="${r.errores.length ? 'mal' : ''}"><b>${num(r.errores.length)}</b><span>con errores</span></div></div>
    ${r.errores.length ? `<details class="imperr"><summary>Ver las filas con errores</summary><div>${r.errores.slice(0, 200).map(e => `<div><b>Fila ${e.fila}</b> · ${esc(e.error)}</div>`).join('')}</div></details>` : ''}
    <div class="acts" style="justify-content:center;flex-wrap:wrap"><button class="btn sec" type="button" id="impdes">${svgIco(ICON_NOM['undo-2'])} Deshacer esta importación</button>
      <button class="btn sec" type="button" id="impotra">Importar otro archivo</button><button class="btn" type="button" id="impver">Ver ${esc(IMP_TIPOS().find(x => x[0] === IMP.entidad)[1].toLowerCase())}</button></div></div>`;
  $('impdes').onclick = () => impDeshacer(ini.id);
  $('impotra').onclick = pintarImportar;
  $('impver').onclick = () => { if (destino === 'ventas') PEDSEC = 'ventas'; ir(destino); };
}
async function impDeshacer(id) {
  if (!await preguntar('Se borrará lo que CREÓ esta importación (los datos que actualizó no cambian). No se borra lo que ya se esté usando en pedidos, facturas o citas.', { titulo: '¿Deshacer la importación?', ok: 'Deshacer', peligro: true })) return;
  const { data } = await RPC_ORIG('importar_deshacer', { p_imp: id });
  if (!data || !data.ok) { toast('No se ha podido deshacer', true); return; }
  ESCRITURAS++;
  toast(`Deshecha: ${data.clientes} clientes, ${data.productos} productos, ${data.prescriptores} ${etiquetaContactos().toLowerCase()} y ${data.pedidos} pedidos borrados`);
  CFG_SUB = 'historial'; pintarImportaciones();
}
async function pintarImportaciones() {
  const { data } = await RPC_ORIG('importaciones_lista', {});
  const l = data || [], nom = Object.fromEntries(IMP_TIPOS().map(x => [x[0], x[1]]));
  $('cfgcuerpo').innerHTML = `<div class="card cfgpanel"><h2>Importaciones</h2>
    <p class="sm">Cada importación se puede deshacer: se borra lo que creó (lo que actualizó se conserva, y no se borra lo que ya se use en pedidos, facturas o citas).</p>
    <div class="errlista">${l.map(x => `<div class="errfila e-${x.estado === 'Deshecha' ? 'api' : 'reporte'}"><div><b>${esc(nom[x.entidad] || x.entidad)} · ${esc(x.archivo || '')}</b>
      <span class="sm">${new Date(x.creado_en).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })} · ${esc(x.usuario || '—')} · ${num(x.filas)} filas: ${num(x.creados)} creados, ${num(x.actualizados)} actualizados, ${num(x.errores)} con errores · <b>${esc(x.estado)}</b></span></div>
      ${x.estado !== 'Deshecha' ? `<button class="btn sec" type="button" data-impdes="${x.id}">${svgIco(ICON_NOM['undo-2'])} Deshacer</button>` : '<span></span>'}</div>`).join('') || '<div class="vacio">Aún no se ha importado ningún archivo.</div>'}</div></div>`;
  $('cfgcuerpo').querySelectorAll('[data-impdes]').forEach(b => b.onclick = () => impDeshacer(b.dataset.impdes));
}
// Configuración → Datos → Importar datos (administración)
arbolConfig = (orig => function () {
  const g = orig();
  // v2.109.0: con el permiso «Importar datos» del rol (antes, solo administración)
  if (!puede('importar_datos')) return g;
  const datos = g.find(x => x[0] === 'Datos');
  const item = { k: 'importar', ic: 'file-spreadsheet', t: 'Importar datos', d: `Clientes, productos, ${etiquetaContactos().toLowerCase()} y ventas desde Excel o CSV`,
    sub: [['nueva', 'Nueva importación', pintarImportar], ['historial', 'Importaciones', pintarImportaciones]] };
  if (datos) { if (!datos[1].some(x => x.k === 'importar')) datos[1].push(item); } else g.push(['Datos', [item]]);
  return g;
})(arbolConfig);


