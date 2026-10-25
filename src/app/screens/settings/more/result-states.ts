/**
 * Visit results of a classifier: in which commercial states of the card each one is offered («Solo en: …» or «En todos los
 * estados»). Added next to each destination select of the classifier window. Migrated from the legacy decorarResultados and
 * enEstadosTxt (v2.415.0).
 */
import { cardBaseLegacy, legacyDb, notices, term } from '../../../legacy/bridge';
import { settingsMoreLegacy, type ClassifierValue } from '../../../legacy/settings2-bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';

const statesText = (list: readonly string[] | null | undefined): string =>
  (list?.length ? t('settingsMore.results.onlyIn', { states: list.join(', ') }) : t('settingsMore.results.inAll'));

function boxHtml(value: ClassifierValue): string {
  const marked = new Set(value.en_estados ?? []);
  return `<div class="venbox"><span class="sm">${t('settingsMore.results.hint', { name: escapeHtml(value.valor), theVisit: term('visita', { article: 'el' }) })}</span>
        <div class="chips">${cardBaseLegacy.states().map(state => `<button type="button" class="chip ${marked.has(state) ? 'on' : ''}" data-vene="${escapeHtml(state)}" aria-pressed="${String(marked.has(state))}">${escapeHtml(state)}</button>`).join('')}</div>
        <div class="acts" style="justify-content:flex-end;margin:6px 0 0"><button type="button" class="btn sec" data-vencerrar>${t('common.cancel')}</button><button type="button" class="btn" data-venok>${t('common.save')}</button></div></div>`;
}

async function save(value: ClassifierValue, item: Element, box: Element, button: HTMLButtonElement): Promise<void> {
  const chosen = [...box.querySelectorAll<HTMLElement>('[data-vene][aria-pressed="true"]')].map(chip => chip.dataset.vene ?? ''), all = cardBaseLegacy.states().length;
  button.disabled = true;
  const { data: result, error } = await legacyDb().rpc<{ ok?: boolean }>('guardar_valor', { p: { id: value.id, en_estados: chosen.length === all ? [] : chosen } });
  button.disabled = false;
  if (error || result?.ok === false) { notices.toast(t('settingsMore.couldNotSave'), true); return; }
  value.en_estados = chosen.length && chosen.length < all ? chosen : null;
  const label = item.querySelector('[data-ven]'); if (label) label.textContent = statesText(value.en_estados);
  box.remove();
  notices.toast(value.en_estados ? t('settingsMore.results.savedOnly', { name: value.valor, states: chosen.join(', ') }) : t('settingsMore.results.savedAll', { name: value.valor }));
}

function toggleBox(body: HTMLElement, item: Element, value: ClassifierValue): void {
  const open = item.nextElementSibling?.classList.contains('venbox');
  body.querySelectorAll('.venbox').forEach(other => { other.remove(); });
  if (open) return;
  item.insertAdjacentHTML('afterend', boxHtml(value));
  const box = item.nextElementSibling; if (!box) return;
  box.querySelectorAll<HTMLElement>('[data-vene]').forEach(chip => {
    chip.onclick = (): void => { const on = chip.getAttribute('aria-pressed') !== 'true'; chip.setAttribute('aria-pressed', String(on)); chip.classList.toggle('on', on); };
  });
  const cancel = box.querySelector<HTMLElement>('[data-vencerrar]'); if (cancel) cancel.onclick = (): void => { box.remove(); };
  const ok = box.querySelector<HTMLButtonElement>('[data-venok]'); if (ok) ok.onclick = (): void => { void save(value, item, box, ok); };
}

/** Adds the «in which states» button next to each destination select of the open classifier window. */
export function decorateResults(): void {
  const body = document.getElementById('dbody'); if (!body) return;
  body.querySelectorAll<HTMLElement>('[data-vdest]').forEach(select => {
    const item = select.closest('.item'); if (!item || item.querySelector('[data-ven]')) return;
    const id = select.dataset.vdest;
    const value = settingsMoreLegacy.classifiers().flatMap(classifier => classifier.valores ?? []).find(candidate => candidate.id === id); if (!value) return;
    select.insertAdjacentHTML('afterend', `<button type="button" class="btn sec" data-ven="${id ?? ''}" title="${t('settingsMore.results.buttonTitle')}">${escapeHtml(statesText(value.en_estados))}</button>`);
    const button = item.querySelector<HTMLElement>('[data-ven]'); if (button) button.onclick = (): void => { toggleBox(body, item, value); };
  });
}
