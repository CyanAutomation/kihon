import type { CompleteTokenDocuments, TokenData } from './token-types.ts';
import { TokenResolver } from './token-resolver.ts';
import { createTokenContext } from './token-context.ts';
import { isTokenReference } from './token-value-reference.ts';

export function validateDocumentReferences(documents: CompleteTokenDocuments, errors: string[]): void {
  for (const [label, document] of Object.entries(documents)) {
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
