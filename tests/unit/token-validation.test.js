const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTokenDocuments, validateTokenDocuments } = require('../../scripts/token-validation');
const { generateTokensCss } = require('../../scripts/build-tokens');

test('all committed token files validate against DTCG 2025.10 and typed value rules', () => {
  const errors = validateTokenDocuments(loadTokenDocuments());
  assert.deepEqual(errors, []);
});

test('primary button hover colour is defined in both themes and exported by token generation', () => {
  const documents = loadTokenDocuments();
  assert.equal(documents.lightTheme.color.background.$value, '{colors.warm-gray.100}');
  assert.equal(documents.lightTheme.color.surface.$value, '{colors.white}');
  assert.equal(documents.lightTheme.color['text-primary'].$value, '{colors.warm-gray.900}');
  assert.equal(documents.lightTheme.color['text-secondary'].$value, '{colors.warm-gray.700}');
  assert.equal(documents.lightTheme.color['border-subtle'].$value, '{colors.warm-gray.300}');
  assert.equal(documents.lightTheme.color['border-strong'].$value, '{colors.warm-gray.600}');
  assert.equal(documents.lightTheme.color.accent.$value, '{colors.coral.500}');
  assert.equal(documents.lightTheme.color['on-accent'].$value, '{colors.warm-gray.900}');
  assert.equal(documents.lightTheme.color['accent-text'].$value, '{colors.coral.700}');
  assert.equal(documents.lightTheme.color['button-primary-hover'].$value, '{colors.coral.600}');
  assert.equal(documents.lightTheme.color['focus-ring'].$value, '{colors.coral.700}');
  assert.equal(documents.darkTheme.color.accent.$value, '{colors.orange.500}');
  assert.equal(documents.darkTheme.color['on-accent'].$value, '{colors.gray.900}');
  assert.equal(documents.darkTheme.color['button-primary-hover'].$value, '{colors.orange.400}');
  assert.equal(documents.darkTheme.color['accent-text'].$value, '{colors.orange.500}');
  assert.equal(documents.lightTheme.color.success.$value, '{colors.green.800}');
  assert.equal(documents.darkTheme.color.success.$value, '{colors.green.300}');

  const errors = validateTokenDocuments(documents);
  assert.deepEqual(errors, []);
  assert.match(generateTokensCss(), /--kh-color-accent: #fb923c;/);
  assert.match(generateTokensCss(), /--kh-color-accent: #f45738;/);
  assert.match(generateTokensCss(), /--kh-color-on-accent: #171a17;/);
  assert.match(generateTokensCss(), /--kh-color-accent-text: #bf3b2c;/);
  assert.match(generateTokensCss(), /--kh-color-success: #86efac;/);
});

test('loading motion has a typed semantic alias and is exported to CSS', () => {
  const documents = loadTokenDocuments();
  assert.deepEqual(documents.primitives.motion.loading.$value, { value: 800, unit: 'ms' });
  assert.equal(documents.semantic['motion-duration'].loading.$value, '{motion.loading}');
  assert.deepEqual(validateTokenDocuments(documents), []);
  assert.match(generateTokensCss(), /--kh-motion-loading: 800ms;/);
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

test('resolves explicitly namespaced references to the semantic document', () => {
  const documents = loadTokenDocuments();
  documents.lightTheme.color.background.$value = '{semantic.color.background}';

  assert.deepEqual(validateTokenDocuments(documents), []);
});
