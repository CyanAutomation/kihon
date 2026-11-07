const test = require('node:test');
const assert = require('node:assert/strict');
const { contrastRatio, validateThemeContrast, validateThemeDocuments } = require('../../scripts/contrast');
const { loadTokenDocuments } = require('../../scripts/token-validation');

test('calculates WCAG contrast ratios from hex colors', () => {
  assert.ok(Math.abs(contrastRatio('#000000', '#ffffff') - 21) < 0.01);
});

test('checks approved text pairings independently in light and dark themes', () => {
  const themes = {
    light: {
      background: '#ffffff', surface: '#ffffff', 'text-primary': '#000000',
      'text-secondary': '#333333', accent: '#000000', 'on-accent': '#ffffff',
      'focus-ring': '#000000', danger: '#000000', 'border-strong': '#333333'
    },
    dark: {
      background: '#000000', surface: '#111111', 'text-primary': '#ffffff',
      'text-secondary': '#eeeeee', accent: '#ffffff', 'on-accent': '#000000',
      'focus-ring': '#ffffff', danger: '#ffffff', 'border-strong': '#eeeeee'
    }
  };

  assert.deepEqual(validateThemeContrast(themes), []);

  themes.dark['text-secondary'] = '#555555';
  const errors = validateThemeContrast(themes);
  assert.ok(errors.some((error) => error.includes('dark') && error.includes('text-secondary')));
});

test('fails contrast validation for translucent theme colors', () => {
  const documents = loadTokenDocuments();
  documents.lightTheme.color.background.$value = {
    colorSpace: 'srgb', components: [1, 1, 1], alpha: 0.5, hex: '#ffffff'
  };

  const errors = validateThemeDocuments(documents);
  assert.ok(errors.some((error) => error.includes('background') && error.includes('must be opaque')));
});
