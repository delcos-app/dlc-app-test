/**
 * A section with parts (Rutas, Cartera y visitas, Stock y material…) is one page with its parts one under another. Each part paints
 * in its own section and works as before: its pieces with a fixed id (#cfgcuerpo, #fcuerpo, the #dbody panel, #v-admin) are given
 * back when it is touched, and the other parts keep theirs aside («asleep»). Migrated from the legacy cfgSecDormir, cfgSecDespertar,
 * cfgApilar and cfgEstable (v2.422.0).
 */
import { t } from '../../../i18n';
import { shellLegacy, type ActivePanel, type SettingsItem, type SettingsPart } from '../../../legacy/shell-bridge';
import { escapeHtml } from '../../../services/format';

/** The ids each part keeps for itself while another part is active. */
const SECTION_IDS = ['fcuerpo', 'dbody', 'v-admin'];
const STEADY_QUIET_MS = 150, STEADY_FIRST_MS = 200, STEADY_DEFAULT_MAX_MS = 5000, PART_MAX_MS = 4000;

type Section = HTMLElement & { __panel?: ActivePanel | null };

let activeSection: Section | null = null;

const byId = (id: string): HTMLElement | null => document.getElementById(id);

/** Forgets the active part (another section is being opened). */
export function forgetActiveSection(): void { activeSection = null; }

/** Keeps a part's fixed ids aside (as data-idd) while another part is active. */
export function sleepSection(section: Element): void {
  section.querySelectorAll<HTMLElement>(SECTION_IDS.map(id => `#${id}`).join(',')).forEach(element => { element.dataset.idd = element.id; element.removeAttribute('id'); });
  const content = section.querySelector(':scope > .cfgsecc'); if (content?.id === 'cfgcuerpo') content.removeAttribute('id');
}

/** Gives a part its fixed ids back (and its panel, if it has one) and puts the others asleep. */
export function wakeSection(section: Section | null): void {
  if (!section || activeSection === section) return;
  document.querySelectorAll('#cfgcuerpo-hub .cfgsec').forEach(other => { if (other !== section) sleepSection(other); });
  const old = byId('cfgcuerpo'); if (old && !section.contains(old)) old.removeAttribute('id');
  const content = section.querySelector(':scope > .cfgsecc'); if (content) content.id = 'cfgcuerpo';
  section.querySelectorAll<HTMLElement>('[data-idd]').forEach(element => { element.id = element.dataset.idd ?? ''; delete element.dataset.idd; });
  // The usual window (#dbody) only steps aside if the part has its panel
  if (section.__panel) {
    const modal = document.querySelector('dialog #dbody'); if (modal) modal.id = 'dbody-modal';
    shellLegacy.setActivePanel(section.__panel);
  } else {
    const modal = byId('dbody-modal'); if (modal && !document.querySelector('#dbody')) modal.id = 'dbody';
    shellLegacy.setActivePanel(null);
  }
  activeSection = section; shellLegacy.setKey(section.dataset.cfgsec ?? '');
}

/** Resolves when the element stops changing and shows no loader (or after `max` ms). */
export const steady = (element: Element, max = STEADY_DEFAULT_MAX_MS): Promise<void> => new Promise(done => {
  const timers: { quiet?: ReturnType<typeof setTimeout>; limit?: ReturnType<typeof setTimeout> } = {};
  const observer = new MutationObserver(() => { clearTimeout(timers.quiet); timers.quiet = setTimeout(ready, STEADY_QUIET_MS); });
  function ready(): void {
    if (element.querySelector('.cfgcarga, .giro, .spin')) { timers.quiet = setTimeout(ready, STEADY_QUIET_MS); return; }
    observer.disconnect(); clearTimeout(timers.limit); done();
  }
  observer.observe(element, { childList: true, subtree: true, attributes: true });
  timers.quiet = setTimeout(ready, STEADY_FIRST_MS);
  timers.limit = setTimeout(() => { observer.disconnect(); clearTimeout(timers.quiet); done(); }, max);
});

const partsHtml = (parts: readonly SettingsPart[]): string =>
  `<div class="cfgsecs" hidden>${parts.map(part => `<section class="cfgsec" data-cfgsec="${part.k}"><h3 class="cfgsectit">${escapeHtml(part.t)}</h3><div class="cfgsecc"></div></section>`).join('')}</div><div class="cfgcarga cargandolocal"><span class="giro"></span> ${t('settingsShell.loading')}</div>`;

/** Paints one part in its section, awaiting its painter (a window in the panel included). */
async function paintPart(section: Section, part: SettingsPart): Promise<void> {
  section.__panel = null; shellLegacy.setActivePanel(null);
  const modal = byId('dbody-modal'); if (modal && !document.querySelector('#dbody')) modal.id = 'dbody';
  wakeSection(section);
  try { await part.r(); } catch { /* the part shows its own error */ }
  await steady(section, PART_MAX_MS);
  if (shellLegacy.activePanel() && section.querySelector('[data-panel]')) section.__panel = shellLegacy.activePanel();
  shellLegacy.polish();
  // No repeated title: if the part already starts with its own, the section's goes
  if ([...section.querySelectorAll<HTMLElement>('.cfgsecc h2')].some(title => title.offsetParent)) {
    const own = section.querySelector<HTMLElement>('.cfgsectit'); if (own) own.hidden = true;
  }
  activeSection = null;
}

/** Shows the painted parts at once and wakes the asked one (scrolling to it if it is not the first). */
function showParts(hub: HTMLElement, focus: SettingsPart | null, notFirst: boolean): void {
  const box = hub.querySelector<HTMLElement>('.cfgsecs'); if (box) box.hidden = false;
  hub.querySelector(':scope > .cfgcarga')?.remove();
  const first = (focus && hub.querySelector<Section>(`.cfgsec[data-cfgsec="${focus.k}"]`)) ?? hub.querySelector<Section>('.cfgsec');
  wakeSection(first);
  if (focus && notFirst && first) first.scrollIntoView({ block: 'start', behavior: 'smooth' });
}

/** Paints every part hidden and shows the page at once (no ghosts), then wakes the asked part. */
export async function stackSections(item: SettingsItem, focus: SettingsPart | null): Promise<void> {
  const hub = byId('cfgcuerpo-hub'); if (!hub) return;
  const parts = item.hijos ?? [];
  activeSection = null;
  hub.innerHTML = partsHtml(parts);
  hub.dataset.apilado = '1';
  for (const section of hub.querySelectorAll<Section>('.cfgsec')) {
    if (!hub.isConnected) return;
    const part = parts.find(candidate => candidate.k === section.dataset.cfgsec);
    if (part) await paintPart(section, part);
  }
  showParts(hub, focus, focus !== parts[0]);
}
