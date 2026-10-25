/**
 * One observer per list screen: each time the screen paints itself again, the list page model is adjusted before it is seen. The
 * screens still paint themselves with innerHTML at any moment, so the observer stays until they call the bar themselves. Pages that
 * create their section on entering (Eventos, Intervenciones…) are watched again when the section is a new one. Migrated from
 * plObservar and plVigilar (v2.236.0; v2.239.0; v2.421.0).
 */
import { syncListBar } from './sync';

const BURST_WINDOW_MS = 100, BURST_MAX = 30;
const OPTIONS: MutationObserverInit = { childList: true, subtree: true, characterData: true };

const observers: Record<string, MutationObserver | undefined> = {};
const watched: Record<string, Element | undefined> = {};

/** How many times the bar was adjusted by the observers (window.PL_N, for measuring). */
const countSync = (): void => { const counter = window as unknown as { PL_N?: number }; counter.PL_N = (counter.PL_N ?? 0) + 1; };

export function observe(tab: string): void {
  const section = document.getElementById(`v-${tab}`); if (!section || observers[tab]) return;
  let pending = false, burst = 0, burstStart = 0;
  const observer = new MutationObserver(() => {
    if (pending) return;
    // Brake: more than 30 adjustments in 100 ms means another part of the screen answers each change; it waits for the next frame
    const now = performance.now(); if (now - burstStart > BURST_WINDOW_MS) { burstStart = now; burst = 0; }
    burst += 1;
    if (burst > BURST_MAX) {
      if (burst === BURST_MAX + 1) requestAnimationFrame(() => { burst = 0; burstStart = performance.now(); syncListBar(tab); });
      return;
    }
    pending = true;
    queueMicrotask(() => {
      pending = false; countSync(); observer.disconnect();
      try { syncListBar(tab); } finally { observer.takeRecords(); observer.observe(section, OPTIONS); }
    });
  });
  observers[tab] = observer; observer.observe(section, OPTIONS);
}

/** Watches the screen's section again if it is a new element (pages create theirs on entering). */
export function watch(tab: string): void {
  const section = document.getElementById(`v-${tab}`); if (!section || watched[tab] === section) return;
  const previous = observers[tab]; if (previous) { previous.disconnect(); observers[tab] = undefined; }
  watched[tab] = section; observe(tab);
}
