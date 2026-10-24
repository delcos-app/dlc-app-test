/** Data of the home screen: every request at once, so the mosaic is painted in a single step (no screen «ghosts»). */
import { appointments, callRpc, homeCache, legacyDb, permissions } from '../../legacy/bridge';
import { todayIso } from '../../services/dates';
import type { Appointment, Areas, CycleSummary, FollowUpCall, HomeData, StockAlert, Task } from './types';

/** A request that fails or is not allowed resolves to null: one missing area must not block the screen. */
function valueOf<T>(request: PromiseLike<{ data: T | null }> | null): Promise<T | null> {
  if (!request) return Promise.resolve(null);
  return Promise.resolve(request).then(result => result.data, () => null);
}

function requests(today: string): [
  Promise<Areas | null>, Promise<Record<string, unknown[]> | null>, Promise<StockAlert[] | null>,
  Promise<CycleSummary | null>, Promise<FollowUpCall[] | null>, Promise<Appointment[]>, Promise<Task[] | null>,
] {
  const seesOperations = permissions.seesEverything() && permissions.salesLevel() >= 1;
  return [
    valueOf(legacyDb().rpc<Areas>('inicio_areas')),
    valueOf(seesOperations ? callRpc<Record<string, unknown[]>>('operativa_pendiente') : null),
    valueOf(permissions.canSeeArea('productos') ? callRpc<StockAlert[]>('alertas_stock') : null),
    valueOf(permissions.canSeeArea('ciclo') ? callRpc<CycleSummary>('ciclo_cuentas', { p_usuario: null }) : null),
    valueOf(permissions.seesEverything() && permissions.hasOpportunities() ? callRpc<FollowUpCall[]>('llamadas_seguimiento') : null),
    appointments.ofDay(today).catch(() => []),
    valueOf(legacyDb().from<Task[]>('tareas').select('id,titulo,hora,hecha').eq('fecha', today)),
  ];
}

export async function loadHomeData(): Promise<HomeData> {
  const today = todayIso();
  const [areas, pendingOps, stock, cycle, calls, dayAppointments, tasks] = await Promise.all(requests(today));
  if (!homeCache.panel()) homeCache.setPanel(await valueOf(legacyDb().rpc<NonNullable<ReturnType<typeof homeCache.panel>>>('panel_inicio')));
  return {
    today,
    areas: areas ?? {},
    pendingOps,
    stock: stock ?? [],
    cycle,
    calls,
    appointments: dayAppointments,
    tasks: tasks ?? [],
    kpis: homeCache.panel()?.kpis ?? {},
    visitsPerDay: homeCache.charts()?.por_dia ?? [],
  };
}
