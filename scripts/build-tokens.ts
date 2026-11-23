#!/usr/bin/env node

import * as fs from 'node:fs';
import * as path from 'node:path';
import { TokenResolver } from './token-resolver.ts';
import { formatValue } from './token-format.ts';
import { loadTokenDocuments, validateTokenDocuments } from './token-validation.ts';
import { createTokenContext } from './token-context.ts';
import type { CompleteTokenDocuments, TokenMap } from './token-types.ts';

const ROOT = path.join(__dirname, '..');
const OUTPUT = path.join(ROOT, 'src', 'css', 'tokens.css');

function generateTokensCss(tokensDir = path.join(ROOT, 'tokens')) {
  const resolver = new TokenResolver().load(tokensDir);
  const documents: CompleteTokenDocuments = {
    primitives: resolver.primitives ?? {},
    semantic: resolver.semantic ?? {},
    lightTheme: resolver.lightTheme ?? {},
    darkTheme: resolver.darkTheme ?? {}
  };
  const lightTokens = resolver.extractTokens(
    resolver.lightTheme,
    '',
    createTokenContext(documents, resolver.lightTheme)
  );
  const darkTokens = resolver.extractTokens(
    resolver.darkTheme,
    '',
    createTokenContext(documents, resolver.darkTheme)
  );
  const primitives = resolver.extractTokens(resolver.primitives);

  let css = `/* Generated tokens for Kihon UI Foundation
 * This file is auto-generated. Do not edit manually.
 * Run: npm run build-tokens
 */

:root {
  color-scheme: dark;
  font-family: var(--kh-type-font-stack, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
`;

  css = appendThemeColors(css, darkTokens);
  css = appendPrimitives(css, primitives);
  css += `}\n\n@media (prefers-color-scheme: light) {
  :root[data-kh-theme="system"] {
    color-scheme: light;
`;
  css = appendThemeColors(css, lightTokens, '    ');
  css += `  }
}

:root[data-kh-theme="dark"] {
  color-scheme: dark;
`;
  css = appendThemeColors(css, darkTokens);
  css += `}

:root[data-kh-theme="light"] {
  color-scheme: light;
`;
  css = appendThemeColors(css, lightTokens);
  css += '}' + '\n';

  return css;
}

function appendThemeColors(css: string, tokens: TokenMap, indent = '  '): string {
  for (const [name, token] of Object.entries(tokens)) {
    if (name.startsWith('color-')) {
      css += `${indent}--kh-${name}: ${formatValue(token.value, token.type)};\n`;
    }
  }
  return css;
}

function appendPrimitives(css: string, tokens: TokenMap): string {
  for (const [name, token] of Object.entries(tokens)) {
    if (/^(spacing|radius|motion|shadow)-/.test(name) || name.startsWith('typography-')) {
      css += `  ${getVarName(name)}: ${formatValue(token.value, token.type)};\n`;
    }
  }
  return css;
}

function getVarName(name: string): string {
  if (name.startsWith('spacing-')) return `--kh-space-${name.slice('spacing-'.length)}`;
  if (name.startsWith('radius-')) return `--kh-radius-${name.slice('radius-'.length)}`;
  if (name.startsWith('motion-')) return `--kh-motion-${name.slice('motion-'.length)}`;
  if (name.startsWith('shadow-')) return `--kh-shadow-${name.slice('shadow-'.length)}`;
  if (name.startsWith('typography-')) return `--kh-type-${name.slice('typography-'.length)}`;
  return `--kh-${name}`;
}

function writeTokensCss(outputPath = OUTPUT) {
  const errors = validateTokenDocuments(loadTokenDocuments());
  if (errors.length) {
    throw new Error(`Token validation failed:\n${errors.map((error) => `- ${error}`).join('\n')}`);
  }
  const css = generateTokensCss();
  fs.writeFileSync(outputPath, css, 'utf8');
  return css;
}

if (require.main === module) {
  try {
    writeTokensCss();
    console.log(`✓ Generated ${OUTPUT}`);
  } catch (error) {
    console.error(`Token generation failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

export { generateTokensCss, writeTokensCss, getVarName };
