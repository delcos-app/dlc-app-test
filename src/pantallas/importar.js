// pantallas/importar.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

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
