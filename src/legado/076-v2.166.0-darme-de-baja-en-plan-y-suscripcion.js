/* v2.166.0 · «Darme de baja» en Plan y suscripción (petición de Eric): abre directamente la pantalla de cancelar de Stripe y, al confirmar,
   vuelve sola a delcos (?pago=baja) con el aviso de hasta cuándo se puede usar. Con la baja pedida, «Seguir con la suscripción» la deshace. */
const PAGO_VUELTA_BAJA = new URLSearchParams(location.search).get('pago') === 'baja';   // se lee antes de que el arranque limpie la dirección
async function pagoEsperarBaja() {
  for (let i = 0; i < 15; i++) {
    await pagoCargarEstado();
    const pl = PLAN_ACTUAL || {};
    if (pl.baja_al_final || pl.estado === 'cancelada') {
      toast(`Baja registrada: puedes usar delcos hasta el ${fechaCorta(pl.periodo_fin)}`);
      if (TAB === 'plan' || TAB === 'organizacion' || TAB === 'config') ir(TAB); return;
    }
    await new Promise(r => setTimeout(r, 2000));
  }
  toast('Baja pedida: en unos minutos lo verás en Plan y suscripción');
}
if (PAGO_VUELTA_BAJA) {
  let n = 0;
  const t = setInterval(() => {
    if (typeof PERFIL !== 'undefined' && PERFIL && !document.body.classList.contains('sin-sesion')) { clearInterval(t); pagoEsperarBaja(); }
    else if (++n > 90) clearInterval(t);
  }, 1500);
}
pintarPaginaPlan = (orig => async function (...a) {
  const r = await orig.apply(this, a);
  const c = $('cfgcuerpo'), pl = PLAN_ACTUAL || {}; if (!c || !puedeOrganizacion() || !pl.stripe_suscripcion) return r;
  const acts = c.querySelector('#planact .acts');
  if (acts && pl.estado === 'activo' && !pl.baja_al_final && !$('pgdarbaja'))
    acts.insertAdjacentHTML('beforeend', '<button type="button" class="btn sec" id="pgdarbaja">Darme de baja</button>');
  const bf = $('pgbajafin');
  if (bf) {
    bf.innerHTML = `Has pedido la baja: puedes usar la plataforma hasta el <b>${fechaCorta(pl.periodo_fin)}</b>.
      <button type="button" class="btn sec" id="pgseguir">Seguir con la suscripción</button>`;
  }
  if ($('pgdarbaja')) $('pgdarbaja').onclick = async ev => { const d = await pagoLlamar({ accion: 'baja' }, ev.target); if (d && d.url) location.href = d.url; };
  if ($('pgseguir')) $('pgseguir').onclick = async ev => {
    const d = await pagoLlamar({ accion: 'reanudar' }, ev.target); if (!d) return;
    toast('Seguimos: tu suscripción continúa'); await pagoCargarEstado(); ir(TAB);
  };
  return r;
})(pintarPaginaPlan);

/* v2.167.0 · Al volver de Stripe (pago, baja o el portal) se abre «Plan y suscripción», no Inicio (petición de Eric). Stripe vuelve a
   …/?pago=…#plan o a …/#plan: la primera pantalla tras entrar es la del plan. */
let PAGO_IR_PLAN = location.hash === '#plan' || new URLSearchParams(location.search).has('pago');
const pagoAlPlan = () => {
  PAGO_IR_PLAN = false;
  try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
};
ir = (orig => function (t, ...a) {
  if (PAGO_IR_PLAN && PERFIL) { pagoAlPlan(); if (!ES_MEDICO() && puedeOrganizacion()) t = 'plan'; }
  return orig.call(this, t, ...a);
})(ir);
// Si la app ya había entrado antes de llegar aquí, se va ahora
if (PAGO_IR_PLAN && typeof PERFIL !== 'undefined' && PERFIL) setTimeout(() => { if (PAGO_IR_PLAN) ir('plan'); }, 0);
setTimeout(() => { PAGO_IR_PLAN = false; }, 30000);

/* v2.167.0 · «Pedir presupuesto» dentro de delcos (petición de Eric: nada de abrir el correo ni llevar al cliente fuera). Un formulario con
   la imagen de la plataforma: el contacto ya relleno, qué buscan (opciones que se marcan, sin cerrar nada: siempre hay «Cuéntanos con tus
   palabras»), tamaño, cuándo y cómo prefieren que les contactemos. Se guarda (pedir_presupuesto, SQL 104), delcos recibe un aviso al
   momento y la empresa ve en «Plan y suscripción» en qué punto está. Con A medida, el mismo formulario sirve para hablar del contrato.
   En el panel de delcos, pestaña «Solicitudes» con su estado y una nota. */
const PRESU_NECESITA = [
  ['usuarios', 'Más de 50 usuarios'], ['migracion', 'Migrar nuestros datos'], ['conexion', 'Conectar con nuestro programa (ERP, CRM, contabilidad…)'],
  ['portal', 'Portal para muchos profesionales o centros'], ['desarrollo', 'Algo hecho a nuestra medida'], ['formacion', 'Formación del equipo'],
  ['soporte', 'Soporte prioritario'], ['otro', 'Otra cosa']];
