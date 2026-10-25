/**
 * Ciclo de visitas → «Por producto»: how many accounts of each class heard about each promoted product this cycle, and who is
 * missing it, with «+ Cita». Migrated from the legacy pintarCobertura (v2.408.0).
 */
import { cardSectionsLegacy, currentScreen, legacyDb } from '../../legacy/bridge';
import { t } from '../../i18n';
import { escapeHtml, formatNumber } from '../../services/format';
import { sum } from '../../services/values';
import { bindAccounts, bindClassify } from './current';
import { bindOwner, classPill, cycleName, ownerParam, ownerSelector, percentOf, progressBar, rangeText, words } from './model';

interface ClassCoverage { clase: string; cuentas: number; presentado: number }
interface Missing { id: string; clase: string; nombre: string; especialidad?: string | null; municipio?: string | null }
interface ProductCoverage { nombre: string; clases?: ClassCoverage[]; faltan?: Missing[] }
interface CoverageData { meses: number; desde: string; hasta: string; cuentas?: number; productos?: ProductCoverage[] }

function classRow(item: ClassCoverage): string {
  const percent = percentOf(item.presentado, item.cuentas);
  return `<div class="cobf">${classPill(item.clase)}${progressBar(percent)}<span class="cobn"><b>${t('cycle.current.progress', { done: formatNumber(item.presentado), goal: formatNumber(item.cuentas) })}</b> · ${percent}%</span></div>`;
}

const missingRow = (item: Missing): string => `<div class="item cicrow">${classPill(item.clase)}<span class="tx"><button type="button" class="lnk" data-cfi="${item.id}"><b>${escapeHtml(item.nombre)}</b></button>
              <span class="sm">${escapeHtml([item.especialidad, item.municipio].filter(Boolean).join(' · '))}</span></span><button type="button" class="btn sec" data-ccita="${item.id}">${t('cycle.current.newAppointment')}</button></div>`;

function missingHtml(product: ProductCoverage, notHeard: number, cycle: string): string {
  const missing = product.faltan ?? [];
  if (!missing.length) return `<div class="banda-ok cobok">${t('cycle.coverage.allHeard', { cycle })}</div>`;
  const count = notHeard > missing.length ? t('cycle.coverage.firstOf', { shown: missing.length, total: formatNumber(notHeard) }) : t('cycle.coverage.count', { count: formatNumber(missing.length) });
  return `<details class="cobfal"><summary>${t('cycle.coverage.whoIsMissing')}${count}</summary>
            <div class="lista">${missing.map(missingRow).join('')}</div></details>`;
}

function productCard(product: ProductCoverage, cycle: string): string {
  const classes = product.clases ?? [], accounts = sum(classes.map(item => item.cuentas)), heard = sum(classes.map(item => item.presentado));
  return `<section class="card cobcard"><div class="cobcab"><h2>${escapeHtml(product.nombre)}</h2><span class="cobtot">${percentOf(heard, accounts)}%</span></div>
          ${classes.map(classRow).join('')}
          ${missingHtml(product, accounts - heard, cycle)}</section>`;
}

function bodyHtml(data: CoverageData): string {
  const products = data.productos ?? [];
  if (!products.length) return `<div class="vacio">${t('cycle.coverage.noProducts')}${cardSectionsLegacy.can('administrar') ? t('cycle.coverage.markIt', words()) : ''}</div>`;
  if (!data.cuentas) return `<div class="vacio">${t('cycle.coverage.nobodyClassified', words())} <button type="button" class="btn sec" id="cobclas">${t('cycle.classify')}</button></div>`;
  return `<div class="cobgrid">${products.map(product => productCard(product, cycleName(data.meses))).join('')}</div>`;
}

export async function paintCoverage(): Promise<void> {
  if (!document.getElementById('cfgcuerpo')) return;
  const [{ data, error }, selector] = await Promise.all([legacyDb().rpc<CoverageData>('ciclo_cobertura', { p_usuario: ownerParam() }), ownerSelector()]);
  const box = document.getElementById('cfgcuerpo');
  if (!box || currentScreen() !== 'ciclo') return;
  if (error || !data) { box.innerHTML = `<div class="vacio">${t('cycle.coverage.couldNotLoad')}</div>`; return; }
  box.innerHTML = `<div class="cicpag"><div class="ciccab"><div><b>${escapeHtml(rangeText(data))}</b>
      <span class="sm">${t('cycle.coverage.subtitle', { ...words(), cycle: cycleName(data.meses) })}</span></div>
      <span class="cicacc">${selector}</span></div>
    ${bodyHtml(data)}</div>`;
  bindOwner(paintCoverage);
  bindClassify('cobclas');
  bindAccounts(box);
}
