import type { TokenData, TokenMap } from './token-types.ts';
import { isRecord } from './token-json.ts';
import { isTokenDefinition } from './token-shapes.ts';
import { resolveTokenValue } from './token-resolution.ts';

export function extractTokenMap(group: TokenData | null, prefix: string, context: TokenData | null): TokenMap {
  const tokens: TokenMap = {};

  const walk = (node: unknown, keyPath: string, inheritedType: string | null): void => {
    if (!isRecord(node)) return;

    const type = typeof node.$type === 'string' ? node.$type : inheritedType;
    for (const [key, value] of Object.entries(node)) {
      if (key.startsWith('$')) continue;
      const tokenPath = keyPath ? `${keyPath}-${key}` : key;

      if (isTokenDefinition(value)) {
        const token = value;
        tokens[`${prefix}${tokenPath}`] = {
          value: resolveTokenValue(token.$value, context),
          type: token.$type ?? type
        };
      } else {
        walk(value, tokenPath, type);
      }
    }
  };

  walk(group, '', null);
  return tokens;
}
