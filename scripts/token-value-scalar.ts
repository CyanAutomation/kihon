function isFontFamily(value: any): boolean {
  return typeof value === 'string'
    || (Array.isArray(value) && value.every((name) => typeof name === 'string'));
}

function isFontWeight(value: any): boolean {
  return typeof value === 'number' || typeof value === 'string';
}

export function isFiniteNumber(value: any): boolean {
  return typeof value === 'number' && Number.isFinite(value);
}

function isDimension(value: any): boolean {
  return isTypedUnit(value, ['px', 'rem']);
}

function isDuration(value: any): boolean {
  return isTypedUnit(value, ['ms', 's']);
}

function isTypedUnit(value: any, units: readonly string[]): boolean {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value)
    && typeof value.value === 'number' && Number.isFinite(value.value) && units.includes(value.unit));
}

export { isDimension, isDuration, isFontFamily, isFontWeight };
