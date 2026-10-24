/* ============================================================
   v2.43.0 · Idiomas por persona (castellano, inglés, alemán,
   francés e italiano), precios alineados con el mercado, paquete
   ampliado de notificaciones, logo neutro y ayudas «i» renovadas
   ============================================================ */

/* ---------------- logo: el de la empresa o uno neutro ---------------- */

const LOGO_NEUTRO = 'logo-app.png';
aplicarMarca = (orig => function () {
  orig();
  if (!MARCA.logo) document.querySelectorAll('header .logo, .lbox img, #bootsplash img').forEach(i => { i.src = LOGO_NEUTRO; });
})(aplicarMarca);
aplicarMarca();
;

/* ---------------- planes alineados con el mercado ---------------- */

PLANES.splice(0, PLANES.length,
  { id: 'esencial', nombre: 'Esencial', precio: 29, incluidos: 2, bloque: [1, 10], medicos: 0, para: `Para empezar a ordenar ${TT('visita', 'p', 'el', 'l', 'l')}`,
    modulos: ['inicio', 'agenda', 'rutas', 'directorio', 'seguimiento'],
    ventajas: [`Directorio de ${TT('medico', 'p', '', 'l', 'l')} y centros`, `Agenda, «Tu día» y registro de ${TT('visita', 'p', '', 'l', 'l')}`, 'Rutas optimizadas y planificación semanal', 'App móvil instalable'] },
  { id: 'profesional', nombre: 'Profesional', precio: 59, incluidos: 4, bloque: [1, 10], medicos: 0, para: 'Para equipos que venden y miden',
    modulos: ['inicio', 'agenda', 'rutas', 'directorio', 'seguimiento', 'ventas', 'pacientes', 'productos', 'analitica'],
    ventajas: ['Todo lo de Esencial', 'Pedidos, clientes y llamadas', 'Productos y stock por lotes', 'Analítica, ranking y comisiones'] },
  { id: 'avanzado', nombre: 'Avanzado', precio: 99, incluidos: 7, bloque: [1, 10], medicos: 25, para: 'Con facturación y varios comerciales',
    modulos: ['inicio', 'agenda', 'rutas', 'directorio', 'seguimiento', 'ventas', 'pacientes', 'productos', 'analitica', 'facturacion'],
    ventajas: ['Todo lo de Profesional', 'Facturación con VeriFactu y cobros', 'Compras, proveedores y trazabilidad', `Zonas, supervisión y espacio ${TT('medico', 's', 'del', 'l', 'l')} (25)`] },
  { id: 'premium', nombre: 'Premium', precio: 179, incluidos: 15, bloque: [1, 8], medicos: null, para: 'Redes comerciales completas',
    modulos: ['inicio', 'agenda', 'rutas', 'directorio', 'seguimiento', 'ventas', 'pacientes', 'productos', 'analitica', 'facturacion'],
    ventajas: ['Todo lo de Avanzado', `Espacio ${TT('medico', 's', 'del', 'l', 'l')} sin límite`, 'Impersonalización de usuarios y auditoría', 'Soporte prioritario y ayuda con la migración'] });
pintarPlan2 = (orig => async function () {
  await orig();
  const c = $('cfgcuerpo'); if (!c) return;
  // Textos del modelo por usuario (en lugar de bloques)
  c.querySelectorAll('.plan .sm').forEach(s => { s.textContent = s.textContent.replace(/\+1 usuarios por (.+?)\/mes/, 'usuario extra: $1/mes'); });
  const b = $('plbloque'); if (b) b.textContent = b.textContent.replace(/Añadir un bloque de 1 usuarios \((.+)\)/, 'Añadir un usuario extra ($1)');
  c.querySelectorAll('.manlist li span:last-child').forEach(li => {
    if (/bloques de usuarios/.test(li.textContent)) li.textContent = 'Cada plan incluye usuarios; si el equipo crece, se añaden usuarios sueltos sin cambiar de plan.';
    if (/dos meses gratis/.test(li.textContent)) li.textContent = 'Pago mensual con tarjeta, sin permanencia.';
  });
  const act = c.querySelector('.planact .sm'); if (act) act.textContent = act.textContent.replace(/ \+ (\d+) bloques? de 1/, ' + $1 extra');
})(pintarPlan2);

