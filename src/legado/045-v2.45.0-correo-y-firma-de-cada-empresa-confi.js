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





