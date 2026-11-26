import { isJsonObject } from '../../scripts/token-json.ts';
import { isTokenDefinition } from '../../scripts/token-shapes.ts';
import type { JsonObject, JsonValue, TokenDefinition } from '../../scripts/token-types.ts';

export function jsonObjectAtPath(root: unknown, tokenPath: string): JsonObject {
  const value = valueAtPath(root, tokenPath);
  if (!isJsonObject(value)) throw new TypeError(`Expected a JSON object at ${tokenPath}.`);
  return value;
}

export function tokenDefinitionAtPath(root: unknown, tokenPath: string): TokenDefinition {
  const value = valueAtPath(root, tokenPath);
  if (!isTokenDefinition(value)) throw new TypeError(`Expected a token definition at ${tokenPath}.`);
  return value;
}

export function setTokenValueAtPath(root: unknown, tokenPath: string, value: JsonValue): void {
  tokenDefinitionAtPath(root, tokenPath).$value = value;
}

export function deleteAtPath(root: unknown, tokenPath: string): boolean {
  const parts = tokenPath.split('.');
  const key = parts.pop();
  if (key === undefined) return false;
  return Reflect.deleteProperty(jsonObjectAtPath(root, parts.join('.')), key);
}

function valueAtPath(root: unknown, tokenPath: string): unknown {
  let value: unknown = root;
  for (const part of tokenPath.split('.')) {
    if (!isJsonObject(value) || !Object.hasOwn(value, part)) {
      throw new TypeError(`Missing token path ${tokenPath}.`);
    }
    value = value[part];
  }
  return value;
}
