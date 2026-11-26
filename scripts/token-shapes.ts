import { isJsonObject } from './token-json.ts';
import type { TokenDefinition } from './token-types.ts';

/** Recognize token definitions while leaving group-type inheritance optional. */
export function isTokenDefinition(value: unknown): value is TokenDefinition {
  if (!isJsonObject(value) || !Object.hasOwn(value, '$value')) return false;
  return !Object.hasOwn(value, '$type') || typeof value.$type === 'string';
}
