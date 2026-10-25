/**
 * Loading states: the whole-screen one (the app loads everything again), the spinner of a block and the skeleton of a card.
 * Migrated from componentes/carga.js (v2.416.0); pantallaCarga, cargando, skelCard and quitarCarga stay as adapters.
 */
import { t } from '../i18n';
import { escapeHtml } from '../services/format';
import { orFallback } from '../services/values';

export function showFullLoading(message: string): void {
  let overlay = document.getElementById('cargatotal');
  if (!overlay) { document.body.insertAdjacentHTML('beforeend', '<div id="cargatotal" class="cargatotal"></div>'); overlay = document.getElementById('cargatotal'); }
  if (!overlay) return;
  overlay.innerHTML = `<div><span class="spin"></span><b>${escapeHtml(message)}</b><span class="sm">${t('components.loading.everything')}</span></div>`;
  overlay.classList.remove('hide');
}

export const hideFullLoading = (): void => { document.getElementById('cargatotal')?.classList.add('hide'); };

export function showLoading(element: Element | null, text?: string): void {
  if (element) element.innerHTML = `<div class="cargador"><span class="spin"></span><span class="sm">${escapeHtml(orFallback(text, t('components.loading.default')))}</span></div>`;
}

export const cardSkeleton = (title: string): string =>
  `<h2>${escapeHtml(title)}</h2><div class="skel" style="width:45%"></div><div class="skel"></div><div class="skel" style="width:70%"></div>`;
