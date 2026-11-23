import { formatColor } from './token-format-color.ts';

function formatShadow(shadow: any): string {
  const parts = ['offsetX', 'offsetY', 'blur', 'spread'].map((part) => shadow[part]);
  if (parts.every((part) => part.value === 0) && (shadow.color.alpha ?? 1) === 0) return 'none';
  const inset = shadow.inset ? 'inset ' : '';
  return `${inset}${parts.map(formatDimension).join(' ')} ${formatColor(shadow.color)}`;
}

function formatDimension(value: any): string {
  return typeof value === 'object' && value !== null
    ? `${value.value}${value.unit}`
    : String(value);
}

export { formatShadow };
