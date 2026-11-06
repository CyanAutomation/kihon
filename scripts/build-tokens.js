#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Simple DTCG token resolver and CSS generator for Kihon.
 * Resolves token aliases and generates CSS custom properties.
 */

class TokenResolver {
  constructor() {
    this.primitives = null;
    this.semantic = null;
    this.lightTheme = null;
    this.darkTheme = null;
    this.resolvedTokens = {};
    this.visited = new Set();
  }

  load() {
    const tokensDir = path.join(__dirname, '..', 'tokens');
    
    this.primitives = JSON.parse(
      fs.readFileSync(path.join(tokensDir, 'primitives.json'), 'utf-8')
    );
    this.semantic = JSON.parse(
      fs.readFileSync(path.join(tokensDir, 'semantic.json'), 'utf-8')
    );
    this.lightTheme = JSON.parse(
      fs.readFileSync(path.join(tokensDir, 'themes', 'light.json'), 'utf-8')
    );
    this.darkTheme = JSON.parse(
      fs.readFileSync(path.join(tokensDir, 'themes', 'dark.json'), 'utf-8')
    );
  }

  /**
   * Resolve a token reference like {colors.gray.100} recursively.
   */
  resolveValue(value, context = this.primitives, path = '') {
    if (typeof value !== 'string') {
      return value;
    }

    // Match {reference.path} patterns
    const refMatch = value.match(/^{([\w.]+)}$/);
    if (!refMatch) {
      return value;
    }

    const refPath = refMatch[1];

    // Detect circular references
    if (this.visited.has(refPath)) {
      throw new Error(`Circular reference detected: ${refPath}`);
    }

    this.visited.add(refPath);

    const parts = refPath.split('.');
    let current = context;

    for (const part of parts) {
      if (current[part] === undefined) {
        throw new Error(`Unresolved reference: ${refPath}`);
      }
      current = current[part];
    }

    this.visited.delete(refPath);

    // Recurse if the resolved value is also a reference
    if (typeof current === 'object' && current.$value !== undefined) {
      return this.resolveValue(current.$value, context);
    }

    if (typeof current === 'string') {
      return this.resolveValue(current, context);
    }

    return current;
  }

  /**
   * Extract all tokens from a group, resolving their values.
   */
  extractTokens(group, theme = null, prefix = '') {
    const tokens = {};
    const context = theme || this.primitives;

    const walk = (obj, keyPath) => {
      if (obj === null || typeof obj !== 'object') {
        return;
      }

      for (const [key, value] of Object.entries(obj)) {
        const newPath = keyPath ? `${keyPath}-${key}` : key;

        if (value && typeof value === 'object') {
          if ('$value' in value) {
            this.visited.clear();
            const resolvedValue = this.resolveValue(value.$value, context);
            tokens[`${prefix}${newPath}`] = {
              value: resolvedValue,
              type: value.$type
            };
          } else if (!value.$schema && !value.$description) {
            // Recurse into nested objects
            walk(value, newPath);
          }
        }
      }
    };

    walk(group, prefix);
    return tokens;
  }

