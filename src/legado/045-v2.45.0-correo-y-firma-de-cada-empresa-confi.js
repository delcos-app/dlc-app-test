/* ============================================================
   v2.45.0 · Correo y firma de cada empresa configurables en la
   plataforma, con envío de prueba; copias de seguridad descargables
   ============================================================ */

const PROVEEDORES_CORREO = {
  google: { n: 'Google Workspace o Gmail', host: 'smtp.gmail.com', puerto: 465, seg: 'ssl', ayuda: 'Identificador: la dirección de correo. Clave: una «contraseña de aplicación» (Cuenta de Google → Seguridad → Verificación en dos pasos → Contraseñas de aplicaciones), no la contraseña normal.' },
  microsoft: { n: 'Microsoft 365 u Outlook', host: 'smtp.office365.com', puerto: 587, seg: 'starttls', ayuda: 'La cuenta debe tener activado «SMTP autenticado» (lo activa el administrador de Microsoft 365).' },
  mailjet: { n: 'Mailjet', host: 'in-v3.mailjet.com', puerto: 465, seg: 'ssl', ayuda: 'Identificador: la «API Key». Clave: la «Secret Key» (Mailjet → Account settings → API Key Management). El email del remitente debe estar validado en Mailjet.' },
  ionos: { n: 'IONOS', host: 'smtp.ionos.es', puerto: 465, seg: 'ssl', ayuda: 'Identificador: la dirección de correo completa. Clave: la contraseña del buzón.' },
  ovh: { n: 'OVHcloud', host: 'ssl0.ovh.net', puerto: 465, seg: 'ssl', ayuda: 'Identificador: la dirección de correo completa. Clave: la contraseña del buzón.' },
  otro: { n: 'Otro proveedor', host: '', puerto: 465, seg: 'ssl', ayuda: 'Pide a tu proveedor el servidor de salida (SMTP), el puerto y el tipo de seguridad.' }
};

