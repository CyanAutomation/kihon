const test = require('node:test');
const assert = require('node:assert/strict');
const { TokenResolver, formatValue } = require('../../scripts/token-resolver');

test('resolves transitive aliases without losing the active reference chain', () => {
  const tokens = {
    colors: {
      base: { $type: 'color', $value: '#123456' },
      alias: { $type: 'color', $value: '{colors.base}' },
      nested: { $type: 'color', $value: '{colors.alias}' }
    }
  };

  assert.equal(new TokenResolver(tokens).resolveValue('{colors.nested}'), '#123456');
});

test('rejects direct and indirect cyclic references', () => {
  const tokens = {
    values: {
      direct: { $type: 'number', $value: '{values.direct}' },
      first: { $type: 'number', $value: '{values.second}' },
      second: { $type: 'number', $value: '{values.first}' }
    }
  };
  const resolver = new TokenResolver(tokens);

  assert.throws(() => resolver.resolveValue('{values.direct}'), /Circular reference.*values\.direct/);
  assert.throws(() => resolver.resolveValue('{values.first}'), /Circular reference.*values\.first/);
});

test('rejects unresolved aliases with the missing path in the error', () => {
  assert.throws(
    () => new TokenResolver({}).resolveValue('{missing.token}'),
    /Unresolved reference: missing\.token/
  );
});

test('formats typed dimensions, durations, colors, and shadows as CSS values', () => {
  assert.equal(formatValue({ value: 16, unit: 'px' }, 'dimension'), '16px');
  assert.equal(formatValue({ value: 120, unit: 'ms' }, 'duration'), '120ms');
  assert.equal(formatValue({ colorSpace: 'srgb', components: [1, 0, 0], hex: '#ff0000' }, 'color'), '#ff0000');
  assert.equal(formatValue({
    offsetX: { value: 0, unit: 'px' },
    offsetY: { value: 1, unit: 'px' },
    blur: { value: 2, unit: 'px' },
    spread: { value: 0, unit: 'px' },
    color: { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.05, hex: '#000000' }
  }, 'shadow'), '0px 1px 2px 0px rgba(0, 0, 0, 0.05)');
  assert.equal(formatValue([
    {
      offsetX: { value: 0, unit: 'px' }, offsetY: { value: 1, unit: 'px' },
      blur: { value: 2, unit: 'px' }, spread: { value: 0, unit: 'px' },
      color: { colorSpace: 'srgb', components: [0, 0, 0], hex: '#000000' }
    },
    {
      offsetX: { value: 0, unit: 'px' }, offsetY: { value: 0, unit: 'px' },
      blur: { value: 2, unit: 'px' }, spread: { value: 0, unit: 'px' }, inset: true,
      color: { colorSpace: 'srgb', components: [1, 1, 1], hex: '#ffffff' }
    }
  ], 'shadow'), '0px 1px 2px 0px #000000, inset 0px 0px 2px 0px #ffffff');
});
