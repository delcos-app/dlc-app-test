/**
 * Configuración → Correo y firma → «Plantillas de correo»: create, edit, duplicate, remove and choose the default one of each use.
 * Painted with the page (before, a MutationObserver of legado 130 added it after the page). Migrated from the legacy
 * pintarPlantillasCorreo and editarPlantillaCorreo (v2.417.0).
 */
import { notices } from '../../../legacy/bridge';
import { settingsExtraLegacy } from '../../../legacy/settings3-bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { defaultTemplate, newTemplateId, saveTemplates, templateList, USES, useLabel, VARIABLES, type EmailTemplate } from './templates';

const value = (id: string): string => (document.getElementById(id) as HTMLInputElement | null)?.value ?? '';

function templateRow(template: EmailTemplate, many: boolean): string {
  return `<div class="plcfila"><span class="plcn"><b>${escapeHtml(template.nombre)}</b>${template.defecto ? ` <span class="pill p-ok">${t('settingsExtra.templates.byDefault')}</span>` : ''}<span class="sm">${escapeHtml(template.asunto)}</span></span>
        <span class="plcb"><button type="button" class="btn sec chico" data-plce="${template.id}">${t('settingsExtra.templates.edit')}</button><button type="button" class="btn sec chico" data-plcd="${template.id}">${t('settingsExtra.templates.duplicate')}</button>
          ${many ? `<button type="button" class="btn sec chico dang" data-plcx="${template.id}">${t('settingsExtra.templates.remove')}</button>` : ''}</span></div>`;
}

function listHtml(): string {
  const list = templateList();
  return USES.map(use => {
    const group = list.filter(item => item.uso === use);
    return `<div class="plcuso"><div class="sm plcusot">${escapeHtml(useLabel(use))}</div>${group.map(item => templateRow(item, group.length > 1)).join('') || `<div class="sm">${t('settingsExtra.templates.none')}</div>`}</div>`;
  }).join('');
}

/** The «Plantillas de correo» card. */
export function templatesCardHtml(): string {
  return `<div class="card cfgpanel" id="plcorreo"><div class="fh"><h2 class="plch">${t('settingsExtra.templates.title')} ${settingsExtraLegacy.helpButton(t('settingsExtra.templates.title'), t('settingsExtra.templates.help'))}</h2>
    <button type="button" class="btn sec chico" id="plcnueva">${t('settingsExtra.templates.add')}</button></div><div id="plclista" class="plclista">${listHtml()}</div></div>`;
}

const repaint = (): void => { const box = document.getElementById('plclista'); if (box) box.innerHTML = listHtml(); };

function insertAtCursor(field: HTMLInputElement | HTMLTextAreaElement, text: string): void {
  const start = field.selectionStart ?? field.value.length, end = field.selectionEnd ?? start;
  field.value = field.value.slice(0, start) + text + field.value.slice(end); field.focus(); field.selectionStart = field.selectionEnd = start + text.length;
}

function editorHtml(template: EmailTemplate, isNew: boolean): string {
  return `<div class="fh"><div><h2>${t(isNew ? 'settingsExtra.templates.newTitle' : 'settingsExtra.templates.editTitle')}</h2></div><button class="x" data-cerrar2 aria-label="${t('common.close')}">✕</button></div>
    <div class="g2"><div><label for="pcen">${t('settingsExtra.templates.name')}</label><input id="pcen" value="${escapeHtml(template.nombre)}" maxlength="60" placeholder="${t('settingsExtra.templates.namePlaceholder')}"></div>
      <div><label for="pceu">${t('settingsExtra.templates.usedFor')}</label><select id="pceu">${USES.map(use => `<option value="${use}" ${template.uso === use ? 'selected' : ''}>${escapeHtml(useLabel(use))}</option>`).join('')}</select></div></div>
    <label for="pcea">${t('settingsExtra.templates.subject')}</label><input id="pcea" value="${escapeHtml(template.asunto)}">
    <label for="pcet">${t('settingsExtra.templates.text')}</label><textarea id="pcet" rows="12">${escapeHtml(template.texto)}</textarea>
    <div class="sm plchue">${t('settingsExtra.templates.gaps')}</div>
    <div class="plcvars">${VARIABLES.map(([name, key]) => `<button type="button" class="btn sec chico" data-plv="${name}" title="${escapeHtml(t(key))}">[${name}]</button>`).join('')}</div>
    <label class="chk"><input type="checkbox" id="pced" ${template.defecto ? 'checked' : ''}> <span>${t('settingsExtra.templates.useByDefault')}</span></label>
    <div class="acts"><button type="button" class="btn sec" data-cerrar2>${t('settingsExtra.templates.cancel')}</button><button type="button" class="btn" id="pceok">${t('settingsExtra.templates.save')}</button></div>`;
}

