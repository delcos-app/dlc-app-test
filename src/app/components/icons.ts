/**
 * Line icons instead of emojis and glyphs: the desktop menu with the same icons as the phone, and every painted text with its
 * emojis turned into icons (and the «i» help buttons into the info icon). Migrated from the legacy componentes/iconos.js
 * (v2.427.0); iconosMenu and iconizar stay as adapters. The icon sets (ICON_NOM, ICON_EMOJI, ICO_NAV) and the emoji expression
 * stay in legacy data: many files read them.
 */
import { leftoversLegacy } from '../legacy/leftovers-bridge';

const SKIPPED = 'script,style,textarea,svg,[data-noico]';
const VARIATION_SELECTOR = '️';

/** The desktop menu with the same line icons as the phone. */
export function menuIcons(): void {
  document.querySelectorAll<HTMLElement>('nav.main [data-t]').forEach(button => {
    const name = leftoversLegacy.navIcon(button.dataset.t ?? '');
    if (button.querySelector('.navico') || !name) return;
    button.insertAdjacentHTML('afterbegin', `<span class="navico">${leftoversLegacy.svgIcon(leftoversLegacy.namedIcon(name))}</span>`);
  });
}

function textNodesWithEmojis(element: Element, pattern: RegExp): Text[] {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, { acceptNode: node => {
    const parent = node.parentElement; if (!parent || parent.closest(SKIPPED)) return NodeFilter.FILTER_REJECT;
    pattern.lastIndex = 0; return pattern.test(node.nodeValue ?? '') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
  } });
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  return nodes;
}

function replaceEmojis(node: Text, pattern: RegExp): void {
  const parent = node.parentElement, text = node.nodeValue ?? '';
  if (!parent) return;
  if (parent.tagName === 'OPTION' || parent.tagName === 'TITLE') { node.nodeValue = text.replace(pattern, '').replace(/^\s+/, ''); return; }
  const fragment = document.createDocumentFragment();
  let last = 0, match: RegExpExecArray | null;
  pattern.lastIndex = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > last) fragment.appendChild(document.createTextNode(text.slice(last, match.index)));
    if (match[0] !== VARIATION_SELECTOR) {
      const icon = document.createElement('span'); icon.className = 'icw'; icon.innerHTML = leftoversLegacy.svgIcon(leftoversLegacy.emojiIcon(match[0]));
      fragment.appendChild(icon);
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) fragment.appendChild(document.createTextNode(text.slice(last)));
  node.replaceWith(fragment);
}

/** Replaces emojis and glyphs by line icons in everything under `root` (and the «i» help buttons by the info icon). */
export function iconise(root: Node | null | undefined): void {
  if (!root?.nodeType) return;
  const element = root.nodeType === Node.ELEMENT_NODE ? root as Element : root.parentElement;
  if (!element || element.closest(SKIPPED)) return;
  const pattern = leftoversLegacy.emojiPattern();
  textNodesWithEmojis(element, pattern).forEach(node => { replaceEmojis(node, pattern); });
  const helps = [...(element.matches('.ai') ? [element] : []), ...element.querySelectorAll('.ai')];
  helps.forEach(button => { if (!button.querySelector('svg') && (button.textContent ?? '').trim() === 'i') button.innerHTML = leftoversLegacy.svgIcon(leftoversLegacy.namedIcon('info')); });
}
