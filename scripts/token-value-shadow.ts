import { isTokenReference } from './token-value-reference.ts';
import { isColor } from './token-value-color.ts';
import { isDimension } from './token-value-scalar.ts';

export function validateShadow(value: any): string | null {
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
