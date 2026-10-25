/**
 * What legacy layers did around every database call (db.rpc), each installed at its legacy place so they wrap in the same order:
 * the sort order travels with paged lists (v2.224.0), slow reads on the iPhone get a second try (v2.231.0), preloaded answers are
 * used once (v2.249.0), remembered sorts reorder whole lists (v2.262.0), saving an account refreshes what is below (v2.301.0), the
 * «Reporte» filter of Analítica (v2.329.0) and the PDF design templates (v2.342.0). Moved from legado 082, 083, 096, 107, 127, 145
 * and 156 (v2.424.0).
 */
import { rpcLegacy, type RpcCall } from '../../legacy/legado-d-bridge';

type Args = Record<string, unknown> | undefined;

/** v2.224.0: Pedidos and Clientes are sorted by the database: their order goes with the query. */
export function installOrderParameter(): void {
  rpcLegacy.wrap(original => (name, args, ...rest) => {
    const order = name === 'pedidos_pagina' ? rpcLegacy.tableOrder('peds2') : name === 'clientes_lista' ? rpcLegacy.tableOrder('pacs') : null;
    const limit = Number(args?.lim);
    if (order?.k && args && !('p_orden' in args) && (name !== 'clientes_lista' || limit > 5)) return original(name, { ...args, p_orden: order.k + (order.dir === -1 ? ':desc' : ':asc') }, ...rest);
    return original(name, args, ...rest);
  });
}

const SLOW_READS = new Set(['buscar_cuentas', 'buscar_global', 'panel_inicio', 'inicio_areas', 'inicio_graficas',
  'agenda_rango', 'agenda_metricas', 'mis_notificaciones', 'ficha_cuenta', 'operativa_pendiente', 'catalogos_todos', 'opciones_filtros']);
const RETRY_MS = 4500, WAIT_MS = 8000, SLOW_MS = 4000;

/** Both tries race; the first good answer wins (an error of the first waits a while for the second). */
function race(first: () => unknown, second: () => PromiseLike<unknown>): Promise<unknown> {
  return new Promise(resolve => {
    let done = false, other: PromiseLike<unknown> | null = null, wait: ReturnType<typeof setTimeout> | undefined;
    const finish = (result: unknown): void => { if (done) return; done = true; clearTimeout(timer); clearTimeout(wait); resolve(result); };
    const timer = setTimeout(() => { if (done) return; other = second(); other.then(finish, (error: unknown) => { finish({ data: null, error }); }); }, RETRY_MS);
    Promise.resolve(first()).then(result => {
      if (other && (result as { error?: unknown } | null)?.error) { wait = setTimeout(() => { finish(result); }, WAIT_MS); return; }
      finish(result);
    }, (error: unknown) => { if (other) wait = setTimeout(() => { finish({ data: null, error }); }, WAIT_MS); else finish({ data: null, error }); });
  });
}

/** v2.231.0 iPhone: a read with no answer in 4.5 s is sent again (straight, without the cache); slow ones are logged. */
export function installSlowReadRetry(): void {
  rpcLegacy.wrap(original => (name, args, ...rest) => {
    if (!SLOW_READS.has(name)) return original(name, args, ...rest);
    const start = performance.now();
    return race(() => original(name, args, ...rest), () => {
      rpcLegacy.forgetInFlight(name);
      return rpcLegacy.direct(name, args ?? {}, ...rest);
    }).then(result => {
      const ms = Math.round(performance.now() - start);
      if (ms > SLOW_MS && navigator.onLine) rpcLegacy.logError('api', `Lento: ${name}`, { funcion: name, ms, pantalla: rpcLegacy.currentScreen(), segundo_intento: ms > RETRY_MS });
      return result;
    });
  });
}

/** v2.249.0: an answer read in advance (DB_PRE) is used once instead of asking again. */
export function installPreloadedAnswers(): void {
  rpcLegacy.wrap(original => (name, args, ...rest) => {
    const preloaded = rpcLegacy.preloaded();
    if (preloaded.size) {
      const key = name + JSON.stringify(args ?? {});
      if (preloaded.has(key)) { const result = preloaded.get(key); preloaded.delete(key); return Promise.resolve(result); }
    }
    return original(name, args, ...rest);
  });
}

