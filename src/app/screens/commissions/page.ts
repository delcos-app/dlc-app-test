/**
 * Configuración → Equipo → Comisiones: the commission schemes and the settlements. Migrated from the legacy pintarComisiones,
 * pintarComisionesBaseBase and pintarComisionesBase (v2.411.0); pintarComisiones stays as an adapter (legado 004 calls it). The old
 * «Quién cobra con cada esquema» block (pintarComisionesPaso1) was painted and removed at once by pintarComisionesPaso2: it is gone.
 */
import { legacyDb } from '../../legacy/bridge';
import { commissionsLegacy } from '../../legacy/commissions-bridge';
import { t } from '../../i18n';
import { todayIso } from '../../services/dates';
import { escapeHtml, formatCurrency } from '../../services/format';
import { editScheme } from './scheme-editor';
import { type Scheme, schemes } from './model';
import { calculateSettlements, filtersHtml, paintSettlements, type Settlement } from './settlements';

const FIXED = 'fijo', CLOSES = 'cierra';

function howItCounts(scheme: Scheme): string {
  if (scheme.calculo === FIXED) return t('commissions.page.perUnit', { amount: formatCurrency(scheme.valor_fijo) });
  return (scheme.tramos ?? []).map(tier => `${tier.desde_u}${tier.hasta_u ? `-${tier.hasta_u}` : '+'}: ${formatCurrency(tier.valor)}`).join(' · ') || t('commissions.page.noTiers');
}

function schemeRow(scheme: Scheme): string {
  const people = scheme.personas ?? [];
  return `<div class="item u-cursor-default">
      <span class="ic">${scheme.calculo === FIXED ? '€' : '▤'}</span>
      <span class="tx"><b>${escapeHtml(scheme.nombre)}</b><span class="sm">
        ${t(scheme.atribucion === CLOSES ? 'commissions.page.perSale' : 'commissions.page.perPortfolio')} ·
        ${howItCounts(scheme)}
        ${people.length ? ` · ${people.map(escapeHtml).join(', ')}` : t('commissions.page.unassigned')}</span></span>
      <span class="acts u-m-0"><button class="btn sec chico" data-esq="${scheme.id}">${t('commissions.page.edit')}</button></span></div>`;
}

function pageHtml(all: readonly Settlement[]): string {
  const list = schemes();
  return `
    <h2>${t('commissions.page.schemes')}<span class="n">${list.length}</span></h2>
    <p class="sm">${t('commissions.page.schemesHint')}</p>
    <div class="lista">${list.map(schemeRow).join('') || `<div class="vacio">${t('commissions.page.noSchemes')}</div>`}</div>
    <div class="acts u-p-0-16-14"><button class="btn" id="esqnuevo">${t('commissions.page.newScheme')}</button></div>

    <h2>${t('commissions.page.settlements')}</h2>
    <div class="acts u-p-0-16">
      <input id="liqper" type="month" value="${todayIso().slice(0, 7)}" style="max-width:190px">
      <button class="btn sec" id="liqcalc">${t('commissions.page.calculate')}</button></div>
    ${filtersHtml(all)}
    <div class="lista"></div>`;
}

const repaint = (): void => { void paintCommissions(); };

export async function paintCommissions(): Promise<void> {
  const loading = document.getElementById('admcuerpo');
  if (loading) loading.innerHTML = '<div class="skel"></div><div class="skel" style="width:60%"></div>';
  const [{ data: found }, { data: settlements }] = await Promise.all([
    legacyDb().rpc<Scheme[]>('esquemas_lista'), legacyDb().rpc<Settlement[]>('liquidaciones_lista', { p_periodo: null }),
  ]);
  commissionsLegacy.setSchemes(found ?? []);
  const body = document.getElementById('admcuerpo'); if (!body) return;
  body.innerHTML = pageHtml(settlements ?? []);
  const add = document.getElementById('esqnuevo'); if (add) add.onclick = (): void => { editScheme(null, repaint); };
  body.querySelectorAll<HTMLElement>('[data-esq]').forEach(button => { button.onclick = (): void => { editScheme(button.dataset.esq ?? null, repaint); }; });
  const calculate = document.getElementById('liqcalc'); if (calculate) calculate.onclick = (): void => { void calculateSettlements(repaint); };
  const list = document.getElementById('liqfil')?.nextElementSibling;
  if (list instanceof HTMLElement) paintSettlements(list, settlements ?? [], repaint);
}
