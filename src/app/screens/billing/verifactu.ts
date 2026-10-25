/**
 * Facturación → Configuración → «VeriFactu»: what is ready (numbering, chained record, QR), what is missing (sending to the tax
 * agency) and its settings. Migrated from the legacy pintarVerifactu (v2.413.0); pintarVerifactu stays as an adapter
 * (Configuración and Organización open it by that name).
 */
import { callRpc, legacyDb, notices } from '../../legacy/bridge';
import { billingLegacy } from '../../legacy/billing-bridge';
import { t, type MessageKey } from '../../i18n';
import { escapeHtml, formatNumber } from '../../services/format';

interface VerifactuSettings { activo: boolean; modalidad: string; entorno: string }
interface Chain { facturas?: number; rotas?: number; primera_rota?: string | null }
interface BillingEvent { tipo: string; fecha: string }

const DEFAULTS: VerifactuSettings = { activo: false, modalidad: 'verifactu', entorno: 'pruebas' };
const MODES: readonly (readonly [string, MessageKey, MessageKey])[] = [
  ['verifactu', 'billing.verifactu.modeVerifactu', 'billing.verifactu.modeVerifactuText'],
  ['no_verifactu', 'billing.verifactu.modeOther', 'billing.verifactu.modeOtherText'],
];

function heroHtml(settings: VerifactuSettings): string {
  const pill = settings.activo ? `<span class="pill p-est">${t('billing.verifactu.on')}</span>` : `<span class="pill p-per">${t('billing.verifactu.off')}</span>`;
  return `<div class="vfhero ${settings.activo ? 'on' : ''}">
      <div class="vfico">🛡️</div>
      <div><h2>VeriFactu ${pill}</h2>
        <p>${t('billing.verifactu.intro')}</p></div></div>`;
}

function stepsHtml(settings: VerifactuSettings, chain: Chain): string {
  const intact = !chain.rotas;
  const chainText = intact ? t('billing.verifactu.chainOk') : t('billing.verifactu.chainBroken', { from: escapeHtml(chain.primera_rota ?? '') });
  return `<div class="vfpasos">
      <div class="vfpaso hecho"><span>✓</span><b>${t('billing.verifactu.step1')}</b><em>${t('billing.verifactu.step1Text')}</em></div>
      <div class="vfpaso hecho"><span>✓</span><b>${t('billing.verifactu.step2')}</b><em>${t('billing.verifactu.step2Text', { count: formatNumber(chain.facturas ?? 0), chain: chainText })}</em></div>
      <div class="vfpaso ${settings.activo ? 'hecho' : ''}"><span>${settings.activo ? '✓' : '3'}</span><b>${t('billing.verifactu.step3')}</b><em>${t(settings.activo ? 'billing.verifactu.step3On' : 'billing.verifactu.step3Off')}</em></div>
      <div class="vfpaso pend"><span>🔒</span><b>${t('billing.verifactu.step4')}</b><em>${t('billing.verifactu.step4Text')}</em></div>
    </div>`;
}

function whatHtml(last: BillingEvent | undefined): string {
  const lastText = last ? t('billing.verifactu.lastEvent', { type: escapeHtml(last.tipo), date: new Date(last.fecha).toLocaleDateString('es-ES') }) : '';
  return `<div class="card vfcard"><h3>${t('billing.verifactu.whatTitle')}</h3><ul class="manlist">
        <li><span>🔢</span><span>${t('billing.verifactu.what1')}</span></li>
        <li><span>🔗</span><span>${t('billing.verifactu.what2')}</span></li>
        <li><span>🧾</span><span>${t('billing.verifactu.what3')}</span></li>
        <li><span>📋</span><span>${t('billing.verifactu.what4', { last: lastText })}</span></li></ul></div>`;
}

function settingsHtml(settings: VerifactuSettings): string {
  const modes = MODES.map(([key, name, text]) => `<label class="vfmodo"><input type="radio" name="vfm" value="${key}" ${settings.modalidad === key ? 'checked' : ''}><b>${t(name)}</b><span>${t(text)}</span></label>`).join('');
  return `<div class="card vfcard"><h3>${t('billing.verifactu.settings')}</h3>
        <label class="vfswitch"><input type="checkbox" id="vfa" ${settings.activo ? 'checked' : ''}><span class="sw"></span>
          <span><b>${t('billing.verifactu.activate')}</b><br><span class="sm">${t('billing.verifactu.activateHint')}</span></span></label>
        <label>${t('billing.verifactu.mode')}</label>
        <div class="vfmodos">
          ${modes}</div>
        <label for="vfe">${t('billing.verifactu.environment')}</label><select id="vfe"><option value="pruebas" ${settings.entorno === 'pruebas' ? 'selected' : ''}>${t('billing.verifactu.testing')}</option><option value="produccion" ${settings.entorno === 'produccion' ? 'selected' : ''}>${t('billing.verifactu.production')}</option></select>
        <div class="acts u-end"><button class="btn" id="vfok">${t('common.save')}</button></div></div>`;
}

async function save(current: VerifactuSettings): Promise<void> {
  const next: VerifactuSettings = {
    activo: Boolean((document.getElementById('vfa') as HTMLInputElement | null)?.checked),
    modalidad: document.querySelector<HTMLInputElement>('[name=vfm]:checked')?.value ?? DEFAULTS.modalidad,
    entorno: (document.getElementById('vfe') as HTMLSelectElement | null)?.value ?? DEFAULTS.entorno,
  };
  if (next.activo !== current.activo) {
    const on = next.activo;
    const sure = await notices.confirm(t(on ? 'billing.verifactu.activateText' : 'billing.verifactu.deactivateText'),
      { titulo: t(on ? 'billing.verifactu.activateTitle' : 'billing.verifactu.deactivateTitle'), ok: t(on ? 'billing.verifactu.activateOk' : 'billing.verifactu.deactivateOk') });
    if (!sure) return;
  }
  const { error } = await legacyDb().rpc('guardar_ajuste', { p_clave: 'verifactu', p_valor: next });
  if (error) { notices.toast(t('billing.verifactu.couldNotSave'), true); return; }
  billingLegacy.setSetting('verifactu', next); notices.toast(t('billing.verifactu.saved')); void paintVerifactu();
}

export async function paintVerifactu(): Promise<void> {
  await billingLegacy.loadSettings();
  const settings = { ...DEFAULTS, ...(billingLegacy.setting('verifactu') as Partial<VerifactuSettings> | undefined) };
  const [{ data: chain }, { data: events }] = await Promise.all([callRpc<Chain>('verificar_cadena', {}), callRpc<BillingEvent[]>('eventos_facturacion_lista', { lim: 1 })]);
  const body = document.getElementById('fcuerpo'); if (!body) return;
  body.innerHTML = `
    ${heroHtml(settings)}
    ${stepsHtml(settings, chain ?? {})}
    <div class="vfgrid">
      ${whatHtml((events ?? [])[0])}
      ${settingsHtml(settings)}
    </div>`;
  const ok = document.getElementById('vfok'); if (ok) ok.onclick = (): void => { void save(settings); };
}
