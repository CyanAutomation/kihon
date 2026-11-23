function isColorObject(value: any): boolean {
  return Boolean(value)
    && typeof value === 'object'
    && !Array.isArray(value)
    && typeof value.colorSpace === 'string'
    && Array.isArray(value.components);
}

function isValidHex(value: any): boolean {
  return typeof value === 'string' && /^#[\da-f]{6}$/i.test(value);
}

function hasValidColorMetadata(value: any): boolean {
  if (!isColorObject(value)) return false;
  const alphaIsValid = !Object.hasOwn(value, 'alpha')
    || (typeof value.alpha === 'number' && value.alpha >= 0 && value.alpha <= 1);
  const hexIsValid = !Object.hasOwn(value, 'hex') || isValidHex(value.hex);
  return alphaIsValid && hexIsValid;
}

function isSrgbComponent(value: unknown): boolean {
  return typeof value === 'number'
    && Number.isFinite(value)
    && value >= 0
    && value <= 1;
}

function hasValidSrgbComponents(components: unknown[]): boolean {
  return components.length === 3 && components.every(isSrgbComponent);
}

export function isColor(value: any): boolean {
  if (!hasValidColorMetadata(value)) return false;
  if (value.colorSpace === 'srgb') return hasValidSrgbComponents(value.components);
  return isValidHex(value.hex);
}
