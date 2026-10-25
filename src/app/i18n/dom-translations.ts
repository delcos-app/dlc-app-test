/**
 * Translations of the screen texts written in Spanish (castellano, English, Deutsch, Français, Italiano), used when a person chooses
 * another language: core/language.ts translates the page with this table. Moved from the legacy nucleo/idioma.js (v2.425.0).
 */

/** [id, name] of each language, Spanish first. */
export const LANGUAGES: readonly (readonly [string, string])[] = [['es', 'Castellano'], ['en', 'English'], ['de', 'Deutsch'], ['fr', 'Français'], ['it', 'Italiano']];

/** Browser locale of each language. */
export const LOCALES: Readonly<Record<string, string>> = { es: 'es-ES', en: 'en-GB', de: 'de-DE', fr: 'fr-FR', it: 'it-IT' };

/** [castellano, English, Deutsch, Français, Italiano]. */
/** Named I18N like the legacy table: the vocabulary check (qa_literales) treats it as translation data, not as texts. */
export const I18N: readonly (readonly string[])[] = [
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
