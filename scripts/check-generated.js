#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { generateTokensCss } = require('./build-tokens');

const outputPath = path.join(__dirname, '..', 'src', 'css', 'tokens.css');
const expected = generateTokensCss();

if (!fs.existsSync(outputPath)) {
  console.error('Generated CSS is missing. Run: npm run build');
  process.exitCode = 1;
} else if (fs.readFileSync(outputPath, 'utf8') !== expected) {
  console.error('src/css/tokens.css is stale. Run: npm run build and commit the generated output.');
  process.exitCode = 1;
} else {
  console.log('✓ src/css/tokens.css matches the token source');
}
