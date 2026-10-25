/**
 * Configuración → Empresa → «Correo y firma»: the sending account (provider, SMTP, sender), the signature with its preview and the
 * email templates, all painted at once. Migrated from the legacy pintarCorreo (v2.417.0); pintarCorreo stays as an adapter (the
 * Configuración tree and the old tabs open it by that name).
 */
import { callRpc } from '../../../legacy/bridge';
import { settingsExtraLegacy } from '../../../legacy/settings3-bridge';
import { t, type MessageKey } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { orFallback } from '../../../services/values';
import { bindSaving, type EmailConfig, type Signature } from './account-save';
import { bindTemplatesCard, templatesCardHtml } from './template-list';

const DEFAULT_PORT = 465, DEFAULT_COLOUR = '#15528F';
const HINTS = new Map<string, MessageKey>(['google', 'microsoft', 'mailjet', 'ionos', 'ovh', 'otro'].map(key => [key, `settingsExtra.email.hints.${key}` as MessageKey]));

const field = (id: string, label: string, value: unknown, extra = ''): string =>
  `<div><label for="${id}">${label}</label><input id="${id}" value="${escapeHtml(String(value ?? ''))}" ${extra}></div>`;

interface Company { razon_social?: string; telefono?: string; web?: string; direccion?: string; municipio?: string; email?: string }

const companyOf = (): Company => (settingsExtraLegacy.setting('empresa') ?? {}) as Company;

function signatureOf(config: EmailConfig): Signature {
  const company = companyOf();
  return {
    nombre: settingsExtraLegacy.profileName(), cargo: '', empresa: orFallback(company.razon_social, settingsExtraLegacy.appName()), telefono: company.telefono ?? '', telefono2: '',
    web: company.web ?? '', direccion: [company.direccion, company.municipio].filter(Boolean).join(', '), aviso: '', logo: 'si', ...config.firma,
  };
}

function accountHtml(config: EmailConfig): string {
  const providers = settingsExtraLegacy.emailProviders(), company = companyOf();
  const options = Object.entries(providers).map(([key, provider]) => `<option value="${key}" ${config.proveedor === key ? 'selected' : ''}>${provider.n}</option>`).join('');
  const sender = orFallback(config.remitente_email, orFallback(company.email, settingsExtraLegacy.profileEmail()));
  return `<div class="card cfgpanel"><h2>${t('settingsExtra.email.title')}</h2>
      <p class="sm">${t('settingsExtra.email.intro')}</p>
      <div class="g2"><div><label for="coprov">${t('settingsExtra.email.provider')}</label><select id="coprov"><option value="">${t('settingsExtra.email.chooseProvider')}</option>${options}</select></div><div></div></div>
      <div class="avisoh ${config.proveedor ? '' : 'hide'}" id="coayuda"><span>${escapeHtml(providers[config.proveedor]?.ayuda ?? '')}</span></div>
      <div class="g2">${field('cohost', t('settingsExtra.email.host'), config.host, `placeholder="${t('settingsExtra.email.hostPlaceholder')}"`)}
        <div class="g2 copuerg"><div><label for="copuer">${t('settingsExtra.email.port')}</label><input id="copuer" type="number" value="${escapeHtml(String(config.puerto))}"></div>
          <div><label for="coseg">${t('settingsExtra.email.security')}</label><select id="coseg"><option value="ssl" ${config.seguridad === 'ssl' ? 'selected' : ''}>SSL</option><option value="starttls" ${config.seguridad === 'starttls' ? 'selected' : ''}>STARTTLS</option></select></div></div></div>
      <div class="g2">${field('cousu', t('settingsExtra.email.user'), config.usuario, 'autocomplete="off"')}
        <div><label for="copass">${t('settingsExtra.email.password')}</label><input id="copass" type="password" autocomplete="new-password" placeholder="${config.hay_clave ? t('settingsExtra.email.passwordSaved') : ''}"></div></div>
      <div class="g2">${field('conom', t('settingsExtra.email.senderName'), config.remitente_nombre, `placeholder="${escapeHtml(settingsExtraLegacy.appName())}"`)}${field('coemail', t('settingsExtra.email.senderEmail'), sender, `type="email" placeholder="${t('settingsExtra.email.senderEmailPlaceholder')}"`)}</div>
      <p class="sm">${t('settingsExtra.email.passwordPrivate')}</p></div>`;
}

