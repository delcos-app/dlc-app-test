/**
 * Panel delcos → Clientes (Organizaciones): each company with its plan, state, users and domains, and its buttons: Dominios,
 * Extras, Entrar, Plan, Descargar datos, Desactivar and Borrar. Migrated from the legacy pintarOrganizaciones, orgExtras and
 * orgAcciones (v2.413.0); pintarOrganizaciones stays as an adapter (the page tabs and the tests use it).
 */
import { legacyDb, notices } from '../../legacy/bridge';
import { platformLegacy } from '../../legacy/platform-bridge';
import { t, type MessageKey } from '../../i18n';
import { formatShortDate } from '../../services/date-format';
import { escapeHtml, formatNumber } from '../../services/format';
import { orFallback } from '../../services/values';
import { errorMessage, extraName, type Organization, planOf, planText, platformState, statePills } from './model';
import { deleteOrganization, downloadData, enterOrganization, toggleActive } from './org-actions';
import { editExtras } from './org-extras';
import { openNewOrganization } from './org-new';
import { editPlan } from './org-plan';

function detailsText(organization: Organization): string {
  const extras = planOf(organization).extras ?? [];
  return escapeHtml(orFallback(organization.nif, t('platform.orgs.noNif'))) + ` · ${escapeHtml(planText(organization))}${extras.length ? ` + ${extras.map(extraName).join(', ')}` : ''}`
    + t('platform.orgs.counts', { users: formatNumber(organization.usuarios), accounts: formatNumber(organization.cuentas) })
    + (organization.pendiente ? t('platform.orgs.pending', { email: escapeHtml(organization.pendiente) }) : '');
}

function buttonsHtml(organization: Organization): string {
  const inside = organization.id === platformState.viewed?.id, data = planOf(organization);
  const toggle = organization.principal ? '' : `<button class="btn sec" type="button" data-orgact="${organization.id}">${t(organization.activa === false ? 'platform.orgs.reactivate' : 'platform.orgs.deactivate')}</button>`;
  const remove = !organization.principal && (data.estado === 'prueba' || !organization.activa) ? `<button class="btn sec" type="button" data-orgdel="${organization.id}">${t('platform.orgs.delete')}</button>` : '';
  return `<span class="acts u-m-0"><span class="sm">${organization.creado_en ? formatShortDate(String(organization.creado_en).slice(0, 10)) : ''}</span>
        <button class="btn sec chico" type="button" data-orgdom="${organization.id}">${t('platform.orgs.domains')}</button>
        <button class="btn sec chico" type="button" data-orgext="${organization.id}">${t('platform.orgs.extras')}</button>
        <button class="btn chico ${inside ? 'sec' : ''}" type="button" data-orgver="${organization.id}">${t(inside ? 'platform.orgs.inside' : 'platform.orgs.enter')}</button>
        <button class="btn sec chico" type="button" data-orgplan="${organization.id}">${t('platform.orgs.plan')}</button>
        <button class="btn sec chico" type="button" data-orgexp="${organization.id}">${t('platform.orgs.download')}</button>
        ${toggle}${remove}</span>`;
}

function rowHtml(organization: Organization): string {
  const domains = organization.dominios ?? [];
  return `<div class="item u-cursor-default">
      <span class="tx"><b>${escapeHtml(organization.nombre)}</b>${statePills(organization)}<span class="sm">${detailsText(organization)}</span>
        <span class="sm">${domains.length ? t('platform.orgs.domainList', { domains: domains.map(escapeHtml).join(', ') }) : t('platform.orgs.noDomain')}</span></span>
      ${buttonsHtml(organization)}</div>`;
}

const DOMAIN_ERRORS = new Map<string, MessageKey>([['permiso', 'platform.orgs.noPermission'], ['dominio', 'platform.orgs.badDomain'], ['en_uso', 'platform.orgs.domainInUse'], ['no_existe', 'platform.orgs.gone']]);

interface DomainsAnswer { ok?: boolean; error?: string; dominio?: string; organizacion?: string; dominios?: string[] }

function domainsFailure(result: DomainsAnswer | null, error: unknown): string {
  const key = DOMAIN_ERRORS.get(result?.error ?? '');
  if (key) return t(key, { domain: result?.dominio ?? '', organization: result?.organizacion ?? '' });
  return t('platform.orgs.domainsFailed') + (error ? `: ${errorMessage(error)}` : '');
}

async function editDomains(organization: Organization): Promise<void> {
  const text = await platformLegacy.askText(t('platform.orgs.domainsText', { name: organization.nombre }), (organization.dominios ?? []).join(', '), { titulo: t('platform.orgs.domainsTitle'), ok: t('common.save') });
  if (text === null) return;
  const { data: result, error } = await legacyDb().rpc<DomainsAnswer>('guardar_dominios_organizacion', { p_id: organization.id, p_dominios: text.split(/[,;\s]+/).filter(Boolean) });
  if (error || !result?.ok) { notices.toast(domainsFailure(result, error), true); return; }
  notices.toast(t(result.dominios?.length ? 'platform.orgs.domainsSaved' : 'platform.orgs.domainsRemoved')); void paintOrganizations();
}

type Action = (organization: Organization, button: HTMLButtonElement) => void;

const ACTIONS: readonly (readonly [string, Action])[] = [
  ['orgver', organization => { if (organization.id !== platformState.viewed?.id) void enterOrganization(organization); }],
  ['orgdom', organization => { void editDomains(organization); }],
  ['orgext', organization => { editExtras(organization, paintOrganizations); }],
  ['orgplan', organization => { editPlan(organization, paintOrganizations); }],
  ['orgexp', (organization, button) => { void downloadData(organization, button); }],
  ['orgdel', organization => { void deleteOrganization(organization, paintOrganizations); }],
  ['orgact', (organization, button) => { void toggleActive(organization, button, paintOrganizations); }],
];

function bind(box: HTMLElement, list: readonly Organization[]): void {
  for (const [key, action] of ACTIONS) box.querySelectorAll<HTMLButtonElement>(`[data-${key}]`).forEach(button => {
    button.onclick = (): void => { const organization = list.find(item => item.id === button.dataset[key]); if (organization) action(organization, button); };
  });
  const add = document.getElementById('orgnueva'); if (add) add.onclick = (): void => { openNewOrganization(paintOrganizations); };
}

export async function paintOrganizations(): Promise<void> {
  const start = document.getElementById('cfgcuerpo'); if (!start) return;
  start.innerHTML = `<div class="card"><div class="sm">${t('common.loading')}</div></div>`;
  const { data, error } = await legacyDb().rpc<Organization[]>('organizaciones_lista');
  const box = document.getElementById('cfgcuerpo'); if (!box) return;
  const list = Array.isArray(data) ? data : [];
  box.innerHTML = `<div class="card"><div class="fh"><div><h2>${t('platform.orgs.title')}</h2>
      <div class="sm">${t('platform.orgs.subtitle')}</div></div>
      <button class="btn" id="orgnueva">${t('platform.orgs.new')}</button></div>
    ${error ? `<div class="vacio">${t('platform.orgs.couldNotLoad', { error: escapeHtml(errorMessage(error)) })}</div>` : `<div class="lista">${list.map(rowHtml).join('')}</div>`}</div>`;
  bind(box, list);
}
