/** Signature with the finger or the mouse on a canvas. Migrated from componentes/firma.js (v2.416.0); padFirma stays as an adapter. */
const INK = '#0B2540', LINE_WIDTH = 2.2;

export interface SignaturePadApi { borrar: () => void; vacia: () => boolean; imagen: () => string | null; marcar: () => void }

interface Point { x: number; y: number }

export function signaturePad(canvas: HTMLCanvasElement): SignaturePadApi {
  const context = canvas.getContext('2d');
  let drawing = false, signed = false, last: Point | null = null;
  const fit = (): void => {
    const box = canvas.getBoundingClientRect(), ratio = window.devicePixelRatio || 1;
    canvas.width = box.width * ratio; canvas.height = box.height * ratio;
    if (context) { context.scale(ratio, ratio); context.lineWidth = LINE_WIDTH; context.lineCap = 'round'; context.lineJoin = 'round'; context.strokeStyle = INK; }
    signed = false;
  };
  const point = (event: PointerEvent): Point => { const box = canvas.getBoundingClientRect(); return { x: event.clientX - box.left, y: event.clientY - box.top }; };
  canvas.addEventListener('pointerdown', event => { event.preventDefault(); canvas.setPointerCapture(event.pointerId); drawing = true; last = point(event); });
  canvas.addEventListener('pointermove', event => {
    if (!drawing || !context || !last) return;
    const next = point(event);
    context.beginPath(); context.moveTo(last.x, last.y); context.lineTo(next.x, next.y); context.stroke();
    last = next; signed = true;
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(type => { canvas.addEventListener(type, () => { drawing = false; }); });
  requestAnimationFrame(fit);
  return { borrar: fit, vacia: () => !signed, imagen: () => (signed ? canvas.toDataURL('image/png').split(',')[1] ?? null : null), marcar: () => { signed = true; } };
}