const PRESU_CUANDO = ['Lo antes posible', 'Este trimestre', 'Más adelante', 'Solo me estoy informando'];
const PRESU_ESTADO = { 'Nueva': 'Recibida', 'En curso': 'En curso', 'Cerrada': 'Atendida' };
function pedirPresupuesto(tipo) {
  tipo = tipo === 'contrato' ? 'contrato' : 'presupuesto';
  const est = { contacto: 'correo' }, usados = +((PAGO_ESTADO || {}).usuarios || 0), med = +((PAGO_ESTADO || {}).medicos || 0);
  const tit = tipo === 'contrato' ? 'Hablar de tu contrato A medida' : 'Pide tu plan A medida';
  $('dbody').innerHTML = `<div class="fh"><div><h2>${tit}</h2>
      <div class="sm">Cuéntanos qué necesitáis y te respondemos en un día laborable. No te comprometes a nada.</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="presu">
      <section><h3>Qué buscáis <span class="sm">(marca lo que encaje; no hace falta acertar)</span></h3>
        <div class="presuops">${PRESU_NECESITA.map(([k, t]) => `<label class="presuop"><input type="checkbox" value="${k}"><span>${esc(t)}</span></label>`).join('')}</div>
        <div id="presuprogw" class="hide"><label for="presuprog">¿Con qué programa?</label><input id="presuprog" placeholder="Por ejemplo: Holded, Sage, A3, Salesforce…"></div>
        <label for="presumsg">Cuéntanos con tus palabras</label>
        <textarea id="presumsg" rows="4" placeholder="Qué queréis conseguir, cómo trabajáis hoy, qué os falta… Todo nos ayuda a proponeros lo mejor."></textarea></section>
      <section><h3>Vuestro equipo</h3>
        <div class="g2"><div><label for="presuusu">Usuarios aproximados</label><input id="presuusu" type="number" min="1" class="numw" value="${Math.max(50, usados)}">
            <span class="sm">Ahora sois ${num(usados)}.</span></div>
          <div><label for="presumed">${TT('medico', 'p', '', 'l', 'C')} o centros con portal</label><input id="presumed" type="number" min="0" class="numw" value="${med || ''}" placeholder="Opcional"></div>
          <div><label for="presucuando">¿Cuándo os gustaría empezar?</label><select id="presucuando">${PRESU_CUANDO.map(x => `<option>${esc(x)}</option>`).join('')}</select></div></div></section>
      <section><h3>Cómo te contactamos</h3>
        <div class="g2"><div><label for="presunom">Nombre</label><input id="presunom" value="${esc(PERFIL.nombre || '')}"></div>
          <div><label for="presumail">Correo</label><input id="presumail" type="email" value="${esc(PERFIL.email || '')}"></div>
          <div><label for="presutel">Teléfono</label><input id="presutel" type="tel" placeholder="Opcional" value="${esc(PERFIL.telefono || '')}"></div>
          <div><label for="presuhora">Mejor momento</label><input id="presuhora" placeholder="Por ejemplo: mañanas de 9 a 13"></div></div>
        <label>Prefieres</label><div class="segs" role="group" id="presucont">${[['correo', 'Correo'], ['llamada', 'Llamada'], ['video', 'Videollamada']]
          .map(([k, t]) => `<button type="button" data-pc="${k}" class="${k === 'correo' ? 'on' : ''}" aria-pressed="${k === 'correo'}">${t}</button>`).join('')}</div></section>
    </div>
    <div class="acts" style="justify-content:flex-end"><button class="btn sec" data-cerrar>Cancelar</button><button class="btn" id="presuok">Enviar solicitud</button></div>`;
  const ops = () => [...$('dbody').querySelectorAll('.presuop input:checked')].map(x => x.value);
  $('dbody').querySelectorAll('.presuop input').forEach(x => x.onchange = () => {
    x.closest('.presuop').classList.toggle('on', x.checked);
    $('presuprogw').classList.toggle('hide', !ops().includes('conexion'));
  });
  $('dbody').querySelectorAll('[data-pc]').forEach(b => b.onclick = () => {
    est.contacto = b.dataset.pc; $('dbody').querySelectorAll('[data-pc]').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
  });
  $('presuok').onclick = async ev => {
    const necesita = ops(), mensaje = $('presumsg').value.trim();
    if (!necesita.length && !mensaje) { toast('Marca qué buscáis o cuéntanoslo con tus palabras', true); $('presumsg').focus(); return; }
    if (!$('presumail').value.trim() && !$('presutel').value.trim()) { toast('Déjanos un correo o un teléfono para contestarte', true); return; }
    const datos = { necesita, necesita_txt: necesita.map(k => (PRESU_NECESITA.find(x => x[0] === k) || [k, k])[1]), programa: $('presuprog').value.trim() || null,
      mensaje, usuarios: +$('presuusu').value || null, portal: +$('presumed').value || null, cuando: $('presucuando').value,
      nombre: $('presunom').value.trim(), correo: $('presumail').value.trim(), telefono: $('presutel').value.trim() || null,
      horario: $('presuhora').value.trim() || null, contacto: est.contacto, plan_actual: (PLAN_ACTUAL || {}).plan || null };
    ev.target.disabled = true;
    const { data: r, error } = await RPC_ORIG('pedir_presupuesto', { p: { tipo, datos } });
    ev.target.disabled = false;
    if (error || !r || !r.ok) {
      toast(({ demasiadas: 'Ya nos has enviado varias hoy: te contestamos enseguida', vacia: 'Cuéntanos qué buscáis', permiso: 'No puedes enviar solicitudes' })[(r && r.error) || ''] || 'No se ha podido enviar', true);
      return;
    }
    $('dbody').innerHTML = `<div class="fh"><div><h2>Solicitud enviada</h2></div><button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
      <div class="presuok"><div class="presuokic">${svgIco(ICON_NOM.check)}</div>
        <p><b>Gracias, ${esc(nombrePila(datos.nombre || PERFIL.nombre || ''))}.</b> Ya la tenemos: te ${est.contacto === 'correo' ? 'escribimos' : est.contacto === 'llamada' ? 'llamamos' : 'proponemos una videollamada'}
          en un día laborable${datos.correo ? ` (${esc(datos.correo)})` : ''}.</p>
        <p class="sm">Puedes ver en qué punto está en Plan y suscripción.</p></div>
      <div class="acts" style="justify-content:flex-end"><button class="btn" data-cerrar>Entendido</button></div>`;
    $('dlg').addEventListener('close', () => { if (TAB === 'plan' || TAB === 'organizacion' || TAB === 'config') ir(TAB); }, { once: true });
  };
  $('dlg').showModal();
}
// «Plan y suscripción»: botones al formulario (en lugar de correos) y la última solicitud con su estado
pintarPaginaPlan = (orig => async function (...a) {
  const r = await orig.apply(this, a);
  const c = $('cfgcuerpo'); if (!c || !c.querySelector('#planact')) return r;
  const pl = PLAN_ACTUAL || {};
  c.querySelectorAll('a[href^="mailto"]').forEach(x => {
    const b = document.createElement('button'); b.type = 'button'; b.className = x.className;
    b.textContent = x.closest('.plan[data-plan="medida"]') ? 'Pedir presupuesto' : 'Hablar con delcos';
    b.dataset.presu = x.closest('.plan[data-plan="medida"]') && pl.plan !== 'medida' ? 'presupuesto' : 'contrato';
    x.replaceWith(b);
  });
  const comp = $('pgcomp');
  if (pl.plan === 'medida' && !c.querySelector('[data-presu]') && !puede('gestionar_plataforma')) {
    const acts = c.querySelector('#planact .acts');
    if (acts) acts.insertAdjacentHTML('beforeend', '<button type="button" class="btn sec" data-presu="contrato">Hablar con delcos</button>');
  }
  if (comp) comp.textContent = comp.textContent.replace(' Para cambiarlo, habla con delcos.', '');
  c.querySelectorAll('[data-presu]').forEach(b => b.onclick = () => pedirPresupuesto(b.dataset.presu));
  try {
    const { data } = await db.from('solicitudes_plan').select('creado_en,estado,tipo').order('creado_en', { ascending: false }).limit(1);
    const s = (data || [])[0], h = c.querySelector('#planact h2');
    if (s && h && !$('presuest') && (s.estado !== 'Cerrada' || Date.now() - new Date(s.creado_en) < 30 * 864e5))
      h.insertAdjacentHTML('afterend', `<div class="banda-info" id="presuest">Tu solicitud ${s.tipo === 'contrato' ? 'sobre el contrato' : 'de presupuesto'} del
        ${fechaCorta(s.creado_en.slice(0, 10))}: <b>${esc(PRESU_ESTADO[s.estado] || s.estado)}</b>.${s.estado === 'Nueva' ? ' Te contestamos en un día laborable.' : ''}</div>`);
  } catch (e) {}
  return r;
})(pintarPaginaPlan);

