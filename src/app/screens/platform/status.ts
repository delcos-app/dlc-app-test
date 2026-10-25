/**
 * Panel delcos → Estado de la plataforma: this app's version, the SQL applied to this database, the versions each company uses and
 * the use of the routes service (TomTom) with its daily limits. Migrated from the legacy pintarEstadoDelcosBase and
 * pintarEstadoDelcos (v2.413.0).
 */
import { callRpc } from '../../legacy/bridge';
import { platformLegacy } from '../../legacy/platform-bridge';
import { t } from '../../i18n';
import { escapeHtml, formatNumber } from '../../services/format';
import { errorMessage, panelBox, stillOnTab } from './model';

const ROUTES_DEFAULT_LIMIT = 2000, ROUTES_PER_USER = 30, WARNING_SHARE = 0.8;

interface UsedVersion { version: string; organizacion: string; ultima_vez: string }
interface AppliedSql { numero: number; version_app?: string | null; descripcion?: string | null; aplicado_en: string }
interface PlatformState { empresas?: { activas?: number; total?: number }; sql?: AppliedSql[]; versiones?: UsedVersion[]; usuarios?: number; portal?: number; errores?: number }
interface RoutesUse { ok?: boolean; hoy?: number; mes?: number; config?: { global?: number; activo?: boolean; por_usuario?: number }; empresas?: { nombre: string; hoy: number; cupo: number; mes: number }[] }

function versionsHtml(list: readonly UsedVersion[]): string {
  const byVersion = new Map<string, UsedVersion[]>();
  list.forEach(item => { byVersion.set(item.version, [...byVersion.get(item.version) ?? [], item]); });
  const versions = [...byVersion.keys()].sort((first, second) => second.localeCompare(first, 'es', { numeric: true }));
  if (!versions.length) return `<div class="vacio">${t('platform.status.noVersions')}</div>`;
  return versions.map(version => {
    const users = byVersion.get(version) ?? [], number = version.replace(/^v/, '');
    return `<div class="pdver"><div class="pdvercab"><b>v${escapeHtml(number)}</b>${number === platformLegacy.appVersion() ? ` <span class="pill p-est">${t('platform.status.current')}</span>` : ` <span class="pill p-warn">${t('platform.status.previous')}</span>`}
        <span class="sm">${users.length} ${t(users.length === 1 ? 'platform.status.company' : 'platform.status.companies')}</span></div>
      <div class="sm">${users.map(item => `${escapeHtml(item.organizacion)} (${platformLegacy.timeAgo(item.ultima_vez)})`).join(' · ')}</div></div>`;
  }).join('');
}

function sqlFigure(last: AppliedSql | undefined): [string, string] {
  return [last?.numero ? `SQL ${last.numero}` : '—', last?.version_app ? t('platform.status.databaseAt', { version: last.version_app }) : t('platform.status.database')];
}

function figuresHtml(state: PlatformState): string {
  const companies = state.empresas ?? {};
  return platformLegacy.kpis([
    [escapeHtml(`v${platformLegacy.appVersion()}`), t('platform.status.appVersion')],
    sqlFigure((state.sql ?? [])[0]),
    [`${formatNumber(companies.activas ?? 0)} / ${formatNumber(companies.total ?? 0)}`, t('platform.status.activeCompanies')],
    [formatNumber(state.usuarios ?? 0), t('platform.status.activeUsers') + (state.portal ? t('platform.status.portalUsers', { count: formatNumber(state.portal) }) : '')],
    [formatNumber(state.errores ?? 0), t('platform.status.openErrors'), state.errores ? 'aviso' : ''],
  ]);
}

function pageHtml(state: PlatformState, error: unknown): string {
  const test = platformLegacy.isTestEnvironment();
  return `<div class="card cfgpanel">
    ${error ? `<div class="banda-peligro">${t('platform.status.couldNotRead', { error: escapeHtml(errorMessage(error)) })}</div>` : ''}
    ${figuresHtml(state)}
    <h3 class="pdh3">${t('platform.status.versionsTitle')}</h3>
    ${versionsHtml(state.versiones ?? [])}
    <h3 class="pdh3">${t('platform.status.sqlTitle')}</h3>
    <div class="tablawrap"><table class="pdtabla"><thead><tr><th>SQL</th><th>${t('platform.status.version')}</th><th>${t('platform.status.whatChanges')}</th><th>${t('platform.status.applied')}</th></tr></thead><tbody>
      ${(state.sql ?? []).map(sql => `<tr><td class="num">${sql.numero}</td><td>${escapeHtml(sql.version_app ?? '')}</td><td class="sm">${escapeHtml(sql.descripcion ?? '')}</td><td class="sm">${platformLegacy.shortDate(sql.aplicado_en)}</td></tr>`).join('')}</tbody></table></div>
    <p class="sm">${t(test ? 'platform.status.footerTest' : 'platform.status.footerProduction')}</p></div>`;
}

function routesHtml(use: RoutesUse): string {
  const config = use.config ?? {}, limit = Number(config.global) || ROUTES_DEFAULT_LIMIT, today = use.hoy ?? 0, off = config.activo === false, companies = use.empresas ?? [];
  return `<h3 class="pdh3">${t('platform.status.routesTitle')}</h3>
    ${platformLegacy.kpis([[`${formatNumber(today)} / ${formatNumber(limit)}`, t('platform.status.routesToday'), today >= limit * WARNING_SHARE ? 'aviso' : ''],
      [formatNumber(use.mes ?? 0), t('platform.status.routesMonth')], [t(off ? 'platform.status.off' : 'platform.status.on'), t('platform.status.service'), off ? 'aviso' : ''],
      [formatNumber(Number(config.por_usuario) || ROUTES_PER_USER), t('platform.status.perUser')]])}
    ${companies.length ? `<div class="tablawrap"><table class="pdtabla"><thead><tr><th>${t('platform.billing.company')}</th><th class="num">${t('platform.status.today')}</th><th class="num">${t('platform.status.dailyLimit')}</th><th class="num">${t('platform.status.thisMonth')}</th></tr></thead><tbody>
      ${companies.map(item => `<tr><td>${escapeHtml(item.nombre)}</td><td class="num" style="${item.hoy >= item.cupo ? 'color:var(--warn);font-weight:700' : ''}">${formatNumber(item.hoy)}</td><td class="num">${formatNumber(item.cupo)}</td><td class="num">${formatNumber(item.mes)}</td></tr>`).join('')}</tbody></table></div>`
      : `<div class="vacio">${t('platform.status.noRoutes')}</div>`}`;
}

/** The routes block, before the footer of the card. */
function addRoutes(box: HTMLElement, use: RoutesUse): void {
  const card = box.querySelector('.card.cfgpanel'); if (!card) return;
  const footer = [...card.querySelectorAll(':scope > p.sm')].pop();
  if (footer) footer.insertAdjacentHTML('beforebegin', routesHtml(use)); else card.insertAdjacentHTML('beforeend', routesHtml(use));
}

export async function paintStatus(): Promise<void> {
  const start = panelBox(); if (!start) return;
  start.innerHTML = platformLegacy.skeleton();
  const routes = Promise.resolve(callRpc<RoutesUse>('rutas_uso_resumen', {})).catch(() => ({ data: null }));
  const { data, error } = await callRpc<PlatformState>('estado_plataforma', {});
  if (!stillOnTab('estado')) return;
  const box = panelBox(); if (!box) return;
  box.innerHTML = pageHtml(error ? {} : data ?? {}, error);
  const { data: use } = await routes;
  if (stillOnTab('estado') && use?.ok) addRoutes(box, use);
}