/* ---------------- notificaciones ampliadas ---------------- */

TIPOS_NOTIF.push(
  ['citas_hoy', '📅', 'Mis citas de hoy', 'Al empezar el día, cuántas citas tienes'],
  ['sin_visitar', '⏳', `${TT('medico', 'p', '', 'l', 'C')} sin visitar`, `Los lunes, ${TT('medico', 'p', '', 'l', 'l')} de tu cartera con más de 60 días sin ${TT('visita', 's', '', 'l', 'l')}`],
  ['cliente_nuevo', '🧑‍⚕️', `${TT('paciente', 'p', '', 'l', 'C', 'nuevo')} de mi cartera`, `Cuando se da de alta un cliente que viene de ${TT('medico', 's', 'un', 'l', 'l', 'tuyo')}`],
  ['pago_recibido', '💳', 'Pagos de mis pedidos', 'Cuando se cobra un pedido que creaste'],
  ['borrador_nuevo', '✏️', 'Pedidos en borrador', 'Cuando alguien deja un pedido pendiente de confirmar'],
  ['seguimientos_hoy', '📞', 'Llamadas de seguimiento', 'Al empezar el día, las llamadas que tocan hoy'],
  ['pagos_pendientes', '⌛', 'Pagos pendientes', 'Al empezar el día, pedidos con el pago pendiente hace más de una semana'],
  ['facturas_vencidas', '🧾', 'Facturas vencidas', 'Al empezar el día, facturas vencidas sin cobrar'],
  ['stock_minimo', '📉', 'Stock bajo', 'Cuando un producto baja de su stock mínimo'],
  ['lotes_caducan', '⚠️', 'Lotes que caducan', 'Al empezar el día, lotes que caducan en 30 días'],
  ['compra_recibida', '🚚', 'Mercancía recibida', 'Cuando se registra la recepción de una compra'],
  ['rectificativa', '↩️', 'Facturas rectificativas', 'Cada rectificativa que se emite'],
  ['duplicado', '🧩', 'Posibles duplicados', 'Cuando una ficha se marca como posible duplicado'],
  ['usuario_nuevo', '👤', 'Usuarios nuevos', 'Cuando se da de alta una persona'],
  ['esquema', '€', 'Mi comisión', 'Cuando te asignan un esquema de comisión']);
irEnlace = (orig => function (e) {
  const [t] = String(e || '').split(':');
  if (t === 'agenda') { AG_MODO = 'dia'; AG_FECHA = hoyISO(); ir('agenda'); }
  else if (t === 'llamadas') { PEDSEC = 'llamadas'; ir('ventas'); }
  else if (t === 'ventas') { PEDSEC = 'ventas'; ir('ventas'); }
  else if (t === 'stock') { PSEC = 'stock'; ir('productos'); }
  else if (t === 'facturacion') ir('facturacion');
  else if (t === 'duplicados') ir('duplicados');
  else orig(e);
})(irEnlace);
// Resumen del día: se genera la primera vez que se abre la plataforma cada día
// Configuración de notificaciones agrupada
pintarNotif = (orig => function () {
  orig();
  const c = $('cfgcuerpo').querySelector('.notcfg'); if (!c) return;
  const al = ['citas_hoy', 'seguimientos_hoy', 'pagos_pendientes', 'facturas_vencidas', 'lotes_caducan', 'sin_visitar'];
  const labels = [...c.children];
  const dia = labels.filter(l => al.includes(l.querySelector('[data-nt]').dataset.nt));
  if (dia.length) { c.insertAdjacentHTML('beforeend', '<h3 class="mansub">Resumen al empezar el día</h3>'); dia.forEach(l => c.appendChild(l)); }
  if (labels.length > dia.length) c.insertAdjacentHTML('afterbegin', '<h3 class="mansub" style="margin-top:0">Al momento</h3>');
})(pintarNotif);

/* ---------------- idiomas ---------------- */

