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



