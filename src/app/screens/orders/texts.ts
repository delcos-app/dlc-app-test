/**
 * The texts of Pedidos arrive with its code (plan 7.3, cut F): this is the first import of chunk.ts, so they are
 * registered before any other module of the chunk runs, and t() never meets one of its keys without its text.
 */
import { registerMessages } from '../../i18n';
import { texts } from '../../i18n/es/chunks/orders';

registerMessages(texts);

export { texts };