// Panel delcos → Solicitudes
async function pintarSolicitudesPlan() {
  const c = $('cfgcuerpo'); if (!c) return;
  c.innerHTML = `<div class="card cfgpanel"><div class="skel" style="width:40%"></div><div class="skel"></div></div>`;
  const { data, error } = await RPC_ORIG('solicitudes_plan_lista', {});
  if (!$('cfgcuerpo')) return;
  const l = error ? [] : (data || []);
  const f = v => new Date(v).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
  const cont = { correo: 'Por correo', llamada: 'Por teléfono', video: 'Videollamada' };
  c.innerHTML = `<div class="card cfgpanel"><h2>Solicitudes de las empresas</h2>
    <p class="sm">Presupuestos A medida y conversaciones sobre el contrato. Llegan también como aviso. Cambia el estado cuando las atiendas: la empresa lo ve en su Plan.</p>
    ${error ? `<div class="banda-peligro">No se han podido leer: ${esc(error.message)}</div>` : ''}
    <div class="presulista">${l.map((s, i) => { const d = s.datos || {};
      return `<div class="presufila${s.estado === 'Cerrada' ? ' cerrada' : ''}">
        <div class="presucab"><b>${esc(s.organizacion)}</b> <span class="pill p-est">${esc(planDe(s.plan).nombre)}</span>
          <span class="pill ${s.estado === 'Nueva' ? 'p-warn' : s.estado === 'En curso' ? 'p-est' : 'p-anu'}">${esc(s.estado)}</span>
          <span class="sm">${s.tipo === 'contrato' ? 'Contrato A medida' : 'Presupuesto A medida'} · ${f(s.creado_en)}</span></div>
        ${(d.necesita_txt || []).length ? `<div class="chips">${d.necesita_txt.map(x => `<span class="chip">${esc(x)}</span>`).join('')}</div>` : ''}
        ${d.programa ? `<div class="sm">Programa: <b>${esc(d.programa)}</b></div>` : ''}
        ${d.mensaje ? `<p class="presumsg">${esc(d.mensaje)}</p>` : ''}
        <div class="sm">${d.usuarios ? num(d.usuarios) + ' usuarios' : ''}${d.portal ? ' · ' + num(d.portal) + ' con portal' : ''}${d.cuando ? ' · ' + esc(d.cuando) : ''}</div>
        <div class="sm">${esc(d.nombre || s.persona || '')}${d.correo ? ` · <a href="mailto:${esc(d.correo)}">${esc(d.correo)}</a>` : ''}${d.telefono ? ` · <a href="tel:${esc(d.telefono)}">${esc(d.telefono)}</a>` : ''}
          · ${esc(cont[d.contacto] || '')}${d.horario ? ' (' + esc(d.horario) + ')' : ''}</div>
        <div class="presuges"><select data-psest="${i}" aria-label="Estado">${['Nueva', 'En curso', 'Cerrada'].map(e => `<option ${s.estado === e ? 'selected' : ''}>${e}</option>`).join('')}</select>
          <input data-psnota="${i}" placeholder="Nota interna (qué se ha hablado, próximos pasos…)" value="${esc(s.nota || '')}">
          <button type="button" class="btn sec" data-psok="${i}">Guardar</button></div></div>`; }).join('')
      || '<div class="vacio">Todavía no ha llegado ninguna solicitud.</div>'}</div></div>`;
  c.querySelectorAll('[data-psok]').forEach(b => b.onclick = async () => {
    const i = +b.dataset.psok, s = l[i];
    const { data: r } = await RPC_ORIG('marcar_solicitud_plan', { p_id: s.id, p_estado: c.querySelector(`[data-psest="${i}"]`).value, p_nota: c.querySelector(`[data-psnota="${i}"]`).value });
    toast(r && r.ok ? 'Solicitud actualizada' : 'No se ha podido guardar', !(r && r.ok));
    if (r && r.ok) pintarSolicitudesPlan();
  });
}
if (PAGINAS.delcos && !PAGINAS.delcos.tabs.some(t => t[0] === 'solicitudes')) PAGINAS.delcos.tabs.splice(1, 0, ['solicitudes', 'Solicitudes', () => pintarSolicitudesPlan()]);

/* v2.168.0 · Alta de empresas desde la web (decisiones de Eric: prueba de 30 días con tarjeta, formulario en delcos.app). Quien vuelve de
   Stripe (?alta=ok) ve en el acceso que le llega un correo; el enlace de ese correo (invitación) le pide crear su contraseña y entra directo
   (?bienvenida=1) con una bienvenida y los primeros pasos. «Plan y suscripción» dice hasta cuándo dura la prueba y qué se cobrará después. */
(function altaAvisos() {
  const q = new URLSearchParams(location.search);
  if (q.get('alta') === 'ok') {
    history.replaceState(null, '', location.pathname + location.hash);
    setTimeout(() => {
      const m = $('lmsg');
      if (m && !(typeof PERFIL !== 'undefined' && PERFIL)) {
        m.style.color = 'var(--ok)';
        m.textContent = '¡Listo! Estamos creando tu empresa. En unos minutos te llegará un correo para crear tu contraseña y entrar (mira también en correo no deseado).';
      } else toast('Alta recibida: tu empresa estará lista en unos minutos');
    }, 400);
  }
  if (q.get('bienvenida') === '1') {
    history.replaceState(null, '', location.pathname);
    let n = 0;
    const t = setInterval(() => {
      if (typeof PERFIL !== 'undefined' && PERFIL && !document.body.classList.contains('sin-sesion') && typeof RPC_ORIG === 'function') { clearInterval(t); setTimeout(bienvenidaAlta, 900); }
      else if (++n > 60) clearInterval(t);
    }, 1000);
  }
})();
async function bienvenidaAlta() {
  try { await pagoCargarEstado(); } catch (e) {}
  const pl = PLAN_ACTUAL || {};
  const pasos = [
    ['importar', 'Trae tus datos', `Sube tu Excel de ${TT('medico', 'p', '', 'l', 'l')}, centros o clientes y los ordenamos por ti.`],
    ['equipo', 'Invita a tu equipo', 'Da acceso a las personas que van a usar delcos, cada una con su rol.'],
    ['marca', 'Pon tu marca', 'Tu logotipo y tu nombre en la plataforma y en los documentos.']];
  $('dbody').innerHTML = `<div class="fh"><div><h2>Te damos la bienvenida a delcos</h2>
      <div class="sm">${esc(nombreApp())} ya está en marcha${pl.en_prueba && pl.periodo_fin ? ` · prueba gratis hasta el ${fechaCorta(pl.periodo_fin)}` : ''}</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <p>Tres pasos para empezar con buen pie (los puedes hacer cuando quieras):</p>
    <div class="bienpasos">${pasos.map(([k, t, d], i) => `<button type="button" class="bienpaso" data-bien="${k}"><span class="bienn">${i + 1}</span>
      <span><b>${esc(t)}</b><span class="sm">${esc(d)}</span></span></button>`).join('')}</div>
    ${pl.en_prueba ? `<p class="sm">Durante la prueba no se cobra nada. Si decides no seguir, date de baja en Organización → Plan y suscripción antes del ${fechaCorta(pl.periodo_fin)}.</p>` : ''}
    <div class="acts" style="justify-content:flex-end"><button class="btn" data-cerrar>Empezar</button></div>`;
  $('dbody').querySelectorAll('[data-bien]').forEach(b => b.onclick = () => {
    $('dlg').close();
    const k = b.dataset.bien;
    if (k === 'importar') { CFG_SEC = 'importar'; ir('config'); }
    else if (k === 'equipo') ir('usuarios');
    else ir('organizacion');
  });
  $('dlg').showModal();
}
// «Plan y suscripción»: periodo de prueba de Stripe
pintarPaginaPlan = (orig => async function (...a) {
  const r = await orig.apply(this, a);
  const c = $('cfgcuerpo'), pl = PLAN_ACTUAL || {}, h = c && c.querySelector('#planact h2');
  if (h && pl.en_prueba && pl.periodo_fin && !$('pgprueba') && !pl.baja_al_final)
    h.insertAdjacentHTML('afterend', `<div class="banda-info" id="pgprueba">Estás en el periodo de prueba hasta el <b>${fechaCorta(pl.periodo_fin)}</b>:
      hasta entonces no se cobra nada. Ese día se pasará el primer recibo, salvo que te des de baja antes.</div>`);
  return r;
})(pintarPaginaPlan);

