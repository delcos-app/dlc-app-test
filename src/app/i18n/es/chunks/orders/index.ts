/**
 * The Spanish texts that arrive with the chunk orders (min/chunks/orders.js, plan 7.3, cut F): only its code uses them, so the
 * core does not carry them. screens/orders/texts.ts registers them when the chunk loads.
 */
import { orders } from './orders';
import { ordersMore } from './orders-more';

export const texts = { orders, ordersMore } as const;
