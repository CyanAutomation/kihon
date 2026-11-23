import * as fs from 'node:fs';
import * as path from 'node:path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import type { CompleteTokenDocuments, TokenData } from './token-types.ts';
import { TokenResolver } from './token-resolver.ts';
import { createTokenContext } from './token-context.ts';
import { isTokenReference, validateTokenValue } from './token-value-validation.ts';

const ROOT = path.join(__dirname, '..');
const SCHEMA_PATH = path.join(ROOT, 'schemas', 'dtcg-2025.10-format.schema.json');
const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validateSchema = ajv.compile(schema);
const REQUIRED_THEME_COLORS = [
  'background', 'surface', 'text-primary', 'text-secondary', 'accent', 'accent-text',
  'on-accent', 'button-primary-hover', 'danger', 'success', 'success-background',
  'border-subtle', 'border-strong', 'focus-ring', 'scrim'
];

function loadTokenDocuments(tokensDir = path.join(ROOT, 'tokens')): CompleteTokenDocuments {
  return {
    primitives: readJson(path.join(tokensDir, 'primitives.json')),
    semantic: readJson(path.join(tokensDir, 'semantic.json')),
    lightTheme: readJson(path.join(tokensDir, 'themes', 'light.json')),
    darkTheme: readJson(path.join(tokensDir, 'themes', 'dark.json'))
  };
}

function validateTokenDocuments(documents: CompleteTokenDocuments): string[] {
  const errors: string[] = [];
  const entries = Object.entries(documents);

  for (const [label, document] of entries) {
    if (!validateSchema(document)) {
      for (const issue of validateSchema.errors || []) {
        errors.push(`${label} does not match the DTCG 2025.10 schema at ${issue.instancePath || '/'}: ${issue.message}`);
      }
    }
    validateTypedValues(document, label, errors);
  }

  for (const [label, document] of entries) {
    const context = createTokenContext(documents, document);
    const resolver = new TokenResolver(context);
    visitTokens(document, (token, tokenPath, inheritedType) => {
      validateReferenceTypes(token.$value, token.$type || inheritedType, resolver, context, `${label}.${tokenPath}`, errors);
      try {
        resolver.resolveValue(token.$value, context);
      } catch (error) {
        errors.push(`${label}.${tokenPath}: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }

  validateRequiredThemeTokens(documents.lightTheme, 'lightTheme', errors);
  validateRequiredThemeTokens(documents.darkTheme, 'darkTheme', errors);
  return [...new Set(errors)];
}

function validateTypedValues(document: TokenData, label: string, errors: string[]): void {
  const walk = (node: any, tokenPath = '', inheritedType: string | null = null): void => {
    if (!node || typeof node !== 'object' || Array.isArray(node)) return;
    const type = node.$type || inheritedType;

    if (Object.hasOwn(node, '$value')) {
      if (!type) {
        errors.push(`${label}.${tokenPath} is missing a token type ($type)`);
      } else {
        const issue = validateTokenValue(type, node.$value);
        if (issue) errors.push(`${label}.${tokenPath} (${type}): ${issue}`);
      }
      return;
    }

    for (const [key, child] of Object.entries(node)) {
      if (key.startsWith('$')) continue;
      walk(child, tokenPath ? `${tokenPath}.${key}` : key, type);
    }
  };

  walk(document);
}

function validateReferenceTypes(
  value: any,
  expectedType: string | null,
  resolver: TokenResolver,
  context: TokenData,
  tokenPath: string,
  errors: string[]
): void {
  if (isTokenReference(value)) {
    try {
      const target = resolver.lookupToken(value.slice(1, -1), context);
      if (target.type && target.type !== expectedType) {
        errors.push(`${tokenPath}: expected a ${expectedType} reference, but ${value} is ${target.type}`);
      }
    } catch {
      // Unresolved and non-token references are reported by the resolver check.
    }
    return;
  }

  if (expectedType === 'shadow') {
    const shadows = Array.isArray(value) ? value : [value];
    shadows.forEach((shadow, index) => {
      if (isTokenReference(shadow)) {
        validateReferenceTypes(shadow, 'shadow', resolver, context, `${tokenPath}[${index}]`, errors);
        return;
      }
      if (!shadow || typeof shadow !== 'object') return;
      for (const key of ['offsetX', 'offsetY', 'blur', 'spread']) {
        validateReferenceTypes(shadow[key], 'dimension', resolver, context, `${tokenPath}.${key}`, errors);
      }
      validateReferenceTypes(shadow.color, 'color', resolver, context, `${tokenPath}.color`, errors);
    });
  }
}

function validateRequiredThemeTokens(theme: TokenData, name: string, errors: string[]): void {
  const colors = theme && theme.color;
  for (const token of REQUIRED_THEME_COLORS) {
    if (!colors || !Object.hasOwn(colors, token) || !Object.hasOwn(colors[token], '$value')) {
      errors.push(`${name} is missing required color token color.${token}`);
    }
  }
}

function visitTokens(
  group: TokenData,
  callback: (token: TokenData, tokenPath: string, inheritedType: string | null) => void,
  prefix = '',
  inheritedType: string | null = null
): void {
  if (!group || typeof group !== 'object' || Array.isArray(group)) return;
  const type = group.$type || inheritedType;
  for (const [key, value] of Object.entries(group)) {
    if (key.startsWith('$')) continue;
    const tokenPath = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && Object.hasOwn(value, '$value')) {
      callback(value, tokenPath, type);
    } else {
      visitTokens(value, callback, tokenPath, type);
    }
  }
}

function readJson(filePath: string): TokenData {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export { loadTokenDocuments, validateTokenDocuments };
