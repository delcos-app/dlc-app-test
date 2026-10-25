/**
 * v2.261.0 · Reading batches and serial numbers with the camera: on a phone or tablet, batch fields (stock entry, purchase receipt)
 * and serial number fields (surgeries, equipment) get a camera button. The code is read (DataMatrix, QR, Code 128, EAN…) and, if
 * it is GS1, split: batch, serial number, expiry and manufacturing date (filled in a stock entry when empty). With several units the
 * camera stays open and fills the next empty one, without repeating. It uses the browser reader (BarcodeDetector) and, without it
 * (iPhone), a library loaded only when the camera opens. Migrated from the legacy servicios/camara.js (v2.427.0); escPoner and
 * abrirEscaner stay as adapters (the device glue calls them).
 */
import { leftoversLegacy } from '../../legacy/leftovers-bridge';
import { t } from '../../i18n';
import { scannedValue, type Gs1 } from './gs1';

const FIELDS: readonly (readonly [string, string])[] = [['#mvl', 'lote'], ['[data-r="lote"]', 'lote'], ['[data-cser]', 'serie'], ['[data-pqs]', 'serie'], ['#eqs', 'serie']];
const ZXING_URL = 'https://unpkg.com/@zxing/library@0.21.3/umd/index.min.js';
const ZXING_HASH = 'sha384-BzBxP10ZE72aitqj5UMmUsbKFliP/DZqA8Wq+BNNhlIJDGoEd1tpkMYXOg9+n6sB';
const DETECT_EVERY_MS = 180, VIBRATION_MS = 60;

interface Detector { detect(source: HTMLVideoElement): Promise<{ rawValue: string }[]> }
interface DetectorClass { new (options?: { formats: string[] }): Detector; getSupportedFormats(): Promise<string[]> }
interface ZxingReader { decodeFromStream(stream: MediaStream, video: HTMLVideoElement, onResult: (result: { getText(): string } | null) => void): void; reset(): void }
interface Zxing { BrowserMultiFormatReader: new () => ZxingReader }

interface Session { input: HTMLInputElement; mode: string; group: HTMLInputElement[]; live: boolean; read: Set<string>; count: number; stream?: MediaStream; zxing?: ZxingReader }
let session: Session | null = null;

const scannerWindow = (): HTMLDialogElement | null => document.getElementById('escaner') as HTMLDialogElement | null;
const status = (text: string): void => { const line = document.getElementById('escest'); if (line && line.textContent !== text) line.textContent = text; };
const modeOf = (input: Element): string => FIELDS.find(([selector]) => input.matches(selector))?.[1] ?? '';
const unitsText = (count: number): string => (count === 1 ? t('leftovers.scanner.oneUnit') : t('leftovers.scanner.units', { count }));
const vibrate = (): void => { try { navigator.vibrate(VIBRATION_MS); } catch { /* not every device vibrates */ } };

/** The camera button goes in at the same moment as the field (it does not appear later). */
export function addScannerButtons(root?: ParentNode | null): void {
  if (!leftoversLegacy.canScan()) return;
  (root ?? document).querySelectorAll<HTMLElement>(FIELDS.map(([selector]) => `${selector}:not([data-escok])`).join(',')).forEach(input => {
    if (input.tagName !== 'INPUT') return;
    input.dataset.escok = '1';
    const wrapper = document.createElement('span'); wrapper.className = 'escw';
    input.parentNode?.insertBefore(wrapper, input); wrapper.appendChild(input);
    wrapper.insertAdjacentHTML('beforeend', `<button type="button" class="escbtn" data-esc aria-label="${t('leftovers.scanner.read')}" title="${t('leftovers.scanner.read')}">${leftoversLegacy.icon('camera')}</button>`);
  });
}

/** The serial number fields of the same units (several units of one product). */
function groupOf(input: HTMLInputElement): HTMLInputElement[] {
  const key = input.dataset.cser !== undefined ? `[data-cser="${input.dataset.cser}"]` : input.dataset.pqs !== undefined ? `[data-pqs="${input.dataset.pqs}"]` : '';
  if (!key) return [input];
  const box = input.closest('.cirser, .cirusa, .dlgficha, dialog') ?? document;
  return [...box.querySelectorAll<HTMLInputElement>(key)];
}

async function loadZxing(): Promise<Zxing> {
  const loaded = (window as unknown as { ZXing?: Zxing }).ZXing; if (loaded) return loaded;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = ZXING_URL; script.integrity = ZXING_HASH; script.crossOrigin = 'anonymous';
    script.onload = (): void => { resolve(); }; script.onerror = (): void => { reject(new Error('zxing')); };
    document.head.appendChild(script);
  });
  return (window as unknown as { ZXing: Zxing }).ZXing;
}

function setValue(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true }));
}

/** Closes the camera (without giving the focus back to the field: on a phone it would open the keyboard). */
export function closeScanner(): void {
  if (session) {
    session.live = false;
    try { session.zxing?.reset(); } catch { /* already stopped */ }
    try { session.stream?.getTracks().forEach(track => { track.stop(); }); } catch { /* already stopped */ }
    session = null;
  }
  const dialog = scannerWindow(); if (dialog?.open) dialog.close();
}

