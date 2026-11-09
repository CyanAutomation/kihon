#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const postcss = require('postcss');
const { HtmlValidate } = require('html-validate');

const ROOT = path.join(__dirname, '..');

function collectCssPaths(root = ROOT) {
  const componentsDirectory = path.join(root, 'src', 'css', 'components');
  const componentPaths = fs.readdirSync(componentsDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && path.extname(entry.name) === '.css')
    .map((entry) => path.join(componentsDirectory, entry.name))
    .sort((left, right) => left < right ? -1 : left > right ? 1 : 0);

  return [
    path.join(root, 'src', 'css', 'tokens.css'),
    path.join(root, 'src', 'css', 'base.css'),
    ...componentPaths,
    path.join(root, 'style-guide', 'styles.css')
  ];
}

function importedPath(params) {
  const value = params.trim();
  const urlMatch = /^url\(\s*(['"]?)(.*?)\1\s*\)$/i.exec(value);
  if (urlMatch) return urlMatch[2];
  const quotedMatch = /^(['"])(.*?)\1$/.exec(value);
  if (quotedMatch) return quotedMatch[2];
  return value;
}

function findComponentImportErrors(root, baseStylesheet, componentPaths) {
  const errors = [];
  const basePath = path.join(root, 'src', 'css', 'base.css');
  const importedFiles = new Set();

  baseStylesheet.walkAtRules('import', (rule) => {
    const specifier = importedPath(rule.params);
    if (!specifier.startsWith('.')) return;

    const resolved = path.resolve(path.dirname(basePath), specifier);
    importedFiles.add(resolved);
    if (!fs.existsSync(resolved)) {
      errors.push(`${path.relative(root, basePath)}:${rule.source.start.line} referenced stylesheet does not exist: ${specifier}`);
    }
  });

  const expectedImports = [
    path.join(root, 'src', 'css', 'tokens.css'),
    ...componentPaths
  ];
  for (const stylesheetPath of expectedImports) {
    if (!importedFiles.has(stylesheetPath)) {
      const specifier = `./${path.relative(path.dirname(basePath), stylesheetPath).split(path.sep).join('/')}`;
      errors.push(`${path.relative(root, basePath)} is missing required stylesheet import ${specifier}`);
    }
  }

  return errors;
}

async function runSanityChecks(root = ROOT) {
  const errors = [];
  const htmlPath = path.join(root, 'style-guide', 'index.html');
  const cssPaths = collectCssPaths(root);
  const validator = new HtmlValidate({
    extends: ['html-validate:recommended'],
    // The style guide uses inline declarations to show token values beside examples.
    rules: { 'no-inline-style': 'off' }
  });
  const htmlResult = await validator.validateFile(htmlPath);
  for (const result of htmlResult.results) {
    for (const message of result.messages) {
      errors.push(`${path.relative(root, result.filePath)}:${message.line}:${message.column} ${message.ruleId}: ${message.message}`);
    }
  }

  let baseStylesheet = null;
  for (const filePath of cssPaths) {
    // Keep filesystem errors distinct from PostCSS syntax errors.
    const css = fs.readFileSync(filePath, 'utf8');
    try {
      const stylesheet = postcss.parse(css, { from: filePath });
      if (filePath === path.join(root, 'src', 'css', 'base.css')) baseStylesheet = stylesheet;
    } catch (error) {
      errors.push(`${path.relative(root, filePath)}:${error.line}:${error.column} CSS parse error: ${error.reason}`);
    }
  }

  if (baseStylesheet) {
    const componentPaths = cssPaths.filter((filePath) =>
      path.dirname(filePath) === path.join(root, 'src', 'css', 'components')
    );
    errors.push(...findComponentImportErrors(root, baseStylesheet, componentPaths));
  }

  return errors;
}

async function main() {
  const errors = await runSanityChecks();
  if (errors.length) {
    console.error('HTML/CSS validation failed:');
    for (const error of errors) console.error(`  - ${error}`);
    process.exitCode = 1;
    return;
  }

  console.log('✓ Style guide HTML passes html-validate');
  console.log('✓ Generated, base, all discovered component, and style guide CSS parse successfully');
}

if (require.main === module) main().catch((error) => {
  console.error(`Sanity check failed: ${error.message}`);
  process.exitCode = 1;
});

module.exports = { collectCssPaths, findComponentImportErrors, runSanityChecks };
