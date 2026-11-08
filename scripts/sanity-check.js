#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const postcss = require('postcss');
const { HtmlValidate } = require('html-validate');

const ROOT = path.join(__dirname, '..');
const HTML_PATH = path.join(ROOT, 'style-guide', 'index.html');
const CSS_PATHS = [
  path.join(ROOT, 'src', 'css', 'tokens.css'),
  path.join(ROOT, 'src', 'css', 'base.css'),
  path.join(ROOT, 'src', 'css', 'components', 'buttons.css'),
  path.join(ROOT, 'src', 'css', 'components', 'forms.css'),
  path.join(ROOT, 'src', 'css', 'components', 'settings.css'),
  path.join(ROOT, 'src', 'css', 'components', 'dialogs.css'),
  path.join(ROOT, 'src', 'css', 'components', 'app-shell.css'),
  path.join(ROOT, 'style-guide', 'styles.css')
];

async function runSanityChecks() {
  const errors = [];
  const validator = new HtmlValidate({
    extends: ['html-validate:recommended'],
    // The style guide uses inline declarations to show token values beside examples.
    rules: { 'no-inline-style': 'off' }
  });
  const htmlResult = await validator.validateFile(HTML_PATH);
  for (const result of htmlResult.results) {
    for (const message of result.messages) {
      errors.push(`${path.relative(ROOT, result.filePath)}:${message.line}:${message.column} ${message.ruleId}: ${message.message}`);
    }
  }

  for (const filePath of CSS_PATHS) {
    try {
      postcss.parse(fs.readFileSync(filePath, 'utf8'), { from: filePath });
    } catch (error) {
      errors.push(`${path.relative(ROOT, filePath)}:${error.line}:${error.column} CSS parse error: ${error.reason}`);
    }
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
  console.log('✓ Generated, base, component, and style guide CSS parse successfully');
}

if (require.main === module) main().catch((error) => {
  console.error(`Sanity check failed: ${error.message}`);
  process.exitCode = 1;
});

module.exports = { runSanityChecks };
