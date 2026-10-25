/**
 * Dragging in «Personalizar menú» on desktop, only from the handle: pressing it makes its row (or its block) draggable; a section moves
 * inside its block, a block between blocks. Migrated from the drag part of the legacy menuPersonalizarBase (v2.426.0).
 */
import { moveBlock, moveItem, type Draft } from './customise';

interface Dragged { kind: 'item' | 'block'; key?: string; group: string; element: HTMLElement }

const MARKS = ['soltar-antes', 'soltar-despues'];

function start(box: HTMLElement, event: DragEvent): Dragged | null {
  const element = (event.target as Element).closest<HTMLElement>('[draggable="true"]'); if (!element) { event.preventDefault(); return null; }
  const dragged: Dragged = element.classList.contains('mlpi')
    ? { kind: 'item', key: element.dataset.k ?? '', group: element.dataset.g ?? '', element } : { kind: 'block', group: element.dataset.g ?? '', element };
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    try { event.dataTransfer.setData('text/plain', dragged.key ?? dragged.group); } catch { /* some browsers refuse it */ }
  }
  requestAnimationFrame(() => { if (box.contains(dragged.element)) dragged.element.classList.add('arrastrando'); });
  return dragged;
}

function over(box: HTMLElement, dragged: Dragged, event: DragEvent): void {
  const target = dragged.kind === 'item' ? (event.target as Element).closest<HTMLElement>(`.mlpi[data-g="${dragged.group}"]`) : (event.target as Element).closest<HTMLElement>('.mlpg');
  box.querySelectorAll(`.${MARKS.join(', .')}`).forEach(mark => { mark.classList.remove(...MARKS); });
  if (!target || target === dragged.element) return;
  event.preventDefault(); const rect = target.getBoundingClientRect();
  target.classList.add(event.clientY < rect.top + rect.height / 2 ? 'soltar-antes' : 'soltar-despues');
}

function drop(box: HTMLElement, dragged: Dragged, draft: Draft): boolean {
  const target = box.querySelector<HTMLElement>('.soltar-antes, .soltar-despues'); if (!target) return false;
  const before = target.classList.contains('soltar-antes');
  if (dragged.kind === 'item') moveItem(draft, dragged.group, dragged.key ?? '', { key: target.dataset.k ?? '', before });
  else moveBlock(draft, dragged.group, target.dataset.g ?? '', before);
  return true;
}

/** Wires the dragging of the panel. */
export function wireDrag(panel: { box: HTMLElement; draft: Draft; repaint: () => void }): void {
  const { box, draft, repaint } = panel;
  let dragged: Dragged | null = null;
  box.addEventListener('pointerdown', event => {
    box.querySelectorAll('[draggable="true"]').forEach(element => { element.removeAttribute('draggable'); });
    const grip = (event.target as Element).closest<HTMLElement>('.mlpasa'); if (!grip) return;
    (grip.dataset.ag ? grip.closest('.mlpg') : grip.closest('.mlpi'))?.setAttribute('draggable', 'true');
  });
  box.addEventListener('dragstart', event => { dragged = start(box, event); });
  box.addEventListener('dragover', event => { if (dragged) over(box, dragged, event); });
  box.addEventListener('drop', event => {
    if (!dragged) return; event.preventDefault();
    if (drop(box, dragged, draft)) { dragged = null; repaint(); }
  });
  box.addEventListener('dragend', () => {
    dragged = null;
    box.querySelectorAll(`.${MARKS.join(', .')}`).forEach(mark => { mark.classList.remove(...MARKS); });
    box.querySelectorAll('.arrastrando').forEach(element => { element.classList.remove('arrastrando'); });
  });
}
