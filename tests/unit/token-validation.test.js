const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTokenDocuments, validateTokenDocuments } = require('../../scripts/token-validation');

test('all committed token files validate against DTCG 2025.10 and typed value rules', () => {
  const errors = validateTokenDocuments(loadTokenDocuments());
  assert.deepEqual(errors, []);
});

test('rejects legacy string dimensions and durations', () => {
  const documents = loadTokenDocuments();
  documents.primitives.spacing['4'].$value = '16px';
  documents.primitives.motion.fast.$value = '120ms';

  const errors = validateTokenDocuments(documents);
  assert.ok(errors.some((error) => error.includes('spacing.4') && error.includes('dimension')));
  assert.ok(errors.some((error) => error.includes('motion.fast') && error.includes('duration')));
});

test('rejects malformed shadow sub-values and unresolved references', () => {
  const documents = loadTokenDocuments();
  documents.primitives.shadow.sm.$value.offsetY = '1px';
  documents.semantic.color.background.$value = '{colors.not-a-color}';

  const errors = validateTokenDocuments(documents);
  assert.ok(errors.some((error) => error.includes('shadow.sm') && error.includes('offsetY')));
  assert.ok(errors.some((error) => error.includes('Unresolved reference: colors.not-a-color')));
});

test('rejects aliases whose target token has an incompatible type', () => {
  const documents = loadTokenDocuments();
  documents.primitives.spacing['4'].$value = '{colors.gray.100}';
  documents.primitives.shadow.sm.$value.offsetY = '{colors.black}';

  const errors = validateTokenDocuments(documents);
  assert.ok(errors.some((error) => error.includes('spacing.4') && error.includes('expected a dimension reference')));
  assert.ok(errors.some((error) => error.includes('shadow.sm.offsetY') && error.includes('expected a dimension reference')));
});

test('requires a usable sRGB fallback when a color token uses another color space', () => {
  const documents = loadTokenDocuments();
  documents.primitives.colors.gray['100'].$value = {
    colorSpace: 'lab',
    components: [50, 0, 0]
  };

  const errors = validateTokenDocuments(documents);
  assert.ok(errors.some((error) => error.includes('colors.gray.100') && error.includes('DTCG color object')));
});

test('honors a token type inherited from its containing group', () => {
  const documents = loadTokenDocuments();
  documents.primitives.dimensions = {
    $type: 'dimension',
    incompatible: { $value: '{colors.black}' }
  };

  const errors = validateTokenDocuments(documents);
  assert.ok(errors.some((error) => error.includes('dimensions.incompatible') && error.includes('expected a dimension reference')));
});
