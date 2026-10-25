/** A simple list row: icon, title and a line under it. Migrated from the legacy itemHTML (v2.416.0). */
import { escapeHtml } from '../../services/format';

export interface ListItem { readonly id: string; readonly icon: string; readonly iconClass?: string; readonly title: string; readonly detail: string }

/** `icon` and `detail` are HTML; the title is escaped. */
export const itemHtml = (item: ListItem): string =>
  `<button class="item" data-id="${item.id}"><span class="ic ${item.iconClass ?? ''}">${item.icon}</span>
   <span class="tx"><b>${escapeHtml(item.title)}</b><span class="sm">${item.detail}</span></span></button>`;
