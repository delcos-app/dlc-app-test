/**
 * The company settings and catalogs: loading the settings (AJUSTES, then the label and the organisation menu), the classifier
 * catalogs (CAT, kept on the device for when there is no connection) with the custom fields, the brand in the page and the logo
 * of the invoice. The state stays in the legacy globals AJUSTES, CAT and MARCA, which many screens and the tests read. Migrated
 * from the legacy cargarAjustes*, cargarCatalogos*, aplicarMarca* and logoData (v2.428.0).
 */
import { legacyDb } from '../../legacy/bridge';
import { settingsCoreLegacy } from '../../legacy/settings-core-bridge';
import { t } from '../../i18n';

const CATALOGS_KEY = 'dlc-cat', NEUTRAL_LOGO = 'logo-app.png';
const LOGO_PLACES = 'header .logo, .lbox img, #bootsplash img';

export { NEUTRAL_LOGO };

/** Reads the company settings, then applies the label of the contacts and, with a session, the organisation menu. */
export async function loadSettings(): Promise<void> {
  const { data } = await legacyDb().rpc<Record<string, unknown>>('ajustes_lista');
  settingsCoreLegacy.setSettings(data ?? {});
  settingsCoreLegacy.applyLabel();
  if (settingsCoreLegacy.hasProfile()) settingsCoreLegacy.organisationMenu();
}

function keepOrRestoreCatalogs(catalogs: Record<string, unknown[]>): void {
  try {
    const empty = Object.values(catalogs).every(list => !list.length);
    if (!empty) { localStorage.setItem(CATALOGS_KEY, JSON.stringify(catalogs)); return; }
    const stored = JSON.parse(localStorage.getItem(CATALOGS_KEY) ?? 'null') as Record<string, unknown[] | undefined> | null;
    if (stored) Object.keys(catalogs).forEach(key => { const list = stored[key]; if (list?.length) catalogs[key] = list; });
  } catch { /* without the device copy */ }
}

/** Reads every classifier catalog (and, without waiting, the custom fields); offline, the copy kept on the device is used. */
export async function loadCatalogs(): Promise<void> {
  const catalogs = settingsCoreLegacy.catalogs(), keys = Object.keys(catalogs);
  const answers = await Promise.all(keys.map(key => legacyDb().rpc<unknown[]>('catalogo_papel', { p_papel: key })));
  keys.forEach((key, index) => { catalogs[key] = answers[index]?.data ?? []; });
  settingsCoreLegacy.loadCustomFields().catch(() => undefined);
  keepOrRestoreCatalogs(catalogs);
}

/** The company name and logo in the page title, the header, the sign-in box and the start screen (the neutral logo without one). */
export function applyBrand(): void {
  const name = settingsCoreLegacy.appName(), logo = settingsCoreLegacy.brand().logo;
  document.title = name;
  document.querySelectorAll<HTMLMetaElement>('meta[name="apple-mobile-web-app-title"]').forEach(meta => { meta.content = name; });
  document.querySelectorAll<HTMLImageElement>(LOGO_PLACES).forEach(image => { image.src = logo ? logo : NEUTRAL_LOGO; image.alt = name; });
  const title = document.querySelector('.lbox h1'); if (title) title.textContent = name;
  const turn = document.querySelector('#girar span:last-child'); if (turn) turn.textContent = t('settingsCore.upright', { name });
}

/** The logo of the invoice: only the company's own, unless it chose not to print it. */
export function invoiceLogo(): Promise<string | null> {
  const logo = settingsCoreLegacy.brand().logo, brandSettings = settingsCoreLegacy.settings().marca as { logo_factura?: boolean } | undefined;
  if (!logo || brandSettings?.logo_factura === false) return Promise.resolve(null);
  settingsCoreLegacy.setInvoiceLogo(logo);
  return Promise.resolve(logo);
}
