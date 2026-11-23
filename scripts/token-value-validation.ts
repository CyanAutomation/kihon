import { isTokenReference } from './token-value-reference.ts';
import { isDimension, isDuration, isFiniteNumber, isFontFamily, isFontWeight } from './token-value-scalar.ts';
import { isColor } from './token-value-color.ts';
import { validateShadow } from './token-value-shadow.ts';

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

function validateTokenValue(type: string, value: any): string | null {
  if (isTokenReference(value)) return null;
  return VALUE_VALIDATORS[type]?.(value) ?? null;
}

export { isTokenReference, validateTokenValue };
