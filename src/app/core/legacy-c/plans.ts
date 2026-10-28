/**
 * The plans by user (v2.117.0: Campo, Comercial, Empresa and A medida; price per user and month without VAT, annual payment = 10 of 12
 * months; at least 3 users except A medida), with the sentences and advantages published on delcos.app (v2.157.0, Oportunidades and the
 * portal as v2.158.0), what each module brings (v2.53.0) and the extras of a company. Folded from legado 054, 071 and 075 (v2.425.0):
 * the plans are written once with their final texts (v2.157.0 only changed what is shown, at load, before anything read it).
 */
import { term } from '../../legacy/bridge';
import { t } from '../../i18n';
import { sessionStore } from '../session-store';
import * as legacyFreeCoreServices from '../services';

interface Plan {
  id: string; nombre: string; precio: number | null; anual: number | null; minimo: number; incluidos: number; bloque: [number, number];
  medicos: number | null; presupuesto?: boolean; para: string; modulos: string[]; ventajas: string[];
}

const FIELD = ['inicio', 'agenda', 'rutas', 'directorio', 'seguimiento'];
const SALES = [...FIELD, 'ventas', 'pacientes', 'productos', 'analitica'];
const COMPANY = [...SALES, 'facturacion'];
const BIG_NETWORK_USERS = 50;

const lines = (key: 'field' | 'sales' | 'company' | 'custom', words: Record<string, string>): string[] =>
  t(`legacyC.plans.${key}.advantages`, words).split('|');

/** The plans with their final texts (the legacy PLANES, built once at legado 041). */
export function definePlanList(): Plan[] {
  const words = { professionals: term('medico', { number: 'p' }), visits: term('visita', { number: 'p' }), ofTheProfessional: term('medico', { article: 'del' }) };
  return [
    { id: 'campo', nombre: t('legacyC.plans.field.name'), precio: 29, anual: 24, minimo: 3, incluidos: 3, bloque: [1, 29], medicos: 0, para: t('legacyC.plans.field.for'), modulos: [...FIELD], ventajas: lines('field', words) },
    { id: 'comercial', nombre: t('legacyC.plans.sales.name'), precio: 42, anual: 35, minimo: 3, incluidos: 3, bloque: [1, 42], medicos: 0, para: t('legacyC.plans.sales.for'), modulos: [...SALES], ventajas: lines('sales', words) },
    { id: 'empresa', nombre: t('legacyC.plans.company.name'), precio: 59, anual: 49, minimo: 3, incluidos: 3, bloque: [1, 59], medicos: BIG_NETWORK_USERS, para: t('legacyC.plans.company.for'), modulos: [...COMPANY], ventajas: lines('company', words) },
    { id: 'medida', nombre: t('legacyC.plans.custom.name'), precio: null, anual: null, minimo: BIG_NETWORK_USERS, incluidos: BIG_NETWORK_USERS, bloque: [1, 0], medicos: null, presupuesto: true,
      para: t('legacyC.plans.custom.for'), modulos: [...COMPANY], ventajas: lines('custom', words) },
  ];
}

/** What each module brings, for the plan page (the legacy MOD_PLAN). */
export function planModules(): [string, string, string][] {
  const words = { visits: term('visita', { number: 'p' }), professionalsCapital: term('medico', { number: 'p', capital: 'C' }), patientsCapital: term('paciente', { number: 'p', capital: 'C' }), professionals: term('medico', { number: 'p' }) };
  return [
    ['agenda', t('legacyC.modules.agenda.name'), t('legacyC.modules.agenda.brings', words)], ['rutas', t('legacyC.modules.routes.name'), t('legacyC.modules.routes.brings')],
    ['directorio', legacyFreeCoreServices.vocabulary.contactsLabel(), t('legacyC.modules.accounts.brings', words)], ['seguimiento', t('legacyC.modules.quality.name'), t('legacyC.modules.quality.brings')],
    ['ventas', t('legacyC.modules.sales.name'), t('legacyC.modules.sales.brings')], ['pacientes', t('legacyC.modules.customers.name'), t('legacyC.modules.customers.brings', words)],
    ['productos', t('legacyC.modules.products.name'), t('legacyC.modules.products.brings')], ['analitica', t('legacyC.modules.analytics.name'), t('legacyC.modules.analytics.brings', words)],
    ['facturacion', t('legacyC.modules.billing.name'), t('legacyC.modules.billing.brings')],
  ];
}

/** Whether the company has an extra: given apart, or included in its plan (the legacy hayExtra). */
export function hasExtra(key: string): boolean {
  const plan = (sessionStore.plan as { extras?: string[]; plan?: string } | null | undefined) ?? {};
  return (plan.extras ?? []).includes(key) || ((PLAN_EXTRAS as Record<string, string[] | undefined>)[key] ?? []).includes(plan.plan ?? '');
}
