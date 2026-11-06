#!/usr/bin/env node

/**
 * Basic HTML and CSS sanity checks for Kihon
 * Verifies generated files are well-formed and contain expected content
 */

const fs = require('fs');
const path = require('path');

function checkHTMLValidity() {
  const htmlPath = path.join(__dirname, '..', 'style-guide', 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf-8');

  const checks = [
    {
      name: 'HTML has DOCTYPE',
      pass: html.includes('<!DOCTYPE html>')
    },
    {
      name: 'HTML has main content area',
      pass: html.includes('id="main-content"')
    },
    {
      name: 'CSS imports are present',
      pass: html.includes('href="styles.css"')
    },
    {
      name: 'Theme toggle buttons exist',
      pass: html.match(/data-kh-theme-toggle="(system|light|dark)"/g)?.length === 3
    },
    {
      name: 'Script includes theme switcher',
      pass: html.includes('src="theme.js"')
    },
    {
      name: 'Has language attribute',
      pass: html.includes('lang="en"')
    },
    {
      name: 'Has proper head metadata',
      pass: html.includes('charset="UTF-8"') && html.includes('viewport')
    }
  ];

  return checks;
}

function checkCSSValidity() {
  const tokensCssPath = path.join(__dirname, '..', 'src', 'css', 'tokens.css');
  const baseCssPath = path.join(__dirname, '..', 'src', 'css', 'base.css');
  const sgCssPath = path.join(__dirname, '..', 'style-guide', 'styles.css');

  const tokensCss = fs.readFileSync(tokensCssPath, 'utf-8');
  const baseCss = fs.readFileSync(baseCssPath, 'utf-8');
  const sgCss = fs.readFileSync(sgCssPath, 'utf-8');

  const checks = [
    {
      name: 'tokens.css has :root selector',
      pass: tokensCss.includes(':root {')
    },
    {
      name: 'tokens.css has dark theme media query',
      pass: tokensCss.includes('@media (prefers-color-scheme: dark)')
    },
    {
      name: 'tokens.css has theme overrides',
      pass: tokensCss.includes('[data-kh-theme="light"]') && tokensCss.includes('[data-kh-theme="dark"]')
    },
    {
      name: 'base.css has typography defaults',
      pass: baseCss.includes('h1') && baseCss.includes('body')
    },
    {
      name: 'base.css has form defaults',
      pass: baseCss.includes('input') && baseCss.includes('label')
    },
    {
      name: 'base.css has focus handling',
      pass: baseCss.includes(':focus-visible')
    },
    {
      name: 'base.css has reduced motion support',
      pass: baseCss.includes('prefers-reduced-motion')
    },
    {
      name: 'style guide CSS imports tokens',
      pass: sgCss.includes('@import url(\'../src/css/tokens.css\')')
    }
  ];

  return checks;
}

function checkTokenContent() {
  const tokensDir = path.join(__dirname, '..', 'tokens');
  const primitives = JSON.parse(
    fs.readFileSync(path.join(tokensDir, 'primitives.json'), 'utf-8')
  );
  const light = JSON.parse(
    fs.readFileSync(path.join(tokensDir, 'themes', 'light.json'), 'utf-8')
  );
  const dark = JSON.parse(
    fs.readFileSync(path.join(tokensDir, 'themes', 'dark.json'), 'utf-8')
  );

  const checks = [
    {
      name: 'Primitives have colour palette',
      pass: primitives.colors && Object.keys(primitives.colors).length > 0
    },
    {
      name: 'Primitives have spacing scale',
      pass: primitives.spacing && Object.keys(primitives.spacing).length >= 8
    },
    {
      name: 'Primitives have typography',
      pass: primitives.typography && primitives.typography.size && primitives.typography.weight
    },
    {
      name: 'Light theme has required colours',
      pass: light.color &&
            light.color.background &&
            light.color['text-primary'] &&
            light.color.accent
    },
    {
      name: 'Dark theme has required colours',
      pass: dark.color &&
            dark.color.background &&
            dark.color['text-primary'] &&
            dark.color.accent
    }
  ];

  return checks;
}

function main() {
  console.log('\n========================================');
  console.log('Kihon Sanity Checks');
  console.log('========================================\n');

  const allChecks = [
    { name: 'HTML Validity', checks: checkHTMLValidity() },
    { name: 'CSS Validity', checks: checkCSSValidity() },
    { name: 'Token Content', checks: checkTokenContent() }
  ];

  let allPassed = true;

  for (const group of allChecks) {
    console.log(`${group.name}:`);
    for (const check of group.checks) {
      const icon = check.pass ? '✓' : '✗';
      console.log(`  ${icon} ${check.name}`);
      if (!check.pass) {
        allPassed = false;
      }
    }
    console.log();
  }

  if (allPassed) {
    console.log('✅ All sanity checks passed!\n');
    process.exit(0);
  } else {
    console.log('❌ Some checks failed. Review above.\n');
    process.exit(1);
  }
}

try {
  main();
} catch (err) {
  console.error('Sanity check error:', err.message);
  process.exit(1);
}
