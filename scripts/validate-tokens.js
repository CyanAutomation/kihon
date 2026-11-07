#!/usr/bin/env node

const { loadTokenDocuments, validateTokenDocuments } = require('./token-validation');
const { validateThemeDocuments } = require('./contrast');

function runValidation(documents = loadTokenDocuments()) {
  return [
    ...validateTokenDocuments(documents),
    ...validateThemeDocuments(documents)
  ];
}

function main() {
  const errors = runValidation();
  console.log('\n========================================');
  console.log('Kihon Token Validation Report');
  console.log('========================================\n');

  if (errors.length) {
    console.error('✗ Validation failed:');
    for (const error of errors) console.error(`  - ${error}`);
    process.exitCode = 1;
    return;
  }

  console.log('✓ DTCG 2025.10 schema and typed token values');
  console.log('✓ Alias resolution, including cycle and unresolved-reference checks');
  console.log('✓ Required tokens in light and dark themes');
  console.log('✓ WCAG contrast for approved pairings in both themes');
  console.log('\nAll token checks passed.\n');
}

if (require.main === module) main();

module.exports = { runValidation };
