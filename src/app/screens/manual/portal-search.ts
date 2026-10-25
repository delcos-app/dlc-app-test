/**
 * The search of the professional portal manual: every sentence of every section, its help and the frequent questions, matched
 * word by word (accents ignored), with the words marked; a result opens its section. Migrated from the legacy cargarManualPaso1
 * and the result listener of cargarManualPaso2 (v2.410.0).
 */
import { manualLegacy } from '../../legacy/bridge';
import { t } from '../../i18n';
import { escapeHtml } from '../../services/format';
import { helpLines } from './model';
import { showSection } from './portal-info';

const MIN_QUERY = 2, MAX_HITS = 12;

interface Entry { readonly section: string | null; readonly module: string; readonly text: string }

const stripTags = (text: string): string => text.replace(/<[^>]+>/g, '');
const normalise = (text: string): string => stripTags(text).toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function searchIndex(): Entry[] {
  const entries: Entry[] = [];
  for (const section of manualLegacy.sections()) {
    const add = (text: string): void => { entries.push({ section: section.id, module: section.t, text }); };
    add(section.para);
    section.hacer.forEach(([, text]) => { add(text); });
    (section.config ?? []).forEach(place => { add(t('manual.portal.configuredIn', { place })); });
    helpLines(section.id, false).forEach(line => { add(stripTags(line)); });
  }
  manualLegacy.faq().forEach(([question, answer]) => { entries.push({ section: null, module: t('manual.portal.faqHit'), text: `${question} — ${answer}` }); });
  return entries;
}

function hitHtml(entry: Entry, words: readonly string[]): string {
  let text = escapeHtml(stripTags(entry.text));
  words.forEach(word => { text = text.replace(new RegExp(`(${escapeRegExp(word)})`, 'ig'), '<mark>$1</mark>'); });
  return `<button class="manhit" ${entry.section ? `data-mansec2="${entry.section}"` : ''}><span class="mhm">${escapeHtml(entry.module)}</span><span>${text}</span></button>`;
}

function search(input: HTMLInputElement, results: HTMLElement, entries: readonly Entry[]): void {
  const query = normalise(input.value.trim());
  document.querySelectorAll('.mancard').forEach(card => { card.classList.remove('hide'); });
  if (query.length < MIN_QUERY) { results.classList.add('hide'); return; }
  const words = query.split(/\s+/);
  const hits = entries.filter(entry => words.every(word => normalise(`${entry.text} ${entry.module}`).includes(word))).slice(0, MAX_HITS);
  results.classList.remove('hide');
  results.innerHTML = hits.length ? hits.map(entry => hitHtml(entry, words)).join('')
    : `<div class="manhit">${t('manual.portal.noResults', { query: escapeHtml(input.value) })}</div>`;
}

/** Adds the results box under the search field and listens to it. */
export function listenToSearch(): void {
  const input = document.getElementById('manq') as HTMLInputElement | null;
  if (!input) return;
  input.insertAdjacentHTML('afterend', '<div class="manres hide" id="manres"></div>');
  const results = document.getElementById('manres'), entries = searchIndex();
  if (!results) return;
  input.oninput = (): void => { search(input, results, entries); };
  results.addEventListener('click', event => {
    const hit = (event.target as Element | null)?.closest<HTMLElement>('[data-mansec2]');
    if (!hit) return;
    results.classList.add('hide');
    showSection(hit.dataset.mansec2 ?? '');
  });
}
