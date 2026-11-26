import { isJsonValue, isRecord } from './token-json.ts';
import { isTokenDefinition } from './token-shapes.ts';
import { isTokenReference } from './token-value-reference.ts';
import type { JsonValue, TokenData, TokenDefinition } from './token-types.ts';

export function lookupToken(
  reference: string,
  context: TokenData | null
): { token: TokenDefinition; type: string | null } {
  let target: unknown = context;
  let inheritedType: string | null = null;
  for (const part of reference.split('.')) {
    const record = isRecord(target) ? target : null;
    if (record && typeof record.$type === 'string') inheritedType = record.$type;
    if (!record || !Object.hasOwn(record, part)) {
      throw new Error(`Unresolved reference: ${reference}`);
    }
    target = record[part];
  }

  if (!isTokenDefinition(target)) {
    throw new Error(`Reference does not point to a token: ${reference}`);
  }

  return { token: target, type: target.$type ?? inheritedType };
}

export function resolveTokenValue(
  value: unknown,
  context: TokenData | null,
  referenceStack: readonly string[] = []
): JsonValue {
  if (!isJsonValue(value)) throw new TypeError('Token values must contain JSON-compatible data.');
  return resolveJsonValue(value, context, referenceStack);
}

function resolveJsonValue(
  value: JsonValue,
  context: TokenData | null,
  referenceStack: readonly string[]
): JsonValue {
  if (typeof value === 'string' && isTokenReference(value)) {
    const reference = value.slice(1, -1);
    if (referenceStack.includes(reference)) {
      const chain = [...referenceStack, reference].join(' -> ');
      throw new Error(`Circular reference detected: ${chain}`);
    }

    const { token } = lookupToken(reference, context);
    return resolveJsonValue(token.$value, context, [...referenceStack, reference]);
  }

  if (Array.isArray(value)) {
    return value.map((item) => resolveJsonValue(item, context, referenceStack));
  }

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [
        key,
        resolveJsonValue(child, context, referenceStack)
      ])
    );
  }

  return value;
}
