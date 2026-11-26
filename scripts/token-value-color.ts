import { isJsonObject } from './token-json.ts';
import type { DtcgColorValue } from './token-types.ts';

function isColorObject(value: unknown): value is DtcgColorValue {
  return isJsonObject(value)
    && typeof value.colorSpace === 'string'
    && Array.isArray(value.components);
}

function isValidHex(value: unknown): value is string {
  return typeof value === 'string' && /^#[\da-f]{6}$/i.test(value);
}

function hasValidColorMetadata(value: unknown): value is DtcgColorValue {
  if (!isColorObject(value)) return false;
  const alphaIsValid = !Object.hasOwn(value, 'alpha')
    || (typeof value.alpha === 'number' && value.alpha >= 0 && value.alpha <= 1);
  const hexIsValid = !Object.hasOwn(value, 'hex') || isValidHex(value.hex);
  return alphaIsValid && hexIsValid;
}

export function hasValidSrgbComponents(
  components: readonly unknown[]
): components is readonly [number, number, number] {
  return components.length === 3 && components.every(isSrgbComponent);
}

function isSrgbComponent(value: unknown): value is number {
  return typeof value === 'number'
    && Number.isFinite(value)
    && value >= 0
    && value <= 1;
}

export function isColor(value: unknown): value is DtcgColorValue {
  if (!hasValidColorMetadata(value)) return false;
  if (value.colorSpace === 'srgb') return hasValidSrgbComponents(value.components);
  return isValidHex(value.hex);
}
