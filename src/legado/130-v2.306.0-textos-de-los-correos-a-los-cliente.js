/* ============================================================
   v2.306.0 · Textos de los correos a los clientes (revisión de Eric con un correo real: al cliente le llegó «IBAN: (añade el
   IBAN…)», la despedida repetía lo que ya dice la firma y el concepto no era su nombre). Cada empresa escribe sus textos en
   Configuración → Correo y firma → «Textos de los correos», con huecos como [nombre] o [iban] que se rellenan al enviar.
   Se guardan en el ajuste plantillas_correo. Sin IBAN no se envían los datos de pago. La despedida y los teléfonos van solo en la firma.
   ============================================================ */
const PLANT_CORREO = {
  pago: { titulo: 'Datos de pago por transferencia', asunto: '[Documento] [numero] de [empresa] para [nombre]',
    texto: 'Hola [nombre_pila]:\n\nGracias por tu pedido [numero], por un importe de [importe].\n\nPara completarlo, haz una transferencia bancaria con estos datos:\n\nBeneficiario: [beneficiario]\nIBAN: [iban]\nImporte: [importe]\nConcepto: [nombre]\n\nIndica el concepto tal como aparece arriba: así identificamos el pago enseguida y no se retrasa la preparación del pedido.\n\nEn cuanto recibamos el pago preparamos el envío.' },
  factura: { titulo: 'Envío de la factura', asunto: '[Documento] [numero] de [empresa] para [nombre]',
    texto: 'Hola [nombre_pila]:\n\nTe adjuntamos la [documento] [numero] de tu pedido, por un importe de [importe].\n\nGracias por tu confianza. Si tienes cualquier duda, estaremos encantados de ayudarte.' }
};
const VARS_CORREO = [['nombre', 'Nombre completo del cliente'], ['nombre_pila', 'Solo el nombre de pila'], ['empresa', 'Vuestra razón social'], ['documento', 'pedido o factura'],
  ['Documento', 'Pedido o Factura'], ['numero', 'Número del pedido o la factura'], ['importe', 'Importe total'], ['beneficiario', 'Titular de la cuenta (razón social)'], ['iban', 'IBAN de los datos fiscales']];
function varsCorreo(o) {
  const e = AJUSTES.empresa || {}, emp = e.razon_social || nombreApp(), doc = o.documento || 'pedido';
  return { nombre: o.nombre || '', nombre_pila: o.nombre ? nombrePila(o.nombre) : '', empresa: emp, documento: doc, Documento: doc.charAt(0).toUpperCase() + doc.slice(1),
    numero: o.numero || '', importe: eurI(o.importe || 0), beneficiario: emp, iban: e.iban || '' };
}
function plantillaCorreo(k, campo, v) {
  const l = plantillasCorreo(k), p = l.find(x => x.id === PLANT_ELEGIDA[k]) || l.find(x => x.defecto) || l[0] || {};
  const t = (p[campo] || '').trim() || PLANT_CORREO[k][campo];
  return t.replace(/\[(\w+)\]/g, (m, n) => n in v ? v[n] : m).replace(/ {2,}/g, ' ').trim();
}
// (R-12: textoEmailPago se definía aquí otra vez; ahora está en su sitio, más arriba)
function asuntoEmailPago(p, total, cliente) { return plantillaCorreo('pago', 'asunto', varsCorreo({ documento: 'pedido', numero: p.numero, importe: total, nombre: cliente })); }

// Configuración → Correo y firma: «Textos de los correos»
// Configuración → Correo y firma → «Plantillas de correo»
function pintarPlantillasCorreo() {
  const c = $('cfgcuerpo'); if (!c || $('plcorreo') || !$('cook')) return;
  const fin = $('cook').closest('.card'); if (!fin) return;
  fin.insertAdjacentHTML('beforebegin', `<div class="card cfgpanel" id="plcorreo"><div class="fh"><h2 class="plch">Plantillas de correo ${pmAyu('Plantillas de correo', 'Los correos que reciben tus clientes. Crea las que quieras, con el nombre que quieras; para cada uso, una es la de por defecto y, si hay más, se elige al enviar. Los huecos entre corchetes ([nombre], [iban]…) se rellenan al enviar. La despedida y los teléfonos ya van en la firma.')}</h2>
    <button type="button" class="btn sec chico" id="plcnueva">+ Nueva plantilla</button></div><div id="plclista" class="plclista"></div></div>`);
  const pinta = () => {
    const l = listaCorreos();
    $('plclista').innerHTML = Object.keys(USOS_CORREO).map(u => {
      const g = l.filter(x => x.uso === u);
      return `<div class="plcuso"><div class="sm plcusot">${esc(USOS_CORREO[u])}</div>${g.map(x => `<div class="plcfila"><span class="plcn"><b>${esc(x.nombre)}</b>${x.defecto ? ' <span class="pill p-ok">Por defecto</span>' : ''}<span class="sm">${esc(x.asunto)}</span></span>
        <span class="plcb"><button type="button" class="btn sec chico" data-plce="${x.id}">Editar</button><button type="button" class="btn sec chico" data-plcd="${x.id}">Duplicar</button>
          ${g.length > 1 ? `<button type="button" class="btn sec chico dang" data-plcx="${x.id}">Eliminar</button>` : ''}</span></div>`).join('') || '<div class="sm">Sin plantillas.</div>'}</div>`;
    }).join('');
  };
  pinta();
  $('plcorreo').onclick = async e => {
    const ed = e.target.closest('[data-plce]'), du = e.target.closest('[data-plcd]'), x = e.target.closest('[data-plcx]');
    const l = listaCorreos().map(p => Object.assign({}, p));
    if (e.target.closest('#plcnueva')) { editarPlantillaCorreo({ id: idPlant(), nombre: '', uso: 'pago', asunto: PLANT_CORREO.pago.asunto, texto: PLANT_CORREO.pago.texto, defecto: false }, true, pinta); return; }
    if (ed) { editarPlantillaCorreo(l.find(p => p.id === ed.dataset.plce), false, pinta); return; }
    if (du) { const o = l.find(p => p.id === du.dataset.plcd); editarPlantillaCorreo(Object.assign({}, o, { id: idPlant(), nombre: o.nombre + ' (copia)', defecto: false }), true, pinta); return; }
    if (x) {
      const o = l.find(p => p.id === x.dataset.plcx); if (!o) return;
      if (!await preguntar(`Se elimina la plantilla «${o.nombre}».`, { titulo: '¿Eliminar la plantilla?', ok: 'Eliminar' })) return;
      let n = l.filter(p => p !== o);
      if (o.defecto) { const otra = n.find(p => p.uso === o.uso); if (otra) otra.defecto = true; }
      if (await guardarCorreos(n)) { toast('Plantilla eliminada'); pinta(); }
    }
  };
}
// Aparece en cuanto la página «Correo y firma» está pintada (su botón Guardar, #cook, existe)
new MutationObserver(() => { if (TAB === 'config' && $('cook') && !$('plcorreo')) pintarPlantillasCorreo(); }).observe(document.querySelector('main') || document.body, { childList: true, subtree: true });


