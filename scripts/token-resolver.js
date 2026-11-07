const fs = require('node:fs');
const path = require('node:path');

const REFERENCE = /^\{([^{}]+)\}$/;

class TokenResolver {
  constructor(primitives = null) {
    this.primitives = primitives;
    this.semantic = null;
    this.lightTheme = null;
    this.darkTheme = null;
  }

  load(tokensDir = path.join(__dirname, '..', 'tokens')) {
    this.primitives = readJson(path.join(tokensDir, 'primitives.json'));
    this.semantic = readJson(path.join(tokensDir, 'semantic.json'));
    this.lightTheme = readJson(path.join(tokensDir, 'themes', 'light.json'));
    this.darkTheme = readJson(path.join(tokensDir, 'themes', 'dark.json'));
    return this;
  }

  resolveValue(value, context = this.primitives, referenceStack = []) {
    if (typeof value === 'string') {
      const match = value.match(REFERENCE);
      if (!match) return value;

      const reference = match[1];
      if (referenceStack.includes(reference)) {
        const chain = [...referenceStack, reference].join(' -> ');
        throw new Error(`Circular reference detected: ${chain}`);
      }

      const { token } = this.lookupToken(reference, context);
      return this.resolveValue(token.$value, context, [...referenceStack, reference]);
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.resolveValue(item, context, referenceStack));
    }

    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([key, child]) => [
          key,
          this.resolveValue(child, context, referenceStack)
        ])
      );
    }

    return value;
  }

  lookupToken(reference, context = this.primitives) {
    let target = context;
    let inheritedType = null;
    for (const part of reference.split('.')) {
      if (target && typeof target === 'object' && target.$type) inheritedType = target.$type;
      if (!target || typeof target !== 'object' || !Object.hasOwn(target, part)) {
        throw new Error(`Unresolved reference: ${reference}`);
      }
      target = target[part];
    }

    if (!target || typeof target !== 'object' || !Object.hasOwn(target, '$value')) {
      throw new Error(`Reference does not point to a token: ${reference}`);
    }

    return { token: target, type: target.$type || inheritedType };
  }

  extractTokens(group, prefix = '', context = this.primitives) {
    const tokens = {};

    const walk = (node, keyPath) => {
      if (!node || typeof node !== 'object' || Array.isArray(node)) return;

      for (const [key, value] of Object.entries(node)) {
        if (key.startsWith('$')) continue;
        const tokenPath = keyPath ? `${keyPath}-${key}` : key;

        if (value && typeof value === 'object' && Object.hasOwn(value, '$value')) {
          tokens[`${prefix}${tokenPath}`] = {
            value: this.resolveValue(value.$value, context),
            type: value.$type || node.$type
          };
        } else {
          walk(value, tokenPath);
        }
      }
    };

    walk(group, '');
    return tokens;
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function formatValue(value, type) {
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

function formatColor(value) {
  if (typeof value === 'string') return value;
  const hex = value.hex || srgbToHex(value.components);
  if ((value.alpha ?? 1) === 1) return hex;

  const channels = hexToRgb(hex);
  return `rgba(${channels.join(', ')}, ${value.alpha})`;
}

function formatShadow(shadow) {
  const parts = ['offsetX', 'offsetY', 'blur', 'spread'].map((part) => shadow[part]);
  if (parts.every((part) => part.value === 0) && (shadow.color.alpha ?? 1) === 0) return 'none';
  const inset = shadow.inset ? 'inset ' : '';
  return `${inset}${parts.map((part) => formatValue(part, 'dimension')).join(' ')} ${formatColor(shadow.color)}`;
}

function formatFontFamilyName(name) {
  const cssGenericFamilies = new Set([
    'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui',
    'ui-serif', 'ui-sans-serif', 'ui-monospace', 'ui-rounded', 'math', 'emoji', 'fangsong'
  ]);
  if (cssGenericFamilies.has(name) || /^[-a-z]+$/i.test(name)) return name;
  return `"${name.replaceAll('"', '\\"')}"`;
}

function srgbToHex(components) {
  const hex = components.map((component) => Math.round(component * 255).toString(16).padStart(2, '0'));
  return `#${hex.join('')}`;
}

function hexToRgb(hex) {
  const normalized = hex.length === 4
    ? `#${hex.slice(1).split('').map((digit) => digit + digit).join('')}`
    : hex;
  return [1, 3, 5].map((offset) => Number.parseInt(normalized.slice(offset, offset + 2), 16));
}

module.exports = { TokenResolver, formatValue, formatColor };