/* v2.169.0 · Datos de facturación bien antes del primer recibo (petición de Eric: «¿quién garantiza que después de la prueba los datos están
   bien?»). En «Plan y suscripción», con suscripción de Stripe, los datos con los que se factura (razón social, NIF, correo y dirección, de la
   función «pagos», acción datos) y «Corregir datos» (portal de Stripe); lo que falta, marcado. Durante la prueba, en los 7 últimos días, aviso
   arriba para revisarlos. El alta se hace en la web (www.delcos.app/empezar.html): el empezar.html del panel lleva allí. */
const diasHasta = f => f ? Math.round((Date.parse(String(f).slice(0, 10)) - Date.parse(hoyISO())) / 864e5) : null;   // días de calendario
pintarPaginaPlan = (orig => async function (...a) {
  const r = await orig.apply(this, a);
  const c = $('cfgcuerpo'), pl = PLAN_ACTUAL || {};
  if (!c || !c.querySelector('#planact') || !pl.stripe_cliente || !puedeOrganizacion() || $('pgdatos')) return r;
  c.querySelector('#planact').insertAdjacentHTML('afterend', `<div class="card cfgpanel" id="pgdatos"><h2 style="padding:0 0 4px">Datos de facturación</h2>
    <p class="sm">Con estos datos se hacen tus recibos y facturas. ${pl.en_prueba ? `Revísalos antes del ${fechaCorta(pl.periodo_fin)}, cuando se pasa el primer recibo.` : ''}</p>
    <div class="pgdlista"><div class="skel"></div></div>
    <div class="acts"><button type="button" class="btn sec" id="pgdcorr">Corregir datos</button></div></div>`);
  $('pgdcorr').onclick = ev => pagoPortal(ev.target);
  // Sin avisos si falla (se ve «Falta» y se puede corregir igual)
  const d = await db.functions.invoke('pagos', { body: { accion: 'datos' } }).then(x => x.data, () => null).catch(() => null);
  const l = c.querySelector('#pgdatos .pgdlista'); if (!l) return r;
  if (!d || !d.ok) { l.innerHTML = '<p class="sm">No se han podido leer ahora. Puedes verlos y cambiarlos con «Corregir datos».</p>'; return r; }
  const x = d.datos || {};
  const filas = [['Razón social', x.nombre], ['NIF o CIF', x.nif], ['Correo para los recibos', x.email], ['Dirección fiscal', x.direccion]];
  const faltan = filas.filter(f => !f[1]).length;
  l.innerHTML = filas.map(([k, v]) => `<div class="pgdfila${v ? '' : ' falta'}"><span>${esc(k)}</span><b>${v ? esc(v) : 'Falta'}</b></div>`).join('')
    + (faltan ? `<div class="banda-aviso" style="margin-top:8px">Faltan datos para poder facturarte: complétalos con «Corregir datos».</div>` : '');
  return r;
})(pintarPaginaPlan);
// En los 7 últimos días de la prueba, aviso arriba (no tapa los de impago o solo lectura)
pagoAviso = (orig => function (...a) {
  const r = orig.apply(this, a);
  const pl = (PAGO_ESTADO || {}).plan || PLAN_ACTUAL || {}, n = diasHasta(pl.periodo_fin);
  let el = $('pruebaaviso');
  const ver = pl.en_prueba && !pl.baja_al_final && n != null && n >= 0 && n <= 7 && !$('pagoaviso') && puedeOrganizacion();
  if (!ver) { if (el) el.remove(); return r; }
  const main = document.querySelector('main'); if (!main) return r;
  if (!el) { main.insertAdjacentHTML('afterbegin', '<div id="pruebaaviso" class="banda-info" role="status"></div>'); el = $('pruebaaviso'); }
  el.innerHTML = `Tu prueba termina ${n === 0 ? 'hoy' : n === 1 ? 'mañana' : `en ${n} días`} (${fechaCorta(pl.periodo_fin)}): ese día se pasa el primer recibo.
    Revisa que tus datos de facturación están bien. <button type="button" class="btn sec" id="pruebaver">Revisar mis datos</button>`;
  $('pruebaver').onclick = () => ir('plan');
  return r;
})(pagoAviso);

/* v2.171.0 · Panel delcos fuera de las empresas (decisión de Eric, 4/10/2026). El equipo de delcos entra con su propio usuario, que vive en
   la organización de plataforma (SQL 107); allí la app enseña SOLO el Panel delcos, con su menú: Clientes, Solicitudes, Errores, Accesos,
   Auditoría, Equipo delcos y Plantilla (roles y catálogos que reciben las empresas nuevas). Para ayudar a una empresa, «Entrar» desde
   Clientes (la app normal de esa empresa, con la franja «Estás viendo…») y «Salir» vuelve al panel. plan_uso dice si es la de plataforma. */
let MODO_PLATAFORMA = false;
const PANEL_SECCIONES = [['pd-orgs', 'orgs', 'Clientes', 'building-2'], ['pd-solicitudes', 'solicitudes', 'Solicitudes', 'mail'],
  ['pd-errores', 'errores', 'Errores', 'bug'], ['pd-accesos', 'accesos', 'Accesos', 'lock-keyhole'], ['pd-auditoria', 'auditoria', 'Auditoría', 'history'],
  ['pd-equipo', 'equipo', 'Equipo delcos', 'users'], ['pd-plantilla', 'plantilla', 'Plantilla', 'clipboard-list']];
