/**
 * Typed calls to the SQL functions (plan 7.5, v2.432.0). The contract (contract.ts) is generated from the database schema by
 * delcos-qa/pruebas/herramientas/contrato_api.js: a misspelt function or parameter, or a missing required one, no longer compiles.
 * Results of json functions are loosely typed (their keys, when the body tells them, as optional unknowns): each screen narrows
 * them to its own shape.
 */
import { legacyDb } from '../legacy/bridge';
import type { Contract } from './contract';

export type RpcName = keyof Contract;
export type RpcParams<K extends RpcName> = Contract[K]['params'];
export type RpcResult<K extends RpcName> = Contract[K]['result'];

/** A function whose parameters are all optional (or that has none) may be called without them. */
type ParamsArgument<K extends RpcName> = Record<never, never> extends RpcParams<K> ? [] | [RpcParams<K>] : [RpcParams<K>];

/** Calls the SQL function `name` with the parameters its schema declares. */
export function rpc<K extends RpcName>(name: K, ...params: ParamsArgument<K>): PromiseLike<LegacyResult<RpcResult<K>>> {
  const [values] = params;
  return legacyDb().rpc<RpcResult<K>>(name, values as Record<string, unknown> | undefined);
}