function readIntoGroup(current: Session, value: string): void {
  if (current.read.has(value)) { status(t('leftovers.scanner.alreadyRead', { read: current.read.size, total: current.group.length })); return; }
  const empty = [current.input, ...current.group].find(input => !input.value.trim());
  if (!empty) { closeScanner(); return; }
  setValue(empty, value); current.read.add(value); current.count++;
  vibrate();
  if (!current.group.some(input => !input.value.trim())) { const count = current.count; closeScanner(); leftoversLegacy.toast(t('leftovers.scanner.unitsRead', { units: unitsText(count) })); return; }
  status(t('leftovers.scanner.readNext', { value, read: current.read.size, total: current.group.length }));
}

/** In a stock entry, the expiry and manufacturing dates of the code fill the empty date fields. */
function fillDates(input: HTMLInputElement, gs1: Gs1): void {
  const box = input.closest('.rcl'), entry = input.id === 'mvl';
  const expiry = box ? box.querySelector<HTMLInputElement>('[data-r="cad"]') : entry ? document.getElementById('mvc') as HTMLInputElement | null : null;
  const made = box ? box.querySelector<HTMLInputElement>('[data-r="fab"]') : entry ? document.getElementById('mvf') as HTMLInputElement | null : null;
  if (gs1.cad && expiry && !expiry.value) setValue(expiry, gs1.cad);
  if (gs1.fab && made && !made.value) setValue(made, gs1.fab);
}

/** A code read: into the field (and the dates in a stock entry); with several units, into the next empty one. */
function onRead(text: string): void {
  const current = session;
  if (!current?.live || !text) return;
  const { v: value, g: gs1 } = scannedValue(text, current.mode); if (!value) return;
  if (current.group.length > 1) { readIntoGroup(current, value); return; }
  setValue(current.input, value);
  if (gs1 && current.mode === 'lote') fillDates(current.input, gs1);
  vibrate();
  closeScanner();
  leftoversLegacy.toast(t('leftovers.scanner.read1', { value }) + (gs1?.cad ? t('leftovers.scanner.expires', { date: leftoversLegacy.shortDate(gs1.cad) }) : ''));
}

function windowHtml(several: boolean): string {
  return `<div class="escvid"><video id="escv" playsinline muted></video><div class="escmarco"></div></div>
    <div class="escpie"><p id="escest" class="sm">${t('leftovers.scanner.opening')}</p>
      <div class="acts u-end u-m-0"><button type="button" class="btn sec" id="escfin">${t(several ? 'leftovers.scanner.finish' : 'leftovers.scanner.typeIt')}</button></div></div>`;
}

function openWindow(input: HTMLInputElement): Session {
  let dialog = scannerWindow();
  if (!dialog) {
    dialog = document.createElement('dialog'); dialog.id = 'escaner'; dialog.className = 'escdlg'; dialog.setAttribute('aria-label', t('leftovers.scanner.title'));
    document.body.appendChild(dialog);
  }
  const group = groupOf(input);
  dialog.innerHTML = windowHtml(group.length > 1);
  const opened: Session = { input, mode: modeOf(input), group, live: true, read: new Set(group.map(field => field.value.trim()).filter(Boolean)), count: 0 };
  session = opened;
  const finish = document.getElementById('escfin'); if (finish) finish.onclick = closeScanner;
  dialog.oncancel = (event): void => { event.preventDefault(); closeScanner(); };
  dialog.showModal();
  return opened;
}

function aimText(current: Session): string {
  if (current.mode === 'lote') return t('leftovers.scanner.aimBox');
  return current.group.length > 1 ? t('leftovers.scanner.aimEach', { read: current.read.size, total: current.group.length }) : t('leftovers.scanner.aimUnit');
}

/** The browser reader, every 180 ms while the window is open; false if this browser has none. */
async function detectWithBrowser(current: Session, video: HTMLVideoElement): Promise<boolean> {
  const detectorClass = (window as unknown as { BarcodeDetector?: DetectorClass }).BarcodeDetector;
  if (!detectorClass) return false;
  try {
    const formats = await detectorClass.getSupportedFormats(), detector = new detectorClass(formats.length ? { formats } : undefined);
    const live = (): boolean => current.live;
    const turn = async (): Promise<void> => {
      if (!live()) return;
      try { const found = await detector.detect(video); if (found[0]) onRead(found[0].rawValue); } catch { /* a frame without a code */ }
      if (live()) setTimeout(() => { void turn(); }, DETECT_EVERY_MS);
    };
    void turn();
    return true;
  } catch { return false; }
}

async function detectWithLibrary(current: Session, video: HTMLVideoElement): Promise<void> {
  try {
    const zxing = await loadZxing(); if (!current.live || !current.stream) return;
    current.zxing = new zxing.BrowserMultiFormatReader();
    current.zxing.decodeFromStream(current.stream, video, result => { if (result && current.live) onRead(result.getText()); });
  } catch { status(t('leftovers.scanner.cannotRead')); }
}

/** Opens the camera for the field `input`. */
export async function openScanner(input: HTMLInputElement): Promise<void> {
  const current = openWindow(input);
  try {
    current.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } }, audio: false });
  } catch (error) {
    closeScanner();
    leftoversLegacy.toast(t(/NotAllowed|Permission/i.test((error as { name?: string } | null)?.name ?? '') ? 'leftovers.scanner.notAllowed' : 'leftovers.scanner.couldNotOpen'), true);
    return;
  }
  if (!current.live) { current.stream.getTracks().forEach(track => { track.stop(); }); return; }
  const video = document.getElementById('escv') as HTMLVideoElement;
  video.srcObject = current.stream; try { await video.play(); } catch { /* it plays when it can */ }
  status(aimText(current));
  if (await detectWithBrowser(current, video)) return;
  await detectWithLibrary(current, video);
}
