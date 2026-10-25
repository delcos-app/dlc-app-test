// pantallas/configuracion.js · Configuración está en src/app (pantallas en src/app/screens/settings, el núcleo de ajustes en
// src/app/core/settings; v2.415.0–v2.428.0). Aquí solo queda el estado compartido que otras partes leen o cambian por su nombre y
// los adaptadores de una línea. Normas: docs/normas_codigo.md.

// ---------- Estado compartido (lo leen o lo cambian otras partes y las pruebas por su nombre) ----------
const ROLKEY = window.delcos.settingsCore.ROLES_KEY;
let ROLES_DEF = [];   // legado 001 la rellena con la copia del dispositivo; cargarRoles con la de la base
let AJUSTES = {};
let ABRIR_PLAN_SEMANA = false;
let LOGO_DATA = null;
let PANEL_ACTIVO = null;
let NOTIF_N = 0;
let CFG_SUB = null;
let CFG_DETALLE = false;
let CFU_RAF = 0;
let TX_OBS = 0;
const CAMPOS = { medico: [], cliente: [], producto: [], pedido: [] };
const PUESTA_EN_MARCHA = 490;
const CFG_DE_MODULO = { agenda: 'horario', rutas: 'horario', admin: 'usuarios', facturacion: 'fiscal', inicio: 'kpis', config: 'prefs', directorio: 'cat', ventas: 'cat', permisos: 'usuarios', medico: 'usuarios', roles: 'usuarios' };
const CFG_ADMIN = { usuarios: 'usuarios', comisiones: 'comis', accesos: 'accesos', auditoria: 'auditoria' };
// Nombres anteriores de cada apartado → dónde está ahora
const CFG_ANTES = { prefs: ['perfil'], horario: ['rutas', 'horario'], kpis: ['inicio', 'kpis'], usuarios: ['equipo', 'usuarios'],
  roles: ['equipo', 'roles'], reglas: ['cartera', 'reglas'], frec: ['cartera', 'frec'], accesos: ['seguridad', 'accesos'], auditoria: ['seguridad', 'auditoria'],
  alm: ['stock', 'alm'], mues: ['stock', 'mues'], fiscal: ['fact', 'fiscal'], series: ['fact', 'series'], vf: ['fact', 'vf'] };
const CFG_PULIR = ['datos', 'rutas.salida', 'rutas.horario', 'inicio.kpis', 'o.marca', 'o.correo', 'o.plan', 'o.copias'];
// Listas con textos: son los mismos objetos que src/app/core/settings/constants.ts (legado 080 añade Concursos y Parque a las de avisos)
const NOMBRES_DETALLE = window.delcos.settingsCore.DETAIL_NAMES;
const MOTIVO_REFRESCO = window.delcos.settingsCore.REFRESH_REASONS;
const NOTIF_AREAS = window.delcos.settingsCore.NOTIFICATION_AREAS;
const NOTIF_DIARIOS = window.delcos.settingsCore.DAILY_NOTIFICATIONS;
const PRESU_NECESITA = window.delcos.settingsCore.QUOTE_NEEDS;
const PRESU_CUANDO = window.delcos.settingsCore.QUOTE_WHEN;
const PRESU_ESTADO = window.delcos.settingsCore.QUOTE_STATES;
const CFG_CLAVES = window.delcos.settingsCore.SEARCH_WORDS;

const marca = paso => console.info(`[App] ${paso} · ${Math.round(performance.now() - T0)} ms`);

