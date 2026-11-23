function formatColor(value: any): string {
  if (typeof value === 'string') return value;
  const hex = value.hex || srgbToHex(value.components);
  if ((value.alpha ?? 1) === 1) return hex;

  const channels = hexToRgb(hex);
  return `rgba(${channels.join(', ')}, ${value.alpha})`;
}

function srgbToHex(components: number[]): string {
  const hex = components.map((component) => Math.round(component * 255).toString(16).padStart(2, '0'));
  return `#${hex.join('')}`;
}

function hexToRgb(hex: string): number[] {
  const normalized = hex.length === 4
    ? `#${hex.slice(1).split('').map((digit) => digit + digit).join('')}`
    : hex;
  return [1, 3, 5].map((offset) => Number.parseInt(normalized.slice(offset, offset + 2), 16));
}

export { formatColor };
