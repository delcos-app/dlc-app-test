/**
 * The Spanish texts that arrive with the chunk accounts (min/chunks/accounts.js, plan 7.3, cut F): only its code uses them, so the
 * core does not carry them. screens/accounts/texts.ts registers them when the chunk loads.
 */
import { accounts } from './accounts';
import { accountsEditor } from './accounts-editor';
import { accountsMap } from './accounts-map';
import { accountsMore } from './accounts-more';

export const texts = { accounts, accountsEditor, accountsMap, accountsMore } as const;
