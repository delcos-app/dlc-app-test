/**
 * The professional portal home (v2.417.0): the cards, the week and sales, the operations, the glance, the calls and the hidden
 * alerts, in this order. Migrated from the legacy pintarInicioBase2 chain; filtrarAlertasInicio and verOcultas stay as adapters
 * (legado 040 calls the first).
 */
import { currentScreen } from '../../../legacy/bridge';
import { filterHiddenAlerts } from './alerts';
import { paintPortalCards } from './cards';
import { paintCallsToday, paintGlanceStep, paintOperations } from './extras';
import { paintWeekAndSales } from './week';

export { filterHiddenAlerts, showHiddenAlerts } from './alerts';
export { placeHeader, removeOldBlocks } from './extras';

export async function paintProfessionalHome(): Promise<void> {
  await paintPortalCards();
  await paintWeekAndSales();
  await paintOperations();
  await paintGlanceStep();
  await paintCallsToday();
  if (currentScreen() === 'inicio') await filterHiddenAlerts();
}
