/**
 * Configuración loaded on first use, in chunks by section (plan 7.3, cut D3): Usuarios, Plan, Correo and the rest of the sections.
 * The same functions as before, now async; the shell waits for each part before painting the next one, so a section whose chunk
 * has not arrived yet counts as a request in progress and the page appears once, painted. The facades (index.ts, extra/index.ts,
 * rest/index.ts) publish these with the functions that stay in the core.
 */
import { lazyChunk } from '../../core/lazy/load';
import type * as EmailChunk from './email/chunk';
import type * as PartsChunk from './parts/chunk';
import type * as PlanChunk from './plan/chunk';
import type * as UsersChunk from './users/chunk';

const fromUsers = lazyChunk<typeof UsersChunk>('settings-users');
const fromPlan = lazyChunk<typeof PlanChunk>('settings-plan');
const fromEmail = lazyChunk<typeof EmailChunk>('settings-email');
const fromParts = lazyChunk<typeof PartsChunk>('settings-parts');

export const showTemporaryAccess = fromUsers('showTemporaryAccess');
export const showUser = fromUsers('showUser');
export const editUser = fromUsers('editUser');
export const paintUsers = fromUsers('paintUsers');
export const newUser = fromUsers('newUser');
export const deleteUser = fromUsers('deleteUser');

export const paintPlanPage = fromPlan('paintPlanPage');
export const askBudget = fromPlan('askBudget');

export const paintEmail = fromEmail('paintEmail');

export const paintPreferences = fromParts('paintPreferences');
export const paintProfile = fromParts('paintProfile');
export const paintMyProfile = fromParts('paintMyProfile');
export const paintPreferencesPart = fromParts('paintPreferencesPart');
export const saveIndicators = fromParts('saveIndicators');
export const showNotifications = fromParts('showNotifications');
export const paintMenuNames = fromParts('paintMenuNames');
export const paintAudit = fromParts('paintAudit');
export const paintBillingLog = fromParts('paintBillingLog');
export const newClassifier = fromParts('newClassifier');
export const paintClassifiers = fromParts('paintClassifiers');
export const bringProduction = fromParts('bringProduction');
export const paintTestEnvironment = fromParts('paintTestEnvironment');
export const refreshStatus = fromParts('refreshStatus');
