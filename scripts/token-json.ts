import type { JsonObject, JsonValue } from './token-types.ts';

/** Narrow an untrusted value to an object before reading token properties. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Confirm a value contains only finite JSON-compatible data and no cycles. */
export function isJsonValue(value: unknown): value is JsonValue {
  return isJsonValueWithAncestors(value, new WeakSet<object>());
}

function isJsonValueWithAncestors(value: unknown, ancestors: WeakSet<object>): value is JsonValue {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value !== 'object') return false;

  const prototype = Object.getPrototypeOf(value);
  if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null) return false;
  if (ancestors.has(value)) return false;

  ancestors.add(value);
  const children = Array.isArray(value) ? value : Object.values(value);
  const valid = children.every((child: unknown) => isJsonValueWithAncestors(child, ancestors));
  ancestors.delete(value);
  return valid;
}

/** Narrow a JSON-compatible object, excluding arrays and scalar values. */
export function isJsonObject(value: unknown): value is JsonObject {
  return isRecord(value) && isJsonValue(value);
}