// Pestañas propias del panel en modo plataforma: el equipo (los usuarios de la de plataforma) y la plantilla de las empresas nuevas
(() => {
  const base = PAGINAS.delcos.tabs;
  Object.defineProperty(PAGINAS.delcos, 'tabs', { configurable: true, get() {
    return MODO_PLATAFORMA ? [...base, ['equipo', 'Equipo delcos', () => pintarUsuarios2()], ['plantilla', 'Plantilla', () => pintarPlantillaDelcos()]] : base;
  } });
})();
async function pintarPlantillaDelcos(sub) {
  const c = $('cfgcuerpo'); if (!c) return;
  if (!sub) {
    c.innerHTML = `<div class="card cfgpanel"><h2>Plantilla de las empresas nuevas</h2>
      <p class="sm">Lo que recibe cada empresa al darse de alta (desde la web o desde Clientes). Cambiarlo aquí no toca a las empresas que ya existen.</p>
      <div class="acts" style="justify-content:flex-start"><button type="button" class="btn sec" data-plsub="roles">Roles y permisos</button>
        <button type="button" class="btn sec" data-plsub="cat">Catálogos y estados</button></div></div>`;
    c.querySelectorAll('[data-plsub]').forEach(b => b.onclick = () => pintarPlantillaDelcos(b.dataset.plsub));
    return;
  }
  // Los editores de siempre, sobre la organización de plataforma (que es la plantilla)
  if (sub === 'roles') await pintarRoles(); else { c.innerHTML = ''; await pintarCatalogos(); }
  const c2 = $('cfgcuerpo'); if (!c2 || $('plaviso')) return;
  c2.insertAdjacentHTML('afterbegin', `<div class="banda-info" id="plaviso">Estás cambiando la <b>plantilla de las empresas nuevas</b>.
    <button type="button" class="btn sec" id="plvolver">Volver a la plantilla</button></div>`);
  $('plvolver').onclick = () => pintarPlantillaDelcos();
}
// Menú: en modo plataforma, solo las secciones del panel (como botones del menú de siempre, ocultos fuera de él)
(() => {
  const nav = $('nav'); if (!nav) return;
  PANEL_SECCIONES.forEach(([t, , txt, ico]) => {
    if (!nav.querySelector(`[data-t="${t}"]`)) nav.insertAdjacentHTML('beforeend', `<button data-t="${t}" aria-selected="false" class="hide pdsec">${esc(txt)}</button>`);
    ICO_NAV[t] = ico;
  });
  MENU_GRUPOS.push({ id: 'panel', t: 'Panel delcos', items: PANEL_SECCIONES.map(s => s[0]) });
})();
ir = (orig => function (t, ...a) {
  const s = PANEL_SECCIONES.find(x => x[0] === t);
  if (s) { PAG_TAB.delcos = s[1]; const r = orig.call(this, 'delcos', ...a); marcarPanel(); return r; }
  // En modo plataforma no hay módulos de empresa: todo lleva al panel (salvo Configuración y el perfil)
  if (MODO_PLATAFORMA && !['delcos', 'config', 'perfil', 'manual'].includes(t)) { const r = orig.call(this, 'delcos', ...a); marcarPanel(); return r; }
  const r = orig.call(this, t, ...a); if (t === 'delcos') marcarPanel(); return r;
})(ir);
function marcarPanel() {
  const tab = PAG_TAB.delcos || 'orgs';
  document.querySelectorAll('nav.main [data-t]').forEach(b => { if (b.classList.contains('pdsec') || b.dataset.t === 'delcos') b.setAttribute('aria-selected', String(b.dataset.t === 'pd-' + tab)); });
}
function aplicarModoPlataforma() {
  document.body.classList.toggle('modo-plataforma', MODO_PLATAFORMA);
  document.querySelectorAll('#nav [data-t]').forEach(b => {
    const pd = b.classList.contains('pdsec');
    if (MODO_PLATAFORMA) b.classList.toggle('hide', !pd);
    else if (pd) b.classList.add('hide');
  });
  if (MODO_PLATAFORMA) document.querySelectorAll('[data-u="organizacion"], [data-u="plan"], [data-u="empresa"]').forEach(b => b.classList.add('hide'));
  try { MENU_FIRMA = ''; montarMenuLateral(); } catch (e) {}
}
aplicarPermisosMenu = (orig => function (...a) { const r = orig.apply(this, a); try { aplicarModoPlataforma(); } catch (e) {} return r; })(aplicarPermisosMenu);
// Se sabe al entrar (plan_uso): en la de plataforma, a Clientes
pagoCargarEstado = (orig => async function (...a) {
  const antes = MODO_PLATAFORMA;
  const r = await orig.apply(this, a);
  MODO_PLATAFORMA = !!(PAGO_ESTADO && PAGO_ESTADO.plataforma);
  if (MODO_PLATAFORMA !== antes) {
    aplicarModoPlataforma();
    if (MODO_PLATAFORMA && TAB !== 'delcos' && TAB !== 'config') ir('pd-orgs');
  }
  return r;
})(pagoCargarEstado);

/* v2.172.0 · «Tu día»: subir o bajar una cita la mueve al momento, sin recargar la agenda (aviso de Eric: antes se recargaban métricas,
   semana, mes y sugerencias). La lista se repinta con el orden nuevo a partir de lo que ya hay (agenda_rango no se vuelve a pedir) y el orden
   se guarda por detrás; si no se puede guardar, vuelve a lo guardado. El foco se queda en la flecha de la cita movida. */
let TD_ULTIMO = null, TD_PRESET = null;
rpcCache = (orig => async function (fn, params, clave) {
  if (fn === 'agenda_rango' && TD_PRESET && params && params.p_desde === TD_PRESET.fecha && params.p_hasta === TD_PRESET.fecha) {
    const d = TD_PRESET.data; TD_PRESET = null; return { data: d, cache: false };
  }
  const r = await orig.call(this, fn, params, clave);
  if (fn === 'agenda_rango' && params && params.p_desde === params.p_hasta && r && r.data) TD_ULTIMO = { fecha: params.p_desde, data: r.data };
  return r;
})(rpcCache);
async function moverCitaLocal(orden, id, acc) {
  const u = TD_ULTIMO && TD_ULTIMO.fecha === AG_FECHA ? TD_ULTIMO.data : null;
  if (!u) { if (await guardarOrden(orden)) cargarAgenda(); return; }
  const ids = new Set(orden.map(c => c.id));
  TD_PRESET = { fecha: AG_FECHA, data: [...orden, ...u.filter(c => !ids.has(c.id))] };
  TD_ULTIMO = { fecha: AG_FECHA, data: TD_PRESET.data };
  const y = window.scrollY;
  await pintarTuDia();
  window.scrollTo({ top: y });
  const b = document.querySelector(`#agcuerpo .tdu [data-td="${acc}|${id}"]:not([disabled])`) || document.querySelector(`#agcuerpo .tdu [data-td$="|${id}"]`);
  if (b) b.focus({ preventScroll: true });
  if (!(await guardarOrden(orden))) cargarAgenda();
}

/* v2.173.0 · Panel delcos completo (SQL 108): Cobros y suscripciones, Altas desde la web y Estado de la plataforma, en el menú del panel.
   Con el menú lateral, el panel ya no repite sus apartados como pestañas (aviso de Eric): el título dice dónde estás. Al entrar en una
   empresa o salir de ella la app se recarga tapada («Abriendo …») hasta tener el menú, la marca y la pantalla de esa organización, para
   que no se vea ni un instante lo de la otra. En «Tu día», la cita que se sube o se baja se desliza a su sitio y queda marcada un momento. */
PANEL_SECCIONES.splice(1, 0, ['pd-cobros', 'cobros', 'Cobros y suscripciones', 'credit-card'], ['pd-altas', 'altas', 'Altas desde la web', 'rocket']);
PANEL_SECCIONES.splice(5, 0, ['pd-estado', 'estado', 'Estado de la plataforma', 'shield-check']);
const PANEL_DESC = { orgs: 'Las empresas que usan delcos: plan, dominios, extras y entrar a ayudarlas', cobros: 'Quién paga, quién está en prueba y qué recibos vienen',
  altas: 'Empresas que se han dado de alta desde www.delcos.app', solicitudes: 'Presupuestos A medida y conversaciones sobre el contrato',
  errores: 'Errores de la plataforma agrupados, de todas las empresas', estado: 'Versiones en uso, SQL aplicado y cifras generales',
  accesos: 'Entradas y salidas de la plataforma', auditoria: 'Cambios hechos en el panel', equipo: 'Las personas de delcos con acceso al panel',
  plantilla: 'Roles y catálogos que recibe cada empresa nueva' };
