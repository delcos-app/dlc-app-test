// pantallas/comisiones.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

// Editar usuario · Comisión: desde cuándo se aplica el esquema, y zona de los comerciales
async function usuarioComisionYZona(id) {
  const u = (USUARIOS || []).find(x => x.id === id);
  if (!u || !$('dlg').open) return;
  // Comisión: desde cuándo se aplica el esquema (el selector se pinta un momento después)
  for (let i = 0; i < 30 && !$('ucom') && $('dlg').open; i++) await new Promise(r => setTimeout(r, 100));
  const ucom = $('ucom');
  if (ucom && !$('ucdesde')) {
    ucom.dataset.orig = ucom.value;
    ucom.closest('.g2').insertAdjacentHTML('afterend', `<div class="g2" id="ucdesde">
      <div><label class="sm" for="ucdm">Se aplica</label><select id="ucdm">
        <option value="hoy">A partir de hoy</option><option value="todo">A todo su histórico (hacia atrás)</option><option value="fecha">A partir de una fecha concreta</option></select></div>
      <div><label class="sm" for="ucdf">Fecha</label><input id="ucdf" type="date" value="${hoyISO()}" disabled></div></div>
      <div class="sm" id="uchist"></div>`);
    $('ucdm').onchange = () => { $('ucdf').disabled = $('ucdm').value !== 'fecha'; };
    const { data: h } = await RPC_ORIG('historial_esquemas', { p_usuario: id });
    if ((h || []).length && $('uchist')) $('uchist').innerHTML = 'Historial: ' + h.map(x => `${esc(x.esquema)} desde ${fechaCorta(x.desde)}${x.hasta ? ' hasta ' + fechaCorta(x.hasta) : ''}`).join(' · ');
  }
  // Zona, solo para comerciales. v2.109.0: según el rol elegido en la ventana (si se cambia a uno con cartera, aparece; si no, se oculta)
  if ($('ur') && !$('ur').dataset.zona) {
    $('ur').dataset.zona = '1';
    $('ur').addEventListener('change', () => { const z = $('uzonas'); if (z) z.classList.toggle('hide', !rolPuede($('ur').value, 'cartera')); else usuarioComisionYZona(id); });
  }
  if (rolPuede($('ur') ? $('ur').value : u.rol, 'cartera') && !$('uzonas')) {
    const html = await bloqueZonas(u);
    const ref = $('ucomzona') || $('dbody').querySelector('.acts:last-of-type');
    if (ref && $('dlg').open && !$('uzonas')) ref.insertAdjacentHTML('beforebegin', html);
    if ($('uzonas')) $('uzonas').dataset.orig = zonasMarcadas().join('|');
    $('dbody').querySelectorAll('[data-zcc]').forEach(c => c.onchange = () =>
      $('dbody').querySelectorAll(`[data-zpc="${CSS.escape(c.dataset.zcc)}"]`).forEach(x => x.checked = c.checked));
    if ($('uzok')) $('uzok').onclick = async ev => {
      const zonas = zonasMarcadas();
      ev.target.disabled = true;
      const { data: r, error } = await db.rpc('asignar_zona', { p_usuario: id, p_zonas: zonas });
      ev.target.disabled = false;
      if (error || (r && r.ok === false)) { toast('No se ha podido guardar la zona', true); return; }
      $('uzonas').dataset.orig = zonas.join('|');
      toast(`Zona guardada · ${num(r.asignados)} ${TT('medico', 'p', '', 'l', 'l', 'nuevo')} en su cartera${r.en_otra_cartera ? ` · ${num(r.en_otra_cartera)} de su zona están en otra cartera` : ''}`);
    };
  }
}






async function panelComisionUsuario(u) {
  if (!ESQUEMAS.length) { const { data } = await db.rpc('esquemas_lista'); ESQUEMAS = data || []; }
  const actual = ESQUEMAS.find(e => (e.personas || []).includes(u.nombre));
  // v2.276.0: el valor guardado, de su perfil (la lista de usuarios no lo trae: siempre salía «Nada»)
  const { data: pv } = await db.from('perfiles').select('comision_ver').eq('id', u.id).maybeSingle();
  const ver = (pv && pv.comision_ver) || u.comision_ver || 'nada'; u.comision_ver = ver;
  return `<label>Comisión</label>
    <div class="g2">
      <div><label class="sm" for="ucom">Esquema</label><select id="ucom">
        <option value="">Sin comisión</option>
        ${ESQUEMAS.map(e => `<option value="${e.id}" ${actual && actual.id === e.id ? 'selected' : ''}>${esc(e.nombre)}</option>`).join('')}
      </select></div>
      <div><label class="sm" for="uverc">Qué ve esa persona</label><select id="uverc">
        <option value="nada" ${ver === 'nada' ? 'selected' : ''}>Nada</option>
        <option value="unidades" ${ver === 'unidades' ? 'selected' : ''}>Solo sus unidades</option>
        <option value="importe" ${ver === 'importe' ? 'selected' : ''}>Unidades e importe</option>
      </select></div>
    </div>`;
}




async function cargarComerciales() {
  const { data } = await db.from('perfiles').select('id,nombre,rol,activo').order('nombre');
  // Solo quien lleva cartera o agenda comercial (no Dirección, Solo consulta ni médicos)
  COMS = (data || []).filter(u => u.activo && rolPuede(u.rol, 'equipo_comercial'));
  $('fcom').innerHTML = '<option value="">Todos</option><option value="ninguno">Sin comercial</option>' +
    COMS.map(u => `<option value="${u.id}" ${F.com === u.id ? 'selected' : ''}>${esc(u.nombre)}</option>`).join('');
}

let ESQUEMAS = [];

let COMS = [];


// Editar usuario · La comisión se muestra como información: se asigna dentro de cada esquema
async function usuarioComisionInfoBase(id) {
  for (let i = 0; i < 30 && !$('ucom') && $('dlg').open; i++) await new Promise(r => setTimeout(r, 100));
  const s = $('ucom'); if (!s || $('ucominfo')) return;
  const g = s.closest('.g2') || s.parentElement;
  const txt = s.selectedOptions[0] && s.value ? s.selectedOptions[0].textContent : 'Sin comisión';
  g.classList.add('hide'); if ($('ucdesde')) $('ucdesde').classList.add('hide'); if ($('uchist')) $('uchist').classList.add('hide');
  g.insertAdjacentHTML('afterend', `<div class="avisoh" id="ucominfo"><span>Comisión: <b>${esc(txt)}</b>. Se asigna dentro de cada esquema en Configuración → Equipo → Comisiones.</span></div>`);
}


async function usuarioComisionInfo(...a) {
  const r = await usuarioComisionInfoBase.apply(this, a);
  const s = $('uverc'), info = $('ucominfo');
  if (s && info && !$('uvercw')) {
    const w = s.parentElement; w.id = 'uvercw';
    const l = w.querySelector('label'); if (l) l.classList.remove('sm');
    w.insertAdjacentHTML('beforeend', '<div class="sm">Lo que ve en Inicio de su comisión: nada, solo sus unidades o también el importe.</div>');
    info.insertAdjacentElement('afterend', w);
  }
  return r;
}

// Comisiones está en src/app/screens/commissions (v2.411.0). Estos nombres se quedan: Configuración (legado 004), Inicio y las
// pruebas los usan.
function pintarComisiones() { return window.delcos.screens.commissions.paintCommissions(); }
function tarjetaComision() { return window.delcos.screens.commissions.paintCommissionCard(); }
function editorEsquema(id) { return window.delcos.screens.commissions.editScheme(id || null, () => { pintarComisiones(); }); }
