import wcagContrast from 'wcag-contrast';
import { TokenResolver } from './token-resolver.ts';
import { formatColor } from './token-format.ts';
import { createTokenContext } from './token-context.ts';
import type { CompleteTokenDocuments, TokenData, TokenDocuments } from './token-types.ts';

const APPROVED_PAIRS = [
  { foreground: 'text-primary', background: 'background', minimum: 4.5 },
  { foreground: 'text-primary', background: 'surface', minimum: 4.5 },
  { foreground: 'text-secondary', background: 'background', minimum: 4.5 },
  { foreground: 'text-secondary', background: 'surface', minimum: 4.5 },
  { foreground: 'on-accent', background: 'accent', minimum: 4.5 },
  { foreground: 'on-accent', background: 'button-primary-hover', minimum: 4.5 },
  { foreground: 'accent-text', background: 'background', minimum: 4.5 },
  { foreground: 'accent-text', background: 'surface', minimum: 4.5 },
  { foreground: 'accent', background: 'background', minimum: 3 },
  { foreground: 'accent', background: 'surface', minimum: 3 },
  { foreground: 'button-primary-hover', background: 'background', minimum: 3 },
  { foreground: 'button-primary-hover', background: 'surface', minimum: 3 },
  { foreground: 'danger', background: 'background', minimum: 4.5 },
  { foreground: 'danger', background: 'surface', minimum: 4.5 },
  { foreground: 'success', background: 'success-background', minimum: 4.5 },
  { foreground: 'focus-ring', background: 'background', minimum: 3 },
  { foreground: 'focus-ring', background: 'surface', minimum: 3 },
  { foreground: 'border-strong', background: 'background', minimum: 3 },
  { foreground: 'border-strong', background: 'surface', minimum: 3 },
];
const CONTRAST_COLOR_ROLES = new Set(APPROVED_PAIRS.flatMap(({ foreground, background }) => [foreground, background]));

function contrastRatio(foreground: string, background: string): number {
  return wcagContrast.hex(foreground, background);
}

function resolveThemeColors(theme: TokenData, documents: TokenDocuments = {}): Record<string, string> {
  const resolver = new TokenResolver(documents.primitives || {});
  const context = createTokenContext(documents, theme);
  const colors: Record<string, string> = {};

  for (const [name, rawToken] of Object.entries(theme.color || {})) {
    const token = rawToken as TokenData;
    if (!CONTRAST_COLOR_ROLES.has(name)) continue;
    if (!token || !Object.hasOwn(token, '$value')) continue;
    const value = resolver.resolveValue(token.$value, context);
    if (typeof value !== 'string' && ((value as TokenData).alpha ?? 1) !== 1) {
      throw new Error(`${name}: theme colors used in contrast checks must be opaque`);
    }
    colors[name] = typeof value === 'string' ? value : formatColor(value);
  }

  return colors;
}

function validateThemeContrast(themes: Record<string, Record<string, string>>): string[] {
  const errors: string[] = [];
  for (const [themeName, colors] of Object.entries(themes)) {
    for (const pair of APPROVED_PAIRS) {
      const foreground = colors[pair.foreground];
      const background = colors[pair.background];
      if (!foreground || !background) {
        errors.push(`${themeName}: missing contrast color for ${pair.foreground} on ${pair.background}`);
        continue;
      }

      const ratio = contrastRatio(foreground, background);
      if (ratio < pair.minimum) {
        errors.push(
          `${themeName}: ${pair.foreground} on ${pair.background} is ${ratio.toFixed(2)}:1; requires ${pair.minimum}:1`
        );
      }
    }
  }
  return errors;
}

function validateThemeDocuments(documents: CompleteTokenDocuments): string[] {
  try {
    const themes = {
      light: resolveThemeColors(documents.lightTheme, documents),
      dark: resolveThemeColors(documents.darkTheme, documents)
    };
    return validateThemeContrast(themes);
  } catch (error) {
    return [`Contrast validation failed: ${error instanceof Error ? error.message : String(error)}`];
  }
}

export { contrastRatio, resolveThemeColors, validateThemeContrast, validateThemeDocuments };
