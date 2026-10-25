/** Saving the contacts module name and the vocabulary of «Marca y logo» (v2.415.0). A new vocabulary reloads the platform. */
import { cycleLegacy, legacyDb, notices } from '../../../legacy/bridge';
import { settingsMoreLegacy, type TermSettings } from '../../../legacy/settings2-bridge';
import { t } from '../../../i18n';

const RELOAD_MS = 900;

/** Adds the contacts module name to the saved brand. */
export async function saveLabel(label: string): Promise<void> {
  const brand = { ...(cycleLegacy.setting('marca') as Record<string, unknown> | undefined), etiqueta: label };
  const { error } = await legacyDb().rpc('guardar_ajuste', { p_clave: 'marca', p_valor: brand });
  if (!error) { cycleLegacy.setSetting('marca', brand); settingsMoreLegacy.applyLabel(); }
}

function readVocabulary(): Record<string, TermSettings> {
  const vocabulary: Record<string, TermSettings> = {};
  document.querySelectorAll<HTMLElement>('.mkvocf').forEach(row => {
    const word: Record<string, string> = {};
    row.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-tf]').forEach(input => { if (input.value.trim()) word[input.dataset.tf ?? ''] = input.value.trim(); });
    if (Object.keys(word).length) vocabulary[row.dataset.term ?? ''] = word;
  });
  return vocabulary;
}

/** Saves the vocabulary when it changed, and reloads the platform so every text uses it. */
export async function saveVocabulary(): Promise<void> {
  const vocabulary = readVocabulary();
  if (JSON.stringify(vocabulary) === JSON.stringify(settingsMoreLegacy.terms())) return;
  const { error } = await legacyDb().rpc('guardar_ajuste', { p_clave: 'terminos', p_valor: vocabulary });
  if (error) { notices.toast(t('settingsMore.brand.vocabularyNotSaved'), true); return; }
  settingsMoreLegacy.saveTermsCopy(vocabulary);
  notices.toast(t('settingsMore.brand.vocabularySaved')); setTimeout(() => { location.reload(); }, RELOAD_MS);
}
