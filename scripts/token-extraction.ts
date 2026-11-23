import type { TokenData, TokenMap } from './token-types.ts';
import { resolveTokenValue } from './token-resolution.ts';

export function extractTokenMap(group: TokenData | null, prefix: string, context: TokenData | null): TokenMap {
  const tokens: TokenMap = {};

  const walk = (node: any, keyPath: string, inheritedType: string | null): void => {
    if (!node || typeof node !== 'object' || Array.isArray(node)) return;

    const type = node.$type || inheritedType;
    for (const [key, value] of Object.entries(node)) {
      if (key.startsWith('$')) continue;
      const tokenPath = keyPath ? `${keyPath}-${key}` : key;

      if (value && typeof value === 'object' && Object.hasOwn(value, '$value')) {
        const token = value as TokenData;
        tokens[`${prefix}${tokenPath}`] = {
          value: resolveTokenValue(token.$value, context),
          type: token.$type || type
        };
      } else {
        walk(value, tokenPath, type);
      }
    }
  };

  walk(group, '', null);
  return tokens;
}
