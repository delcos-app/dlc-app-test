/* ============================================================
   v2.302.0 · Alta y edición de un centro con su propio formulario (aviso de Eric: al crear un centro salía el de un
   profesional, con «consultas» y un selector de centro dentro). Para una ficha de tipo Centro: nombre, teléfono, email,
   contacto y nota, y debajo su dirección (calle, código postal, población, provincia), cómo llegar y su horario de atención.
   Sin consultas ni planta/sala. Se guarda como la ubicación principal de la ficha, situada en el mapa al guardar.
   ============================================================ */
async function abrirEditor(id, tipo, ...r) {
  const res = await abrirEditorBase2.call(this, id, tipo, ...r);
  const body = $('dbody');
  if (!body || !$('eguardar') || $('ee') || $('esr') || !$('econs')) return res;   // solo el formulario de un centro
  body.classList.add('edcentro');
  body.querySelectorAll('.cpersform[data-cpamb=medico]').forEach(x => x.remove());   // los campos personalizados son de los profesionales (cargo, equipo…)
  const boxes = [...$('econs').children];
  if (!id) boxes.slice(1).forEach(b => b.remove());
  const box = $('econs').firstElementChild; if (!box) return res;
  const i = box.dataset.cons, cf = f => box.querySelector(`[data-cf="${i}|${f}"]`);
  const val = f => (cf(f) || {}).value || '';
  // Los campos de dirección, a la vista (los mismos data-cf: el guardado los recoge igual)
  const u = {}; ['direccion', 'cp', 'municipio', 'provincia'].forEach(f => { u[f] = val(f); const h = cf(f); if (h) h.remove(); });
  box.insertAdjacentHTML('afterbegin', `<h3 class="edch">Dirección del centro</h3>
    <label for="edcd">Calle y número</label><input id="edcd" data-cf="${i}|direccion" value="${esc(val('direccion') || '')}" placeholder="p. ej. Calle Mayor 12">
    <div class="g2"><div><label for="edcc">Código postal</label><input id="edcc" data-cf="${i}|cp" inputmode="numeric" maxlength="5" value="${esc(val('cp') || '')}"></div>
      <div><label for="edcm">Población</label><input id="edcm" data-cf="${i}|municipio" autocapitalize="characters"></div></div>
    <label for="edcp">Provincia</label><input id="edcp" data-cf="${i}|provincia" autocapitalize="characters">`);
  const c0 = (box.dataset.lat || ''), ant = { d: '', m: '' };
  $('edcd').value = u.direccion || ''; $('edcc').value = u.cp || ''; $('edcm').value = u.municipio || ''; $('edcp').value = u.provincia || '';
  ant.d = $('edcd').value; ant.m = $('edcm').value;
  const lbl = [...box.querySelectorAll('label')].find(l => /^Días y horario/.test(l.textContent)); if (lbl) lbl.textContent = 'Horario de atención';
  const add = $('eadd'); if (add) add.closest('.acts').classList.add('hide');
  // Al guardar: el nombre de la ubicación es el del centro y, si la dirección cambió, se sitúa en el mapa
  let listo = false;
  $('eguardar').addEventListener('click', async e => {
    if (listo) { listo = false; return; }
    const nom = $('en').value.trim().toUpperCase(), cn = cf('centro_nombre'); if (cn) cn.value = nom;
    const d = $('edcd').value.trim(), m = $('edcm').value.trim();
    if (!d || (d === ant.d && m === ant.m && c0)) return;
    e.stopImmediatePropagation(); e.preventDefault();
    const g = await geocodificar([d, $('edcc').value.trim(), m, $('edcp').value.trim(), 'España'].filter(Boolean).join(', '), { direccion: d, municipio: m, cp: $('edcc').value.trim() }).catch(() => null);
    if (g && !g.fuera) { if (cf('lat')) cf('lat').value = g.lat; if (cf('lon')) cf('lon').value = g.lon; }
    else if (g && g.fuera) toast(`La dirección sale en ${g.fuera}, no en ${m}: se guarda sin situarla en el mapa`, true);
    ant.d = d; ant.m = m; listo = true; $('eguardar').click();
  }, true);
  return res;
}

// v2.304.0: el filtro rápido «Tipo» de Cuentas
if ($('ftipo')) $('ftipo').addEventListener('change', e => { F.tipo = e.target.value; buscar(true); });
// La búsqueda de Cuentas está en src/app/screens/accounts/list (v2.405.0); estos nombres se quedan porque los llaman muchos archivos
function buscar(reiniciar) { return window.delcos.screens.accounts.searchAccounts(reiniciar); }
function cabeceraTabla() { window.delcos.screens.accounts.paintAccountsHeader(); }


