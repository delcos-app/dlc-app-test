/**
 * Facturación → Series and Registro: «Nueva serie» goes into the table bar, and the explaining text becomes an «i» help at the start
 * of the bar. Migrated from the legacy ajustarFacturacion (v2.427.0), which stays as an adapter (legacy-c's observer calls it).
 */
import { currentScreen } from '../../../legacy/bridge';
import { billingLegacy } from '../../../legacy/billing-bridge';
import { t } from '../../../i18n';

const BAR = '.tbarra, .filtros.conbtn';

function moveNewSeries(body: HTMLElement): void {
  const add = [...body.querySelectorAll('button')].find(button => new RegExp(t('billingMore.layout.newSeries'), 'i').test(button.textContent ?? ''));
  const bar = body.querySelector(BAR);
  if (!add || !bar || add.parentElement === bar) return;
  const panelButton = bar.querySelector('.htbtn');
  add.classList.add('tbacc');
  if (panelButton) bar.insertBefore(add, panelButton); else bar.appendChild(add);
}

const flatText = (element: Element): string => {
  const copy = element.cloneNode(true) as Element;
  copy.querySelectorAll('button').forEach(button => { button.remove(); });
  return (copy.textContent ?? '').trim().replace(/\s+/g, ' ');
};

function helpInBar(body: HTMLElement, section: string): void {
  const bar = body.querySelector(BAR);
  if (!bar || bar.querySelector('.ai')) return;
  const texts = [body.querySelector('.panel > .cuenta'), section === 'series' ? body.querySelector('.panel > p.sm') : null].filter((item): item is Element => item !== null);
  if (!texts.length) return;
  const help = document.createElement('button');
  help.type = 'button'; help.className = 'ai'; help.textContent = 'i'; help.setAttribute('aria-label', t('billingMore.layout.help'));
  help.dataset.ayudaTit = t(section === 'series' ? 'billingMore.layout.seriesTitle' : 'billingMore.layout.logTitle');
  help.dataset.ayudaTxt = texts.map(flatText).join(' ');
  bar.insertBefore(help, bar.firstChild); texts.forEach(item => { item.remove(); });
}

export function arrangeBilling(): void {
  if (currentScreen() !== 'facturacion') return;
  const body = document.getElementById('fcuerpo'), section = billingLegacy.section();
  if (!body) return;
  if (section === 'series') moveNewSeries(body);
  if (section === 'series' || section === 'registro') helpInBar(body, section);
}
