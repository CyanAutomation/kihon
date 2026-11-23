function formatFontFamily(value: string[]): string {
  return value.map(formatFontFamilyName).join(', ');
}

function formatFontFamilyName(name: string): string {
  const cssGenericFamilies = new Set([
    'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui',
    'ui-serif', 'ui-sans-serif', 'ui-monospace', 'ui-rounded', 'math', 'emoji', 'fangsong'
  ]);
  if (cssGenericFamilies.has(name) || /^[-a-z]+$/i.test(name)) return name;
  return `"${name.replaceAll('"', '\\"')}"`;
}

export { formatFontFamily };
