import test from 'node:test';
import assert from 'node:assert/strict';
import { isJsonObject, isJsonValue } from '../../scripts/token-json.ts';
import { isTokenDefinition } from '../../scripts/token-shapes.ts';
import { isTokenReference } from '../../scripts/token-value-reference.ts';
import type { JsonValue, ResolvedToken, TokenDefinition } from '../../scripts/token-types.ts';
import type { TokenData } from '../../scripts/token-types.ts';
import { TokenResolver } from '../../scripts/token-resolver.ts';

type IsAny<Value> = 0 extends (1 & Value) ? true : false;
type AssertFalse<Value extends false> = Value;

const resolvedValueIsNotAny: AssertFalse<IsAny<ResolvedToken['value']>> = false;
const tokenDataIsNotAny: AssertFalse<IsAny<TokenData>> = false;
const resolverOutputIsNotAny: AssertFalse<IsAny<ReturnType<TokenResolver['resolveValue']>>> = false;
void resolvedValueIsNotAny;
void tokenDataIsNotAny;
void resolverOutputIsNotAny;

test('recognizes recursive JSON values and rejects non-JSON objects', () => {
  assert.equal(isJsonValue({ name: 'Kihon', dimensions: [4, null, true] }), true);
  assert.equal(isJsonValue(Number.NaN), false);
  assert.equal(isJsonValue(new Date()), false);

  const cyclic: { self?: unknown } = {};
  cyclic.self = cyclic;
  assert.equal(isJsonValue(cyclic), false);
  assert.equal(isJsonObject({ $value: 4 }), true);
  assert.equal(isJsonObject([]), false);
  assert.equal(isJsonObject(null), false);
});

test('recognizes token definitions only when they own a JSON $value', () => {
  const definition: unknown = {
    $type: 'dimension',
    $value: { value: 4, unit: 'px' }
  };
  assert.equal(isTokenDefinition(definition), true);
  if (isTokenDefinition(definition)) {
    const token: TokenDefinition = definition;
    assert.deepEqual(token.$value, { value: 4, unit: 'px' });
  }

  assert.equal(isTokenDefinition(Object.create({ $value: 4 })), false);
  assert.equal(isTokenDefinition({ $value: undefined }), false);
  assert.equal(isTokenDefinition({ $value: () => 1 }), false);
});

test('narrows only complete token reference strings', () => {
  assert.equal(isTokenReference('{space.4}'), true);
  assert.equal(isTokenReference('{colors.base} suffix'), false);
  assert.equal(isTokenReference('{not{a}reference}'), false);
  assert.equal(isTokenReference(4), false);
});

test('models parsed token values without any escape hatches', () => {
  const tokenValue: JsonValue = {
    colorSpace: 'srgb',
    components: [0.1, 0.2, 0.3]
  };
  assert.equal(isJsonValue(tokenValue), true);
});

test('rejects non-JSON values before token resolution', () => {
  const resolver = new TokenResolver({});
  assert.throws(() => resolver.resolveValue(() => 'not JSON'), /JSON-compatible data/);
});
