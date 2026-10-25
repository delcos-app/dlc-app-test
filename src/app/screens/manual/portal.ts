/**
 * The manual of the professional portal (the rest of the app shows the book): first steps, a card per section with the user's
 * access, frequent questions and the search. Sections outside the plan show the plan that includes them. Migrated from the
 * legacy cargarManualBase, cargarManualPaso2 and cargarManualPaso3 (v2.410.0).
 */
import { icon, manualLegacy } from '../../legacy/bridge';
import { t } from '../../i18n';
import { escapeHtml, formatNumber } from '../../services/format';
import { accessText, cardLevel, firstSteps, PLAN_MODULES, sectionIcon } from './model';
import { showFirstStep, showSection } from './portal-info';
import { listenToSearch } from './portal-search';

function heroHtml(): string {
  const profile = manualLegacy.profile();
  return `<div class="manhero">
      <div><h1>${t('manual.title')}</h1><p>${t('manual.portal.subtitle')}</p>
        <div class="manchips"><span>👤 ${escapeHtml(profile.nombre)}</span><span>🎫 ${escapeHtml(profile.rol)}</span><span>🧩 ${t('manual.portal.modules', { count: formatNumber(manualLegacy.moduleCount()) })}</span></div></div>
      <div class="manbusca"><input id="manq" type="search" placeholder="${t('manual.portal.search')}" aria-label="${t('manual.portal.searchLabel')}"></div>
    </div>`;
}

function cardHtml(section: ManualSection): string {
  const level = cardLevel(section), pill = level >= 2 ? 'p-est' : level === 1 ? 'p-per' : 'p-anu';
  return `<button class="mancard ${level ? '' : 'bloq'}" data-mansec="${section.id}"><span class="mci">${sectionIcon(section.id)}</span>
        <b>${escapeHtml(section.t)}</b><span class="mcd">${escapeHtml(section.para)}</span><span class="pill ${pill}">${level ? t('manual.portal.yourAccess', { level: accessText(section) }) : t('manual.portal.noAccess')}</span></button>`;
}

function pageHtml(): string {
  const steps = firstSteps().map(([stepIcon, title, text, screen], index) => `<button class="manpaso" data-mira="${screen}"><span class="mpn">${index + 1}</span><span class="mpi">${stepIcon}</span><b>${escapeHtml(title)}</b><span>${escapeHtml(text)}</span></button>`).join('');
  return `${heroHtml()}
    <h2 class="mantit">${t('manual.portal.firstSteps')}</h2>
    <div class="manpasos">${steps}</div>
    <h2 class="mantit">${t('manual.portal.byModule')}</h2>
    <div class="mangrid">${manualLegacy.sections().map(cardHtml).join('')}</div>
    <h2 class="mantit">${t('manual.portal.faq')}</h2>
    <div class="card manfaqs">${manualLegacy.faq().map(([question, answer]) => `<details class="manfaq"><summary>${escapeHtml(question)}</summary><p>${escapeHtml(answer)}</p></details>`).join('')}</div>`;
}

/** Sections whose module is not in the plan: the pill names the plan that includes it and pressing shows the plan notice. */
function markOutOfPlan(page: HTMLElement): void {
  page.querySelectorAll<HTMLElement>('.mancard').forEach(card => {
    const module = card.dataset.mansec ?? '';
    if (!PLAN_MODULES.has(module) || manualLegacy.planIncludes(module)) return;
    const pill = card.querySelector('.pill');
    if (pill) { pill.className = 'pill p-plan'; pill.innerHTML = `${icon('lock')} ${t('manual.portal.inPlan', { plan: escapeHtml(manualLegacy.cheapestPlan(module) ?? t('manual.portal.premium')) })}`; }
    card.classList.add('bloq');
    card.onclick = (): void => { manualLegacy.showPlanNotice(module); };
  });
}

function bind(page: HTMLElement): void {
  page.onclick = (event): void => {
    const step = (event.target as Element | null)?.closest('[data-mira]');
    if (!step) return;
    const card = step.closest('.manpaso'), index = card ? [...page.querySelectorAll('.manpaso')].indexOf(card) : -1, chosen = firstSteps()[index];
    if (index >= 0 && chosen) showFirstStep(chosen);
  };
  page.querySelectorAll<HTMLElement>('.mancard').forEach(card => { card.onclick = (): void => { showSection(card.dataset.mansec ?? ''); }; });
}

export function paintPortalManual(): void {
  const page = document.getElementById('v-manual');
  if (!page) return;
  page.innerHTML = pageHtml();
  bind(page);
  listenToSearch();
  markOutOfPlan(page);
}
