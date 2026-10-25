/**
 * The header of Cuentas: its title and the «Calidad del dato» button (for who has the module). Migrated from the legacy
 * botonCalidadBase (v2.410.0); botonCalidad stays as an adapter (the start-up of legado 018 calls it).
 */
import { goTo, icon, qualityLegacy, term } from '../../legacy/bridge';
import { t } from '../../i18n';
import { arrangeHeader } from '../accounts/list/bar';

export function paintAccountsHeader(): void {
  const view = document.getElementById('v-directorio');
  if (view && !document.getElementById('dircab')) {
    const button = qualityLegacy.canUseModule('seguimiento') ? `<button class="btn sec" id="dircalidad">${icon('shield-check')} ${t('quality.accountsHeader.dataQuality')}</button>` : '';
    view.insertAdjacentHTML('afterbegin', `<div class="saludo" id="dircab"><div><h1>${term('medico', { number: 'p', capital: 'C' })}</h1><div class="fecha">${t('quality.accountsHeader.subtitle', { Professionals: term('medico', { number: 'p', capital: 'C' }) })}</div></div>
    <div class="acts">${button}</div></div>`);
    const quality = document.getElementById('dircalidad'); if (quality) quality.onclick = (): void => { goTo('seguimiento'); };
  }
  arrangeHeader();
}
