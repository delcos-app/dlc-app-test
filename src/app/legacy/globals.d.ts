/**
 * Legacy globals (src/legado and the files moved out of it) that the new code still uses while screens migrate.
 * This is the ONLY place where new code learns about legacy names: when a piece is migrated, its line goes away from here.
 * Everything here is reached through src/app/legacy/bridge.ts, never directly from a screen.
 */
interface LegacyResult<T> { data: T | null; error: unknown }
interface LegacyQuery<T> extends PromiseLike<LegacyResult<T>> {
  select(columns: string): LegacyQuery<T>;
  eq(column: string, value: unknown): LegacyQuery<T>;
  update(values: Record<string, unknown>): LegacyQuery<T>;
  limit(count: number): LegacyQuery<T>;
  insert(values: Record<string, unknown>): LegacyQuery<T>;
  delete(): LegacyQuery<T>;
  in(column: string, values: readonly unknown[]): LegacyQuery<T>;
  or(filter: string): LegacyQuery<T>;
  order(column: string, options?: { ascending?: boolean }): LegacyQuery<T>;
  maybeSingle(): LegacyQuery<T>;
  is(column: string, value: unknown): LegacyQuery<T>;
}
interface LegacyDb {
  rpc<T>(name: string, params?: Record<string, unknown>): PromiseLike<LegacyResult<T>>;
  from<T>(table: string): LegacyQuery<T>;
}

declare const db: LegacyDb;
declare function RPC_ORIG<T>(name: string, params: Record<string, unknown>): PromiseLike<LegacyResult<T>>;
declare let TAB: string;
declare let PEDSEC: string;
declare let KV_INI: HomePanel | null;
declare let KV_GRAF: HomeCharts | null;
declare const CITA_ABIERTA: readonly string[];
declare const ICON_NOM: Readonly<Record<string, string>>;
declare function ir(screen: string): unknown;
declare function TT(term: string, number?: string, article?: string, caseStyle?: string, capital?: string, adjective?: string): string;
declare function verArea(area: string): boolean;
declare function verImportes(): boolean;
declare function VE_TODO(): boolean;
declare function nivelDe2(letter: string): number;
declare function ES_MEDICO(): boolean;
declare function citaAnulada(state: string): boolean;
declare function citasDelDia(date: string): Promise<{ estado: string; hora?: string | null; medico?: string; nombre?: string }[]>;
declare function svgIco(inner: string): string;
declare function plYaContado(key: string, values: readonly string[]): boolean;
declare function hayOportunidades(): boolean;
declare function puedeDuplicados(): boolean;
declare function inicioQuitarAntiguo(): void;
declare function inicioCabecera(): void;
declare function pintarInicioBase2(): Promise<void>;

// ---- Navigation (src/app/core/navigation): state and helpers the navigation steps still read or change
type PageTab = Record<string, string | undefined>;
declare const VUELTA: unknown[];
declare let VISTA: unknown;
declare const PL: Readonly<Record<string, unknown>>;
declare let MANUAL_VUELTA: { tab: string; y: number } | null;
declare let CFG_SEC: string | null;
declare let CFG_SUB: string | null;
declare let CFG_KEY: string;
declare let CFG_DETALLE: boolean;
declare let PAG_TAB: PageTab;
declare let IR_DESDE_MENU_CFG: boolean;
declare let IR_DESDE_MENU: boolean;
declare const PANEL_SECCIONES: readonly (readonly string[])[];
declare let MODO_PLATAFORMA: boolean;
declare let PAGO_IR_PLAN: boolean;
declare const PLAN_SECCIONES: Readonly<Record<string, readonly string[]>>;
declare let PERFIL: unknown;
declare let AG_MODO: string;
declare let AG_FECHA: string | null;
declare const ALIAS_PEDIDOS: Readonly<Record<string, string>>;
declare const ORG_DESDE: Readonly<Record<string, string>>;
declare const PAGINAS: Readonly<Record<string, unknown>>;
declare let FAC_ULTIMA: string | null;
declare let FSEC: string;
declare let PEND: number;
declare let VIA_IR: string | null;
declare function irBase(screen: string): void;
declare function cometa(): void;
declare function plVigilar(screen: string): void;
declare function aplicarNombresMenu(): void;
declare function claveCfgVieja(section: string | null, subsection: string | null): string;
declare function marcarPanel(): void;
declare function ponerAyudaManual(): void;
declare function aplicarEtiqueta(): void;
declare function pagoAlPlan(): void;
declare function puedeOrganizacion(): boolean;
declare function planIncluyeSeccion(section: string): boolean;
declare function avisoPlan(section: string): void;
declare function hoyISO(): string;
declare function marcarPedsec(): void;
declare function menuMarcarPie(): void;
declare function puede(capability: string): boolean;
declare function cerrarEncajadas(): void;
declare function revelar(section: HTMLElement, maxMs: number, since: number): void;
declare function cargarPagina(screen: string): void;

