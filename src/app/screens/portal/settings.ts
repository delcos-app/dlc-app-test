/**
 * Configuración → Portal del profesional: which material can be asked for and how much each time, and whether centres pay their
 * portal orders in advance. Migrated from the legacy pintarCfgPortalBase and pintarCfgPortal (v2.413.0); pintarCfgPortal stays as
 * an adapter (Configuración and the tests open it by that name).
 */
import { callRpc, legacyDb, notices, term } from '../../legacy/bridge';
import { portalPageLegacy } from '../../legacy/portal-bridge';
import { t } from '../../i18n';
import { escapeHtml } from '../../services/format';
import { helpButton } from './model';

const DEFAULT_MAX = 20, MAX_LIMIT = 1000;

interface Allowed { valor: string; max: number }
type PortalSetting = { material?: Allowed[]; pago_anticipado?: boolean } & Record<string, unknown>;

async function portalSetting(): Promise<PortalSetting> {
  const { data } = await legacyDb().from<{ valor?: PortalSetting } | null>('ajustes').select('valor').eq('clave', 'portal').maybeSingle();
  return data?.valor ?? {};
}

async function saveSetting(value: PortalSetting): Promise<boolean> {
  const { data: result, error } = await legacyDb().rpc<{ ok?: boolean }>('guardar_ajuste', { p_clave: 'portal', p_valor: value });
  if (error || result?.ok === false) { notices.toast(t('portal.settings.couldNotSave'), true); return false; }
  return true;
}

function materialRow(item: { valor: string }, chosen: Allowed | undefined): string {
  return `<label class="item u-cursor-default">
        <input type="checkbox" data-cfpm="${escapeHtml(item.valor)}" ${chosen ? 'checked' : ''}> <span class="tx"><b>${escapeHtml(item.valor)}</b></span>
        <span class="sm">${t('portal.settings.maximum')}</span> <input type="number" min="1" max="${MAX_LIMIT}" value="${chosen ? chosen.max : DEFAULT_MAX}" data-cfpx="${escapeHtml(item.valor)}" style="max-width:110px" aria-label="${t('portal.settings.maximumOf', { name: escapeHtml(item.valor) })}"></label>`;
}

function materialHtml(catalog: readonly { valor: string }[], allowed: readonly Allowed[], saved: boolean): string {
  if (!catalog.length) return `<div class="vacio">${t('portal.settings.noCatalog')}</div>`;
  return `<div class="lista" id="cfpmat">${catalog.map(item => materialRow(item, allowed.find(other => other.valor === item.valor))).join('')}</div>
      ${saved ? '' : `<p class="sm u-p-0-16">${t('portal.settings.everything')}</p>`}
      <div class="acts u-end"><button class="btn" id="cfpok">${t('common.save')}</button></div>`;
}

async function saveMaterial(box: HTMLElement, setting: PortalSetting): Promise<void> {
  const material = [...box.querySelectorAll<HTMLInputElement>('[data-cfpm]')].filter(input => input.checked).map(input => {
    const max = box.querySelector<HTMLInputElement>(`[data-cfpx="${CSS.escape(input.dataset.cfpm ?? '')}"]`);
    return { valor: input.dataset.cfpm ?? '', max: Math.max(1, Math.min(MAX_LIMIT, Number(max?.value) || DEFAULT_MAX)) };
  });
  // Without removing the rest of the setting
  if (!await saveSetting({ ...setting, material })) return;
  notices.toast(t('portal.settings.saved')); void paintPortalSettings();
}

function prepaymentHtml(on: boolean): string {
  return `<div class="card" id="cfpantc"><div class="fh"><div><h2>${t('portal.settings.prepaymentTitle')} ${helpButton(t('portal.settings.prepayment'), t('portal.settings.prepaymentHelp'))}</h2></div></div>
    <label class="opt"><input type="checkbox" id="cfpant" ${on ? 'checked' : ''}> ${t('portal.settings.prepaymentLabel')}</label>
    <div class="acts u-end"><button class="btn" id="cfpantok" type="button">${t('common.save')}</button></div></div>`;
}

async function savePrepayment(button: HTMLButtonElement): Promise<void> {
  button.disabled = true;
  const on = (document.getElementById('cfpant') as HTMLInputElement | null)?.checked ?? false, saved = await saveSetting({ ...await portalSetting(), pago_anticipado: on });
  button.disabled = false;
  if (saved) notices.toast(t(on ? 'portal.settings.prepaymentOn' : 'portal.settings.prepaymentOff'));
}

/** Paints Configuración → Portal del profesional. */
export async function paintPortalSettings(): Promise<void> {
  const start = document.getElementById('cfgcuerpo'); if (!start) return;
  start.innerHTML = `<div class="card">${portalPageLegacy.skeletonCard(t('common.loading'))}</div>`;
  const [{ data: catalog }, { data: allowed }, setting] = await Promise.all([
    legacyDb().rpc<{ valor: string }[]>('catalogo_papel', { p_papel: 'material_visita' }), callRpc<Allowed[]>('portal_material_permitido', {}), portalSetting(),
  ]);
  const box = document.getElementById('cfgcuerpo'); if (!box) return;
  box.innerHTML = `<div class="card"><div class="fh"><div><h2>${t('portal.settings.title', { ofProfessional: term('medico', { article: 'del' }) })}</h2>
      <div class="sm">${t('portal.settings.subtitle', { theProfessionals: term('medico', { number: 'p', article: 'el' }) })}</div></div></div>
    ${materialHtml(catalog ?? [], Array.isArray(allowed) ? allowed : [], Boolean(setting.material))}</div>
  ${prepaymentHtml(Boolean(setting.pago_anticipado))}`;
  const save = document.getElementById('cfpok'); if (save) save.onclick = (): void => { void saveMaterial(box, setting); };
  const savePay = document.getElementById('cfpantok') as HTMLButtonElement | null; if (savePay) savePay.onclick = (): void => { void savePrepayment(savePay); };
}
