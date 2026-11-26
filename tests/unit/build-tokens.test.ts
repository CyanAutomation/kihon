import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { generateTokensCss } from '../../scripts/build-tokens.ts';
import { loadTokenDocuments } from '../../scripts/token-validation.ts';
import { setTokenValueAtPath } from './token-test-helpers.ts';

test('generates theme CSS from explicitly namespaced semantic references', () => {
  const documents = loadTokenDocuments();
  setTokenValueAtPath(documents, 'lightTheme.color.background', '{semantic.color.background}');
  const tokensDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kihon-token-context-'));

  try {
    fs.mkdirSync(path.join(tokensDir, 'themes'));
    fs.writeFileSync(path.join(tokensDir, 'primitives.json'), JSON.stringify(documents.primitives));
    fs.writeFileSync(path.join(tokensDir, 'semantic.json'), JSON.stringify(documents.semantic));
    fs.writeFileSync(path.join(tokensDir, 'themes', 'light.json'), JSON.stringify(documents.lightTheme));
    fs.writeFileSync(path.join(tokensDir, 'themes', 'dark.json'), JSON.stringify(documents.darkTheme));

    const css = generateTokensCss(tokensDir);
    assert.match(css, /--kh-color-background: #f5f5f7;/);
  } finally {
    fs.rmSync(tokensDir, { recursive: true, force: true });
  }
});

test('uses dark as the default and reserves system-following behavior for an explicit mode', () => {
  const css = generateTokensCss();

  assert.match(css, /:root\s*\{\s*color-scheme: dark;/);
  assert.match(css, /--kh-color-background: #141518;/);
  assert.match(css, /--kh-color-accent: #fb923c;/);
  assert.match(css, /:root\[data-kh-theme="light"\]\s*\{\s*color-scheme: light;/);
  assert.match(css, /:root\[data-kh-theme="dark"\]\s*\{\s*color-scheme: dark;/);
  assert.match(css, /@media \(prefers-color-scheme: light\)\s*\{\s*:root\[data-kh-theme="system"\]\s*\{\s*color-scheme: light;/);
  assert.doesNotMatch(css, /:root:not\(\[data-kh-theme\]\)/);
});
