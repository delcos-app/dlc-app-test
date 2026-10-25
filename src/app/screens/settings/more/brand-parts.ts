/** Parts of «Marca y logo»: the vocabulary of the company and the preview of how the team sees the platform (v2.415.0). */
import { initialsOf } from '../../../legacy/bridge';
import { settingsMoreLegacy } from '../../../legacy/settings2-bridge';
import { t, type MessageKey } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { orFallback } from '../../../services/values';

const TERM_LABELS = new Map<string, MessageKey>([
  ['medico', 'settingsMore.brand.termProfessional'], ['paciente', 'settingsMore.brand.termCustomer'], ['visita', 'settingsMore.brand.termVisit'],
]);

function termRow(key: string): string {
  const defaults = settingsMoreLegacy.termDefaults()[key] ?? { s: '', p: '' }, chosen = settingsMoreLegacy.terms()[key] ?? {};
  const label = TERM_LABELS.get(key);
  return `<div class="g3 mkvocf" data-term="${key}">
      <div><label class="sm">${label ? t(label) : ''} · ${t('settingsMore.brand.singular')}</label><input data-tf="s" value="${escapeHtml(chosen.s ?? '')}" placeholder="${escapeHtml(defaults.s)}"></div>
      <div><label class="sm">${t('settingsMore.brand.plural')}</label><input data-tf="p" value="${escapeHtml(chosen.p ?? '')}" placeholder="${escapeHtml(defaults.p)}"></div>
      <div><label class="sm">${t('settingsMore.brand.gender')}</label><select data-tf="g"><option value="">${t(defaults.g === 'f' ? 'settingsMore.brand.feminineDefault' : 'settingsMore.brand.masculineDefault')}</option>
        <option value="m" ${chosen.g === 'm' ? 'selected' : ''}>${t('settingsMore.brand.masculine')}</option><option value="f" ${chosen.g === 'f' ? 'selected' : ''}>${t('settingsMore.brand.feminine')}</option></select></div></div>`;
}

/** The vocabulary block: singular, plural and gender of each company word. */
export function vocabularyHtml(): string {
  return `<div class="mkvoc"><label>${t('settingsMore.brand.vocabularyTitle')}</label>
    <div class="sm">${t('settingsMore.brand.vocabularyHint')}</div>
    ${Object.keys(settingsMoreLegacy.termDefaults()).map(termRow).join('')}</div>`;
}

/** Paints the preview (header and login) with the name and logo being edited. */
export function brandPreview(): void {
  const preview = document.getElementById('mkprev2'); if (!preview) return;
  const name = orFallback((document.getElementById('mknom') as HTMLInputElement | null)?.value, settingsMoreLegacy.appName());
  const logo = orFallback((document.getElementById('mklogo') as HTMLImageElement | null)?.src, 'logo-app.png');
  preview.innerHTML = `<div class="mkcab"><img src="${escapeHtml(logo)}" alt=""><span class="mkbus">${t('settingsMore.brand.search')}</span><span class="mkav">${escapeHtml(initialsOf(settingsMoreLegacy.profileName()))}</span></div>
      <div class="mklogin"><img src="${escapeHtml(logo)}" alt=""><b>${escapeHtml(name)}</b><span>${t('settingsMore.brand.loginHint')}</span><i></i><i></i><em>${t('settingsMore.brand.enter')}</em></div>`;
}
