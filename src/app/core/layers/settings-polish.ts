/**
 * Configuración tidied after each section is painted (v2.215.0–v2.217.0): cards that only introduce a section move their text to the
 * header, repeated titles are hidden, number settings become rows, the vocabulary and the email state get their cards, and the
 * user counters filter by role. Folds pulirCfgBase and pulirCfg (legado 081) into one function (v2.424.0); pulirCfg stays as an adapter.
 */
import { polishLegacy } from '../../legacy/legado-d-bridge';
import { t } from '../../i18n';
import { escapeHtml } from '../../services/format';

const byId = (id: string): HTMLElement | null => document.getElementById(id);
const valueOf = (id: string): string => (document.getElementById(id) as HTMLInputElement | null)?.value ?? '';

/** Cards that only introduce the section: their text goes to the header; titles repeating the section's are hidden. */
function liftIntroductions(body: HTMLElement): void {
  const header = document.querySelector('.cfucab'), title = polishLegacy.normalise(header?.querySelector('h2')?.textContent ?? '');
  body.querySelectorAll<HTMLElement>(':scope > .card:not([data-pul])').forEach(card => {
    card.dataset.pul = '1';
    const heading = card.querySelector(':scope > h2');
    if (heading && polishLegacy.normalise(heading.textContent) === title) heading.classList.add('cfudup');
    const children = [...card.children];
    if (!children.length || !children.every(child => child.matches('h2, p'))) return;
    const text = [...card.querySelectorAll(':scope > p')].map(paragraph => (paragraph.textContent ?? '').trim()).join(' ');
    if (header && text) {
      let paragraph = header.querySelector('p');
      if (!paragraph) { paragraph = document.createElement('p'); header.appendChild(paragraph); }
      paragraph.textContent = text;
    }
    card.remove();
  });
  [...body.querySelectorAll('h2:not(.cfudup)')].find(heading => polishLegacy.normalise(heading.textContent) === title)?.classList.add('cfudup');
}

/** Visit times and the recent visit notice: setting rows with the number on the right. */
function numberRows(body: HTMLElement): void {
  body.querySelectorAll<HTMLElement>('.g2 > div:not([data-pul])').forEach(row => {
    const number = row.querySelector(':scope > .numw'); if (!number) return;
    row.dataset.pul = '1'; row.classList.add('ajfila', 'ajnum');
    const left = document.createElement('div'); left.className = 'ajtxt';
    [...row.children].filter(child => child !== number).forEach(child => left.appendChild(child));
    row.prepend(left);
    row.parentElement?.classList.add('ajlista');
  });
  const notice = byId('pfaviso');
  if (notice && !notice.dataset.pul) { notice.dataset.pul = '1'; notice.classList.add('card', 'cfgpanel'); }
}

/** Marca y vocabulario: the vocabulary in its own card, as a table. */
function vocabularyCard(body: HTMLElement): void {
  const vocabulary = body.querySelector('.mkvoc'), label = body.querySelector('.mketqbox');
  if (!vocabulary || byId('mkvoccard')) return;
  body.insertAdjacentHTML('beforeend', `<div class="card cfgpanel" id="mkvoccard"><h2 style="padding:0 0 4px">${t('legacyD.polish.vocabularyTitle')}</h2>
        <p class="sm">${t('legacyD.polish.vocabularyHint')}</p>
        <div id="mkvochueco"></div><div class="acts u-end"><button type="button" class="btn" id="mkvocok">${t('common.save')}</button></div></div>`);
  const place = byId('mkvochueco'); if (!place) return;
  if (label) place.appendChild(label);
  place.appendChild(vocabulary);
  vocabulary.querySelectorAll(':scope > label, :scope > .sm').forEach(item => { item.remove(); });
  vocabulary.insertAdjacentHTML('afterbegin', `<div class="mkvocf mkvoccab" aria-hidden="true"><span></span><span>${t('legacyD.polish.singular')}</span><span>${t('legacyD.polish.plural')}</span><span>${t('legacyD.polish.gender')}</span></div>`);
  const partNames = new Map([['s', t('legacyD.polish.singularLower')], ['p', t('legacyD.polish.pluralLower')], ['g', t('legacyD.polish.genderLower')]]);
  vocabulary.querySelectorAll<HTMLElement>('.mkvocf[data-term]').forEach(row => {
    const rowLabel = row.querySelector('label'), name = rowLabel ? (rowLabel.textContent ?? '').replace(/\s*·\s*singular\s*$/i, '').trim() : row.dataset.term ?? '';
    row.insertAdjacentHTML('afterbegin', `<b class="mkvocn">${escapeHtml(name)}</b>`);
    row.querySelectorAll<HTMLElement>('[data-tf]').forEach(input => { input.setAttribute('aria-label', `${name} · ${partNames.get(input.dataset.tf ?? '') ?? ''}`); });
  });
  const ok = byId('mkvocok'); if (ok) ok.onclick = (): void => { byId('mkok')?.click(); };
}

