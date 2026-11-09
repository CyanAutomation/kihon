#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { generateTokensCss } = require('./build-tokens');
const { getRuntimeOutputs } = require('./build-runtime');
const { getPackageOutputs } = require('./build-package');

const ROOT = path.join(__dirname, '..');
const outputPath = path.join(ROOT, 'src', 'css', 'tokens.css');
const expected = generateTokensCss();

function listFiles(directory, prefix = '') {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relative = path.join(prefix, entry.name);
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(absolute, relative) : [relative];
  });
}

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

  const packageOutputs = await getPackageOutputs();
  const expectedPackageFiles = new Set();
  for (const output of packageOutputs) {
    const relativePath = path.relative(ROOT, output.path);
    expectedPackageFiles.add(relativePath);
    if (!fs.existsSync(output.path) || !fs.readFileSync(output.path).equals(output.contents)) {
      console.error(`${relativePath} is stale or missing. Run: npm run build and regenerate dist/.`);
      failed = true;
    }
  }
  const actualPackageFiles = listFiles(path.join(ROOT, 'dist'))
    .map((relativePath) => path.join('dist', relativePath));
  for (const relativePath of actualPackageFiles) {
    if (!expectedPackageFiles.has(relativePath)) {
      console.error(`${relativePath} is an unexpected package artifact. Run: npm run build to replace dist/.`);
      failed = true;
    }
  }
  for (const output of packageOutputs) {
    const relativePath = path.relative(ROOT, output.path);
    if (fs.existsSync(output.path) && fs.readFileSync(output.path).equals(output.contents)) {
      console.log(`✓ ${relativePath} matches its package source`);
    }
  }

  const packageMetadata = require('../package.json');
  const exportTargets = [];
  const visitExport = (entry) => {
    if (typeof entry === 'string') exportTargets.push(entry);
    else if (entry && typeof entry === 'object') Object.values(entry).forEach(visitExport);
  };
  Object.values(packageMetadata.exports || {}).forEach(visitExport);
  for (const target of exportTargets) {
    if (!target.startsWith('./dist/')) {
      console.error(`Package export ${target} must point inside dist/.`);
      failed = true;
    } else if (!fs.existsSync(path.join(ROOT, target))) {
      console.error(`Package export target ${target} is missing. Run: npm run build.`);
      failed = true;
    }
  }

  if (failed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`Generated-file check failed: ${error.message}`);
  process.exitCode = 1;
});