// ---------- Adaptadores: src/app/core/settings (v2.428.0). Los usan otras pantallas, los puentes, legado y las pruebas ----------
function cargarAjustes() { return window.delcos.settingsCore.loadSettings(); }
function cargarCatalogos() { return window.delcos.settingsCore.loadCatalogs(); }
function cargarRoles() { return window.delcos.settingsCore.loadRoles(); }
function aplicarMarca() { return window.delcos.settingsCore.applyBrand(); }
function logoData() { return window.delcos.settingsCore.invoiceLogo(); }
function arbolConfig() { return window.delcos.settingsCore.settingsTree(); }
function rolDef(r) { return window.delcos.settingsCore.roleDefinition(r); }
function rolPuede(r, c) { return window.delcos.settingsCore.roleCan(r, c); }
function rolesNombres() { return window.delcos.settingsCore.roleNames(); }
function rolCon(c) { return window.delcos.settingsCore.roleWith(c); }
function rolPorDefecto() { return window.delcos.settingsCore.defaultRole(); }
function plantillaRol(r) { return window.delcos.settingsCore.roleTemplate(r); }
function marcarCache(t) { return window.delcos.settingsCore.markModuleCache(t); }
function nombreEnTextos(raiz) { return window.delcos.settingsCore.nameInTexts(raiz); }
function menuMarcarPie() { return window.delcos.settingsCore.markMenuFooter(); }
function colocarIndPruebas() { return window.delcos.settingsCore.placeTestBadge(); }
function rpPlanDe(i) { return window.delcos.settingsCore.proposalPlan(i); }
function txTexto(b) { return window.delcos.settingsCore.menuLabelText(b); }
function salidaUsuario() { return window.delcos.settingsCore.userStart(); }
function clasCampos(amb) { return window.delcos.settingsCore.sortedFields(amb); }
function precioPlan(p) { return window.delcos.settingsCore.planPrice(p); }
function usuariosContratados() { return window.delcos.settingsCore.contractedUsers(); }
function deshacible(a) { return window.delcos.settingsCore.isUndoable(a); }
function notifArea(t) { return window.delcos.settingsCore.notificationArea(t); }
function notifIco(t) { return window.delcos.settingsCore.notificationIcon(t); }
// La tarjeta del plan de ruta y su ventana de tiempos (legado 061 y pantallas/cuentas.js las envuelven)
function pintarPlanBase2() { return window.delcos.settingsCore.paintPlanCard(); }
function abrirHorarioPlanBase() { return window.delcos.settingsCore.openPlanTimesWindow(); }
// Filtros generados de los campos propios: ahora los pinta el panel «Filtros y columnas» (se queda vacío)
function camposFiltros() { return ''; }

// Preferencias, Clasificadores, Auditoría, Registro, campos personalizados y entorno de pruebas están en src/app/screens/settings
// (v2.415.0). Estos nombres se quedan: las secciones de Configuración, Facturación, Pedidos, Productos, Clientes, la ficha, el Panel
// delcos, legado 002, 004, 014, 073 y 148 y las pruebas los usan.
function pintarPrefs() { return window.delcos.screens.settings.paintPreferences(); }
function pintarPrefsPaso2() { return window.delcos.screens.settings.paintProfile(); }
function pintarCatalogos() { return window.delcos.screens.settings.paintClassifiers(); }
function pintarAuditoria() { return window.delcos.screens.settings.paintAudit(); }
function pintarRegistro() { return window.delcos.screens.settings.paintBillingLog(); }
function cargarCampos() { return window.delcos.screens.settings.loadCustomFields(); }
function camposHTML(amb, valores) { return window.delcos.screens.settings.customFieldsHtml(amb, valores); }
function camposLeer(raiz) { return window.delcos.screens.settings.readCustomFields(raiz); }
function camposGuardar(leido, id) { return window.delcos.screens.settings.saveCustomFields(leido, id); }
function camposInsertar(raiz, amb, id, antesDe) { return window.delcos.screens.settings.insertCustomFields(raiz, amb, id, antesDe); }
function camposFiltrosActivar(zona, estado, alCambiar) { return window.delcos.screens.settings.bindCustomFieldFilters(zona, estado, alCambiar); }
function bloqueCampos(tabla, id, cont) { return window.delcos.screens.settings.paintCustomFieldsBlock(tabla, id, cont); }
function estadoRefresco() { return window.delcos.screens.settings.refreshStatus(); }
function pintarCfgPruebas() { return window.delcos.screens.settings.paintTestEnvironment(); }

// Configuración, segunda parte: está en src/app/screens/settings/more (v2.415.0). Estos nombres se quedan: el resto de
// Configuración, las pestañas de las páginas, los puentes, Productos, Eventos y las pruebas los usan.
function editorReglasCartera() { return window.delcos.screens.settingsMore.editPortfolioRules(); }
function pintarCopias() { return window.delcos.screens.settingsMore.paintBackups(); }
function deshacerUno(id, despues) { return window.delcos.screens.settingsMore.undoChange(id, despues); }
function cajaDeshacerPersona(caja, usuario, desde, nombre, despues) { if (caja) window.delcos.screens.settingsMore.paintPersonUndo({ box: caja, user: usuario, from: desde, name: nombre, then: despues }); }
function pintarEstadosPapel() { return window.delcos.screens.settingsMore.paintCommercialStates(); }
function matMejorar() { return window.delcos.screens.settingsMore.improveMaterial(); }
function conexionTxt(a, largo) { return window.delcos.screens.settingsMore.connectionText(a, !!largo); }
function pintarAccesos() { return window.delcos.screens.settingsMore.paintAccesses(); }
function facccon(uid) { return window.delcos.screens.settingsMore.fillConnection(uid); }
function textoValor(v) { return window.delcos.screens.settingsMore.valueText(v); }
function resumenDetalle(d) { return window.delcos.screens.settingsMore.detailSummary(d); }
function abrirClasificador(id) { return window.delcos.screens.settingsMore.openClassifier(id); }
function decorarResultados() { return window.delcos.screens.settingsMore.decorateResults(); }
function pintarRoles() { return window.delcos.screens.settingsMore.paintRoles(); }
function pintarMarca() { return window.delcos.screens.settingsMore.paintBrand(); }

