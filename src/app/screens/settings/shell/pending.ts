/**
 * What is pending in Configuración (a dot in the index and a notice on the page): no departure point, no company email, no recent
 * backup. Read at most once a minute. Migrated from the legacy pendientesCfg (v2.422.0).
 */
import { legacyDb } from '../../../legacy/bridge';
import { shellLegacy } from '../../../legacy/shell-bridge';
import { t } from '../../../i18n';

const CACHE_MS = 60000, DAY_MS = 864e5, BACKUP_MAX_DAYS = 7, BACKUP_ACTION = 'Copia de seguridad';

let cached: { at: number; list: Record<string, string> } = { at: 0, list: {} };

async function backupNotice(): Promise<string | null> {
  const { data } = await legacyDb().from<{ creado_en: string }[]>('auditoria').select('creado_en').eq('accion', BACKUP_ACTION)
    .order('creado_en', { ascending: false }).limit(1);
  const last = data?.[0];
  if (!last) return t('settingsShell.pending.noBackup');
  const days = Math.floor((Date.now() - new Date(last.creado_en).getTime()) / DAY_MS);
  return days > BACKUP_MAX_DAYS ? t('settingsShell.pending.oldBackup', { days }) : null;
}

async function organisationNotices(list: Record<string, string>): Promise<void> {
  try { const { data } = await shellLegacy.emailSettings(); if (!data?.host) list['o.correo'] = t('settingsShell.pending.noEmail'); } catch { /* not shown */ }
  try { const notice = await backupNotice(); if (notice) list['o.copias'] = notice; } catch { /* not shown */ }
}

/** Pending notices by settings key ('rutas.salida', 'o.correo', 'o.copias'). */
export async function pendingSettings(): Promise<Record<string, string>> {
  if (Date.now() - cached.at < CACHE_MS) return cached.list;
  const list: Record<string, string> = {};
  try { if (!shellLegacy.hasDeparture() && shellLegacy.canUseModule('agenda')) list['rutas.salida'] = t('settingsShell.pending.noDeparture'); } catch { /* not shown */ }
  if (shellLegacy.canManageOrganisation()) await organisationNotices(list);
  cached = { at: Date.now(), list };
  return list;
}
