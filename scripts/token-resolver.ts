import * as fs from 'node:fs';
import * as path from 'node:path';
import { isJsonObject } from './token-json.ts';
import type { JsonValue, TokenData, TokenMap } from './token-types.ts';
import { extractTokenMap } from './token-extraction.ts';
import { lookupToken, resolveTokenValue } from './token-resolution.ts';

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

  resolveValue(value: unknown, context: TokenData | null = this.primitives): JsonValue {
    return resolveTokenValue(value, context);
  }

  lookupToken(reference: string, context: TokenData | null = this.primitives): { token: TokenData; type: string | null } {
    return lookupToken(reference, context);
  }

  extractTokens(group: TokenData | null, prefix = '', context: TokenData | null = this.primitives): TokenMap {
    return extractTokenMap(group, prefix, context);
  }
}

function readJson(filePath: string): TokenData {
  const value: unknown = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!isJsonObject(value)) throw new TypeError(`Expected a JSON object in ${filePath}.`);
  return value;
}

export { TokenResolver };
