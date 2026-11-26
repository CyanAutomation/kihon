import * as fs from 'node:fs';
import * as path from 'node:path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import type { CompleteTokenDocuments, TokenData } from './token-types.ts';
import { isJsonObject, isRecord } from './token-json.ts';
import { isTokenDefinition } from './token-shapes.ts';
import { validateTokenValue } from './token-value-validation.ts';

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

export function loadTokenDocuments(tokensDir = path.join(ROOT, 'tokens')): CompleteTokenDocuments {
  return {
    primitives: readJson(path.join(tokensDir, 'primitives.json')),
    semantic: readJson(path.join(tokensDir, 'semantic.json')),
    lightTheme: readJson(path.join(tokensDir, 'themes', 'light.json')),
    darkTheme: readJson(path.join(tokensDir, 'themes', 'dark.json'))
  };
}

export function validateDocumentShape(document: TokenData, label: string, errors: string[]): void {
  if (!validateSchema(document)) {
    for (const issue of validateSchema.errors || []) {
      errors.push(`${label} does not match the DTCG 2025.10 schema at ${issue.instancePath || '/'}: ${issue.message}`);
    }
  }
  validateTypedValues(document, label, errors);
}

export function validateRequiredThemeTokens(theme: TokenData, name: string, errors: string[]): void {
  const colors = isRecord(theme.color) ? theme.color : null;
  for (const token of REQUIRED_THEME_COLORS) {
    if (!colors || !isTokenDefinition(colors[token])) {
      errors.push(`${name} is missing required color token color.${token}`);
    }
  }
}

function validateTypedValues(document: TokenData, label: string, errors: string[]): void {
  const walk = (node: unknown, tokenPath = '', inheritedType: string | null = null): void => {
    if (!isRecord(node)) return;
    const type = typeof node.$type === 'string' ? node.$type : inheritedType;

    if (Object.hasOwn(node, '$value')) {
      const value = node.$value;
      if (!type) {
        errors.push(`${label}.${tokenPath} is missing a token type ($type)`);
      } else {
        const issue = validateTokenValue(type, value);
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

function readJson(filePath: string): TokenData {
  const value: unknown = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!isJsonObject(value)) throw new TypeError(`Expected a JSON object in ${filePath}.`);
  return value;
}
