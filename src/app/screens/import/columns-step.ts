/**
 * Step 3 of «Nueva importación»: the field of each column (a platform field, a custom field or nothing), with examples of each
 * column, and the check that the required fields are there and no field is used twice. Migrated from the legacy impColumnas
 * (v2.410.0).
 */
import { t } from '../../i18n';
import { escapeHtml, formatNumber } from '../../services/format';
import { entityName, fieldLabel, FIELDS } from './fields';
import { onClick, paint, steps, stepsHtml, wizard } from './wizard';

const SAMPLE_ROWS = 40, SAMPLES = 3;

const samples = (index: number): string[] => [...new Set(wizard.rows.slice(0, SAMPLE_ROWS).map(row => row.v[index] ?? '').filter(Boolean))].slice(0, SAMPLES);

function columnHtml(header: string, index: number): string {
  const chosen = wizard.mapping[index] ?? 'no', entity = wizard.entity;
  const options = FIELDS[entity].map(([key, required]) => `<option value="std:${key}" ${chosen === `std:${key}` ? 'selected' : ''}>${escapeHtml(fieldLabel(entity, key))}${required ? ' *' : ''}</option>`).join('');
  return `<div class="impcol ${chosen === 'no' ? 'ignorada' : ''}">
      <div><b>${escapeHtml(header)}</b><span class="sm">${samples(index).map(escapeHtml).join(' · ') || t('importing.columns.empty')}</span></div>
      <span class="impflecha">→</span>
      <select data-impc="${index}"><option value="no" ${chosen === 'no' ? 'selected' : ''}>${t('importing.columns.skip')}</option>
        <optgroup label="${t('importing.columns.platformFields')}">${options}</optgroup>
        <option value="extra" ${chosen === 'extra' ? 'selected' : ''}>${t('importing.columns.custom', { name: escapeHtml(header) })}</option></select></div>`;
}

function pageHtml(): string {
  const intro = t('importing.columns.summary', { rows: formatNumber(wizard.rows.length), columns: wizard.headers.length })
    + (wizard.remembered ? t('importing.columns.remembered') : t('importing.columns.proposed'))
    + t('importing.columns.customHint', { type: escapeHtml(entityName(wizard.entity)) });
  return `<div class="card cfgpanel impcaja">${stepsHtml(3)}
    <h2 style="padding:0 0 4px">${t('importing.columns.title', { name: escapeHtml(wizard.fileName) })}</h2>
    <p class="sm">${intro}</p>
    <div class="impmapa">${wizard.headers.map(columnHtml).join('')}</div>
    <div id="impaviso" class="sm u-mt-10"></div>
    <div class="acts u-between"><button class="btn sec" type="button" id="impvolver">${t('importing.file.back')}</button><button class="btn" type="button" id="impsig">${t('importing.columns.next')}</button></div></div>`;
}

/** The required fields not assigned (in sales, the product can come by its reference) and the fields assigned twice. */
function problems(): { missing: string[]; repeated: string[] } {
  const entity = wizard.entity, assigned = wizard.mapping.filter(value => value.startsWith('std:')).map(value => value.slice(4));
  const missing = FIELDS[entity].filter(([key, required]) => required && !assigned.includes(key) && !(entity === 'ventas' && key === 'producto' && assigned.includes('referencia')))
    .map(([key]) => fieldLabel(entity, key));
  const repeated = [...new Set(assigned.filter((key, index) => assigned.indexOf(key) !== index))].map(key => fieldLabel(entity, key));
  return { missing, repeated };
}

function check(): void {
  const { missing, repeated } = problems(), notice = document.getElementById('impaviso'), next = document.getElementById('impsig') as HTMLButtonElement | null;
  const danger = (text: string): string => `<span class="u-danger">${text}</span>`;
  if (notice) {
    notice.innerHTML = missing.length ? danger(t('importing.columns.missing', { fields: missing.map(escapeHtml).join(', ') }))
      : repeated.length ? danger(t('importing.columns.repeated', { fields: repeated.map(escapeHtml).join(', ') })) : '';
  }
  if (next) next.disabled = Boolean(missing.length || repeated.length);
}

export function paintColumnsStep(): void {
  const box = paint(pageHtml());
  box?.querySelectorAll<HTMLSelectElement>('[data-impc]').forEach(select => {
    select.onchange = (): void => {
      wizard.mapping[Number(select.dataset.impc)] = select.value;
      select.closest('.impcol')?.classList.toggle('ignorada', select.value === 'no');
      check();
    };
  });
  onClick('impvolver', steps.file); onClick('impsig', steps.review);
  check();
}
