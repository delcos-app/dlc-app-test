/**
 * The block pages (Eventos, Intervenciones, Concursos, Parque instalado): their cards become a table with the same rows, and the
 * blocks (Próximos, Pasados, Reposiciones…) become indicators that filter and a quick filter. Migrated from BLQ (componentes/lista.js)
 * and the PL entries of legado 087 (v2.239.0; v2.421.0).
 */
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { EVENT_TYPES } from '../../../screens/events/model';
import { chosenGroups } from '../state';
import { smallText, textOf } from '../text';
import type { BlockConfig, ListConfig } from '../types';
import { gridConfig } from './grid';

const TIME = /^\d{1,2}:\d{2}$/;
const NUMBER = 'num';

const bold = (row: Element): string => `<b>${escapeHtml(textOf(row.querySelector('.tx b')))}</b>`;
const statePill = (row: Element): string => row.querySelector('.cirest')?.innerHTML ?? '';

function eventCells(row: HTMLElement): string[] {
  const parts = smallText(row).split(' · '), time = parts.find(part => TIME.test(part));
  const type = parts.find(part => (EVENT_TYPES as readonly string[]).includes(part));
  const attendees = parts.find(part => part.includes('asistente')) ?? '';
  const place = parts.filter((part, index) => index > 0 && part !== time && part !== type && part !== attendees).join(' · ');
  return [bold(row), escapeHtml((parts[0] ?? '') + (time ? ` · ${time}` : '')), escapeHtml(type ?? '—'), escapeHtml(place || '—'),
    escapeHtml((/\d+/.exec(attendees) ?? ['0'])[0]), escapeHtml(textOf(row.querySelector('.evtot')) || '—')];
}

function surgeryCells(row: HTMLElement): string[] {
  const time = textOf(row.querySelector('.cirf .sm'));
  return [escapeHtml(textOf(row.querySelector('.cirf b')) + (time ? ` · ${time}` : '')), bold(row), escapeHtml(smallText(row.querySelector('.tx'))), statePill(row)];
}

const plainCells = (row: HTMLElement): string[] => [bold(row), escapeHtml(smallText(row.querySelector('.tx'))), statePill(row)];

/** The block pages and how each one becomes a table (the record attribute, what it lists, its columns and cells). */
export const blocks = (): Record<string, BlockConfig> => ({
  eventos: { attr: 'ev', que: t('listBar.blocks.events'), grupo: t('listBar.blocks.when'), def: t('listBar.blocks.allEvents'),
    cols: [[t('listBar.blocks.event'), ''], [t('listBar.blocks.date'), ''], [t('listBar.blocks.type'), ''], [t('listBar.blocks.place'), ''], [t('listBar.blocks.attendees'), NUMBER], [t('listBar.blocks.spending'), NUMBER]],
    celdas: eventCells },
  cirugias: { attr: 'cir', que: t('listBar.blocks.surgeries'), grupo: t('listBar.blocks.block'), def: t('listBar.blocks.allSurgeries'),
    cols: [[t('listBar.blocks.date'), ''], [t('listBar.blocks.surgery'), ''], [t('listBar.blocks.teamAndPlace'), ''], [t('listBar.blocks.state'), '']],
    celdas: surgeryCells },
  concursos: { attr: 'con', que: t('listBar.blocks.tenders'), grupo: t('listBar.blocks.block'), def: t('listBar.blocks.allTenders'),
    cols: [[t('listBar.blocks.tender'), ''], [t('listBar.blocks.customerBodyLots'), ''], [t('listBar.blocks.stateAndDeadlines'), '']],
    celdas: plainCells },
  parque: { attr: 'eq', que: t('listBar.blocks.equipment'), grupo: t('listBar.blocks.block'), def: t('listBar.blocks.allEquipment'),
    cols: [[t('listBar.blocks.equipmentName'), ''], [t('listBar.blocks.serialCentreContract'), ''], [t('listBar.blocks.reviewAndExpiry'), '']],
    celdas: plainCells },
});

/** The list configuration of a block page: its block filter, its band of blocks and the filters it counts. */
export function blockConfig(tab: string, block: BlockConfig): { lista: ListConfig } {
  return { lista: gridConfig({ tab, que: () => block.que, bloques: block, rapidos: [[`#plg-${tab}`, block.grupo]], banda: `plgb-${tab}`,
    activos: () => (chosenGroups[tab] ? 1 : 0) + (document.getElementById(`v-${tab}`)?.querySelectorAll('.htchips .htchip').length ?? 0) }) };
}
