/**
 * Configuración → Preferencias: the card of the person on top (their modules and their activity: portfolio, visits this month,
 * zone and commission scheme). Migrated from the legacy pintarPrefsPaso2 (v2.415.0).
 */
import { callRpc, initialsOf, legacyDb, term } from '../../../legacy/bridge';
import { settingsLegacy } from '../../../legacy/settings1-bridge';
import { t, type MessageKey } from '../../../i18n';
import { escapeHtml, formatNumber } from '../../../services/format';
import { isPresent } from '../../../services/values';

interface HomeKpis { medicos?: number | null; visitas_mes?: number | null }
interface SchemePeriod { esquema: string; hasta?: string | null }

const MODULE_NAMES = new Map<string, MessageKey>([
  ['inicio', 'settings.profile.moduleNames.inicio'], ['agenda', 'settings.profile.moduleNames.agenda'], ['rutas', 'settings.profile.moduleNames.rutas'],
  ['directorio', 'settings.profile.moduleNames.directorio'], ['pacientes', 'settings.profile.moduleNames.pacientes'], ['productos', 'settings.profile.moduleNames.productos'],
  ['seguimiento', 'settings.profile.moduleNames.seguimiento'], ['ventas', 'settings.profile.moduleNames.ventas'], ['analitica', 'settings.profile.moduleNames.analitica'],
  ['facturacion', 'settings.profile.moduleNames.facturacion'],
]);

const moduleName = (module: string): string => { const key = MODULE_NAMES.get(module); return key ? t(key) : module; };

function cardHtml(): string {
  const user = settingsLegacy.user();
  const modules = settingsLegacy.modules().map(module => `<span>${settingsLegacy.moduleIcon(module) ?? '•'} ${escapeHtml(moduleName(module))}</span>`).join('');
  return `<div class="card miperfil" id="miperfil">
    <div class="mpcab"><span class="mpav">${escapeHtml(initialsOf(user.nombre))}</span>
      <div><h2 class="u-p-0-0-4 u-m-0">${escapeHtml(user.nombre)}</h2><div class="sm">${escapeHtml(user.email ?? '')}</div>
        <div class="mpchips"><span class="pill p-est">${escapeHtml(user.rol)}</span></div></div></div>
    <div class="mpgrid">
      <div><b>${t('settings.profile.modules')}</b><div class="mpmods">${modules}</div></div>
      <div id="mpextra"><b>${t('settings.profile.activity')}</b><div class="sm">${t('settings.profile.loading')}</div></div>
    </div>
    <p class="sm u-m-10-0-0">${t('settings.profile.permissions')}</p></div>`;
}

const zoneName = (zone: string): string => zone.charAt(0) + zone.slice(1).toLowerCase();

function activityHtml(kpis: HomeKpis, zones: readonly string[], scheme: SchemePeriod | undefined): string {
  return `<b>${t('settings.profile.activity')}</b><ul class="mplist">
    ${isPresent(kpis.medicos) ? `<li>🩺 <b>${formatNumber(kpis.medicos)}</b> ${term('medico', { number: 'p' })} ${t('settings.profile.portfolio')}</li>` : ''}
    ${isPresent(kpis.visitas_mes) ? `<li>📝 <b>${formatNumber(kpis.visitas_mes)}</b> ${term('visita', { number: 'p' })} ${t('settings.profile.thisMonth')}</li>` : ''}
    ${zones.length ? `<li>📍 ${escapeHtml(t('settings.profile.zone', { zones: zones.map(zoneName).join(', ') }))}</li>` : ''}
    ${scheme ? `<li>€ ${escapeHtml(t('settings.profile.commission', { scheme: scheme.esquema }))}</li>` : ''}</ul>`;
}

/** A read that never fails: whatever goes wrong, an empty answer. */
const safely = <T>(read: PromiseLike<{ data: T | null }>): Promise<{ data: T | null }> => Promise.resolve(read).then(result => result, () => ({ data: null }));

/** Adds the person's card on top of the preferences (once) and fills in their activity. */
export async function paintProfile(): Promise<void> {
  const box = document.getElementById('cfgcuerpo');
  if (!box || document.getElementById('miperfil')) return;
  box.insertAdjacentHTML('afterbegin', cardHtml());
  const userId = settingsLegacy.user().id;
  const [{ data: panel }, { data: schemes }, { data: me }] = await Promise.all([
    safely(callRpc<HomeKpis & { kpis?: HomeKpis }>('panel_inicio', {})),
    safely(callRpc<SchemePeriod[]>('historial_esquemas', { p_usuario: userId })),
    safely(legacyDb().from<{ zonas?: string[] | null }>('perfiles').select('zonas').eq('id', userId).single())]);
  const extra = document.getElementById('mpextra'); if (!extra) return;
  extra.innerHTML = activityHtml(panel?.kpis ?? panel ?? {}, me?.zonas ?? [], (schemes ?? []).find(item => !item.hasta));
}
