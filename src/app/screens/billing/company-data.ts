/**
 * Facturación → Datos fiscales: the issuer's data printed on each invoice (with the web for the invoice footer) and how invoices
 * are issued (days to due date, default payment method, issue on confirming an order). Folded from legado 030 and its v2.35.0
 * layer in legado 034, which saved the web in a second write (v2.424.0); pintarEmpresaBase2 stays as an adapter (legado 056).
 */
import { notices } from '../../legacy/bridge';
import { legacyBActions, legacyBState, rawDb, type RpcAnswer } from '../../legacy/legado-b-bridge';
import { t, type MessageKey } from '../../i18n';
import { escapeHtml } from '../../services/format';
import { DEFAULT_COUNTRY } from '../../core/organisation';

interface Billing { vencimiento_dias?: number; forma_pago?: string; emitir_al_validar?: boolean }
type Company = Record<string, string | undefined>;

const FIELDS = ['razon_social', 'nif', 'direccion', 'cp', 'municipio', 'provincia', 'telefono', 'email', 'iban', 'registro', 'pie', 'web'] as const;
const DEFAULT_DUE_DAYS = 15;

function field(company: Company, key: string, label: MessageKey, extra = ''): string {
  return `<div><label for="em_${key}">${t(label)}</label><input id="em_${key}" value="${escapeHtml(company[key] ?? '')}" ${extra}></div>`;
}

function issuerHtml(company: Company): string {
  return `<h2 style="padding:0 0 8px">${t('legacyB.company.title')}</h2><p class="sm">${t('legacyB.company.hint')}</p>
    <div class="g2">${field(company, 'razon_social', 'legacyB.company.businessName')}${field(company, 'nif', 'legacyB.company.taxId')}</div>
    <div class="g2">${field(company, 'direccion', 'legacyB.company.address')}${field(company, 'cp', 'legacyB.company.postcode')}</div>
    <div class="g2">${field(company, 'municipio', 'legacyB.company.town')}${field(company, 'provincia', 'legacyB.company.province')}</div>
    <div class="g2">${field(company, 'telefono', 'legacyB.company.phone')}${field(company, 'email', 'legacyB.company.email', 'type="email"')}</div>
    <div class="g2">${field(company, 'web', 'legacyB.company.web', `placeholder="${t('legacyB.company.webPlaceholder')}"`)}<div></div></div>
    <div class="g2">${field(company, 'iban', 'legacyB.company.iban')}${field(company, 'registro', 'legacyB.company.registry')}</div>
    <label for="em_pie">${t('legacyB.company.footer')}</label><textarea id="em_pie" rows="2" placeholder="${t('legacyB.company.footerPlaceholder')}">${escapeHtml(company.pie ?? '')}</textarea>`;
}

function issuingHtml(billing: Billing): string {
  const methods = legacyBState.paymentMethods().map(method => `<option ${method.valor === billing.forma_pago ? 'selected' : ''}>${escapeHtml(method.valor)}</option>`).join('');
  return `<h2 style="padding:18px 0 8px">${t('legacyB.company.onIssue')}</h2>
    <div class="g2"><div><label for="fcv">${t('legacyB.company.dueDays')}</label><input id="fcv" type="number" min="0" value="${Number(billing.vencimiento_dias) || 0}"></div>
      <div><label for="fcf">${t('legacyB.company.defaultPayment')}</label><select id="fcf"><option value="">—</option>${methods}</select></div></div>
    <label class="opt u-mt-10"><input type="checkbox" id="fce" ${billing.emitir_al_validar ? 'checked' : ''}>
      <span><b>${t('legacyB.company.autoIssue')}</b><br><span class="sm">${t('legacyB.company.autoIssueHint')}</span></span></label>`;
}

const value = (id: string): string => (document.getElementById(id) as HTMLInputElement | null)?.value.trim() ?? '';

async function save(previous: Company): Promise<void> {
  const company: Company = {};
  FIELDS.forEach(key => { company[key] = value(`em_${key}`); });
  company.pais = previous.pais ?? DEFAULT_COUNTRY;
  if (!company.razon_social || !company.nif) { notices.toast(t('legacyB.company.required'), true); return; }
  const billing = { vencimiento_dias: Number(value('fcv')) || 0, forma_pago: value('fcf'), emitir_al_validar: Boolean((document.getElementById('fce') as HTMLInputElement | null)?.checked) };
  const rpc = rawDb().rpc;
  const [first, second] = await Promise.all([rpc('guardar_ajuste', { p_clave: 'empresa', p_valor: company }), rpc('guardar_ajuste', { p_clave: 'facturacion', p_valor: billing })]) as RpcAnswer<unknown>[];
  if (first?.error || second?.error) { notices.toast(t('legacyB.company.couldNotSave'), true); return; }
  legacyBState.setSetting('empresa', company); notices.toast(t('legacyB.company.saved'));
}

/** Paints Datos fiscales in Facturación's body (#fcuerpo). */
export async function paintCompanyData(): Promise<void> {
  await legacyBActions.loadSettings();
  const body = document.getElementById('fcuerpo'); if (!body) return;
  const settings = legacyBState.settings(), company = (settings.empresa ?? {}) as Company;
  const billing: Billing = { vencimiento_dias: DEFAULT_DUE_DAYS, forma_pago: '', emitir_al_validar: false, ...(settings.facturacion as Billing | undefined) };
  body.innerHTML = `<div class="card" style="padding-top:16px;padding-bottom:16px">${issuerHtml(company)}${issuingHtml(billing)}
    <div class="acts u-end"><button class="btn" id="emok">${t('legacyB.company.save')}</button></div></div>`;
  const ok = document.getElementById('emok'); if (ok) ok.onclick = (): void => { void save(company); };
}