async function pintarCorreo() {
  const [{ data: c }] = await Promise.all([RPC_ORIG('correo_config', {}), cargarAjustes()]);
  const cfg = Object.assign({ proveedor: '', host: '', puerto: 465, seguridad: 'ssl', usuario: '', remitente_nombre: '', remitente_email: '', color: '#15528F', firma: {} }, c || {});
  const f = Object.assign({ nombre: PERFIL.nombre, cargo: '', empresa: (AJUSTES.empresa || {}).razon_social || nombreApp(), telefono: (AJUSTES.empresa || {}).telefono || '',
    telefono2: '', web: (AJUSTES.empresa || {}).web || '', direccion: [(AJUSTES.empresa || {}).direccion, (AJUSTES.empresa || {}).municipio].filter(Boolean).join(', '), aviso: '', logo: 'si' }, cfg.firma || {});
  const campo = (id, et, v, extra = '') => `<div><label for="${id}">${et}</label><input id="${id}" value="${esc(v || '')}" ${extra}></div>`;
  $('cfgcuerpo').innerHTML = `
    <div class="card cfgpanel"><h2>Correo de la empresa</h2>
      <p class="sm">Desde esta cuenta salen las facturas, los datos de pago y los resúmenes. Cada empresa usa su propio correo: los clientes ven vuestro remitente y vuestra firma.</p>
      <div class="g2"><div><label for="coprov">Proveedor</label><select id="coprov"><option value="">Elige tu proveedor…</option>${Object.entries(PROVEEDORES_CORREO).map(([k, p]) => `<option value="${k}" ${cfg.proveedor === k ? 'selected' : ''}>${p.n}</option>`).join('')}</select></div><div></div></div>
      <div class="avisoh ${cfg.proveedor ? '' : 'hide'}" id="coayuda"><span>${esc((PROVEEDORES_CORREO[cfg.proveedor] || {}).ayuda || '')}</span></div>
      <div class="g2">${campo('cohost', 'Servidor de salida (SMTP)', cfg.host, 'placeholder="smtp.tuproveedor.com"')}
        <div class="g2 copuerg"><div><label for="copuer">Puerto</label><input id="copuer" type="number" value="${esc(cfg.puerto)}"></div>
          <div><label for="coseg">Seguridad</label><select id="coseg"><option value="ssl" ${cfg.seguridad === 'ssl' ? 'selected' : ''}>SSL</option><option value="starttls" ${cfg.seguridad === 'starttls' ? 'selected' : ''}>STARTTLS</option></select></div></div></div>
      <div class="g2">${campo('cousu', 'Identificador de acceso', cfg.usuario, 'autocomplete="off"')}
        <div><label for="copass">Clave de acceso</label><input id="copass" type="password" autocomplete="new-password" placeholder="${cfg.hay_clave ? '•••••••• guardada · escribe solo para cambiarla' : ''}"></div></div>
      <div class="g2">${campo('conom', 'Nombre del remitente', cfg.remitente_nombre, `placeholder="${esc(nombreApp())}"`)}${campo('coemail', 'Email del remitente', cfg.remitente_email || (AJUSTES.empresa || {}).email || PERFIL.email || '', 'type="email" placeholder="nombre@tuempresa.com"')}</div>
      <p class="sm">🔒 La clave de acceso se guarda aparte y nadie puede verla desde la plataforma, ni siquiera administración.</p></div>
    <div class="card cfgpanel"><h2>Firma</h2>
      <p class="sm">Se añade al final de cada email, con el logo de la empresa si lo tienes en Marca y logo.</p>
      <div class="firmaed"><div>
        <div class="g2">${campo('fnom', 'Nombre', f.nombre)}${campo('fcar', 'Cargo', f.cargo, 'placeholder="p. ej. Atención al cliente"')}</div>
        <div class="g2">${campo('femp', 'Empresa', f.empresa)}${campo('fweb', 'Web', f.web, 'placeholder="www.tuempresa.com"')}</div>
        <div class="g2">${campo('ftel', 'Teléfono', f.telefono)}${campo('ftel2', 'Otro teléfono', f.telefono2)}</div>
        ${campo('fdir', 'Dirección', f.direccion)}
        <label for="faviso">Aviso legal o de confidencialidad</label><textarea id="faviso" rows="3" placeholder="Texto que aparece en pequeño al final del correo">${esc(f.aviso || '')}</textarea>
        <div class="g2"><div><label for="fcolor">Color</label><input id="fcolor" type="color" value="${esc(cfg.color || '#15528F')}" style="height:44px"></div>
          <div><label class="vfswitch"><input type="checkbox" id="flogo" ${f.logo !== 'no' ? 'checked' : ''}><span class="sw"></span><span>Incluir el logo</span></label></div></div>
      </div><div><div class="sm" style="margin-bottom:6px">Vista previa</div><div class="firmaprev" id="fprev"></div></div></div></div>
    <div class="card cfgpanel"><div class="acts" style="justify-content:flex-end;flex-wrap:wrap;margin:0">
      <button class="btn sec" id="coprueba">Enviarme un correo de prueba</button><button class="btn" id="cook">Guardar</button></div>
      <p class="sm" id="comsg"></p></div>`;
  const prev = () => {
    const v = id => $(id).value.trim(), color = $('fcolor').value, logo = $('flogo').checked && MARCA.logo;
    $('fprev').innerHTML = `<div style="height:4px;background:${color};border-radius:4px;margin-bottom:12px"></div><p style="margin:0 0 12px">Hola:<br><br>Te adjuntamos la factura de tu pedido.<br><br>Un saludo,</p>
      <div class="fprevfirma">${logo ? `<img src="${esc(MARCA.logo)}" alt="">` : ''}<div>${v('fnom') ? `<b style="color:${color}">${esc(v('fnom'))}</b><br>` : ''}${v('fcar') ? esc(v('fcar')) + '<br>' : ''}${v('femp') ? `<b>${esc(v('femp'))}</b><br>` : ''}
        ${[v('ftel'), v('ftel2')].filter(Boolean).map(esc).join(' · ')}${v('ftel') || v('ftel2') ? '<br>' : ''}${v('fweb') ? `<span style="color:${color}">${esc(v('fweb'))}</span><br>` : ''}${v('fdir') ? esc(v('fdir')) : ''}</div></div>
      ${v('faviso') ? `<p class="fprevaviso">${esc(v('faviso'))}</p>` : ''}`;
  };
  ['fnom', 'fcar', 'femp', 'fweb', 'ftel', 'ftel2', 'fdir', 'faviso', 'fcolor', 'flogo'].forEach(id => $(id).addEventListener('input', prev)); $('flogo').onchange = prev; prev();
  // Qué pide cada proveedor como identificador y como clave
  const PISTAS = { google: ['Dirección de correo de la cuenta', 'Contraseña de aplicación'], microsoft: ['Dirección de correo de la cuenta', 'Contraseña de la cuenta'],
    mailjet: ['API Key', 'Secret Key'], ionos: ['Dirección de correo completa', 'Contraseña del buzón'], ovh: ['Dirección de correo completa', 'Contraseña del buzón'], otro: ['Lo indica tu proveedor', 'Lo indica tu proveedor'] };
  const pistas = () => { const k = PISTAS[$('coprov').value] || ['', '']; $('cousu').placeholder = k[0]; if (!cfg.hay_clave) $('copass').placeholder = k[1]; };
  pistas();
  $('coprov').onchange = () => {
    pistas();
    const p = PROVEEDORES_CORREO[$('coprov').value]; if (!p) return;
    if (p.host) $('cohost').value = p.host; $('copuer').value = p.puerto; $('coseg').value = p.seg;
    $('coayuda').classList.remove('hide'); $('coayuda').querySelector('span').textContent = p.ayuda;
  };
  const guardar = async () => {
    const v = id => $(id).value.trim();
    const p = { proveedor: $('coprov').value, host: v('cohost'), puerto: +$('copuer').value || 465, seguridad: $('coseg').value, usuario: v('cousu'),
      remitente_nombre: v('conom'), remitente_email: v('coemail') || (/@/.test(v('cousu')) ? v('cousu') : ''), color: $('fcolor').value,
      firma: { nombre: v('fnom'), cargo: v('fcar'), empresa: v('femp'), web: v('fweb'), telefono: v('ftel'), telefono2: v('ftel2'), direccion: v('fdir'), aviso: $('faviso').value.trim(), logo: $('flogo').checked ? 'si' : 'no' } };
    // Cada dato que falta se marca en su campo
    document.querySelectorAll('#cfgcuerpo .campoerr').forEach(x => x.remove());
    document.querySelectorAll('#cfgcuerpo .conerr').forEach(x => x.classList.remove('conerr'));
    const falta = (id, t) => { const el = $(id); el.classList.add('conerr'); (el.closest('.selw, .numw') || el).insertAdjacentHTML('afterend', `<span class="campoerr">${t}</span>`); };
    const errores = [];
    if (!p.host) errores.push(['cohost', 'Indica el servidor de salida']);
    if (!p.usuario) errores.push(['cousu', 'Indica el identificador de acceso']);
    if (!cfg.hay_clave && !$('copass').value) errores.push(['copass', 'Escribe la clave de acceso']);
    if (!p.remitente_email) errores.push(['coemail', 'Indica el email del remitente']);
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.remitente_email)) errores.push(['coemail', 'Ese email no es válido']);
    if (errores.length) {
      errores.forEach(([id, t]) => falta(id, t));
      $('comsg').innerHTML = `<b style="color:var(--dang)">${errores.length === 1 ? 'Falta un dato' : 'Faltan ' + errores.length + ' datos'}:</b> revisa los campos marcados en rojo.`;
      $(errores[0][0]).focus(); return false;
    }
    const { data: r, error } = await db.rpc('guardar_correo', { p, p_clave: $('copass').value || null });
    if (error || (r && r.ok === false)) {
      const motivo = error ? (error.message || error.code || '') : r.error;
      const txt = /Could not find the function|PGRST202/i.test(motivo) ? 'La base de datos no encuentra la función del correo (SQL 48).'
        : motivo === 'permiso' ? 'Solo el propietario de la empresa puede configurar el correo.' : 'No se ha podido guardar: ' + motivo;
      $('comsg').innerHTML = `<b style="color:var(--dang)">${esc(txt)}</b>${motivo && txt.indexOf(motivo) < 0 ? `<span class="errtec">Detalle técnico: ${esc(motivo)}</span>` : ''}`; toast(txt, true); return false;
    }
    if ($('copass').value) cfg.hay_clave = true;
    $('comsg').innerHTML = '<b style="color:var(--ok)">✓ Guardado.</b>';
    $('copass').value = ''; $('copass').placeholder = '•••••••• guardada · escribe solo para cambiarla'; toast('Correo guardado'); return true;
  };
  $('cook').onclick = () => conCarga($('cook'), 'Guardando…', guardar);
  $('coprueba').onclick = ev => conCarga($('coprueba'), 'Enviando…', async () => {
    if (!await guardar()) return;
    $('comsg').textContent = 'Enviando el correo de prueba…';
    let { data, error } = await db.functions.invoke('enviar_email', { body: { prueba: true } });
    if (error && error.context && typeof error.context.json === 'function') { try { data = await error.context.json(); } catch (x) {} }
    const e = data && data.error;
    $('comsg').innerHTML = data && data.ok ? '<b style="color:var(--ok)">✓ Enviado.</b> Revisa tu bandeja de entrada (y la de correo no deseado).'
      : e === 'credenciales' ? '<b style="color:var(--dang)">El servidor ha rechazado el identificador o la clave de acceso.</b> Revisa los datos que te da tu proveedor.'
      : e === 'conexion' ? '<b style="color:var(--dang)">No se ha podido conectar con el servidor.</b> Revisa el servidor, el puerto y la seguridad.'
      : e === 'sin_smtp' ? '<b style="color:var(--dang)">Falta el servidor, el usuario o la contraseña.</b>'
      // v2.280.0: el motivo en palabras (antes salía «permiso» suelto)
      : e === 'permiso' ? '<b style="color:var(--dang)">No tienes permiso para enviar el correo de prueba.</b> Lo envía quien administra la empresa.'
      : e === 'sesion' ? '<b style="color:var(--dang)">Tu sesión ha caducado.</b> Vuelve a entrar y prueba otra vez.'
      : `<b style="color:var(--dang)">No se ha podido enviar.</b> ${error && !data ? 'La función de envío no está instalada en el servidor.' : esc(String(e || ''))}`;
  });
  validarEmailEnVivo($('coemail'));
}

