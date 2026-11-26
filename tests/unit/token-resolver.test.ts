import test from 'node:test';
import assert from 'node:assert/strict';
import { TokenResolver } from '../../scripts/token-resolver.ts';
import { formatColor, formatValue } from '../../scripts/token-format.ts';
import type { TokenDefinition } from '../../scripts/token-types.ts';

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

test('lookup preserves inherited types and prefers an explicitly typed token', () => {
  const tokens = {
    $type: 'dimension',
    spacing: {
      inherited: { $value: { value: 4, unit: 'px' } },
      explicit: { $type: 'number', $value: 2 },
      emptyType: { $type: '', $value: 3 }
    }
  };
  const resolver = new TokenResolver(tokens);

  assert.deepEqual(resolver.lookupToken('spacing.inherited'), {
    token: tokens.spacing.inherited,
    type: 'dimension'
  });
  assert.deepEqual(resolver.lookupToken('spacing.explicit'), {
    token: tokens.spacing.explicit,
    type: 'number'
  });
  const explicitToken: TokenDefinition = resolver.lookupToken('spacing.explicit').token;
  assert.equal(explicitToken.$value, 2);
  assert.deepEqual(resolver.lookupToken('spacing.emptyType'), {
    token: tokens.spacing.emptyType,
    type: ''
  });
  assert.throws(() => resolver.lookupToken('spacing'), /Reference does not point to a token: spacing/);
});

test('extracts nested tokens, skips metadata, resolves values, and inherits group types', () => {
  const tokens = {
    $type: 'dimension',
    $description: 'Ignored group metadata',
    spacing: {
      base: { $value: { value: 4, unit: 'px' } },
      alias: { $value: '{spacing.base}' },
      count: { $type: 'number', $value: 2 }
    },
    empty: null
  };

  assert.deepEqual(new TokenResolver(tokens).extractTokens(tokens, '--kh-'), {
    '--kh-spacing-base': { value: { value: 4, unit: 'px' }, type: 'dimension' },
    '--kh-spacing-alias': { value: { value: 4, unit: 'px' }, type: 'dimension' },
    '--kh-spacing-count': { value: 2, type: 'number' }
  });
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

test('formats font family names, generated colors, transparent shadows, and generic arrays', () => {
  assert.equal(formatValue(['Inter', 'sans-serif', 'A "Quoted" Font'], 'fontFamily'), 'Inter, sans-serif, "A \\"Quoted\\" Font"');
  assert.equal(formatColor('#abc'), '#abc');
  assert.equal(formatValue({ colorSpace: 'srgb', components: [0.25, 0.5, 0.75] }, 'color'), '#4080bf');
  assert.equal(formatValue({ colorSpace: 'srgb', components: [0.25, 0.5, 0.75], alpha: 0.5 }, 'color'), 'rgba(64, 128, 191, 0.5)');
  assert.equal(formatValue({
    offsetX: { value: 0, unit: 'px' },
    offsetY: { value: 0, unit: 'px' },
    blur: { value: 0, unit: 'px' },
    spread: { value: 0, unit: 'px' },
    color: { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0 }
  }, 'shadow'), 'none');
  assert.equal(formatValue([1, 'two'], 'unknown'), '1, two');
});