// ---- Home indicators (src/app/screens/home/indicators): the indicator catalog is shared with Configuración (not migrated yet)
interface KpiDefinition {
  readonly id: string;
  readonly t: string;
  readonly v: (kpis: Record<string, number>) => unknown;
  readonly cls?: (kpis: Record<string, number>) => string;
  readonly h?: string;
  readonly admin?: boolean;
}
interface KpiSetting { readonly id: string; readonly on: boolean; readonly t?: string; readonly filtro?: Record<string, unknown> }
interface HomePanel {
  kpis?: Record<string, number>;
  agenda_hoy?: { estado: string; hora?: string | null; nombre: string }[];
}
interface HomeCharts {
  por_dia?: { fecha: string; n: number }[];
  estados?: { valor: string; n: number }[];
  proximos?: { fecha: string; n: number }[];
}
declare const KPI_CAT: readonly KpiDefinition[];
declare const AYUDA_KPI: Readonly<Record<string, string>>;
declare const KPI_ICO: Readonly<Record<string, string>>;
declare const KPI_TXT: Readonly<Record<string, string>>;
declare let ESTADOS_DEF: readonly { valor: string; papel: string }[];
declare const EST_COL: Readonly<Record<string, string>>;
declare function kpiConfig(): readonly KpiSetting[];
declare function kpiPermitido(definition: KpiDefinition | undefined): boolean;
declare function textoFiltro(filter: Record<string, unknown>): string;
declare function contarFiltro(filter: Record<string, unknown>): Promise<number>;
declare function rpcCache<T>(name: string, params: Record<string, unknown>, key: string): Promise<{ data: T | null; cache?: boolean; fecha?: string }>;
declare function marca(step: string): void;
declare function avisoCache(element: HTMLElement, date: string | undefined): void;
declare function ponerAyudas(): void;
declare function ES_MOVIL(): boolean;

interface AgendaMetrics {
  hoy?: { visitadas?: number | null; citas?: number | null };
  semana?: { visitas?: number | null; media?: number | null };
  cierres?: { hoy?: number | null; media_dia?: number | null };
  pendientes?: { urgentes?: number | null; sin_visita?: number | null };
  media_dia?: number | null;
}
declare let AG_MET: AgendaMetrics | null;
declare let AG_VISTA: { id: string; nombre: string } | null;
interface AgendaAppointment { id: string; cuenta_id?: string; estado: string; lat?: number | string | null; lon?: number | string | null; centro_nombre?: string | null }
declare let TD_CITAS: AgendaAppointment[];
declare let TD_ULTIMO: { fecha: string; data?: AgendaAppointment[] } | null;
declare function agUsuarioFiltro(): string | null;
declare function agVerDia(isoDate: string): Promise<void>;
declare function agN(): boolean;