(() => {
  const nav = $('nav'); if (!nav) return;
  PANEL_SECCIONES.forEach(([t, , txt, ico]) => {
    if (!nav.querySelector(`[data-t="${t}"]`)) nav.insertAdjacentHTML('beforeend', `<button data-t="${t}" aria-selected="false" class="hide pdsec">${esc(txt)}</button>`);
    ICO_NAV[t] = ico;
  });
  const g = MENU_GRUPOS.find(x => x.id === 'panel'); if (g) g.items = PANEL_SECCIONES.map(s => s[0]);
  // Las pestañas del panel siguen el mismo orden que el menú (en el móvil son su navegación)
  const desc = Object.getOwnPropertyDescriptor(PAGINAS.delcos, 'tabs');
  Object.defineProperty(PAGINAS.delcos, 'tabs', { configurable: true, get() {
    const base = desc.get ? desc.get.call(this) : desc.value;
    if (!MODO_PLATAFORMA) return base;
    const extra = { cobros: () => pintarCobrosDelcos(), altas: () => pintarAltasDelcos(), estado: () => pintarEstadoDelcos() };
    return PANEL_SECCIONES.map(([, k, n]) => { const b = base.find(x => x[0] === k); return b ? [k, n, b[2]] : extra[k] ? [k, n, extra[k]] : null; }).filter(Boolean);
  } });
})();
cargarPagina = (orig => function (t, ...a) {
  const r = orig.call(this, t, ...a);
  if (t === 'delcos' && MODO_PLATAFORMA) {
    const sec = $('v-delcos'), tab = PAG_TAB.delcos || 'orgs', s = PANEL_SECCIONES.find(x => x[1] === tab);
    if (sec && s) { const h = sec.querySelector('.saludo h1'), d = sec.querySelector('.saludo .fecha'); if (h) h.textContent = s[2]; if (d) d.textContent = PANEL_DESC[tab] || ''; }
  }
  return r;
})(cargarPagina);

const pdFecha = v => v ? new Date(String(v).length === 10 ? v + 'T12:00:00' : v).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const pdHace = v => { if (!v) return '—'; const m = Math.round((Date.now() - new Date(v)) / 60000);
  return m < 60 ? `hace ${Math.max(1, m)} min` : m < 1440 ? `hace ${Math.round(m / 60)} h` : `hace ${Math.round(m / 1440)} días`; };
const pdKpis = l => `<div class="pdkpis">${l.map(([v, t, cls]) => `<div class="pdkpi${cls ? ' ' + cls : ''}"><b>${v}</b><span>${esc(t)}</span></div>`).join('')}</div>`;
const pdEsqueleto = () => `<div class="card cfgpanel"><div class="pdkpis">${'<div class="pdkpi"><div class="skel" style="width:50%"></div><div class="skel" style="width:70%"></div></div>'.repeat(4)}</div><div class="skel"></div><div class="skel" style="width:80%"></div></div>`;

// ---- Cobros y suscripciones: el estado de pago de cada empresa (de ajustes.plan, que mantiene el aviso de Stripe)
function pdCobroEstado(o) {
  const p = o.plan_datos || {};
  if (o.bloqueada) return ['Bloqueada', 'p-anu', o.bloqueada === 'desactivada' ? 'Desactivada' : 'Prueba terminada'];
  if (p.estado === 'cancelada') return ['Cancelada', 'p-anu', p.periodo_fin ? 'Acceso hasta el ' + pdFecha(p.periodo_fin) : ''];
  if (p.estado === 'impago') { const d = p.impago_desde ? Math.round((Date.now() - new Date(p.impago_desde + 'T12:00:00')) / 864e5) : 0;
    return ['Impago', 'p-urg', d >= 14 ? 'Solo lectura desde hace ' + (d - 14) + ' días' : 'Le quedan ' + (14 - d) + ' días de gracia']; }
  if (p.en_prueba || p.estado === 'prueba') return ['En prueba', 'p-warn', (p.prueba_hasta || p.periodo_fin) ? 'Hasta el ' + pdFecha(p.prueba_hasta || p.periodo_fin) : ''];
  if (!p.stripe_suscripcion) return [p.plan === 'medida' ? 'A medida' : 'Sin suscripción', 'p-per', p.plan === 'medida' ? 'Contrato con delcos' : 'Sin pago con tarjeta'];
  return ['Al día', 'p-est', p.periodo_fin ? 'Próximo recibo: ' + pdFecha(p.periodo_fin) : ''];
}
function pdMensual(p) {
  if (!p || !p.stripe_suscripcion || p.estado === 'cancelada' || p.plan === 'medida') return 0;
  const pl = planDe(p.plan), u = Math.max(+p.usuarios || 0, pl.minimo || 3);
  return (p.pago === 'anual' ? (pl.anual || pl.precio) : pl.precio) * u;
}
async function pintarCobrosDelcos() {
  const c = $('cfgcuerpo'); if (!c) return;
  c.innerHTML = pdEsqueleto();
  const { data, error } = await RPC_ORIG('organizaciones_lista', {});
  if (!$('cfgcuerpo') || PAG_TAB.delcos !== 'cobros') return;
  const l = error ? [] : (data || []);
  const est = l.map(o => ({ o, p: o.plan_datos || {}, e: pdCobroEstado(o) }));
  const cuenta = n => est.filter(x => x.e[0] === n).length;
  const mrr = est.filter(x => x.e[0] === 'Al día').reduce((t, x) => t + pdMensual(x.p), 0);
  const stripe = id => `https://dashboard.stripe.com/${EN_PRUEBAS ? 'test/' : ''}customers/${encodeURIComponent(id)}`;
  let filtro = 'todas';
  const pinta = () => {
    const f = est.filter(x => filtro === 'todas' || (filtro === 'atencion' ? ['Impago', 'Bloqueada'].includes(x.e[0]) || x.p.baja_al_final || x.p.cambio_previsto : x.e[0] === filtro));
    $('pdcobl').innerHTML = f.length ? `<div class="tablawrap"><table class="pdtabla"><thead><tr><th>Empresa</th><th>Plan</th><th>Estado</th><th>Al mes</th><th>Pendiente</th><th></th></tr></thead><tbody>
      ${f.map(({ o, p, e }) => { const avisos = [p.baja_al_final ? 'Se da de baja al final del periodo' : '', p.cambio_previsto ? 'Cambio previsto a ' + planDe(p.cambio_previsto.plan || p.plan).nombre + (p.cambio_previsto.usuarios ? ' · ' + p.cambio_previsto.usuarios + ' usuarios' : '') + (p.cambio_previsto.desde ? ' el ' + pdFecha(p.cambio_previsto.desde) : '') : '', p.compromiso_hasta ? 'Compromiso hasta el ' + pdFecha(p.compromiso_hasta) : ''].filter(Boolean);
        return `<tr><td><b>${esc(o.nombre)}</b><div class="sm">${o.usuarios} usuarios activos${p.origen === 'web' ? ' · alta desde la web' : ''}</div></td>
          <td>${esc(planDe(p.plan).nombre)}<div class="sm">${p.plan === 'medida' ? '' : (p.usuarios ? p.usuarios + ' contratados · ' : '') + (p.pago === 'anual' ? 'anual' : 'mensual')}</div></td>
          <td><span class="pill ${e[1]}">${e[0]}</span><div class="sm">${esc(e[2])}</div></td>
          <td class="num">${pdMensual(p) ? eur(pdMensual(p)) : '—'}</td>
          <td>${avisos.map(a => `<div class="sm">${esc(a)}</div>`).join('') || '<span class="sm">—</span>'}</td>
          <td>${p.stripe_cliente ? `<a class="btn sec" href="${stripe(p.stripe_cliente)}" target="_blank" rel="noopener">Ver en Stripe</a>` : ''}</td></tr>`; }).join('')}</tbody></table></div>`
      : '<div class="vacio">No hay empresas en este grupo.</div>';
  };
  c.innerHTML = `<div class="card cfgpanel">
    ${error ? `<div class="banda-peligro">No se han podido leer: ${esc(error.message)}</div>` : ''}
    ${pdKpis([[cuenta('Al día'), 'al día'], [cuenta('En prueba'), 'en prueba'], [cuenta('Impago'), 'con impago', cuenta('Impago') ? 'mal' : ''],
      [est.filter(x => x.p.baja_al_final).length, 'se dan de baja'], [eur(mrr), 'cobro mensual estimado (sin IVA)']])}
    <div class="segs" id="pdcobf">${[['todas', 'Todas'], ['atencion', 'Requieren atención'], ['Al día', 'Al día'], ['En prueba', 'En prueba'], ['Impago', 'Impago']]
      .map(([k, n]) => `<button type="button" data-pdf="${esc(k)}" class="${k === filtro ? 'on' : ''}">${n}</button>`).join('')}</div>
    <div id="pdcobl"></div>
    <p class="sm">El estado llega solo desde Stripe con cada cobro. Las devoluciones y los datos de la tarjeta se miran en Stripe.</p></div>`;
  c.querySelectorAll('[data-pdf]').forEach(b => b.onclick = () => { filtro = b.dataset.pdf; c.querySelectorAll('[data-pdf]').forEach(x => x.classList.toggle('on', x === b)); pinta(); });
  pinta();
}

