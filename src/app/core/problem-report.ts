/**
 * «Reportar un problema»: what happened, where, how much it affects and how often, the person's words and an optional screenshot; the
 * technical data (screen, version, size, errors of the session and last actions) is attached by itself. Migrated from the legacy
 * reportarProblema (v2.425.0); reportarProblema stays as an adapter.
 */
import { coreLegacy } from '../legacy/core-bridge';
import { t, type MessageKey } from '../i18n';
import { escapeHtml } from '../services/format';
import { SESSION_ERRORS } from './session';
import { wordFor } from './vocabulary';

const MIN_TEXT = 5, MAX_WIDTH = 1280, JPEG_QUALITY = 0.7;

type Options = readonly (readonly [string, string])[];

const options = (prefix: string, keys: readonly string[]): Options =>
  keys.map(key => [key, t(`core.report.${prefix}.${key}` as MessageKey)] as const);

const KINDS = ['error', 'no_esperado', 'lento', 'visual', 'datos', 'idea'], SEVERITIES = ['bloquea', 'molesta', 'menor'], FREQUENCIES = ['siempre', 'aveces', 'una'];
const FIELD_NAMES = new Map<string, MessageKey>([['tipo', 'core.report.kind'], ['modulo', 'core.report.where'], ['gravedad', 'core.report.severity'], ['frecuencia', 'core.report.frequency']]);

const labelOf = (name: string): string => { const key = FIELD_NAMES.get(name); return key ? t(key) : name; };

const chips = (name: string, list: Options, selected: string): string =>
  `<div class="rpchips" data-rp="${name}">${list.map(([value, text]) => `<button type="button" data-v="${escapeHtml(value)}" class="${value === selected ? 'on' : ''}">${escapeHtml(text)}</button>`).join('')}</div>`;

function visibleModules(): [string, string][] {
  return [...document.querySelectorAll<HTMLElement>('nav.main [data-t]')].filter(button => !button.classList.contains('hide') && getComputedStyle(button).display !== 'none')
    .map(button => [button.dataset.t ?? '', (button.textContent ?? '').trim()]);
}

function formHtml(): string {
  const modules = visibleModules(), screen = coreLegacy.currentScreen();
  const where = modules.some(module => module[0] === screen) ? screen : (screen === 'config' ? 'config' : 'otro');
  const example = t('core.report.example', { visit: wordFor('visita', 's', { determiner: 'un' }), professional: wordFor('medico', 's', { determiner: 'un', adjective: 'nuevo' }) });
  const technical = t('core.report.technical', { screen: escapeHtml(screen), version: escapeHtml(coreLegacy.appVersion()), width: innerWidth, height: innerHeight, errors: SESSION_ERRORS.length, actions: coreLegacy.trail().length });
  return `<div class="fh"><div><h2>${t('core.report.title')}</h2><div class="sm">${t('core.report.subtitle')}</div></div>
    <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
    <div class="rpgrid">
      <div><label>${t('core.report.whatHappened')}</label>${chips('tipo', options('kinds', KINDS), 'error')}</div>
      <div><label>${t('core.report.whereLabel')}</label>${chips('modulo', [...modules, ['config', t('core.report.settings')], ['otro', t('core.report.elsewhere')]], where)}</div>
      <div><label>${t('core.report.howMuch')}</label>${chips('gravedad', options('severities', SEVERITIES), 'molesta')}</div>
      <div><label>${t('core.report.always')}</label>${chips('frecuencia', options('frequencies', FREQUENCIES), 'siempre')}</div>
    </div>
    <label for="rpque">${t('core.report.inYourWords')}</label><textarea id="rpque" rows="4" placeholder="${escapeHtml(example)}"></textarea>
    <label>${t('core.report.screenshot')}</label><input type="file" id="rpcap" accept="image/*">
    <details class="rptec"><summary>${t('core.report.technicalTitle')}</summary><div class="sm">${technical}</div></details>
    <div class="acts u-end"><button class="btn sec" data-cerrar>${t('common.cancel')}</button><button class="btn" id="rptok" disabled>${t('core.report.send')}</button></div>`;
}

/** The picture, at most 1280 px wide, as JPEG. */
async function screenshotOf(file: File): Promise<string> {
  const image = new Image(); image.src = URL.createObjectURL(file); await image.decode();
  const scale = Math.min(1, MAX_WIDTH / image.width), canvas = document.createElement('canvas');
  canvas.width = image.width * scale; canvas.height = image.height * scale;
  canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}

function bindChips(body: HTMLElement, values: Record<string, string>): void {
  body.querySelectorAll<HTMLElement>('.rpchips').forEach(group => {
    const name = group.dataset.rp ?? '';
    values[name] = group.querySelector<HTMLElement>('.on')?.dataset.v ?? '';
    group.querySelectorAll<HTMLElement>('button').forEach(button => {
      button.onclick = (): void => { group.querySelectorAll('button').forEach(other => { other.classList.toggle('on', other === button); }); values[name] = button.dataset.v ?? ''; };
    });
  });
}

async function send(body: HTMLElement, dialog: HTMLDialogElement, values: Record<string, string>, screenshot: string | null): Promise<void> {
  const summary = Object.entries(values).map(([name, value]) =>
    `${labelOf(name)}: ${body.querySelector(`[data-rp="${name}"] [data-v="${value}"]`)?.textContent ?? value}`).join(' · ');
  const text = (document.getElementById('rpque') as HTMLTextAreaElement | null)?.value.trim() ?? '';
  const { data, error } = await coreLegacy.rpc('registrar_error', { p: {
    tipo: 'reporte', mensaje: `[${summary}] ${text}`, pantalla: values.modulo ?? coreLegacy.currentScreen(), version: coreLegacy.appVersion(), navegador: navigator.userAgent,
    detalle: { ...values, errores_sesion: SESSION_ERRORS, ultimas_acciones: coreLegacy.trail(), ancho: innerWidth, alto: innerHeight, captura: screenshot },
  } });
  if (error || !(data as { ok?: boolean } | null)?.ok) { coreLegacy.toast(t('core.report.couldNotSend'), true); return; }
  delete dialog.dataset.sucio; dialog.close(); coreLegacy.toast(t('core.report.thanks'));
}

/** Opens «Reportar un problema». */
export function reportProblem(): void {
  const body = document.getElementById('dbody'), dialog = document.getElementById('dlg') as HTMLDialogElement | null;
  if (!body || !dialog) return;
  body.innerHTML = formHtml();
  dialog.classList.add('amplia'); dialog.showModal();
  const values: Record<string, string> = {};
  bindChips(body, values);
  const text = document.getElementById('rpque') as HTMLTextAreaElement | null, ok = document.getElementById('rptok') as HTMLButtonElement | null;
  const picture = document.getElementById('rpcap') as HTMLInputElement | null;
  if (text && ok) text.oninput = (): void => { ok.disabled = text.value.trim().length < MIN_TEXT; };
  let screenshot: string | null = null;
  if (picture) picture.onchange = async (): Promise<void> => { const file = picture.files?.[0]; if (file) screenshot = await screenshotOf(file); };
  if (ok) ok.onclick = (): void => { void coreLegacy.withButtonLoading(ok, t('core.report.sending'), () => send(body, dialog, values, screenshot)); };
}
