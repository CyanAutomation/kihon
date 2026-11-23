import type { TokenData } from './token-types.ts';

const REFERENCE = /^\{([^{}]+)\}$/;

export function lookupToken(reference: string, context: TokenData | null): { token: TokenData; type: string | null } {
  let target: any = context;
  let inheritedType: string | null = null;
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

export function resolveTokenValue(value: any, context: TokenData | null, referenceStack: string[] = []): any {
  if (typeof value === 'string') {
    const match = value.match(REFERENCE);
    if (!match) return value;

    const reference = match[1];
    if (reference === undefined) return value;
    if (referenceStack.includes(reference)) {
      const chain = [...referenceStack, reference].join(' -> ');
      throw new Error(`Circular reference detected: ${chain}`);
    }

    const { token } = lookupToken(reference, context);
    return resolveTokenValue(token.$value, context, [...referenceStack, reference]);
  }

  if (Array.isArray(value)) {
    return value.map((item) => resolveTokenValue(item, context, referenceStack));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [
        key,
        resolveTokenValue(child, context, referenceStack)
      ])
    );
  }

  return value;
}
