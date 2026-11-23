const REFERENCE = /^\{[^{}]+\}$/;

type TokenValueValidator = (value: any) => string | null;

const VALUE_VALIDATORS: Record<string, TokenValueValidator> = {
  dimension: (value) => isDimension(value)
    ? null
    : 'expected a typed dimension {value: number, unit: px|rem} or a token reference',
  duration: (value) => isDuration(value)
    ? null
    : 'expected a typed duration {value: number, unit: ms|s} or a token reference',
  color: (value) => isColor(value) ? null : 'expected a DTCG color object or a token reference',
  shadow: validateShadow,
  fontFamily: (value) => isFontFamily(value) ? null : 'expected a string or an array of font family names',
  fontWeight: (value) => isFontWeight(value) ? null : 'expected a numeric or named font weight',
  number: (value) => isFiniteNumber(value) ? null : 'expected a finite number'
};

function isTokenReference(value: unknown): value is string {
  return typeof value === 'string' && REFERENCE.test(value);
}

function validateTokenValue(type: string, value: any): string | null {
  if (isTokenReference(value)) return null;
  return VALUE_VALIDATORS[type]?.(value) ?? null;
}

function isFontFamily(value: any): boolean {
  return typeof value === 'string'
    || (Array.isArray(value) && value.every((name) => typeof name === 'string'));
}

function isFontWeight(value: any): boolean {
  return typeof value === 'number' || typeof value === 'string';
}

function isFiniteNumber(value: any): boolean {
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

function isColor(value: any): boolean {
  if (!hasValidColorMetadata(value)) return false;
  if (value.colorSpace === 'srgb') return hasValidSrgbComponents(value.components);
  // Other color spaces need an sRGB fallback for the CSS and contrast tooling.
  return isValidHex(value.hex);
}

function validateShadow(value: any): string | null {
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      if (isTokenReference(value[index])) continue;
      const issue = validateShadowObject(value[index]);
      if (issue) return `shadow ${index}: ${issue}`;
    }
    return null;
  }
  return validateShadowObject(value);
}

function validateShadowObject(value: any): string | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return 'expected a typed shadow object or an array of shadows/references';
  }
  const dimensions = ['offsetX', 'offsetY', 'blur', 'spread'];
  for (const key of dimensions) {
    if (!isDimension(value[key]) && !isTokenReference(value[key])) {
      return `${key} must be a typed dimension or a token reference`;
    }
  }
  if (!isColor(value.color) && !isTokenReference(value.color)) {
    return 'color must be a DTCG color object or a token reference';
  }
  if (Object.hasOwn(value, 'inset') && typeof value.inset !== 'boolean') {
    return 'inset must be a boolean';
  }
  return null;
}

export { isTokenReference, validateTokenValue };
