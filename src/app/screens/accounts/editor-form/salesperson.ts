/**
 * «Comercial asignado» in «Editar ficha», for who administers: the new sales are credited to the salesperson assigned at that
 * moment. Migrated from the legacy abrirEditorBase2 (legado 019) (v2.419.0). It is now assigned after the account is saved
 * (before, on any press of the button, even if the account could not be saved).
 */
import { callRpc, cardSectionsLegacy, legacyDb, notices, salesTeam } from '../../../legacy/bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import type { SaveHooks } from './save';

interface Member { id: string; nombre: string; rol?: string }

export async function addSalesperson(id: string, hooks: SaveHooks): Promise<void> {
  const button = document.getElementById('eguardar');
  if (!cardSectionsLegacy.can('administrar') || !button) return;
  button.closest('.acts')?.insertAdjacentHTML('beforebegin', `<label for="ecom">${t('accountsEditor.salesperson.label')}</label>
    <select id="ecom"><option>${t('common.loading')}</option></select>
    <div class="sm u-mt-4">${t('accountsEditor.salesperson.hint')}</div>`);
  if (!salesTeam.members().length) await salesTeam.load();
  const { data: current } = await callRpc<{ id: string } | null>('responsable_de_cuenta', { p_medico: id });
  const before = current?.id ?? '', select = document.getElementById('ecom') as HTMLSelectElement | null;
  if (!select) return;
  const members = salesTeam.members() as readonly Member[];
  select.innerHTML = `<option value="">${t('accountsEditor.salesperson.none')}</option>` + members.filter(member => cardSectionsLegacy.roleCan(member.rol ?? '', 'cartera') || member.id === before)
    .map(member => `<option value="${member.id}" ${member.id === before ? 'selected' : ''}>${escapeHtml(member.nombre)} · ${escapeHtml(member.rol ?? '')}</option>`).join('');
  hooks.after.push(async () => {
    const now = (document.getElementById('ecom') as HTMLSelectElement | null)?.value ?? before;
    if (now === before) return;
    const { data: result } = await legacyDb().rpc<{ ok?: boolean }>('asignar_responsable_cuenta', { p_medico: id, p_usuario: now || null });
    if (result?.ok === false) notices.toast(t('accountsEditor.salesperson.couldNotChange'), true);
  });
}
