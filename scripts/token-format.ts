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
  if (type === 'fontFamily' && Array.isArray(value)) {
    return value.map(formatFontFamilyName).join(', ');
  }
  if (Array.isArray(value)) return value.map(String).join(', ');
  return String(value);
}

function formatColor(value: any): string {
  if (typeof value === 'string') return value;
  const hex = value.hex || srgbToHex(value.components);
  if ((value.alpha ?? 1) === 1) return hex;

  const channels = hexToRgb(hex);
  return `rgba(${channels.join(', ')}, ${value.alpha})`;
}

function formatShadow(shadow: any): string {
  const parts = ['offsetX', 'offsetY', 'blur', 'spread'].map((part) => shadow[part]);
  if (parts.every((part) => part.value === 0) && (shadow.color.alpha ?? 1) === 0) return 'none';
  const inset = shadow.inset ? 'inset ' : '';
  return `${inset}${parts.map((part) => formatValue(part, 'dimension')).join(' ')} ${formatColor(shadow.color)}`;
}

function formatFontFamilyName(name: string): string {
  const cssGenericFamilies = new Set([
    'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui',
    'ui-serif', 'ui-sans-serif', 'ui-monospace', 'ui-rounded', 'math', 'emoji', 'fangsong'
  ]);
  if (cssGenericFamilies.has(name) || /^[-a-z]+$/i.test(name)) return name;
  return `"${name.replaceAll('"', '\\"')}"`;
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

export { formatValue, formatColor };
