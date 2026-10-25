/**
 * Configuración → Seguridad → Auditoría: who changed what and when, filtered by period, user and entity, with «Deshacer» for one
 * change or for everything a person did since the start of the period. Migrated from the legacy pintarAuditoria (v2.415.0).
 */
import { callRpc, cardSectionsLegacy, legacyDb, term } from '../../../legacy/bridge';
import { settingsLegacy, type PeriodRange } from '../../../legacy/settings1-bridge';
import { t, type MessageKey } from '../../../i18n';
import { escapeHtml, formatNumber } from '../../../services/format';

const LIMIT = 500;
const ADDED = 'Alta', REMOVED = 'Baja';

interface AuditEntry { id: number; accion: string; entidad: string; usuario: string; creado_en: string; detalle: unknown }

const keyed = (key: MessageKey) => (): string => t(key);

/** Entity names as the database stores them, and how they read. */
const ENTITIES = new Map<string, () => string>([
  ['cuentas', () => term('medico', { capital: 'C' })], ['ubicaciones', () => term('consulta', { capital: 'C' })], ['actividades', () => term('visita', { capital: 'C' })],
  ['atribuciones', keyed('settings.audit.portfolio')], ['agenda', keyed('settings.audit.appointment')], ['rutas', keyed('settings.audit.route')],
  ['pedidos', keyed('settings.audit.order')], ['perfiles', keyed('settings.audit.userEntity')], ['productos', keyed('settings.audit.product')],
  ['contactos', () => term('paciente', { capital: 'C' })],
]);

const entityName = (entity: string): string => ENTITIES.get(entity)?.() ?? entity;

function frameHtml(users: readonly { id: string; nombre: string }[]): string {
  return `<h2>${t('settings.audit.title')}<span class="n" id="audn">…</span></h2>
    <p class="sm">${t('settings.audit.hint')}</p>
    <div class="filtros" style="border:0;padding:10px 16px">
      <div id="audper"></div>
      <div><label for="ausr">${t('settings.audit.user')}</label><select id="ausr"><option value="">${t('settings.audit.all')}</option>
        ${users.map(user => `<option value="${user.id}">${escapeHtml(user.nombre)}</option>`).join('')}</select></div>
      <div><label for="aent">${t('settings.audit.entity')}</label><select id="aent"><option value="">${t('settings.audit.allEntities')}</option>
        ${[...ENTITIES.keys()].map(key => `<option value="${key}">${entityName(key)}</option>`).join('')}</select></div></div>
    <div id="auddes"></div>
    <div class="lista" id="audlista"></div>`;
}

const iconClass = (action: string): string => (action === REMOVED ? 'w' : action === ADDED ? 'o' : '');
const iconText = (action: string): string => (action === ADDED ? '+' : action === REMOVED ? '−' : '✎');
const when = (date: string): string => new Date(date).toLocaleString('es', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

function rowHtml(entry: AuditEntry): string {
  return `<div class="item u-cursor-default">
      <span class="ic ${iconClass(entry.accion)}">${iconText(entry.accion)}</span>
      <span class="tx"><b>${escapeHtml(entry.accion)} · ${escapeHtml(entityName(entry.entidad))}</b>
        <span class="sm">${escapeHtml(entry.usuario)} · ${when(entry.creado_en)}</span>
        <span class="sm">${escapeHtml(cardSectionsLegacy.detailSummary(entry.detalle))}</span></span>${settingsLegacy.undoable(entry) ? `<button type="button" class="btn sec" data-audx="${entry.id}">${t('settings.audit.undo')}</button>` : ''}</div>`;
}

const selected = (id: string): HTMLSelectElement | null => document.getElementById(id) as HTMLSelectElement | null;

const chosen = (id: string): string => selected(id)?.value ?? '';

function read(period: PeriodRange): PromiseLike<{ data: AuditEntry[] | null }> {
  return callRpc<AuditEntry[]>('auditoria_lista', { p_entidad: chosen('aent') || null, p_usuario: chosen('ausr') || null, p_desde: period.desde, lim: LIMIT });
}

function bindUndo(list: HTMLElement, period: PeriodRange): void {
  list.querySelectorAll<HTMLElement>('[data-audx]').forEach(button => {
    button.onclick = (): void => { cardSectionsLegacy.undo(Number(button.dataset.audx), () => { void paintList(); }); };
  });
  const user = selected('ausr');
  settingsLegacy.undoPersonBox(document.getElementById('auddes'), {
    userId: chosen('ausr'), from: period.desde, name: user?.selectedOptions[0]?.textContent ?? '', then: () => { void paintList(); },
  });
}

async function paintList(): Promise<void> {
  settingsLegacy.showLoading(document.getElementById('audlista'), t('settings.audit.filtering'));
  const period = settingsLegacy.periodRange(document.getElementById('audper'));
  const { data } = await read(period);
  // The tab may have changed while it was loading
  const count = document.getElementById('audn'), list = document.getElementById('audlista');
  if (!count || !list) return;
  const until = period.hasta;
  const entries = (data ?? []).filter(entry => !until || String(entry.creado_en).slice(0, 10) <= until);
  count.textContent = formatNumber(entries.length) + (entries.length === LIMIT ? '+' : '');
  list.innerHTML = entries.map(rowHtml).join('') || `<div class="vacio">${t('settings.audit.empty')}</div>`;
  bindUndo(list, period);
}

export async function paintAudit(): Promise<void> {
  settingsLegacy.showLoading(document.getElementById('admcuerpo'), t('settings.audit.loading'));
  const { data: users } = await legacyDb().rpc<{ id: string; nombre: string }[]>('usuarios_lista');
  const sorted = (users ?? []).slice().sort((first, second) => String(first.nombre).localeCompare(String(second.nombre), 'es'));
  const box = document.getElementById('admcuerpo');
  if (!box) return;
  box.innerHTML = frameHtml(sorted);
  settingsLegacy.mountPeriod(document.getElementById('audper'), { id: 'auditoria', valor: '7d', alCambiar: () => { void paintList(); } });
  for (const id of ['ausr', 'aent']) { const select = selected(id); if (select) select.onchange = (): void => { void paintList(); }; }
  void paintList();
}