/** v2.262.0: Facturas and Llamadas arrive sorted by the chosen column (the whole period, before paging). */
export function installRememberedSorts(): void {
  rpcLegacy.wrap(original => async (name, args, ...rest) => {
    const result = await original(name, args, ...rest) as { data?: unknown } | null;
    const kind = rpcLegacy.rememberedSortOf(name);
    if (kind && result && Array.isArray(result.data) && rpcLegacy.tableOrder(kind)) return { ...result, data: rpcLegacy.sortRemembered(kind, result.data) };
    return result;
  });
}

const ACCOUNT_WRITES = new Set(['guardar_cuenta', 'guardar_centro', 'centro_anadir_profesional', 'centro_quitar_profesional', 'guardar_campos',
  'unificar_cuentas', 'archivar_cuenta', 'clasificar_cuentas']);
const BELOW_MS = 450;

/** v2.301.0: saving an account, a centre or its professionals clears the cache and repaints what is below when windows close. */
export function installRefreshAfterAccountWrites(): void {
  rpcLegacy.wrap(original => (name, args, ...rest) => {
    const result = original(name, args, ...rest) as PromiseLike<{ error?: unknown } | null> | null;
    if (!ACCOUNT_WRITES.has(name) || typeof result?.then !== 'function') return result;
    return result.then(answer => {
      if (answer && !answer.error) { rpcLegacy.forgetCache(); setTimeout(() => { rpcLegacy.refreshBelow(); }, 0); }
      return answer;
    });
  });
  for (const id of ['dlg', 'dlg2', 'ficha']) {
    document.getElementById(id)?.addEventListener('close', () => { setTimeout(() => { if (rpcLegacy.dataChanged()) rpcLegacy.refreshBelow(); }, BELOW_MS); });
  }
}

/** v2.329.0: Analítica's «Reporte» filter goes with its indicators and its table. */
export function installReportedFilter(): void {
  rpcLegacy.wrap(original => (name, args, ...rest) => {
    const reported = rpcLegacy.reportedFilter();
    if (rpcLegacy.currentScreen() !== 'analitica' || !reported || !args) return original(name, args, ...rest);
    const filter = args.p_filtro as Record<string, unknown> | undefined;
    if ((name === 'analitica_kpis' || name === 'analitica_kpis_periodo') && !filter?.reportado) return original(name, { ...args, p_filtro: { ...filter, reportado: reported } }, ...rest);
    if (name === 'analitica_v2' && !document.getElementById('areprt') && !('p_reportado' in args)) return original(name, { ...args, p_reportado: reported }, ...rest);
    return original(name, args, ...rest);
  });
}

/** v2.342.0: saving a PDF design that is not the default one saves it in its template (not in factura_pdf). */
export function installPdfTemplates(): void {
  rpcLegacy.wrap(original => (name, args, ...rest) => {
    const editing = rpcLegacy.pdfEditing();
    if (name !== 'guardar_ajuste' || args?.p_clave !== 'factura_pdf' || !editing) return original(name, args, ...rest);
    return savePdfTemplate(editing, args, () => original(name, args, ...rest));
  });
}

async function savePdfTemplate(id: string, args: NonNullable<Args>, saveDefault: RpcCall): Promise<unknown> {
  const templates = rpcLegacy.pdfTemplates();
  templates.lista = templates.lista.map(item => (item.id === id ? { ...item, cfg: args.p_valor } : item));
  if (!await rpcLegacy.savePdfTemplates({ lista: templates.lista, defecto: templates.defecto })) return { data: { ok: false }, error: null };
  if (id === templates.defecto) return saveDefault();
  // The default one does not change
  setTimeout(() => { rpcLegacy.setInvoicePdf(templates.lista.find(item => item.id === templates.defecto)?.cfg); }, 0);
  return { data: { ok: true }, error: null };
}