/** Correo y firma: its state and the test email at the top. */
function emailState(body: HTMLElement): void {
  if (!byId('coprueba') || byId('costado')) return;
  const host = valueOf('cohost').trim(), first = body.querySelector(':scope > .card');
  const sender = (valueOf('coemail') || host).trim();
  first?.insertAdjacentHTML('beforebegin', `<div class="card cfgpanel" id="costado"><div class="ajfila"><div><b>${t(host ? 'legacyD.polish.emailConnected' : 'legacyD.polish.emailMissing')}</b>
      <span class="sm">${host ? t('legacyD.polish.emailFrom', { sender: escapeHtml(sender) }) : t('legacyD.polish.emailFill')}</span></div>
      <div class="ajctl"><button type="button" class="btn sec" id="copruebaarriba">${t('legacyD.polish.emailTest')}</button></div></div></div>`);
  const top = byId('copruebaarriba');
  if (top) top.onclick = (): void => { const test = byId('coprueba'); test?.scrollIntoView({ block: 'center', behavior: 'smooth' }); test?.click(); };
}

/** Copias: the state and the button in one row. */
function backupRow(body: HTMLElement): void {
  const state = body.querySelector('.copiaest'), button = byId('copok');
  if (!state || !button || state.contains(button)) return;
  const actions = button.closest('.acts'), text = document.createElement('div');
  state.classList.add('copiafila');
  [...state.children].forEach(child => text.appendChild(child));
  state.append(text, button);
  if (actions && !actions.children.length) actions.remove();
}

function polishBase(key: string): void {
  const body = byId('cfgcuerpo');
  if (!body || polishLegacy.currentScreen() !== 'config' || !polishLegacy.polishedKeys().includes(key)) return;
  liftIntroductions(body);
  if (['rutas.horario', 'rutas.salida'].includes(key)) numberRows(body);
  if (key === 'o.marca') vocabularyCard(body);
  if (key === 'o.correo') emailState(body);
  // Correo and Copias show their own state: the pending notice above would say the same
  if (['o.correo', 'o.copias'].includes(key)) byId('cfupend')?.classList.add('hide');
  if (key === 'o.copias') backupRow(body);
}

/** Usuarios: pressing a role counter filters the list by it; «Cuentas con acceso» goes to the guests card. */
function userCounters(body: HTMLElement): void {
  const counters = body.querySelector<HTMLElement>('.cfgpanel > .kpis.vtot:not([data-pul])'); if (!counters) return;
  counters.dataset.pul = '1'; counters.classList.add('usrres');
  const roles = polishLegacy.roleNames();
  const asButton = (item: HTMLElement, title: string, action: () => void): void => {
    item.classList.add('usrresrol'); item.setAttribute('role', 'button'); item.tabIndex = 0; item.title = title;
    item.onclick = action; item.onkeydown = (event): void => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); action(); } };
  };
  counters.querySelectorAll<HTMLElement>('.kpi').forEach(item => {
    const role = (item.querySelector('span')?.textContent ?? '').trim();
    if (!roles.includes(role)) return;
    asButton(item, t('legacyD.polish.onlyRole', { role }), () => {
      const select = document.getElementById('usrrol') as HTMLSelectElement | null; if (!select) return;
      select.value = select.value === role ? '' : role; select.dispatchEvent(new Event('change', { bubbles: true }));
      counters.querySelectorAll('.usrresrol').forEach(other => { other.classList.toggle('on', other === item && Boolean(select.value)); });
    });
  });
  const guests = counters.querySelector<HTMLElement>('[data-usrinvk]');
  if (guests) asButton(guests, t('legacyD.polish.guestsTitle'), () => {
    const card = body.querySelector<HTMLElement>('.usrinvw'); if (!card) return;
    card.scrollIntoView({ behavior: 'smooth', block: 'start' }); card.classList.remove('usrinvluz'); void card.offsetWidth; card.classList.add('usrinvluz');
  });
}

/** pulirCfg: tidies the open section (every section since v2.217.0). */
export function polishSettings(): void {
  const key = polishLegacy.settingsKey();
  if (polishLegacy.currentScreen() !== 'config' || !key) return;
  if (!polishLegacy.polishedKeys().includes(key)) polishLegacy.polishedKeys().push(key);
  polishBase(key);
  const body = byId('cfgcuerpo');
  if (body && key === 'usuarios') userCounters(body);
}

/** Legado 081's Configuración listeners, in their place of the load order. */
export function installSettingsPolish(): void {
  ['scroll', 'resize'].forEach(name => { addEventListener(name, () => { polishLegacy.adjustIndexSoon(); }, { passive: true }); });
  document.addEventListener('click', event => {
    if ((event.target as Element).closest('nav.main [data-t="config"], #bnav [data-t="config"], [data-u="cfg"]')) polishLegacy.markOpenedFromMenu();
  }, true);
  // The manual's «?» goes to the chapter of the open section
  polishLegacy.setManualAnchor('config', () => {
    const key = polishLegacy.settingsKey();
    if (['datos', 'notif'].includes(key)) return 'perfil';
    if (key === 'o.plan') return 'plan';
    if (key.startsWith('o.')) return 'organizacion';
    return ['usuarios', 'roles'].includes(key) ? 'usuarios' : 'ajustes';
  });
  const settings = byId('v-config');
  if (settings) new MutationObserver(() => { if (polishLegacy.currentScreen() === 'config') requestAnimationFrame(() => { polishLegacy.polish(); }); }).observe(settings, { childList: true, subtree: true });
}
