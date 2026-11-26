import { isDimension, isDuration } from './token-value-scalar.ts';
import { formatColor } from './token-format-color.ts';
import { formatFontFamily } from './token-format-font.ts';
import { formatShadow } from './token-format-shadow.ts';

function formatValue(value: unknown, type: string | null | undefined): string {
  if (type === 'color') return formatColor(value);
  if (type === 'dimension') {
    return isDimension(value) ? `${value.value}${value.unit}` : String(value);
  }
  if (type === 'duration') {
    return isDuration(value) ? `${value.value}${value.unit}` : String(value);
  }
  if (type === 'shadow') {
    return Array.isArray(value)
      ? (value as unknown[]).map(formatShadow).join(', ')
      : formatShadow(value);
  }
  if (type === 'fontFamily' && isStringArray(value)) return formatFontFamily(value);
  if (Array.isArray(value)) return (value as unknown[]).map(String).join(', ');
  return String(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item: unknown) => typeof item === 'string');
}

export { formatColor, formatValue };
