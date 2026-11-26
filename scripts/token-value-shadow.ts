import { isRecord } from './token-json.ts';
import { isTokenReference } from './token-value-reference.ts';
import { isColor } from './token-value-color.ts';
import { isDimension } from './token-value-scalar.ts';
import type { ShadowValue } from './token-types.ts';

export function validateShadow(value: unknown): string | null {
  if (Array.isArray(value)) {
    const shadows: readonly unknown[] = value;
    for (let index = 0; index < shadows.length; index += 1) {
      const shadow = shadows[index];
      if (isTokenReference(shadow)) continue;
      const issue = validateShadowObject(shadow);
      if (issue) return `shadow ${index}: ${issue}`;
    }
    return null;
  }
  return validateShadowObject(value);
}

export function isShadowObject(value: unknown): value is ShadowValue {
  return validateShadowObject(value) === null;
}

function validateShadowObject(value: unknown): string | null {
  if (!isRecord(value)) {
    return 'expected a typed shadow object or an array of shadows/references';
  }
  for (const key of ['offsetX', 'offsetY', 'blur', 'spread']) {
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
