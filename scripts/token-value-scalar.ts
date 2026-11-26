import { isRecord } from './token-json.ts';
import type { DimensionValue, DurationValue, FontFamilyValue, FontWeightValue } from './token-types.ts';

function isFontFamily(value: unknown): value is FontFamilyValue {
  return typeof value === 'string'
    || (Array.isArray(value) && value.every((name: unknown) => typeof name === 'string'));
}

function isFontWeight(value: unknown): value is FontWeightValue {
  return typeof value === 'number' || typeof value === 'string';
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isDimension(value: unknown): value is DimensionValue {
  return isTypedUnit(value, ['px', 'rem']);
}

function isDuration(value: unknown): value is DurationValue {
  return isTypedUnit(value, ['ms', 's']);
}

function isTypedUnit(value: unknown, units: readonly string[]): value is { value: number; unit: string } {
  return isRecord(value)
    && typeof value.value === 'number'
    && Number.isFinite(value.value)
    && typeof value.unit === 'string'
    && units.includes(value.unit);
}

export {
  isDimension,
  isDuration,
  isFontFamily,
  isFontWeight
};
