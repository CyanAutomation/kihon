#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { generateTokensCss } = require('./build-tokens');
const { getRuntimeOutputs } = require('./build-runtime');

const outputPath = path.join(__dirname, '..', 'src', 'css', 'tokens.css');
const expected = generateTokensCss();

async function main() {
  let failed = false;

  if (!fs.existsSync(outputPath)) {
    console.error('Generated CSS is missing. Run: npm run build');
    failed = true;
  } else if (fs.readFileSync(outputPath, 'utf8') !== expected) {
    console.error('src/css/tokens.css is stale. Run: npm run build and commit the generated output.');
    failed = true;
  } else {
    console.log('✓ src/css/tokens.css matches the token source');
  }

  const runtimeOutputs = await getRuntimeOutputs();
  for (const output of runtimeOutputs) {
    const relativePath = path.relative(path.join(__dirname, '..'), output.path);
    if (!fs.existsSync(output.path) || !fs.readFileSync(output.path).equals(output.contents)) {
      console.error(`${relativePath} is stale or missing. Run: npm run build and commit the generated output.`);
      failed = true;
    } else {
      console.log(`✓ ${relativePath} matches its TypeScript source`);
    }
  }

  if (failed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`Generated-file check failed: ${error.message}`);
  process.exitCode = 1;
});
