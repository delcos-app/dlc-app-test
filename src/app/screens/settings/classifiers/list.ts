/**
 * Configuración → Clasificadores: the lists everyone uses in cards, visits, orders and filters, grouped and folded by group.
 * Migrated from the legacy pintarCatalogos (v2.415.0).
 */
import { cardSectionsLegacy, legacyDb, term } from '../../../legacy/bridge';
import { settingsLegacy } from '../../../legacy/settings1-bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { orFallback } from '../../../services/values';
import { newClassifier } from './new-classifier';

const SHOWN_VALUES = 5, EDIT_LEVEL = 2, FULL_LEVEL = 3, ADMINISTER = 'administrar', AREA = 'K';

/** Groups folded by the user (remembered while the app is open). */
const folded = new Set<string>();

const level = (): number => settingsLegacy.user().areas?.[AREA] ?? 0;

function cardHtml(classifier: Classifier, canEdit: boolean): string {
  const active = classifier.n_activos, values = (classifier.valores ?? []).filter(value => value.activo).slice(0, SHOWN_VALUES);
  return `<button class="cat-card" data-cat="${classifier.id}">
            <span class="cat-h"><b>${escapeHtml(classifier.nombre)}</b>
              ${classifier.sistema ? `<span class="tagsis">${t('settings.classifiers.system')}</span>` : ''}
              ${canEdit ? '' : `<span class="tagro" title="${t('settings.classifiers.readOnlyTitle')}">🔒</span>`}</span>
            <span class="sm">${active} ${t(active === 1 ? 'settings.classifiers.oneActive' : 'settings.classifiers.activeValues')}${classifier.descripcion ? ` · ${escapeHtml(classifier.descripcion)}` : ''}</span>
            <span class="cat-v">${values.map(value => `<span class="chip">${escapeHtml(value.valor)}</span>`).join('')}
              ${active > SHOWN_VALUES ? `<span class="sm">+${active - SHOWN_VALUES}</span>` : ''}</span>
          </button>`;
}

function groupHtml(group: string, list: readonly Classifier[], canEdit: boolean): string {
  const closed = folded.has(group);
  return `
      <div class="grupo">
        <button class="grupoh" data-grupo="${escapeHtml(group)}">
          <span>${closed ? '▸' : '▾'} <b>${escapeHtml(group)}</b>
            <span class="sm">${list.length} ${t(list.length === 1 ? 'settings.classifiers.oneClassifier' : 'settings.classifiers.classifiers')}</span></span></button>
        <div class="grupoc ${closed ? 'hide' : ''}">
          ${list.map(classifier => cardHtml(classifier, canEdit)).join('')}
        </div></div>`;
}

function byGroup(list: readonly Classifier[]): Map<string, Classifier[]> {
  const groups = new Map<string, Classifier[]>();
  for (const classifier of list) {
    const group = orFallback(classifier.grupo, t('settings.classifiers.general'));
    groups.set(group, [...groups.get(group) ?? [], classifier]);
  }
  return groups;
}

export async function paintClassifiers(): Promise<void> {
  settingsLegacy.showLoading(document.getElementById('cfgcuerpo'), t('settings.classifiers.loading'));
  const { data } = await legacyDb().rpc<Classifier[]>('catalogos_todos');
  settingsLegacy.setClassifiers(data ?? []);
  const box = document.getElementById('cfgcuerpo'); if (!box) return;
  const administers = cardSectionsLegacy.can(ADMINISTER), canEdit = administers || level() >= EDIT_LEVEL, full = administers || level() >= FULL_LEVEL;
  box.innerHTML = `
    <div class="dayhead2"><p class="sm">${t('settings.classifiers.intro', { visits: term('visita', { number: 'p' }) })}
      ${canEdit ? '' : `<b>${t('settings.classifiers.readOnly')}</b>`}</p>
      ${full ? `<button class="btn" id="cnuevo">${t('settings.classifiers.newClassifier')}</button>` : ''}</div>
    ${[...byGroup(settingsLegacy.classifiers())].map(([group, list]) => groupHtml(group, list, canEdit)).join('')}`;
  box.querySelectorAll<HTMLElement>('[data-grupo]').forEach(button => {
    button.onclick = (): void => {
      const group = button.dataset.grupo ?? '';
      if (folded.has(group)) folded.delete(group); else folded.add(group);
      void paintClassifiers();
    };
  });
  box.querySelectorAll<HTMLElement>('[data-cat]').forEach(button => { button.onclick = (): void => { settingsLegacy.openClassifier(button.dataset.cat ?? ''); }; });
  const add = document.getElementById('cnuevo'); if (add) add.onclick = (): void => { newClassifier(() => { void paintClassifiers(); }); };
}
