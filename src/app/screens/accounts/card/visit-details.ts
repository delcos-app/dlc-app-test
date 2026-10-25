/**
 * The material and data of a visit as one line («Díptico (2), Muestra…»): samples are not material, and a result without a datum
 * already shows in the visit's line (v2.205.0). Folded from the legacy detTxt of legado 026 (v2.424.0); detTxt stays as an adapter.
 */
import { legacyBActions } from '../../../legacy/legado-b-bridge';

interface VisitDetail { valor: string; dato?: string | null }
interface Visit { detalles?: VisitDetail[] | null; resultados?: string[] | null }

export function visitDetails(visit: Visit): string {
  const results = visit.resultados ?? [];
  return (visit.detalles ?? []).filter(detail => !legacyBActions.isSamples(detail) && !(!detail.dato && results.includes(detail.valor)))
    .map(detail => detail.valor + (detail.dato ? ` (${detail.dato})` : '')).join(', ');
}
