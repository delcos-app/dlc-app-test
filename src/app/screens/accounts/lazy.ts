/**
 * The functions of the Cuentas chunk (chunk.ts → min/chunks/accounts.js), loaded on first use (plan 7.3, cut D2): the same functions
 * as before, now async. Apart from index.ts so the core modules of Cuentas (the saved filters, the listeners) can call them too.
 * The card and the centre sheet are here as they are (without «‹ Volver»): index.ts adds it to the ones the rest of the app opens.
 */
import { lazyChunk } from '../../core/lazy/load';
import type * as Chunk from './chunk';

const fromChunk = lazyChunk<typeof Chunk>('accounts');

export const openCard = fromChunk('openAccountCard');
export const showCentreSheet = fromChunk('showCentre');
export const refreshPortal = fromChunk('refreshPortal');
export const searchAccounts = fromChunk('searchAccounts');
export const paintAccountsHeader = fromChunk('paintHeader');
export const openColumnsPanel = fromChunk('openColumnsPanel');
export const paintMap = fromChunk('paintMap');
export const loadDuplicates = fromChunk('loadDuplicates');
export const answerDuplicatesClick = fromChunk('answerDuplicatesClick');
export const paintNearby = fromChunk('paintNearby');
export const searchNearby = fromChunk('searchNearby');
export const centreFromLocation = fromChunk('centreFromLocation');
export const centreList = fromChunk('centreList');
export const markLocated = fromChunk('markLocated');
export const paintCentrePicker = fromChunk('paintCentrePicker');
export const setCentre = fromChunk('setCentre');
export const openEditor = fromChunk('openEditor');
export const consultationHtml = fromChunk('consultationHtml');
export const answerDayPickerClick = fromChunk('answerDayPickerClick');
export const readDays = fromChunk('readDays');
export const showPortfolio = fromChunk('showPortfolio');
export const changeState = fromChunk('changeState');
export const setAccountOut = fromChunk('setAccountOut');
