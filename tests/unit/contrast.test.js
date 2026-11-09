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
      'text-secondary': '#333333', accent: '#000000', 'on-accent': '#ffffff', 'button-primary-hover': '#000000',
      'focus-ring': '#000000', danger: '#000000', 'border-strong': '#333333',
      success: '#000000', 'success-background': '#ffffff'
    },
    dark: {
      background: '#000000', surface: '#111111', 'text-primary': '#ffffff',
      'text-secondary': '#eeeeee', accent: '#ffffff', 'on-accent': '#000000', 'button-primary-hover': '#ffffff',
      'focus-ring': '#ffffff', danger: '#ffffff', 'border-strong': '#eeeeee',
      success: '#ffffff', 'success-background': '#000000'
    }
  };

  assert.deepEqual(validateThemeContrast(themes), []);

  themes.dark['text-secondary'] = '#555555';
  const errors = validateThemeContrast(themes);
  assert.ok(errors.some((error) => error.includes('dark') && error.includes('text-secondary')));

  themes.dark['text-secondary'] = '#eeeeee';
  themes.dark['button-primary-hover'] = '#333333';
  assert.ok(validateThemeContrast(themes).some((error) => error.includes('button-primary-hover')));
  themes.dark['button-primary-hover'] = '#ffffff';
  themes.dark.success = '#666666';
  assert.ok(validateThemeContrast(themes).some((error) => error.includes('success on success-background')));
});

test('fails contrast validation for translucent theme colors', () => {
  const documents = loadTokenDocuments();
  documents.lightTheme.color.background.$value = {
    colorSpace: 'srgb', components: [1, 1, 1], alpha: 0.5, hex: '#ffffff'
  };

  const errors = validateThemeDocuments(documents);
  assert.ok(errors.some((error) => error.includes('background') && error.includes('must be opaque')));
});

test('checks contrast after resolving a theme reference into the semantic document', () => {
  const documents = loadTokenDocuments();
  documents.semantic.color['text-primary'].$value = '{colors.gray.100}';
  documents.lightTheme.color.background.$value = '{semantic.color.background}';
  documents.lightTheme.color['text-primary'].$value = '{semantic.color.text-primary}';

  const errors = validateThemeDocuments(documents);
  assert.ok(errors.some((error) => error.includes('light: text-primary on background')));
  assert.ok(errors.every((error) => !error.startsWith('Contrast validation failed:')));
});