  /**
   * Generate CSS custom properties.
   */
  generateCSS() {
    const lightTokens = this.extractTokens(this.lightTheme);
    const darkTokens = this.extractTokens(this.darkTheme);
    const allSemanticTokens = this.extractTokens(this.semantic);

    // Map semantic token names to CSS variable names
    const tokenMapping = {};
    for (const name of Object.keys(allSemanticTokens)) {
      tokenMapping[name] = `--kh-color-${name.replace(/_/g, '-')}`;
    }

    // Also add utility tokens
    const utilityTokens = this.extractTokens(this.primitives);
    for (const name of Object.keys(utilityTokens)) {
      const match = name.match(/^(space|radius|motion|shadow)-(.+)$/);
      if (match) {
        tokenMapping[name] = `--kh-${match[1]}-${match[2]}`;
      } else if (name.startsWith('typography-')) {
        const subMatch = name.match(/^typography-(.+?)-(.+)$/);
        if (subMatch) {
          tokenMapping[name] = `--kh-type-${subMatch[1]}-${subMatch[2]}`;
        }
      }
    }

    // Build CSS
    let css = `/* Generated tokens for Kihon UI Foundation
 * This file is auto-generated. Do not edit manually.
 * Run: npm run build-tokens
 */

:root {
  color-scheme: light;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
`;

    // Light theme tokens
    for (const [name, token] of Object.entries(lightTokens)) {
      if (name.startsWith('color-')) {
        const varName = `--kh-${name}`;
        css += `  ${varName}: ${this.formatValue(token.value, token.type)};\n`;
      }
    }

    // Spacing, radius, motion tokens (theme-independent)
    const themeIndependentTokens = this.extractTokens(this.primitives);
    for (const [name, token] of Object.entries(themeIndependentTokens)) {
      if (name.startsWith('spacing-') || name.startsWith('radius-') || 
          name.startsWith('motion-') || name.startsWith('shadow-') ||
          name.startsWith('typography-')) {
        const varName = this.getVarName(name);
        css += `  ${varName}: ${this.formatValue(token.value, token.type)};\n`;
      }
    }

    css += `}\n\n`;

    // Dark theme with media query
    css += `@media (prefers-color-scheme: dark) {
  :root:not([data-kh-theme]) {
    color-scheme: dark;
`;

    for (const [name, token] of Object.entries(darkTokens)) {
      if (name.startsWith('color-')) {
        const varName = `--kh-${name}`;
        css += `    ${varName}: ${this.formatValue(token.value, token.type)};\n`;
      }
    }

    css += `  }
}\n\n`;

    // Light theme override
    css += `:root[data-kh-theme="light"] {
  color-scheme: light;
`;

    for (const [name, token] of Object.entries(lightTokens)) {
      if (name.startsWith('color-')) {
        const varName = `--kh-${name}`;
        css += `  ${varName}: ${this.formatValue(token.value, token.type)};\n`;
      }
    }

    css += `}\n\n`;

    // Dark theme override
    css += `:root[data-kh-theme="dark"] {
  color-scheme: dark;
`;

    for (const [name, token] of Object.entries(darkTokens)) {
      if (name.startsWith('color-')) {
        const varName = `--kh-${name}`;
        css += `  ${varName}: ${this.formatValue(token.value, token.type)};\n`;
      }
    }

    css += `}\n`;

    return css;
  }

  /**
   * Format a token value based on its type.
   */
  formatValue(value, type) {
    if (type === 'shadow') {
      if (value.blur === '0' && value.offsetX === '0' && value.offsetY === '0') {
        return 'none';
      }
      return `${value.offsetX} ${value.offsetY} ${value.blur} ${value.spread} ${value.color}`;
    }

    if (Array.isArray(value)) {
      return value.join(', ');
    }

    return String(value);
  }

  /**
   * Map token names to CSS variable names.
   */
  getVarName(name) {
    if (name.startsWith('spacing-')) {
      return `--kh-space-${name.slice(8)}`;
    }
    if (name.startsWith('radius-')) {
      return `--kh-radius-${name.slice(7)}`;
    }
    if (name.startsWith('motion-')) {
      return `--kh-motion-${name.slice(7)}`;
    }
    if (name.startsWith('shadow-')) {
      return `--kh-shadow-${name.slice(7)}`;
    }
    if (name.startsWith('typography-')) {
      return `--kh-type-${name.slice(11).replace('_', '-')}`;
    }
    return `--kh-${name}`;
  }

  /**
   * Validate tokens for common issues.
   */
  validate() {
    const errors = [];

    // Check for duplicate public token names
    const allTokens = {};
    for (const [name, token] of Object.entries(this.extractTokens(this.semantic))) {
      if (allTokens[name]) {
        errors.push(`Duplicate token name: ${name}`);
      }
      allTokens[name] = true;
    }

    // Check that required semantic tokens exist
    const requiredTokens = [
      'color-background',
      'color-surface',
      'color-text-primary',
      'color-text-secondary',
      'color-accent',
      'color-on-accent',
      'color-danger',
      'color-border-subtle',
      'color-border-strong',
      'color-focus-ring'
    ];

    const lightTokens = this.extractTokens(this.lightTheme);
    const darkTokens = this.extractTokens(this.darkTheme);

    for (const required of requiredTokens) {
      if (!lightTokens[required]) {
        errors.push(`Missing light theme token: ${required}`);
      }
      if (!darkTokens[required]) {
        errors.push(`Missing dark theme token: ${required}`);
      }
    }

    return errors;
  }
}

/**
 * Main execution.
 */
function main() {
  try {
    const resolver = new TokenResolver();
    resolver.load();

    // Validate
    const errors = resolver.validate();
    if (errors.length > 0) {
      console.error('Token validation errors:');
      errors.forEach((err) => console.error(`  - ${err}`));
      process.exit(1);
    }

    // Generate CSS
    const css = resolver.generateCSS();
    const outputPath = path.join(__dirname, '..', 'src', 'css', 'tokens.css');
    fs.writeFileSync(outputPath, css, 'utf-8');

    console.log(`✓ Generated ${outputPath}`);
    process.exit(0);
  } catch (err) {
    console.error('Token generation failed:', err.message);
    process.exit(1);
  }
}

main();
