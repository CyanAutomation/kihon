const fs = require('node:fs');
const path = require('node:path');
const Ajv = require('ajv').default;
const addFormats = require('ajv-formats').default;
const { TokenResolver } = require('./token-resolver');
const { createTokenContext } = require('./token-context');

const ROOT = path.join(__dirname, '..');
const SCHEMA_PATH = path.join(ROOT, 'schemas', 'dtcg-2025.10-format.schema.json');
const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validateSchema = ajv.compile(schema);
const REFERENCE = /^\{[^{}]+\}$/;
const REQUIRED_THEME_COLORS = [
  'background', 'surface', 'text-primary', 'text-secondary', 'accent',
  'on-accent', 'danger', 'border-subtle', 'border-strong', 'focus-ring'
];

function loadTokenDocuments(tokensDir = path.join(ROOT, 'tokens')) {
  return {
    primitives: readJson(path.join(tokensDir, 'primitives.json')),
    semantic: readJson(path.join(tokensDir, 'semantic.json')),
    lightTheme: readJson(path.join(tokensDir, 'themes', 'light.json')),
    darkTheme: readJson(path.join(tokensDir, 'themes', 'dark.json'))
  };
}

function validateTokenDocuments(documents) {
  const errors = [];
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
        errors.push(`${label}.${tokenPath}: ${error.message}`);
      }
    });
  }

  validateRequiredThemeTokens(documents.lightTheme, 'lightTheme', errors);
  validateRequiredThemeTokens(documents.darkTheme, 'darkTheme', errors);
  return [...new Set(errors)];
}

function validateTypedValues(document, label, errors) {
  const walk = (node, tokenPath = '', inheritedType = null) => {
    if (!node || typeof node !== 'object' || Array.isArray(node)) return;
    const type = node.$type || inheritedType;

    if (Object.hasOwn(node, '$value')) {
      if (!type) {
        errors.push(`${label}.${tokenPath} is missing a token type ($type)`);
      } else {
        const issue = validateValue(type, node.$value);
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

function validateValue(type, value) {
  if (isReference(value)) return null;

  switch (type) {
    case 'dimension':
      return isDimension(value) ? null : 'expected a typed dimension {value: number, unit: px|rem} or a token reference';
    case 'duration':
      return isDuration(value) ? null : 'expected a typed duration {value: number, unit: ms|s} or a token reference';
    case 'color':
      return isColor(value) ? null : 'expected a DTCG color object or a token reference';
    case 'shadow':
      return validateShadow(value);
    case 'fontFamily':
      return typeof value === 'string' || (Array.isArray(value) && value.every((name) => typeof name === 'string'))
        ? null
        : 'expected a string or an array of font family names';
    case 'fontWeight':
      return typeof value === 'number' || typeof value === 'string' ? null : 'expected a numeric or named font weight';
    case 'number':
      return typeof value === 'number' && Number.isFinite(value) ? null : 'expected a finite number';
    default:
      return null;
  }
}

function validateReferenceTypes(value, expectedType, resolver, context, tokenPath, errors) {
  if (isReference(value)) {
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
      if (isReference(shadow)) {
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

function isDimension(value) {
  return isTypedUnit(value, ['px', 'rem']);
}

function isDuration(value) {
  return isTypedUnit(value, ['ms', 's']);
}

function isTypedUnit(value, units) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value) &&
    typeof value.value === 'number' && Number.isFinite(value.value) && units.includes(value.unit));
}

function isColor(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  if (typeof value.colorSpace !== 'string' || !Array.isArray(value.components)) return false;
  if (Object.hasOwn(value, 'alpha') && (typeof value.alpha !== 'number' || value.alpha < 0 || value.alpha > 1)) return false;
  if (Object.hasOwn(value, 'hex') && !/^#[\da-f]{6}$/i.test(value.hex)) return false;
  if (value.colorSpace === 'srgb') {
    return value.components.length === 3 && value.components.every((component) =>
      typeof component === 'number' && Number.isFinite(component) && component >= 0 && component <= 1);
  }
  // Other color spaces need an sRGB fallback for the CSS and contrast tooling.
  return typeof value.hex === 'string' && /^#[\da-f]{6}$/i.test(value.hex);
}

function validateShadow(value) {
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      if (isReference(value[index])) continue;
      const issue = validateShadowObject(value[index]);
      if (issue) return `shadow ${index}: ${issue}`;
    }
    return null;
  }
  return validateShadowObject(value);
}

function validateShadowObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return 'expected a typed shadow object or an array of shadows/references';
  }
  const dimensions = ['offsetX', 'offsetY', 'blur', 'spread'];
  for (const key of dimensions) {
    if (!isDimension(value[key]) && !isReference(value[key])) {
      return `${key} must be a typed dimension or a token reference`;
    }
  }
  if (!isColor(value.color) && !isReference(value.color)) {
    return 'color must be a DTCG color object or a token reference';
  }
  if (Object.hasOwn(value, 'inset') && typeof value.inset !== 'boolean') {
    return 'inset must be a boolean';
  }
  return null;
}

function validateRequiredThemeTokens(theme, name, errors) {
  const colors = theme && theme.color;
  for (const token of REQUIRED_THEME_COLORS) {
    if (!colors || !Object.hasOwn(colors, token) || !Object.hasOwn(colors[token], '$value')) {
      errors.push(`${name} is missing required color token color.${token}`);
    }
  }
}

function visitTokens(group, callback, prefix = '', inheritedType = null) {
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

function isReference(value) {
  return typeof value === 'string' && REFERENCE.test(value);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

module.exports = { loadTokenDocuments, validateTokenDocuments, validateValue, isReference };