const IDIOMAS = [['es', 'Castellano'], ['en', 'English'], ['de', 'Deutsch'], ['fr', 'Français'], ['it', 'Italiano']];
const LOCALES = { es: 'es-ES', en: 'en-GB', de: 'de-DE', fr: 'fr-FR', it: 'it-IT' };
// [castellano, inglés, alemán, francés, italiano]
const I18N = [
  ['Inicio', 'Home', 'Start', 'Accueil', 'Home'], ['Agenda', 'Calendar', 'Kalender', 'Agenda', 'Agenda'], ['Rutas', 'Routes', 'Routen', 'Itinéraires', 'Percorsi'],
  ['Médicos', 'Doctors', 'Ärzte', 'Médecins', 'Medici'], ['Directorio', 'Directory', 'Verzeichnis', 'Annuaire', 'Elenco'], ['Clientes', 'Customers', 'Kunden', 'Clients', 'Clienti'], ['Productos', 'Products', 'Produkte', 'Produits', 'Prodotti'],
  ['Calidad del dato', 'Data quality', 'Datenqualität', 'Qualité des données', 'Qualità dei dati'], ['Pedidos', 'Orders', 'Bestellungen', 'Commandes', 'Ordini'],
  ['Analítica', 'Analytics', 'Analysen', 'Analyses', 'Analisi'], ['Facturación', 'Invoicing', 'Rechnungen', 'Facturation', 'Fatturazione'], ['Más', 'More', 'Mehr', 'Plus', 'Altro'],
  ['Mi informe', 'My report', 'Mein Bericht', 'Mon rapport', 'Il mio report'], ['Mi centro', 'My centre', 'Mein Zentrum', 'Mon centre', 'Il mio centro'], ['Configuración', 'Settings', 'Einstellungen', 'Paramètres', 'Impostazioni'],
  ['Manual de uso', 'User guide', 'Handbuch', 'Guide d’utilisation', 'Manuale'], ['Cerrar sesión', 'Sign out', 'Abmelden', 'Se déconnecter', 'Esci'],
  ['Cambiar contraseña', 'Change password', 'Passwort ändern', 'Changer le mot de passe', 'Cambia password'],
  ['Guardar', 'Save', 'Speichern', 'Enregistrer', 'Salva'], ['Cancelar', 'Cancel', 'Abbrechen', 'Annuler', 'Annulla'], ['Cerrar', 'Close', 'Schließen', 'Fermer', 'Chiudi'],
  ['Editar', 'Edit', 'Bearbeiten', 'Modifier', 'Modifica'], ['Eliminar', 'Delete', 'Löschen', 'Supprimer', 'Elimina'], ['Buscar', 'Search', 'Suchen', 'Rechercher', 'Cerca'],
  ['Añadir', 'Add', 'Hinzufügen', 'Ajouter', 'Aggiungi'], ['Volver', 'Back', 'Zurück', 'Retour', 'Indietro'], ['Hoy', 'Today', 'Heute', 'Aujourd’hui', 'Oggi'],
  ['Día', 'Day', 'Tag', 'Jour', 'Giorno'], ['Semana', 'Week', 'Woche', 'Semaine', 'Settimana'], ['Mes', 'Month', 'Monat', 'Mois', 'Mese'], ['Equipo', 'Team', 'Team', 'Équipe', 'Team'],
  ['Aceptar', 'OK', 'OK', 'OK', 'OK'], ['Borrar', 'Clear', 'Leeren', 'Effacer', 'Cancella'], ['Sí', 'Yes', 'Ja', 'Oui', 'Sì'], ['No', 'No', 'Nein', 'Non', 'No'],
  ['Entrar', 'Sign in', 'Anmelden', 'Se connecter', 'Accedi'], ['Correo', 'Email', 'E-Mail', 'E-mail', 'Email'], ['Contraseña', 'Password', 'Passwort', 'Mot de passe', 'Password'],
  ['He olvidado la contraseña', 'I forgot my password', 'Passwort vergessen', 'Mot de passe oublié', 'Ho dimenticato la password'], ['Bienvenido', 'Welcome', 'Willkommen', 'Bienvenue', 'Benvenuto'],
  ['Buscar médico, centro o municipio', 'Search doctor, centre or town', 'Arzt, Zentrum oder Ort suchen', 'Rechercher médecin, centre ou ville', 'Cerca medico, centro o comune'], ['Buscar profesional, centro o municipio', 'Search professional, centre or town', 'Fachkraft, Zentrum oder Ort suchen', 'Rechercher professionnel, centre ou ville', 'Cerca professionista, centro o comune'], ['Profesionales', 'Professionals', 'Fachkräfte', 'Professionnels', 'Professionisti'], ['Buscar profesional, centro o municipio', 'Search professional, centre or town', 'Fachkraft, Zentrum oder Ort suchen', 'Rechercher professionnel, centre ou ville', 'Cerca professionista, centro o comune'], ['Profesionales', 'Professionals', 'Fachkräfte', 'Professionnels', 'Professionisti'], ['Buscar profesional, centro o municipio', 'Search professional, centre or town', 'Fachkraft, Zentrum oder Ort suchen', 'Rechercher professionnel, centre ou ville', 'Cerca professionista, centro o comune'], ['Profesionales', 'Professionals', 'Fachkräfte', 'Professionnels', 'Professionisti'],
  ['Tu día', 'Your day', 'Dein Tag', 'Votre journée', 'La tua giornata'], ['Alertas', 'Alerts', 'Warnungen', 'Alertes', 'Avvisi'], ['Mi semana', 'My week', 'Meine Woche', 'Ma semaine', 'La mia settimana'],
  ['Ventas del mes', 'Sales this month', 'Umsatz des Monats', 'Ventes du mois', 'Vendite del mese'], ['Operativa de pedidos', 'Order operations', 'Bestellabwicklung', 'Suivi des commandes', 'Gestione ordini'],
  ['Notificaciones', 'Notifications', 'Benachrichtigungen', 'Notifications', 'Notifiche'], ['Idioma', 'Language', 'Sprache', 'Langue', 'Lingua'],
  ['Tu cuenta', 'Your account', 'Dein Konto', 'Votre compte', 'Il tuo account'], ['Mi perfil', 'My profile', 'Mein Profil', 'Mon profil', 'Il mio profilo'],
  ['Rutas y desplazamientos', 'Routes and travel', 'Routen und Fahrten', 'Itinéraires et déplacements', 'Percorsi e spostamenti'], ['Horario de las rutas', 'Route schedule', 'Routenzeiten', 'Horaires des itinéraires', 'Orari dei percorsi'],
  ['Indicadores de Inicio', 'Home indicators', 'Start-Kennzahlen', 'Indicateurs d’accueil', 'Indicatori della home'], ['Mensajes', 'Messages', 'Nachrichten', 'Messages', 'Messaggi'],
  ['Base de datos', 'Database', 'Datenbank', 'Base de données', 'Database'], ['Clasificadores', 'Lists', 'Listen', 'Listes', 'Elenchi'], ['Equipo y cartera', 'Team and portfolio', 'Team und Portfolio', 'Équipe et portefeuille', 'Team e portafoglio'],
  ['Usuarios y permisos', 'Users and permissions', 'Benutzer und Rechte', 'Utilisateurs et droits', 'Utenti e permessi'], ['Roles y permisos', 'Roles and permissions', 'Rollen und Rechte', 'Rôles et droits', 'Ruoli e permessi'],
  ['Reglas de cartera', 'Portfolio rules', 'Portfolio-Regeln', 'Règles de portefeuille', 'Regole del portafoglio'], ['Frecuencia de visita', 'Visit frequency', 'Besuchshäufigkeit', 'Fréquence des visites', 'Frequenza delle visite'],
  ['Comisiones', 'Commissions', 'Provisionen', 'Commissions', 'Provvigioni'], ['Accesos', 'Sign-ins', 'Anmeldungen', 'Connexions', 'Accessi'], ['Auditoría', 'Audit log', 'Protokoll', 'Journal d’audit', 'Registro attività'],
  ['Stock', 'Stock', 'Bestand', 'Stock', 'Magazzino'], ['Almacenes', 'Warehouses', 'Lager', 'Entrepôts', 'Magazzini'], ['Material de visita', 'Visit materials', 'Besuchsmaterial', 'Matériel de visite', 'Materiale di visita'],
  ['Datos fiscales', 'Tax details', 'Steuerdaten', 'Données fiscales', 'Dati fiscali'], ['Series y numeración', 'Series and numbering', 'Serien und Nummerierung', 'Séries et numérotation', 'Serie e numerazione'],
  ['Empresa', 'Company', 'Unternehmen', 'Entreprise', 'Azienda'], ['Marca y logo', 'Brand and logo', 'Marke und Logo', 'Marque et logo', 'Marchio e logo'], ['Plan y suscripción', 'Plan and subscription', 'Tarif und Abo', 'Offre et abonnement', 'Piano e abbonamento'],
  ['Mis datos', 'My details', 'Meine Daten', 'Mes données', 'I miei dati'], ['Nombre visible', 'Display name', 'Anzeigename', 'Nom affiché', 'Nome visualizzato'], ['Teléfono', 'Phone', 'Telefon', 'Téléphone', 'Telefono'],
  ['Al entrar, abrir', 'Open on sign-in', 'Beim Start öffnen', 'Ouvrir à la connexion', 'Apri all’accesso'], ['Nueva contraseña', 'New password', 'Neues Passwort', 'Nouveau mot de passe', 'Nuova password'],
  ['Repítela', 'Repeat it', 'Wiederholen', 'Répétez-le', 'Ripetila'], ['Punto de salida', 'Starting point', 'Startpunkt', 'Point de départ', 'Punto di partenza'], ['Punto de llegada', 'End point', 'Zielpunkt', 'Point d’arrivée', 'Punto di arrivo'],
  ['Navegación', 'Navigation', 'Navigation', 'Navigation', 'Navigazione'], ['Nombre', 'Name', 'Name', 'Nom', 'Nome'], ['Dirección', 'Address', 'Adresse', 'Adresse', 'Indirizzo'],
  ['Buscar dirección', 'Find address', 'Adresse suchen', 'Chercher l’adresse', 'Cerca indirizzo'], ['Usar mi ubicación', 'Use my location', 'Meinen Standort verwenden', 'Utiliser ma position', 'Usa la mia posizione'],
  ['Guardar preferencias', 'Save preferences', 'Einstellungen speichern', 'Enregistrer', 'Salva preferenze'], ['Nuevo usuario', 'New user', 'Neuer Benutzer', 'Nouvel utilisateur', 'Nuovo utente'],
  ['+ Nuevo usuario', '+ New user', '+ Neuer Benutzer', '+ Nouvel utilisateur', '+ Nuovo utente'], ['+ Nueva cita', '+ New appointment', '+ Neuer Termin', '+ Nouveau rendez-vous', '+ Nuovo appuntamento'],
  ['+ Nuevo pedido', '+ New order', '+ Neue Bestellung', '+ Nouvelle commande', '+ Nuovo ordine'], ['+ Nuevo cliente', '+ New customer', '+ Neuer Kunde', '+ Nouveau client', '+ Nuovo cliente'],
  ['Registrar visita', 'Log visit', 'Besuch erfassen', 'Enregistrer la visite', 'Registra visita'], ['Editar ficha', 'Edit record', 'Datensatz bearbeiten', 'Modifier la fiche', 'Modifica scheda'],
  ['Marcar urgente', 'Mark urgent', 'Als dringend markieren', 'Marquer urgent', 'Segna urgente'], ['+ Añadir a mi agenda', '+ Add to my calendar', '+ Zu meinem Kalender', '+ Ajouter à mon agenda', '+ Aggiungi alla mia agenda'],
  ['Estado', 'Status', 'Status', 'Statut', 'Stato'], ['Visitas', 'Visits', 'Besuche', 'Visites', 'Visite'], ['Comercial asignado', 'Assigned rep', 'Zuständiger Vertreter', 'Commercial assigné', 'Agente assegnato'],
  ['Unidades pautadas', 'Units prescribed', 'Verordnete Einheiten', 'Unités prescrites', 'Unità prescritte'], ['Unidades atribuidas', 'Attributed units', 'Zugeordnete Einheiten', 'Unités attribuées', 'Unità attribuite'], ['Unidades atribuidas', 'Attributed units', 'Zugeordnete Einheiten', 'Unités attribuées', 'Unità attribuite'], ['Unidades atribuidas', 'Attributed units', 'Zugeordnete Einheiten', 'Unités attribuées', 'Unità attribuite'], ['Empezar jornada', 'Start day', 'Tag beginnen', 'Commencer la journée', 'Inizia la giornata'],
  ['Ordenar por cercanía', 'Sort by distance', 'Nach Entfernung sortieren', 'Trier par proximité', 'Ordina per vicinanza'], ['Ventas', 'Sales', 'Verkäufe', 'Ventes', 'Vendite'],
  ['Compras', 'Purchases', 'Einkäufe', 'Achats', 'Acquisti'], ['Proveedores', 'Suppliers', 'Lieferanten', 'Fournisseurs', 'Fornitori'], ['Llamadas', 'Calls', 'Anrufe', 'Appels', 'Chiamate'], ['Oportunidades', 'Opportunities', 'Verkaufschancen', 'Opportunités', 'Opportunità'], ['+ Nueva venta', '+ New sale', '+ Neuer Verkauf', '+ Nouvelle vente', '+ Nuova vendita'],
  ['Resumen', 'Summary', 'Übersicht', 'Résumé', 'Riepilogo'], ['Explorar', 'Explore', 'Erkunden', 'Explorer', 'Esplora'], ['Facturas', 'Invoices', 'Rechnungen', 'Factures', 'Fatture'],
  ['Mis rutas', 'My routes', 'Meine Routen', 'Mes itinéraires', 'I miei percorsi'], ['Propuestas automáticas', 'Suggested routes', 'Vorgeschlagene Routen', 'Itinéraires proposés', 'Percorsi suggeriti'],
  ['Todos los módulos', 'All modules', 'Alle Module', 'Tous les modules', 'Tutti i moduli'], ['Gira el móvil', 'Rotate your phone', 'Handy drehen', 'Tournez votre téléphone', 'Ruota il telefono'],
  ['Estás al día', 'You’re all caught up', 'Alles erledigt', 'Vous êtes à jour', 'Sei aggiornato'], ['Marcar todas como leídas', 'Mark all as read', 'Alle als gelesen markieren', 'Tout marquer comme lu', 'Segna tutte come lette'],
  ['citas de hoy visitadas', 'today’s visits done', 'heutige Besuche erledigt', 'visites du jour faites', 'visite di oggi fatte'], ['urgentes sin visitar', 'urgent, not visited', 'dringend, nicht besucht', 'urgents non visités', 'urgenti non visitati'],
  ['visitas esta semana', 'visits this week', 'Besuche diese Woche', 'visites cette semaine', 'visite questa settimana'], ['visitas este mes', 'visits this month', 'Besuche diesen Monat', 'visites ce mois-ci', 'visite questo mese'],
  ['médicos interesados', 'interested doctors', 'interessierte Ärzte', 'médecins intéressés', 'medici interessati'], ['sin contactar', 'not contacted', 'nicht kontaktiert', 'non contactés', 'non contattati'],
  ['médicos en tu cartera', 'doctors in your portfolio', 'Ärzte in deinem Portfolio', 'médecins de votre portefeuille', 'medici nel tuo portafoglio'], ['pendientes de unificar', 'pending merge', 'zusammenzuführen', 'à fusionner', 'da unire']
];
let IDIOMA = 'es', MAPA_I18N = null;
const SALUDOS = { en: ['Good morning', 'Good afternoon', 'Good evening'], de: ['Guten Morgen', 'Guten Tag', 'Guten Abend'], fr: ['Bonjour', 'Bon après-midi', 'Bonsoir'], it: ['Buongiorno', 'Buon pomeriggio', 'Buonasera'] };
let TR_PEND = new Set(), TR_RAF = 0;
new MutationObserver(ms => {
  if (!MAPA_I18N) return;
  ms.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1) TR_PEND.add(n); else if (n.nodeType === 3 && n.parentElement) TR_PEND.add(n.parentElement); }));
  if (TR_RAF) return;
  TR_RAF = 1; queueMicrotask(() => { TR_RAF = 0; const l = [...TR_PEND]; TR_PEND.clear(); l.forEach(n => n.isConnected && traducir(n)); });
}).observe(document.body, { childList: true, subtree: true });
// Fechas en el idioma elegido
fechaLarga = (orig => function (d) { return IDIOMA === 'es' ? orig(d) : new Date(d).toLocaleDateString(LOCALES[IDIOMA], { weekday: 'long', day: 'numeric', month: 'long' }); })(fechaLarga);
prepararIdioma((() => { try { return localStorage.getItem('app-idioma') || 'es'; } catch (e) { return 'es'; } })());
if (MAPA_I18N) traducir(document.body);
// Selector de idioma en Mi perfil