async function pintarCopias() {
  const { data: au } = await db.from('auditoria').select('creado_en').eq('accion', 'Copia de seguridad').order('creado_en', { ascending: false }).limit(1);
  const ultima = au && au[0] ? new Date(au[0].creado_en) : null, dias = ultima ? Math.floor((Date.now() - ultima) / 864e5) : null;
  $('cfgcuerpo').innerHTML = `<div class="card cfgpanel"><h2>Copias de seguridad</h2>
    <p class="sm">Descarga en un único archivo todos los datos de la empresa: ${TT('medico', 'p', '', 'l', 'l')}, ${TT('visita', 'p', '', 'l', 'l')}, agenda, clientes, pedidos, facturas, stock y configuración. Las contraseñas no se incluyen.</p>
    <div class="copiaest ${dias == null || dias > 7 ? 'mal' : 'bien'}"><b>${ultima ? 'Última copia: ' + ultima.toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' }) : 'Todavía no se ha hecho ninguna copia'}</b>
      <span>${dias == null ? 'Haz la primera ahora.' : dias > 7 ? `Hace ${dias} días: conviene hacer una nueva.` : 'Al día.'}</span></div>
    <div class="acts" style="margin:12px 0 0"><button class="btn" id="copok">⬇ Descargar copia completa</button></div>
    <h3 class="mansub">Consejos</h3><ul class="manlist">
      <li><span>📅</span><span>Haz una copia cada semana y guárdala fuera del ordenador (unidad externa o nube de la empresa).</span></li>
      <li><span>🔐</span><span>El archivo contiene datos personales: guárdalo en un sitio con acceso restringido.</span></li>
      <li><span>🤖</span><span>Si quieres que se haga sola cada día, hay una copia automática gratuita con GitHub (pídela a quien te da soporte técnico).</span></li></ul></div>`;
  $('copok').onclick = async ev => {
    ev.target.disabled = true; ev.target.textContent = 'Preparando la copia…';
    const { data, error } = await RPC_ORIG('exportar_datos', {});
    ev.target.disabled = false; ev.target.textContent = '⬇ Descargar copia completa';
    if (error || !data) { toast('No se ha podido hacer la copia', true); return; }
    const b = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `copia_${nombreApp().replace(/[^\p{L}\p{N}]+/gu, '_')}_${hoyISO()}.json`; a.click();
    const n = Object.values(data.tablas || {}).reduce((s, t) => s + t.length, 0);
    toast(`Copia descargada · ${num(n)} registros`); setTimeout(pintarCopias, 800);
  };
}



