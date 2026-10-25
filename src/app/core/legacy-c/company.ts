/**
 * Datos fiscales with a live preview of the invoice header (v2.55.0), and the names of the fields in the change history (v2.117.0).
 * Folded from legado 056 and 072 (v2.425.0).
 */
import { term } from '../../legacy/bridge';
import { t, type MessageKey } from '../../i18n';
import { escapeHtml } from '../../services/format';
import { byId } from './dom';
import * as legacyFreeCoreServices from '../services';

const NOTE_CHARS = 180;

function previewHtml(): string {
  const value = (key: string): string => (byId<HTMLInputElement>(`em_${key}`)?.value ?? '').trim();
  const brand = (AJUSTES.marca ?? {}) as { logo_factura?: boolean };
  const logo = MARCA.logo && brand.logo_factura !== false;
  const address = [value('direccion'), [value('cp'), value('municipio') || value('poblacion')].filter(Boolean).join(' '), value('provincia')].filter(Boolean).join(', ');
  const note = (document.querySelector<HTMLTextAreaElement>('#fcuerpo textarea')?.value ?? '').slice(0, NOTE_CHARS);
  return `<div class="fpcab">${logo ? `<img src="${escapeHtml(MARCA.logo ?? '')}" alt="">` : ''}<div><b>${escapeHtml(value('razon_social') || t('legacyC.company.legalName'))}</b>
        <span>${t('legacyC.company.taxId', { id: escapeHtml(value('nif') || '—') })}</span><span>${escapeHtml(address || t('legacyC.company.address'))}</span>
        <span>${escapeHtml([value('telefono'), value('email'), value('web')].filter(Boolean).join(' · '))}</span></div>
        <div class="fpnum"><b>${t('legacyC.company.invoice')}</b><span>F260001</span><span>${legacyFreeCoreServices.calendar.shortDate((hoyISO()))}</span></div></div>
      <div class="fplineas"><div><span>${t('legacyC.company.sampleProduct')}</span><span>2 × 30,00 €</span></div></div>
      <div class="fppie">${value('iban') ? `${t('legacyC.company.transfer', { iban: escapeHtml(value('iban')) })}<br>` : ''}${escapeHtml(note)}</div>`;
}

/** Datos fiscales, then the preview of the invoice header next to the form (the legacy pintarEmpresa). */
export async function paintCompany(args: readonly unknown[]): Promise<void> {
  await pintarEmpresaBase2(...args);
  const card = byId('fcuerpo')?.querySelector('.card'); if (!card || byId('fprev')) return;
  const wrapper = document.createElement('div'); wrapper.className = 'conprevia';
  card.parentNode?.insertBefore(wrapper, card); wrapper.appendChild(card);
  wrapper.insertAdjacentHTML('beforeend', `<div class="previa"><div class="sm previat">${t('legacyC.company.previewTitle')}</div><div class="facprev" id="fprev"></div></div>`);
  const paint = (): void => { const preview = byId('fprev'); if (preview) preview.innerHTML = previewHtml(); };
  card.addEventListener('input', paint); paint();
}

/** The names of the fields in the change history (the legacy CAMPO_TXT; «especialidad» follows the vocabulary when read). */
export function fieldNames(): Record<string, string> {
  const names: Record<string, string> = {};
  FIELDS.forEach(field => {
    if (field === 'especialidad') Object.defineProperty(names, field, { enumerable: true, configurable: true, get: () => term('especialidad', { capital: 'C' }) });
    else names[field] = field === 'cuenta_id' ? term('medico', { capital: 'C' }) : t(`legacyC.fieldNames.${field}` as MessageKey);
  });
  return names;
}

const FIELDS = ['nombre', 'estado_comercial', 'especialidad', 'area', 'telefono', 'movil', 'email', 'direccion', 'cp', 'municipio', 'provincia', 'nota', 'urgente',
  'centro_nombre', 'dias', 'principal', 'nif', 'cuenta_id', 'codigo', 'precio', 'estado', 'sin_reporting', 'clasificadores', 'planta', 'sala', 'indicaciones', 'lat', 'lon'];