interface SameCentrePerson { id: string; nombre: string; visitar?: string | null; falta?: string[] | null; dias?: Record<string, string | null> | null }
interface SameCentreGroup { centro_id?: string | null; centro_nombre?: string | null; lat?: number | null; lon?: number | null; cuentas?: SameCentrePerson[]; medicos?: SameCentrePerson[] }
interface DueAccount { id?: string; cuenta_id?: string; nombre: string; estado_comercial?: string | null; dias_sin_visita?: number | null; municipio?: string | null; lat?: number | null; lon?: number | null }
interface PendingAppointment { id: string; nombre: string; fecha: string; centro_nombre?: string | null }
declare let AG_SUG: { fecha: string; toca: DueAccount[]; centros: SameCentreGroup[] } | null;
declare let AG_PEND: PendingAppointment[] | null;
declare let HERR_CTX: string | null;
declare function abrirFicha(id: string): Promise<void>;
declare function fichaCentro(id: string): Promise<void>;
declare function nuevaCita(accountId: string, isoDate: string | null): Promise<void>;
declare function planDesdeLista(list: readonly DueAccount[], name: string, button: HTMLElement): Promise<void>;
declare function reprogramarCitas(list: readonly PendingAppointment[], title: string, text: string): Promise<void>;
interface RangeAppointment { fecha: string; estado: string; usuario_id?: string; hora?: string | null; medico?: string | null; nombre?: string | null }
declare function agBloqueos(fromIsoDate: string, days: number): Promise<Record<string, string>>;
declare function menuDiaSemana(button: HTMLElement, isoDate: string, blocked: boolean): Promise<void>;
declare let TD_PRESET: { fecha: string; data?: AgendaAppointment[] } | null;
declare let CINTA_INI: string | null;
declare function agUid(): string;
declare function tareasDelDia(isoDate: string): Promise<unknown>;
declare function bloqueadosSemanaBase(fromIsoDate: string, toIsoDate: string): Promise<Record<string, string>>;
declare let AG_SEM_ABIERTA: boolean;
declare let AG_HOY_VISTO: string | null;
declare let TAREAS_DIA: { f: string; l: (DayTask & { orden?: number })[] } | null;
declare let ABRIR_PLAN_SEMANA: boolean;
declare let COMS: { id: string; nombre: string }[];
declare function pintarTuDia(): Promise<void>;
declare function pintarEquipo(): Promise<void>;
declare function cargarComerciales(): Promise<void>;
declare function avisoSinSalida(element: HTMLElement | null): void;
declare function verAgendaDe(userId: string): Promise<void>;
interface WeekAppointment extends RangeAppointment { id: string; cuenta_id: string; usuario?: string | null; dias?: Record<string, string | null> | null }
interface WeekDraftItem { m: { nombre: string; municipio?: string | null }; ini?: number | null; cita?: Record<string, unknown>; motivo?: string }
interface WeekDraft { semana: string; uid: string; total: number; dias: Record<string, WeekDraftItem[]>; sinDia: WeekDraftItem[]; horario?: Record<string, unknown> | null }
declare let SEM_BORRADOR: WeekDraft | null;
declare function estimarDia(appointments: readonly object[], isoDate: string): { fin: number; tope: number };
declare function planificarSemana(fromIsoDate: string, days: readonly string[], blocked: Record<string, string>, perDay: Record<string, WeekAppointment[]>): Promise<void>;
declare function guardarBorradorSemana(button: HTMLElement): Promise<void>;
declare function ventanasDe(days: Record<string, string | null> | null | undefined, isoDate: string): unknown[] | null;
declare function preguntar(message: string, options: { titulo?: string; ok?: string; peligro?: boolean }): Promise<boolean>;
declare function toast(message: string, isError?: boolean): void;
declare function iniciales(name: string): string;
declare function cargarAgenda(): Promise<void>;
interface DayAppointmentFull extends WeekAppointment {
  lat?: number | string | null; lon?: number | string | null; centro_nombre?: string | null;
  municipio?: string | null; clase?: string | null; urgente?: boolean | null; estado_comercial?: string | null; nota?: string | null;
  anterior?: { fecha: string; proxima_accion?: string | null } | null;
}
interface StopInfo { otroCentro?: string | null; aviso?: string | null; lejos?: number | null; llegada?: number | null; ventanas?: [number, number][] | null; espera?: number | null }
interface DayTask { id: string; titulo: string; nota?: string | null; hora?: string | null; hecha?: boolean | null }
declare let TD_INFO: Record<string, StopInfo>;
declare const ICO: Readonly<Record<string, string>>;
declare const ICU: Readonly<Record<string, string>>;
declare function SVA(path: string): string;
declare function plIco(...names: string[]): string;
declare function jornadaActiva(): { inicio: number } | null;
declare function txtVentanas(windows: readonly [number, number][]): string;
declare function explicarAviso(info: StopInfo): string;
declare function puedeRegistrarEnDia(isoDate: string): boolean;
declare function textoOrigenCita(item: object): string;
declare function empezarJornada(): Promise<void>;
declare function terminarJornada(): Promise<void>;
declare const ordenarPorCercania: ((list: readonly object[]) => object[]) & { fuera?: number };
declare function prepararParadas(isoDate: string): unknown;
declare function tdMarcaTrafico(): void;
declare function colaLeer(): { fn: string; payload?: { p?: { fecha?: string; cuenta_id?: string } } }[];
declare function appVentana(options: { titulo: string; msg?: string; ok: string; cancel?: boolean; campo?: { valor: string; tipo: string } }): Promise<unknown>;
interface SheetAppointment extends DayAppointmentFull {
  especialidad?: string | null; direccion?: string | null;
  aplazada_a_fecha?: string | null; aplazada_de_fecha?: string | null;
}
interface ChoiceButton { k: string; t: string; cls?: string }
declare let VISITA_FECHA: string;
declare let FICHA_CENTRO: string | null;
declare const CAT: Record<string, { valor: string; extra?: string | null }[]>;
declare function escribir(name: string, payload: Record<string, unknown>): Promise<{ error?: unknown } | null>;
declare function escribirRpc(name: string, payload: Record<string, unknown>): Promise<{ error?: { message?: string } | null }>;
declare function pedirFecha(message: string, value: string, options: { titulo?: string; ok?: string }): Promise<string | null>;
declare function proximoDiaConsulta(days: Record<string, string | null> | null | undefined, fromIsoDate: string): string;
declare function elegirOpcion(title: string, message: string, buttons: ChoiceButton[]): Promise<string | null>;
declare function navegarA(point: [number, number] | null): Promise<void>;
declare function abrirVisita(accountId: string): Promise<void>;
declare function nuevaFechaTrasNoEstaba(item: object): Promise<void>;
declare function diaCita(isoDate: string): string;
declare function agUnida(): boolean;
declare const RC: Map<string, unknown>;
declare const RC_VUELO: Map<string, unknown>;
declare let RC_EPOCA: number;
declare let DLG_EPOCA: number;
declare const AG_DIAS_DATOS: Record<string, AgendaAppointment[] | undefined>;
declare function pintarRutaBarra(): Promise<void>;
interface PickedAccount { id: string; nombre?: string; centro_nombre?: string | null; centro?: string | null }
interface Consultation { centro_nombre?: string | null; municipio?: string | null; principal?: boolean | null }
interface RecentContact { tipo: string; fecha: string; usuario?: string | null }
declare function selectorMedico(element: HTMLElement | null, options: { valor: PickedAccount | null; alElegir: (account: PickedAccount) => Promise<void> }): void;
declare function recientesDe(ids: string[], isoDate: string): Promise<Record<string, RecentContact[] | undefined>>;
declare function txtReciente(list: RecentContact[]): string;
declare function avisoRevisita(): { on: boolean; dias: number };
declare function guardarAvisoRevisita(value: { on: boolean; dias: number }): Promise<void>;
declare let FICHA_ID: string | null;
declare let FICHA_PAC: unknown;
declare function puedeEditarTipo(type: string | null | undefined): boolean;
declare function bloqueCampos(table: string, id: string, container: Element | null): Promise<void>;
declare function cicFicha(id: string): Promise<void>;
declare function verFotosVisita(activityId: string, accountId: string): Promise<void>;
declare function verEvento(id: string): Promise<void>;
declare function verDeposito(accountId: string, name: string): Promise<void>;
declare function depCaducaPronto(isoDate: string | null | undefined): boolean;
declare function verCirugia(id: string): Promise<void>;
declare function cirEstado(surgery: object): string;
declare function verConcurso(id: string): Promise<void>;
declare function conQuedan(tender: object): number | null;
declare function conVence(tender: object): string | null;
declare function conPill(state: string): string;
declare function verEquipo(id: string): Promise<void>;
declare function editarEquipo(equipment: null, account: { id: string; nombre: string }): Promise<void>;
declare function eqRevPill(equipment: object): string;
interface CardAccount { id: string; nombre: string; tipo?: string | null; codigo?: string | null; especialidad?: string | null; area?: string | null; urgente?: boolean | null; sin_reporting?: boolean | null; estado_comercial?: string | null; email?: string | null }
interface CardConsultation extends Consultation { direccion?: string | null; cp?: string | null; planta?: string | null; sala?: string | null; indicaciones?: string | null; telefono?: string | null; dias?: Record<string, string | null> | null; lat?: number | null; lon?: number | null }
interface CardVisit { id: string; fecha: string; modo?: string | null; resultados?: string[] | null; muestras?: number | null; nota?: string | null; proxima_fecha?: string | null; proxima_accion?: string | null }
interface CardData { medico?: CardAccount; consultas?: CardConsultation[]; visitas?: CardVisit[]; comerciales?: string[] }
interface AccountUnits { hoy: number; semana: number; mes: number; trimestre: number; anio: number; total: number; pautas: number; ultima: string }
declare let UDS_SERIE: string;
declare const UDS_SERIES: [string, string][];
declare function fichaVisitaHTML(account: CardAccount, consultations: CardConsultation[], visits: CardVisit[]): string;
declare function consultaDeLaVisita(consultations: CardConsultation[]): CardConsultation | undefined;
declare function estados(): string[];
declare function puedeRegistrar(): boolean;
declare function puedeEditar(): boolean;
declare function navAttr(point: [number, number]): string;
declare function editarVisita(visit: CardVisit, accountId: string): Promise<void>;
declare function sparkUnidades(units: AccountUnits, series: string): string;
declare function leyendaUnidades(series: string): string;
declare function faltaHorario(id: string): Promise<boolean>;
declare function abrirEditor(id: string): Promise<void>;
interface HistoryEntry { id: number; accion: string; entidad?: string | null; usuario?: string | null; creado_en: string; detalle?: unknown; deshacible?: boolean | null }
declare const PAC: { q: string; medico: string | null; medicoNombre: string; pagina: number };
declare function rolPuede(role: string, capability: string): boolean;
declare function fichaPaciente(id: string): Promise<void>;
declare function detTxt(visit: object): string;
declare function campoTxt(field: string): string;
declare function textoValor(value: unknown): string;
declare function resumenDetalle(detail: unknown): string;
declare function deshacerUno(id: number, then: () => void): Promise<void>;
interface PortalMessage { id: string; texto: string; del_portal: boolean; creado_en: string; leido_en?: string | null }
interface PortalResult { ok?: boolean; motivo?: string; productos?: number }
interface CatalogProduct { id: string; nombre: string; tipo?: string | null; estado?: string | null; precio?: number | null }
interface PlatformUser { id: string; cuenta_id?: string | null; email?: string | null; activo?: boolean }
declare let PRODUCTOS: CatalogProduct[];
declare let MED_ACCESO: unknown;
declare const CFG: { url: string; anon: string };
declare function hayExtra(extra: string): boolean;
declare function pillMaterial(state: string): string;
declare function hiloMensajes(list: PortalMessage[], fromProfessional: boolean): string;
declare function motivoPortal(result: PortalResult | null): string;
declare function cargarProductos(): Promise<void>;
declare function eurI(value: number): string;
declare function facccon(userId: string): Promise<void>;
declare function puedeVerComo(user: PlatformUser): boolean;
declare function nuevoUsuario(preset: Record<string, unknown>): void;
interface AccountFilters { q: string; prov: string; muni: string; esp: string; est: string; urg: boolean; mios?: boolean; sin?: boolean; com?: string | null; rep?: string | null; tipo?: string; orden: string; pagina: number; total: number; campos: Record<string, unknown> }
interface AccountRow { id: string; nombre?: string | null; urgente?: boolean | null; centro_nombre?: string | null; municipio?: string | null; estado_comercial?: string | null }
interface ColumnSetting { k: string; on: boolean; w: number }
declare const F: AccountFilters;
declare let MODO_MAPA: boolean;
declare const ORD_DIR: Readonly<Record<string, string>>;
declare function pintarMapa(): Promise<void>;
declare function clasChips(scope: string, state: Record<string, unknown>): { k: string; t: string }[];
declare function etiquetaContactos(): string;
declare function tamPagina(): number;
declare function paginador(element: HTMLElement | null, total: number, page: number, onPage: (page: number) => void, onSize: () => void): void;
interface CustomField { clave: string; nombre: string; tipo?: string | null; en_tabla?: boolean | null }
interface AccountListRow extends AccountRow { sin_reporting?: boolean | null; dias?: Record<string, string | null> | null; ultima_visita?: string | null; telefono?: string | null; consulta_telefono?: string | null; clasificadores?: Record<string, unknown> | null; comerciales?: { nombre: string }[] | null; [key: string]: unknown }
declare const CAMPOS: Record<string, CustomField[] | undefined>;
declare function campoTexto(field: CustomField | undefined, value: unknown): string;
declare function nombrePila(name: string): string;
declare function cargarAccesoMedicos(): Promise<void>;
