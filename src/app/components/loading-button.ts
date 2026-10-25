/**
 * A button while its action runs: disabled, with a spinner and a text, and back as it was at the end. Folded from the legacy
 * conCargaBase of legado 048 (v2.424.0); conCargaBase stays as an adapter (legado 074 builds conCarga on it).
 */
import { escapeHtml } from '../services/format';

export async function withLoading<T>(button: HTMLElement | null, text: string, work: () => Promise<T>): Promise<T | undefined> {
  if (!button || button.dataset.cargando) return undefined;
  const before = button.innerHTML;
  button.dataset.cargando = '1'; (button as HTMLButtonElement).disabled = true; button.classList.add('btncarga');
  button.innerHTML = `<span class="giro"></span>${escapeHtml(text)}`;
  try { return await work(); } finally {
    button.innerHTML = before; (button as HTMLButtonElement).disabled = false; button.classList.remove('btncarga'); delete button.dataset.cargando;
  }
}
