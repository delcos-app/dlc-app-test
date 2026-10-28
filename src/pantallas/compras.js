// @ts-check
// pantallas/compras.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

async function cargarProveedores() { const { data } = await db.rpc('proveedores_lista'); PROVEEDORES = data || []; }

const PROVEEDORES_CORREO = {
  google: { n: window.delcos.t('legacyTexts.mailProviders.google'), host: 'smtp.gmail.com', puerto: 465, seg: 'ssl', ayuda: window.delcos.t('legacyTexts.mailProviders.googleHelp') },
  microsoft: { n: window.delcos.t('legacyTexts.mailProviders.microsoft'), host: 'smtp.office365.com', puerto: 587, seg: 'starttls', ayuda: window.delcos.t('legacyTexts.mailProviders.microsoftHelp') },
  mailjet: { n: 'Mailjet', host: 'in-v3.mailjet.com', puerto: 465, seg: 'ssl', ayuda: window.delcos.t('legacyTexts.mailProviders.mailjetHelp') },
  ionos: { n: 'IONOS', host: 'smtp.ionos.es', puerto: 465, seg: 'ssl', ayuda: window.delcos.t('legacyTexts.mailProviders.mailboxHelp') },
  ovh: { n: 'OVHcloud', host: 'ssl0.ovh.net', puerto: 465, seg: 'ssl', ayuda: window.delcos.t('legacyTexts.mailProviders.mailboxHelp') },
  otro: { n: window.delcos.t('legacyTexts.mailProviders.other'), host: '', puerto: 465, seg: 'ssl', ayuda: window.delcos.t('legacyTexts.mailProviders.otherHelp') }
};

// Compras y Proveedores están en src/app/screens/purchases (v2.409.0). Estos nombres se quedan: Pedidos, Inicio, los avisos,
// legado 058 (ventana amplia de editorCompra) y las pruebas los usan.
