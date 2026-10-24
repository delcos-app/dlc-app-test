/** «Requiere tu atención»: what is pending in every area, the most urgent first. */
import { goTo, goToOrders, permissions, term } from '../../legacy/bridge';
import { t } from '../../i18n';
import { formatEuros } from '../../services/format';
import type { AttentionItem, HomeData } from './types';

/** An item is only added when there is something pending (count > 0). */
type Candidate = Omit<AttentionItem, 'count'> & { readonly count: number | undefined };
type Add = (candidate: Candidate) => void;
type Pending = (key: string) => number;

function collectionItems(data: HomeData, add: Add): void {
  const collections = data.areas.cobros;
  if (!collections || !permissions.canSeeArea('facturacion')) return;
  add({
    count: collections.n_vencidas, priority: 'alta', icon: 'receipt', title: t('home.attention.overdueInvoices'),
    detail: t('home.attention.overdueInvoicesDetail', { amount: formatEuros(collections.vencido) }), open: () => { goTo('facturacion'); },
  });
}

function urgentItems(data: HomeData, add: Add, pending: Pending): void {
  add({ count: pending('pago'), priority: 'alta', icon: 'credit-card', title: t('home.attention.pendingPayment'),
    detail: t('home.attention.pendingPaymentDetail'), open: () => { goToOrders('ventas'); } });
  add({ count: data.kpis.urgentes, priority: 'alta', icon: 'zap',
    title: t('home.attention.urgentUnvisited', { professionals: term('medico', { number: 'p', capital: 'C', adjective: 'urgente' }) }),
    detail: t('home.attention.urgentUnvisitedDetail'), open: () => { goTo('directorio'); } });
  if (permissions.canSeeArea('cirugias')) {
    add({ count: data.areas.cirugias_reponer, priority: 'alta', icon: 'scissors', title: t('home.attention.surgeryRestock'),
      detail: t('home.attention.surgeryRestockDetail'), open: () => { goTo('cirugias'); } });
  }
}

function callBackItem(data: HomeData, add: Add): void {
  if (!data.calls) return;
  const due = data.calls.filter(call => call.proxima_fecha && call.proxima_fecha <= data.today);
  const late = due.some(call => (call.proxima_fecha ?? '') < data.today);
  add({ count: due.length, priority: 'media', icon: 'phone', title: t('home.attention.callBackToday'),
    detail: t(late ? 'home.attention.callBackLate' : 'home.attention.callBackOnTime'), open: () => { goToOrders('llamadas'); } });
}

function operationItems(data: HomeData, add: Add, pending: Pending): void {
  add({ count: pending('paquete'), priority: 'media', icon: 'package', title: t('home.attention.packagesToPrepare'),
    detail: t('home.attention.packagesToPrepareDetail'), open: () => { goToOrders('ventas'); } });
  data.stock.forEach(alert => {
    add({ count: alert.n, priority: alert.gravedad === 'alta' ? 'alta' : 'media', icon: 'package', title: alert.titulo,
      detail: (alert.items ?? []).slice(0, 2).map(item => item.nombre).join(' · '), open: () => { goTo('productos'); } });
  });
  callBackItem(data, add);
}

function otherItems(data: HomeData, add: Add, pending: Pending): void {
  if (permissions.canSeeArea('concursos')) {
    add({ count: data.areas.concursos_vencen, priority: 'media', icon: 'gavel', title: t('home.attention.contractsExpiring'),
      detail: t('home.attention.contractsExpiringDetail'), open: () => { goTo('concursos'); } });
  }
  add({ count: pending('email_factura') + pending('email_pago'), priority: 'media', icon: 'mail', title: t('home.attention.emailsToSend'),
    detail: t('home.attention.emailsToSendDetail'), open: () => { goToOrders('ventas'); } });
  if (permissions.canReviewDuplicates()) {
    add({ count: data.kpis.pendientes_unificar, priority: 'media', icon: 'copy', title: t('home.attention.duplicates'),
      detail: t('home.attention.duplicatesDetail'), open: () => { goTo('duplicados'); } });
  }
}

/** Urgent ones first; within the same priority, the biggest count first (stable: same order as they were added). */
function byUrgency(first: AttentionItem, second: AttentionItem): number {
  if (first.priority === second.priority) return second.count - first.count;
  return first.priority === 'alta' ? -1 : 1;
}

export function attentionItems(data: HomeData): AttentionItem[] {
  const items: AttentionItem[] = [];
  const add: Add = candidate => {
    if (candidate.count) items.push({ ...candidate, count: candidate.count });
  };
  const pending: Pending = key => (data.pendingOps?.[key] ?? []).length;
  collectionItems(data, add);
  urgentItems(data, add, pending);
  operationItems(data, add, pending);
  otherItems(data, add, pending);
  return items.sort(byUrgency);
}