function signatureHtml(config: EmailConfig, signature: Signature): string {
  return `<div class="card cfgpanel"><h2>${t('settingsExtra.email.signature')}</h2>
      <p class="sm">${t('settingsExtra.email.signatureIntro')}</p>
      <div class="firmaed"><div>
        <div class="g2">${field('fnom', t('settingsExtra.email.name'), signature.nombre)}${field('fcar', t('settingsExtra.email.jobTitle'), signature.cargo, `placeholder="${t('settingsExtra.email.jobTitlePlaceholder')}"`)}</div>
        <div class="g2">${field('femp', t('settingsExtra.email.company'), signature.empresa)}${field('fweb', t('settingsExtra.email.web'), signature.web, `placeholder="${t('settingsExtra.email.webPlaceholder')}"`)}</div>
        <div class="g2">${field('ftel', t('settingsExtra.email.phone'), signature.telefono)}${field('ftel2', t('settingsExtra.email.otherPhone'), signature.telefono2)}</div>
        ${field('fdir', t('settingsExtra.email.address'), signature.direccion)}
        <label for="faviso">${t('settingsExtra.email.legalNotice')}</label><textarea id="faviso" rows="3" placeholder="${t('settingsExtra.email.legalNoticePlaceholder')}">${escapeHtml(signature.aviso ?? '')}</textarea>
        <div class="g2"><div><label for="fcolor">${t('settingsExtra.email.colour')}</label><input id="fcolor" type="color" value="${escapeHtml(config.color || DEFAULT_COLOUR)}" style="height:44px"></div>
          <div><label class="vfswitch"><input type="checkbox" id="flogo" ${signature.logo !== 'no' ? 'checked' : ''}><span class="sw"></span><span>${t('settingsExtra.email.includeLogo')}</span></label></div></div>
      </div><div><div class="sm" style="margin-bottom:6px">${t('settingsExtra.email.preview')}</div><div class="firmaprev" id="fprev"></div></div></div></div>`;
}

const buttonsHtml = (): string => `<div class="card cfgpanel"><div class="acts u-end u-wrap u-m-0">
      <button class="btn sec" id="coprueba">${t('settingsExtra.email.sendTest')}</button><button class="btn" id="cook">${t('settingsExtra.email.save')}</button></div>
      <p class="sm" id="comsg"></p></div>`;

const text = (id: string): string => ((document.getElementById(id) as HTMLInputElement | null)?.value ?? '').trim();

function previewHtml(): string {
  const colour = text('fcolor'), logo = (document.getElementById('flogo') as HTMLInputElement | null)?.checked ? settingsExtraLegacy.brandLogo() : null;
  const phones = [text('ftel'), text('ftel2')].filter(Boolean);
  const lines = `${text('fnom') ? `<b style="color:${colour}">${escapeHtml(text('fnom'))}</b><br>` : ''}${text('fcar') ? `${escapeHtml(text('fcar'))}<br>` : ''}${text('femp') ? `<b>${escapeHtml(text('femp'))}</b><br>` : ''}
        ${phones.map(escapeHtml).join(' · ')}${phones.length ? '<br>' : ''}${text('fweb') ? `<span style="color:${colour}">${escapeHtml(text('fweb'))}</span><br>` : ''}${text('fdir') ? escapeHtml(text('fdir')) : ''}`;
  return `<div style="height:4px;background:${colour};border-radius:4px;margin-bottom:12px"></div><p style="margin:0 0 12px">${t('settingsExtra.email.previewText')}</p>
      <div class="fprevfirma">${logo ? `<img src="${escapeHtml(logo)}" alt="">` : ''}<div>${lines}</div></div>
      ${text('faviso') ? `<p class="fprevaviso">${escapeHtml(text('faviso'))}</p>` : ''}`;
}

function bindPreview(): void {
  const paint = (): void => { const box = document.getElementById('fprev'); if (box) box.innerHTML = previewHtml(); };
  for (const id of ['fnom', 'fcar', 'femp', 'fweb', 'ftel', 'ftel2', 'fdir', 'faviso', 'fcolor', 'flogo']) document.getElementById(id)?.addEventListener('input', paint);
  const logo = document.getElementById('flogo'); if (logo) logo.onchange = paint;
  paint();
}

/** What each provider asks as identifier and as password. */
function bindProvider(config: EmailConfig): void {
  const select = document.getElementById('coprov') as HTMLSelectElement | null; if (!select) return;
  const input = (id: string): HTMLInputElement | null => document.getElementById(id) as HTMLInputElement | null;
  const hints = (): void => {
    const key = HINTS.get(select.value), [user = '', password = ''] = (key ? t(key) : '|').split('|');
    const userInput = input('cousu'), passwordInput = input('copass');
    if (userInput) userInput.placeholder = user;
    if (!config.hay_clave && passwordInput) passwordInput.placeholder = password;
  };
  hints();
  select.onchange = (): void => {
    hints();
    const provider = settingsExtraLegacy.emailProviders()[select.value]; if (!provider) return;
    const host = input('cohost'), port = input('copuer'), security = document.getElementById('coseg') as HTMLSelectElement | null, help = document.getElementById('coayuda');
    if (provider.host && host) host.value = provider.host;
    if (port) port.value = String(provider.puerto);
    if (security) security.value = provider.seg;
    help?.classList.remove('hide'); const span = help?.querySelector('span'); if (span) span.textContent = provider.ayuda;
  };
}

export async function paintEmail(): Promise<void> {
  const [{ data }] = await Promise.all([callRpc<Partial<EmailConfig>>('correo_config', {}), settingsExtraLegacy.loadSettings()]);
  const config: EmailConfig = { proveedor: '', host: '', puerto: DEFAULT_PORT, seguridad: 'ssl', usuario: '', remitente_nombre: '', remitente_email: '', color: DEFAULT_COLOUR, firma: {}, ...data };
  const box = document.getElementById('cfgcuerpo'); if (!box) return;
  box.innerHTML = `
    ${accountHtml(config)}
    ${signatureHtml(config, signatureOf(config))}
    ${templatesCardHtml()}
    ${buttonsHtml()}`;
  bindPreview();
  bindProvider(config);
  bindSaving(config);
  bindTemplatesCard();
  settingsExtraLegacy.validateEmailLive(document.getElementById('coemail'));
}
