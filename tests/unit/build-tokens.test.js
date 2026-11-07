const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { generateTokensCss } = require('../../scripts/build-tokens');
const { loadTokenDocuments } = require('../../scripts/token-validation');

test('generates theme CSS from explicitly namespaced semantic references', () => {
  const documents = loadTokenDocuments();
  documents.lightTheme.color.background.$value = '{semantic.color.background}';
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