async function saveEdited(template: EmailTemplate, box: HTMLDialogElement): Promise<void> {
  const name = value('pcen').trim(); if (!name) { notices.toast(t('settingsExtra.templates.nameIt'), true); return; }
  const edited: EmailTemplate = { ...template, nombre: name, uso: value('pceu'), asunto: value('pcea').trim(), texto: value('pcet').replace(/\s+$/, ''), defecto: (document.getElementById('pced') as HTMLInputElement | null)?.checked ?? false };
  const list = templateList().map(item => ({ ...item })).filter(item => item.id !== edited.id);
  if (edited.defecto) list.forEach(item => { if (item.uso === edited.uso) item.defecto = false; });
  list.push(edited);
  USES.forEach(use => { const group = list.filter(item => item.uso === use); const first = group[0]; if (first && !group.some(item => item.defecto)) first.defecto = true; });
  if (await saveTemplates(list)) { box.close(); notices.toast(t('settingsExtra.templates.saved')); repaint(); }
}

function editTemplate(template: EmailTemplate, isNew: boolean): void {
  const body = document.getElementById('dlg2body'), box = document.getElementById('dlg2') as HTMLDialogElement | null;
  if (!body || !box) return;
  body.innerHTML = editorHtml(template, isNew);
  box.showModal();
  let last = document.getElementById('pcet') as HTMLInputElement | HTMLTextAreaElement | null;
  for (const id of ['pcea', 'pcet']) document.getElementById(id)?.addEventListener('focus', () => { last = document.getElementById(id) as HTMLInputElement | null; });
  body.querySelectorAll<HTMLElement>('[data-plv]').forEach(button => { button.onclick = (): void => { if (last) insertAtCursor(last, `[${button.dataset.plv ?? ''}]`); }; });
  const ok = document.getElementById('pceok');
  if (ok) ok.onclick = (): void => { void settingsExtraLegacy.withButtonLoading(ok, t('settingsExtra.templates.saving'), () => saveEdited(template, box)); };
}

async function remove(template: EmailTemplate, list: EmailTemplate[]): Promise<void> {
  if (!await notices.confirm(t('settingsExtra.templates.removeText', { name: template.nombre }), { titulo: t('settingsExtra.templates.removeTitle'), ok: t('settingsExtra.templates.remove') })) return;
  const rest = list.filter(item => item !== template);
  if (template.defecto) { const other = rest.find(item => item.uso === template.uso); if (other) other.defecto = true; }
  if (await saveTemplates(rest)) { notices.toast(t('settingsExtra.templates.removed')); repaint(); }
}

function onCardClick(event: MouseEvent): void {
  const target = event.target as Element, list = templateList().map(item => ({ ...item }));
  const find = (attribute: string): EmailTemplate | undefined => { const button = target.closest<HTMLElement>(`[data-${attribute}]`); return button ? list.find(item => item.id === button.getAttribute(`data-${attribute}`)) : undefined; };
  if (target.closest('#plcnueva')) { const base = defaultTemplate('pago'); editTemplate({ id: newTemplateId(), nombre: '', uso: 'pago', asunto: base.asunto, texto: base.texto, defecto: false }, true); return; }
  const edited = find('plce'); if (edited) { editTemplate(edited, false); return; }
  const copied = find('plcd'); if (copied) { editTemplate({ ...copied, id: newTemplateId(), nombre: t('settingsExtra.templates.copyOf', { name: copied.nombre }), defecto: false }, true); return; }
  const removed = find('plcx'); if (removed) void remove(removed, list);
}

/** Listens to the buttons of the card painted by templatesCardHtml. */
export function bindTemplatesCard(): void {
  const card = document.getElementById('plcorreo'); if (card) card.onclick = onCardClick;
}
