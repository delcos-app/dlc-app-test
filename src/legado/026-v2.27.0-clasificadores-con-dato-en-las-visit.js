/* ============================================================
   DLC OS 2.0 · v2.27.0 · Clasificadores con dato en las visitas,
   material comercial, Clientes con filtros, columnas en el panel
   lateral, mapa del plan y aviso de cita repetida
   ============================================================ */

Object.assign(RPC_TTL, { clasificadores_actividad: 300, municipios_clientes: 300 });

/* ---------------- registrar visita con datos ---------------- */

// v2.205.0: los resultados sin dato ya salen en la línea de la visita; no son material
const detTxt = v => (v.detalles || []).filter(d => !esMuestras(d) && !(!d.dato && (v.resultados || []).includes(d.valor)))
  .map(d => d.valor + (d.dato ? ' (' + d.dato + ')' : '')).join(', ');





/* ---------------- clasificadores: configurar el dato de cada valor ---------------- */



/* ---------------- ficha: material y datos en el historial de visitas ---------------- */


/* ---------------- plan: mapa con su propio botón y «Descartar plan» ---------------- */


/* ---------------- columnas dentro del panel lateral ---------------- */

function abrirColumnasBase() {
  const d = $('tools');
  let D = colsConfig();
  const pinta = () => {
    d.innerHTML = `<div class="tbox">
      <div class="fh"><h2>Columnas</h2><button class="x" id="tclose" aria-label="Cerrar">✕</button></div>
      <button class="kcfg" id="tcvolver" style="margin:0 0 10px">← Volver a los filtros</button>
      <p class="sm">Marca las que quieres ver y ordénalas con las flechas. Se aplica al momento. El ancho se cambia arrastrando el borde de cada cabecera.</p>
      <div class="lista tcols">${D.map((c, i) => {
        const col = COLS.find(x => x.k === c.k) || { t: c.k };
        return `<label class="item" style="cursor:pointer;margin:0">
          <input type="checkbox" data-con="${i}" ${c.on ? 'checked' : ''} ${col.fijo ? 'disabled' : ''}>
          <span class="tx"><b>${esc(col.t)}</b>${col.fijo ? '<span class="sm">siempre visible</span>' : ''}</span>
          <span class="kord" style="flex-direction:row">
            <button type="button" class="kmv" data-cmv="${i}|-1" aria-label="Subir" ${i === 0 ? 'disabled' : ''}>${ICO.arriba}</button>
            <button type="button" class="kmv" data-cmv="${i}|1" aria-label="Bajar" ${i === D.length - 1 ? 'disabled' : ''}>${ICO.abajo}</button></span></label>`;
      }).join('')}</div>
      <div class="acts"><button class="btn sec" id="tcres">Restaurar las columnas</button></div></div>`;
    const aplicar = () => { colsGuardar(D); buscar(true); };
    $('tclose').onclick = () => d.classList.remove('abierto');
    $('tcvolver').onclick = () => { HERR_CTX = null; abrirHerramientas('directorio'); };
    d.querySelectorAll('[data-con]').forEach(i => i.onchange = () => {
      D[+i.dataset.con].on = i.checked;
      if (!D.some(c => c.on)) { i.checked = true; D[+i.dataset.con].on = true; toast('Deja al menos una columna', true); return; }
      aplicar();
    });
    d.querySelectorAll('[data-cmv]').forEach(b => b.onclick = e => {
      e.preventDefault();
      const [i, dir] = b.dataset.cmv.split('|').map(Number), j = i + dir;
      if (j < 0 || j >= D.length) return;
      [D[i], D[j]] = [D[j], D[i]]; aplicar(); pinta();
    });
    $('tcres').onclick = () => { localStorage.removeItem(colKey()); D = colsConfig(); buscar(true); pinta(); };
  };
  pinta();
  d.classList.add('abierto');
}

/* ---------------- Clientes (antes Pacientes): tipo y filtros ---------------- */

Object.assign(PAC, { tipo: '', pedidos: '', municipio: '' });




document.querySelectorAll('#nav [data-t="pacientes"]').forEach(b => b.textContent = 'Clientes');

/* ---------------- nueva cita: aviso si ya tiene cita ese día ---------------- */


/* ---------------- ayudas ---------------- */

Object.assign(AYUDA, {
  pacientes: ['Clientes', `${TT('paciente', 'p', '', 'l', 'C')} (personas) y empresas que compran con ${TT('medico', 's', 'un', 'l', 'l')} de referencia.`, [
    `La columna <b>Tipo</b> distingue ${TT('paciente', 'p', '', 'l', 'l')} y empresas. Filtra por tipo, si tienen pedidos o por población.`,
    `Cada cliente tiene un <b>${TT('medico', 's', '', 'l', 'l')} que lo trata</b>: se elige al darlo de alta o se asigna solo con su primer pedido.`,
    'A una persona se le pide DNI o NIE; a una empresa, el CIF.']]
});
AYUDA.config = AYUDA.config || ['Configuración', '', []];
AYUDA.config[2].push(`En <b>Clasificadores</b>, los de ${TT('visita', 'p', '', 'l', 'l')} (resultados, material comercial…) pueden pedir un <b>dato</b> al marcarse: una cantidad, un texto o una opción de una lista. Usa «+ Dato» en cada valor.`);
AYUDA.agenda[2].push(`Si añades una cita a ${TT('medico', 's', 'un', 'l', 'l')} que ya tiene otra ese día, te avisa y eliges: mantener las dos o quedarte solo con la nueva.`);


