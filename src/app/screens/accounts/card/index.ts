/**
 * The account card (ficha): an explicit list of named sections, each painting one block, run in order. Before (until v2.400.0)
 * it was abrirFicha wrapping abrirFichaBase17 … abrirFichaBase: 18 layers, each adding its block after the inner ones finished.
 * The order and what waits for what are the same as those layers; a failing section does not stop the others.
 * Sections still in legacy are reached through the bridge and migrate one by one. abrirFicha stays as the global adapter:
 * «‹ Volver» (legado 126) wraps the windows by their global names.
 */
import { accountCardLegacy, agendaActions } from '../../../legacy/bridge';
import { addPrivacySection } from '../../privacy/person-data';
import { paintBase as paintBaseBlocks } from './base';
import { archiveButtons, centreProfessionals, cycle } from './sections-account';
import { platformAccess } from './sections-access';
import { changeHistory, portalProposal } from './sections-admin';
import { timetableNotice, units } from './sections-base';
import { presentedProducts, visitMaterial, visitPhotos } from './sections-history';
import { deposit, equipment, events, samples, surgeries, tenders } from './sections-related';
import { stillShown } from './card-tools';
import { centreProducts, portalActivity } from './sections-portal';
import { associatedClients, salesRepAndPatients } from './sections-sales';

/** A section: `wait` false runs it without waiting (it fills its block when its data arrives). */
interface Section { readonly name: string; readonly run: (id: string) => Promise<void>; readonly wait?: boolean }

const LOADING_LIMIT_MS = 8000;

/** Painted while the card shows «cargando» (in the legacy order). */
const BASE: readonly Section[] = [
  { name: 'base', run: paintBaseBlocks },
  { name: 'salesRepAndPatients', run: salesRepAndPatients },
  { name: 'timetableNotice', run: timetableNotice },
  { name: 'visitMaterial', run: visitMaterial },
  { name: 'units', run: units },
  { name: 'associatedClients', run: associatedClients },
];

/** Right after the base, while the centre of the appointment (if the card was opened from one) still counts. */
const ACCESS: Section = { name: 'platformAccess', run: platformAccess };
const CUSTOM_FIELDS: Section = {
  name: 'customFields', wait: false,
  run: id => accountCardLegacy.customFields(id, document.getElementById('fzcampos') ?? document.querySelector('#ficha .fbody, #ficha #fbody') ?? document.getElementById('ficha')?.firstElementChild ?? null),
};

/** After that, in order. */
const SECTIONS: readonly Section[] = [
  { name: 'changeHistory', run: changeHistory, wait: false },
  { name: 'portalActivity', run: portalActivity, wait: false },
  { name: 'centreProducts', run: centreProducts, wait: false },
  { name: 'visitPhotos', run: visitPhotos },
  { name: 'samples', run: samples },
  { name: 'events', run: events },
  { name: 'deposit', run: deposit },
  { name: 'cycle', run: cycle },
  { name: 'presentedProducts', run: presentedProducts },
  { name: 'surgeries', run: surgeries },
  { name: 'tenders', run: tenders },
  { name: 'equipment', run: equipment },
  { name: 'portalProposal', run: portalProposal },
  { name: 'centreProfessionals', run: centreProfessionals },
  { name: 'archiveButtons', run: archiveButtons },
  // v2.446.0: «Protección de datos» (RGPD), at the foot, for whoever configures the company
  { name: 'privacy', run: id => { addPrivacySection('cuenta', id, () => stillShown(id), () => { agendaActions.openAccount(id); }); return Promise.resolve(); } },
];

async function runSection(section: Section, id: string): Promise<void> {
  try { await section.run(id); } catch (error) { console.error(`ficha · ${section.name}`, error); }
}

/** The base blocks, with the card marked «cargando» (at most 8 s). Without sales to show, that section goes away (v2.96.0). */
async function paintBase(id: string): Promise<void> {
  const card = document.getElementById('ficha');
  card?.classList.add('cargando');
  const limit = setTimeout(() => card?.classList.remove('cargando'), LOADING_LIMIT_MS);
  try {
    accountCardLegacy.forgetPatients();
    for (const section of BASE) await section.run(id);
    if (document.getElementById('fventas') && !document.getElementById('fventasc')?.children.length) document.getElementById('fventas')?.remove();
  } finally {
    clearTimeout(limit);
    requestAnimationFrame(() => card?.classList.remove('cargando'));
  }
}

/** Opens the card of an account and paints its sections. */
export async function openAccountCard(id: string): Promise<void> {
  try {
    await paintBase(id);
    await runSection(ACCESS, id);
    void runSection(CUSTOM_FIELDS, id);
  } finally {
    // The centre of the appointment the card was opened from only counts for this opening
    accountCardLegacy.forgetCentreFromAppointment();
  }
  for (const section of SECTIONS) {
    if (section.wait === false) void runSection(section, id);
    else await runSection(section, id);
  }
}