// ---- Altas desde la web: completadas (con su empresa y si ya ha entrado) y a medias (empezaron el pago y no lo terminaron)
async function pintarAltasDelcos() {
  const c = $('cfgcuerpo'); if (!c) return;
  c.innerHTML = pdEsqueleto();
  const { data, error } = await RPC_ORIG('altas_lista', {});
  if (!$('cfgcuerpo') || PAG_TAB.delcos !== 'altas') return;
  const l = error ? [] : (data || []);
  const hechas = l.filter(a => a.estado === 'completada'), medias = l.filter(a => a.estado !== 'completada');
  const sem = l.filter(a => Date.now() - new Date(a.creado_en) < 7 * 864e5);
  const fila = a => { const d = a.datos || {};
    const est = a.estado !== 'completada' ? ['A medias', 'p-warn', 'No terminó el pago · ' + pdHace(a.creado_en)]
      : a.entro ? ['Dentro', 'p-est', 'Ya ha entrado en delcos'] : ['Invitada', 'p-per', a.invitado_en ? 'Invitación enviada ' + pdHace(a.invitado_en) : 'Falta la invitación'];
    return `<div class="pdalta"><div class="pdaltacab"><b>${esc(a.organizacion || d.empresa || 'Sin nombre')}</b> <span class="pill ${est[1]}">${est[0]}</span>
        <span class="pill p-per">${esc(planDe(d.plan).nombre)} · ${d.usuarios || 3} usuarios · ${d.pago === 'anual' ? 'anual' : 'mensual'}</span></div>
      <div class="sm">${esc(d.nombre || '')}${d.email ? ` · <a href="mailto:${esc(d.email)}">${esc(d.email)}</a>` : ''}${d.telefono ? ` · <a href="tel:${esc(d.telefono)}">${esc(d.telefono)}</a>` : ''}${d.nif ? ' · ' + esc(d.nif) : ''}</div>
      <div class="sm">${esc(est[2])} · empezó el ${pdFecha(a.creado_en)}</div></div>`; };
  c.innerHTML = `<div class="card cfgpanel">
    ${error ? `<div class="banda-peligro">No se han podido leer: ${esc(error.message)}</div>` : ''}
    ${pdKpis([[hechas.length, 'completadas (90 días)'], [hechas.filter(a => a.entro).length, 'ya han entrado'], [medias.length, 'a medias (7 días)', medias.length ? 'aviso' : ''], [sem.length, 'esta semana']])}
    ${medias.length ? `<h3 class="pdh3">A medias</h3><p class="sm">Rellenaron el formulario pero no terminaron de poner la tarjeta. Puede valer la pena escribirles. Se borran solas a los 7 días.</p>${medias.map(fila).join('')}` : ''}
    <h3 class="pdh3">Completadas</h3>${hechas.map(fila).join('') || '<div class="vacio">Todavía no hay altas completadas desde la web.</div>'}</div>`;
}

// ---- Estado de la plataforma: SQL aplicado, versión publicada y versiones que usa cada empresa
async function pintarEstadoDelcos() {
  const c = $('cfgcuerpo'); if (!c) return;
  c.innerHTML = pdEsqueleto();
  const { data, error } = await RPC_ORIG('estado_plataforma', {});
  if (!$('cfgcuerpo') || PAG_TAB.delcos !== 'estado') return;
  const e = (!error && data) || {}, emp = e.empresas || {}, sql = e.sql || [], ver = e.versiones || [];
  const ult = sql[0] || {};
  const porVer = {}; ver.forEach(v => { (porVer[v.version] = porVer[v.version] || []).push(v); });
  const versiones = Object.keys(porVer).sort((a, b) => b.localeCompare(a, 'es', { numeric: true }));
  c.innerHTML = `<div class="card cfgpanel">
    ${error ? `<div class="banda-peligro">No se ha podido leer: ${esc(error.message)}</div>` : ''}
    ${pdKpis([[esc('v' + VERSION_APP), 'versión de esta app'], [ult.numero ? 'SQL ' + ult.numero : '—', ult.version_app ? 'base en ' + ult.version_app : 'base'],
      [num(emp.activas || 0) + ' / ' + num(emp.total || 0), 'empresas activas'], [num(e.usuarios || 0), 'usuarios activos' + (e.portal ? ' · ' + num(e.portal) + ' del portal' : '')],
      [num(e.errores || 0), 'errores sin resolver (15 días)', e.errores ? 'aviso' : '']])}
    <h3 class="pdh3">Versiones en uso (30 días)</h3>
    ${versiones.length ? versiones.map(v => `<div class="pdver"><div class="pdvercab"><b>v${esc(v.replace(/^v/, ''))}</b>${v.replace(/^v/, '') === VERSION_APP ? ' <span class="pill p-est">la actual</span>' : ' <span class="pill p-warn">anterior</span>'}
        <span class="sm">${porVer[v].length} ${porVer[v].length === 1 ? 'empresa' : 'empresas'}</span></div>
      <div class="sm">${porVer[v].map(x => `${esc(x.organizacion)} (${pdHace(x.ultima_vez)})`).join(' · ')}</div></div>`).join('')
      : '<div class="vacio">Ninguna empresa ha abierto la app en los últimos 30 días.</div>'}
    <h3 class="pdh3">Últimos SQL aplicados en esta base</h3>
    <div class="tablawrap"><table class="pdtabla"><thead><tr><th>SQL</th><th>Versión</th><th>Qué cambia</th><th>Aplicado</th></tr></thead><tbody>
      ${sql.map(s => `<tr><td class="num">${s.numero}</td><td>${esc(s.version_app || '')}</td><td class="sm">${esc(s.descripcion || '')}</td><td class="sm">${pdFecha(s.aplicado_en)}</td></tr>`).join('')}</tbody></table></div>
    <p class="sm">Esto es la base de ${EN_PRUEBAS ? '<b>pruebas</b>' : '<b>producción</b>'}. La de ${EN_PRUEBAS ? 'producción' : 'pruebas'} se mira desde su propio panel.</p></div>`;
}

