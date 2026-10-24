/** Shape of the data the home screen (Inicio) receives from the database functions. */

export interface Collections {
  readonly n: number;
  readonly n_vencidas: number;
  readonly pendiente: number;
  readonly vencido: number;
  readonly facturado_mes: number;
}

export interface MonthSales {
  readonly importe?: number | null;
  readonly importe_ant?: number | null;
  readonly unidades?: number;
  readonly unidades_ant?: number;
  readonly pedidos?: number;
}

export interface UpcomingItem {
  readonly tipo: string;
  readonly fecha: string;
  readonly titulo: string;
  readonly sub?: string | null;
}

/** inicio_areas() */
export interface Areas {
  readonly cobros?: Collections | null;
  readonly ventas?: MonthSales | null;
  readonly proximos?: readonly UpcomingItem[] | null;
  readonly cirugias_reponer?: number;
  readonly concursos_vencen?: number;
}

export interface StockAlert {
  readonly n: number;
  readonly gravedad: string;
  readonly titulo: string;
  readonly items?: readonly { readonly nombre: string }[];
}

export interface CycleSummary {
  readonly resumen?: readonly { readonly hechas: number; readonly objetivo: number }[];
  readonly quedan_dias?: number;
}

export interface Appointment { readonly estado: string; readonly hora?: string | null; readonly medico?: string; readonly nombre?: string }
export interface Task { readonly hecha: boolean }
export interface FollowUpCall { readonly proxima_fecha?: string | null }

/** Everything the mosaic needs, loaded at once (so the screen paints in one go). */
export interface HomeData {
  readonly today: string;
  readonly areas: Areas;
  readonly pendingOps: Readonly<Record<string, readonly unknown[]>> | null;
  readonly stock: readonly StockAlert[];
  readonly cycle: CycleSummary | null;
  readonly calls: readonly FollowUpCall[] | null;
  readonly appointments: readonly Appointment[];
  readonly tasks: readonly Task[];
  readonly kpis: Readonly<Record<string, number>>;
  readonly visitsPerDay: readonly { readonly fecha: string; readonly n: number }[];
}

export type Priority = 'alta' | 'media';

export interface AttentionItem {
  readonly count: number;
  readonly priority: Priority;
  readonly icon: string;
  readonly title: string;
  readonly detail: string;
  readonly open: () => void;
}