// Correo y firma, notificaciones y textos personalizados están en src/app/screens/settings (v2.417.0). Estos nombres se quedan:
// el árbol de Configuración, la campana, Pedidos, Facturación, servicios/pdf.js, el menú y las pruebas los usan.
function pintarCorreo() { return window.delcos.screens.settingsExtra.paintEmail(); }
function varsCorreo(o) { return window.delcos.screens.settingsExtra.emailVariables(o || {}); }
function plantillaCorreo(k, campo, v) { return window.delcos.screens.settingsExtra.fillTemplate(k, campo, v); }
function listaCorreos() { return window.delcos.screens.settingsExtra.templateList(); }
function plantillasCorreo(uso) { return window.delcos.screens.settingsExtra.templatesFor(uso); }
function guardarCorreos(lista) { return window.delcos.screens.settingsExtra.saveTemplates(lista); }
function elegirPlantillaCorreo(uso) { return window.delcos.screens.settingsExtra.chooseTemplate(uso); }
function idPlant() { return window.delcos.screens.settingsExtra.newTemplateId(); }
function panelNotificaciones(l) { return window.delcos.screens.settingsExtra.showNotifications(l); }
function pintarNotif() { return window.delcos.screens.settingsExtra.paintNotificationSettings(); }
function notifModo(k) { return window.delcos.screens.settingsExtra.notificationMode(k); }
function guardarPrefsAvisos(avisos) { return window.delcos.screens.settingsExtra.saveOrderAlerts(avisos); }
function pintarTextos() { return window.delcos.screens.settingsExtra.paintMenuNames(); }

// Usuarios, Mi perfil y «Plan y suscripción» están en src/app/screens/settings (v2.420.0). Estos nombres se quedan: el árbol de
// Configuración, las páginas «perfil» y «plan», legado 004/007/052/076, la ficha, Panel delcos y las pruebas los usan.
function editarUsuario(id) { return window.delcos.screens.settingsRest.editUser(id); }
function nuevoUsuario(pre) { return window.delcos.screens.settingsRest.newUser(pre && pre.medico ? pre : null); }
function pintarUsuarios2() { return window.delcos.screens.settingsRest.paintUsers(); }
function detalleUsuario(u) { return window.delcos.screens.settingsRest.showUser(u); }
function asegurarUsuario(id) { return window.delcos.screens.settingsRest.ensureUser(id); }
function guardarKpis(lista) { return window.delcos.screens.settingsRest.saveIndicators(lista); }
function pintarPrefsParte(parte) { return window.delcos.screens.settingsRest.paintPreferencesPart(parte); }
function pintarPerfil() { return window.delcos.screens.settingsRest.paintMyProfile(); }
function perdidasPlan(de, a, datos) { return window.delcos.screens.settingsRest.planLosses(de, a, datos || null); }
function reciboCalculado(pl) { return window.delcos.screens.settingsRest.receiptOf(pl); }
function pintarPaginaPlanBase10() { return window.delcos.screens.settingsRest.paintPlanPage(); }

// La carcasa de Configuración está en src/app/screens/settings/shell (v2.422.0). Estos nombres se quedan: el mapa de pantallas
// (legado 001), Guardar página, legado 004/044/080/081/157/161, la navegación, los puentes y las pruebas los usan.
function cargarConfig() { return window.delcos.screens.settingsShell.loadSettingsPage(); }
function cfgMovil() { return window.delcos.screens.settingsShell.mobileLayout(); }
function cfuAjustarIndice() { return window.delcos.screens.settingsShell.fitIndex(); }
function cfgSecDespertar(sec) { return window.delcos.screens.settingsShell.wakeSection(sec); }
function cfgClonarEstilos() { return window.delcos.screens.settingsShell.copyPartStyles(); }
function pagMarcarSucio() { return window.delcos.screens.settingsShell.markUnsaved(); }
function claveCfgVieja(sec, sub) { return window.delcos.screens.settingsShell.oldSettingsKey(sec, sub); }
function marcarPedsec() { return window.delcos.screens.settingsShell.markOrderSection(); }
function marcarFacPlan() { return window.delcos.screens.settingsShell.markBillingPlan(); }
function marcarPanel() { return window.delcos.screens.settingsShell.markPlatformPanel(); }