// ---- Cambiar de organización sin heredar nada: la recarga va tapada hasta tener el menú, la marca y la pantalla de la organización nueva
function prepararCambioOrg(destino) {
  try { sessionStorage.setItem('dlc-cambio-org', destino || ''); sessionStorage.removeItem('dlc-f5'); localStorage.removeItem('app-marca'); } catch (e) {}
}
entrarEnOrganizacion = async function (o) {
  if (!await preguntar(`Vas a ver la plataforma como ${o.nombre}: sus datos, su configuración y su plan. Lo que cambies se guarda en su empresa y queda registrado. Para volver, «Salir» en la franja de arriba.`, { titulo: 'Entrar en ' + o.nombre, ok: 'Entrar' })) return;
  const { data: r } = await db.rpc('entrar_organizacion', { p_org: o.id });
  if (!r || !r.ok) { toast(r && r.motivo === 'permiso' ? 'Solo el Administrador de delcos puede entrar' : 'No se ha podido entrar', true); return; }
  prepararCambioOrg(o.nombre);
  location.reload();
};
document.addEventListener('click', ev => { if (ev.target.closest('#orgvistasal')) prepararCambioOrg('Panel delcos'); }, true);
(function terminarCambioOrg() {
  let destino = null; try { destino = sessionStorage.getItem('dlc-cambio-org'); } catch (e) {}
  const html = document.documentElement;
  if (destino === null && !html.classList.contains('cambiando-org')) return;
  const fin = () => { html.classList.remove('cambiando-org'); try { sessionStorage.removeItem('dlc-cambio-org'); } catch (e) {} };
  const tope = setTimeout(fin, 9000);
  let n = 0;
  const t = setInterval(async () => {
    if (++n > 80) { clearInterval(t); return; }
    if (!(typeof PERFIL !== 'undefined' && PERFIL && !document.body.classList.contains('sin-sesion') && typeof RPC_ORIG === 'function')) {
      if (!$('login').classList.contains('hide')) { clearInterval(t); clearTimeout(tope); fin(); }
      return;
    }
    clearInterval(t);
    try { await pagoCargarEstado(); } catch (e) {}
    try { await franjaVista(); } catch (e) {}
    try { aplicarModoPlataforma(); } catch (e) {}
    if (MODO_PLATAFORMA && TAB !== 'delcos') ir('pd-orgs');
    // Se espera a que la pantalla haya revelado sus datos (como mucho 3 s)
    for (let i = 0; i < 30; i++) { await new Promise(r => setTimeout(r, 100)); if (!document.querySelector('main > section.preparando, main > section.cargando')) break; }
    clearTimeout(tope); fin();
  }, 60);
})();
try { const m = () => { try { localStorage.setItem('dlc-modo', MODO_PLATAFORMA ? 'plataforma' : 'empresa'); } catch (e) {} };
  aplicarModoPlataforma = (orig => function (...a) { const r = orig.apply(this, a); m(); return r; })(aplicarModoPlataforma); } catch (e) {}

// ---- «Tu día»: la cita movida se desliza a su sitio (FLIP) y queda resaltada un momento

/* v2.173.0 · El próximo recibo con IVA en «Plan y suscripción» (petición de Eric por la sesión de la web: que la web, Stripe y la app digan lo mismo).
   Durante la prueba: hoy 0 €, el primer recibo con IVA (con la puesta en marcha si el pago es mensual) y lo que viene después; fuera de ella, el
   próximo recibo y su fecha. Se pinta al momento con la misma cuenta que la web (IVA = redondeo de base × 21 / 100) y, si la función «pagos»
   devuelve el recibo de Stripe (acción datos, campo proximo), se cambia por ese (lleva descuentos y lo ya apuntado). */
let PAGO_PROXIMO = null;
db.functions.invoke = (orig => async function (fn, op, ...a) {
  const r = await orig.call(this, fn, op, ...a);
  try { if (fn === 'pagos' && op && op.body && op.body.accion === 'datos' && r && r.data && r.data.ok) { PAGO_PROXIMO = r.data.proximo || null; pintarProximoRecibo(); } } catch (e) {}
  return r;
})(db.functions.invoke.bind(db.functions));
const ivaDe = x => Math.round(x * 21) / 100;
function reciboCalculado(pl) {
  const p = planDe(pl.plan), u = Math.max(+pl.usuarios || 0, p.minimo || 3), anual = pl.pago === 'anual';
  const cuota = u * p.precio * (anual ? 10 : 1);
  const puesta = pl.en_prueba && !anual ? PUESTA_EN_MARCHA : 0;
  return { primero: cuota + puesta + ivaDe(cuota + puesta), despues: cuota + ivaDe(cuota), puesta, anual };
}
// (v2.183.0: aquí iba la primera versión de pintarProximoRecibo; se redefine entera más abajo)
pintarPaginaPlan = (orig => async function (...a) { const r = await orig.apply(this, a); try { pintarProximoRecibo(); } catch (e) {} return r; })(pintarPaginaPlan);

/* v2.174.0 · Recibo con IVA como en la web (repaso de Web delcos): fecha larga («el 3 de noviembre»), importes enteros sin decimales (490 €), sin la
   línea «Próximo recibo el …» que repetía la fecha y, bajo la cuota «Al mes, sin IVA», lo mismo con IVA. */
const eurW = n => { const s = eur(n); return Math.round(+n * 100) % 100 === 0 ? s.replace(/,00(?=\s?€)/, '') : s; };
const fechaDiaMes = f => f ? new Date(String(f).slice(0, 10) + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }) : '';
pintarProximoRecibo = function () {
  const c = $('cfgcuerpo'), pl = PLAN_ACTUAL || {}, h = c && c.querySelector('#planact h2');
  if (!h) return;
  // La cuota del plan, también con IVA
  c.querySelectorAll('#planact .kpi').forEach(k => {
    const sp = k.querySelector(':scope > span'), b = k.querySelector(':scope > b');
    if (!sp || !b || sp.textContent.trim() !== 'Al mes, sin IVA' || k.querySelector('.kpiiva')) return;
    const v = parseFloat(b.textContent.replace(/[^\d,]/g, '').replace(',', '.'));
    if (v > 0) k.insertAdjacentHTML('beforeend', `<span class="sm kpiiva">${eurW(v + ivaDe(v))} con IVA</span>`);
  });
  if (!pl.stripe_suscripcion || pl.plan === 'medida' || pl.baja_al_final || pl.estado === 'cancelada') return;
  const k = reciboCalculado(pl), s = PAGO_PROXIMO;
  const fecha = (s && s.fecha) || pl.periodo_fin, total = s && s.total != null ? s.total : k.primero;
  const cada = k.anual ? 'al año' : 'al mes';
  const txt = pl.en_prueba
    ? `Hoy no pagas nada. El <b>${fechaDiaMes(fecha)}</b> llega el primer recibo: <b>${eurW(total)} con IVA</b>${k.puesta ? `, que incluye la puesta en marcha (${eurW(k.puesta)} + IVA, una sola vez)` : k.anual ? ' (la puesta en marcha va incluida)' : ''}.
       Después, ${eurW(k.despues)} ${cada} con IVA. Si te das de baja antes, no pagas nada.`
    : `Próximo recibo: <b>${eurW(total)} con IVA</b>${fecha ? `, el <b>${fechaDiaMes(fecha)}</b>` : ''}.`;
  let el = $('pgrecibo');
  if (!el) {
    const prueba = $('pgprueba');
    if (prueba) { prueba.id = 'pgrecibo'; el = prueba; } else { h.insertAdjacentHTML('afterend', '<div class="banda-info" id="pgrecibo"></div>'); el = $('pgrecibo'); }
  }
  el.innerHTML = txt;
  el.dataset.origen = s && s.total != null ? 'stripe' : 'calculo';
  // La fecha ya la dice el aviso: fuera la línea suelta «Próximo recibo el …»
  c.querySelectorAll('#planact > p.sm').forEach(p => { if (/^Próximo recibo el /.test(p.textContent.trim())) p.remove(); });
};

