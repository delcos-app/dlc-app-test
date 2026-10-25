/**
 * The route being edited (kept in the legacy RN: the tests, the main menu and the day map read it) and how the wizard repaints
 * itself: wizard.ts sets `repaint`, because the steps cannot import it back. Migrated from the legacy rnNombre (v2.414.0).
 */
import { routesLegacy } from '../../legacy/routes-bridge';
import { t } from '../../i18n';
import { orFallback } from '../../services/values';
import { autoName } from './model';

export const wizardHooks = { repaint: (): void => undefined };

/** Lets the app compute the hour of `id` again. */
export function unfix(draft: RouteDraft, id: string): void {
  draft.fijas = Object.fromEntries(Object.entries(draft.fijas).filter(([key]) => key !== id));
}

export const currentDraft = (): RouteDraft | null => routesLegacy.draft();

/** The name written, or the one proposed with the day and the towns while the user has not written one. */
export function routeName(draft: RouteDraft): string {
  if (draft.auto) draft.nombre = autoName(draft.ms, draft.rep);
  return orFallback(draft.nombre, t('routes.name.newRoute'));
}
