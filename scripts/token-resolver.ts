import * as fs from 'node:fs';
import * as path from 'node:path';
import type { TokenData, TokenMap } from './token-types.ts';

const REFERENCE = /^\{([^{}]+)\}$/;

class TokenResolver {
  primitives: TokenData | null;
  semantic: TokenData | null;
  lightTheme: TokenData | null;
  darkTheme: TokenData | null;

  constructor(primitives: TokenData | null = null) {
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

  resolveValue(value: any, context: TokenData | null = this.primitives, referenceStack: string[] = []): any {
    if (typeof value === 'string') {
      const match = value.match(REFERENCE);
      if (!match) return value;

      const reference = match[1];
      if (reference === undefined) return value;
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

  lookupToken(reference: string, context: TokenData | null = this.primitives): { token: TokenData; type: string | null } {
    let target: any = context;
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

  extractTokens(group: TokenData | null, prefix = '', context: TokenData | null = this.primitives): TokenMap {
    const tokens: TokenMap = {};

    const walk = (node: any, keyPath: string): void => {
      if (!node || typeof node !== 'object' || Array.isArray(node)) return;

      for (const [key, value] of Object.entries(node)) {
        if (key.startsWith('$')) continue;
        const tokenPath = keyPath ? `${keyPath}-${key}` : key;

        if (value && typeof value === 'object' && Object.hasOwn(value, '$value')) {
          const token = value as TokenData;
          tokens[`${prefix}${tokenPath}`] = {
            value: this.resolveValue(token.$value, context),
            type: token.$type || node.$type
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

function readJson(filePath: string): TokenData {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export { TokenResolver };
