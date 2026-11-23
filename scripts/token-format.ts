import { formatColor } from './token-format-color.ts';
import { formatFontFamily } from './token-format-font.ts';
import { formatShadow } from './token-format-shadow.ts';

function formatValue(value: any, type: string | null | undefined): string {
  if (type === 'color') return formatColor(value);
  if (type === 'dimension' || type === 'duration') {
    return typeof value === 'object' && value !== null
      ? `${value.value}${value.unit}`
      : String(value);
  }
  if (type === 'shadow') {
    return Array.isArray(value)
      ? value.map(formatShadow).join(', ')
      : formatShadow(value);
  }
  if (type === 'fontFamily' && Array.isArray(value)) return formatFontFamily(value);
  if (Array.isArray(value)) return value.map(String).join(', ');
  return String(value);
}

export { formatColor, formatValue };
