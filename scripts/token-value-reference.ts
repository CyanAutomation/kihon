import type { TokenReference } from './token-types.ts';

const REFERENCE = /^\{[^{}]+\}$/;

/** Recognize a complete DTCG reference string such as `{space.4}`. */
export function isTokenReference(value: unknown): value is TokenReference {
  return typeof value === 'string' && REFERENCE.test(value);
}
