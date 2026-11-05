/** Whether a screen shows its checkbox column now (Cuentas adds its 40 px to the width of its table). */
import { configOf } from '../configs';
import { showsSelection } from './view';

export function selectionShown(tab: string): boolean {
  const selection = configOf(tab)?.seleccion;
  return selection ? showsSelection(selection) : false;
}
