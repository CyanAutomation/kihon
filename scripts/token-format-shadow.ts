import { formatColor } from './token-format-color.ts';
import { isColor } from './token-value-color.ts';
import { isDimension } from './token-value-scalar.ts';
import { isShadowObject } from './token-value-shadow.ts';

function formatShadow(value: unknown): string {
  if (!isShadowObject(value)) return String(value);

  const dimensions = [value.offsetX, value.offsetY, value.blur, value.spread];
  const isTransparentZeroShadow = dimensions.every(isDimension)
    && dimensions.every((part) => part.value === 0)
    && isColor(value.color)
    && (value.color.alpha ?? 1) === 0;
  if (isTransparentZeroShadow) return 'none';

  const inset = value.inset ? 'inset ' : '';
  return `${inset}${dimensions.map(formatDimension).join(' ')} ${formatColor(value.color)}`;
}

function formatDimension(value: unknown): string {
  return isDimension(value) ? `${value.value}${value.unit}` : String(value);
}

export { formatShadow };
