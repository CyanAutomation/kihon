#!/usr/bin/env node

import * as fs from 'node:fs';
import * as path from 'node:path';
import postcss from 'postcss';
import type { Root as PostCssRoot } from 'postcss';
import { HtmlValidate } from 'html-validate';

const ROOT = path.join(__dirname, '..');

function collectCssPaths(root = ROOT): string[] {
  const componentsDirectory = path.join(root, 'src', 'css', 'components');
  const experienceStylesheet = path.join(root, 'style-guide', 'experience', 'experience.css');
  const componentPaths = fs.readdirSync(componentsDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && path.extname(entry.name) === '.css')
    .map((entry) => path.join(componentsDirectory, entry.name))
    .sort((left, right) => left < right ? -1 : left > right ? 1 : 0);

  return [
    path.join(root, 'src', 'css', 'tokens.css'),
    path.join(root, 'src', 'css', 'base.css'),
    ...componentPaths,
    path.join(root, 'style-guide', 'styles.css'),
    ...(fs.existsSync(experienceStylesheet) ? [experienceStylesheet] : [])
  ];
}

function collectHtmlPaths(root = ROOT): string[] {
  const styleGuideDirectory = path.join(root, 'style-guide');
  const htmlPaths: string[] = [];
  const visit = (directory: string): void => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(entryPath);
      else if (entry.isFile() && path.extname(entry.name) === '.html') htmlPaths.push(entryPath);
    }
  };

  visit(styleGuideDirectory);
  return htmlPaths.sort((left, right) => left < right ? -1 : left > right ? 1 : 0);
}

function importedPath(params: string): string {
  const value = params.trim();
  const urlMatch = /^url\(\s*(['"]?)(.*?)\1\s*\)(?:\s+layer(?:\([^)]*\))?)?$/i.exec(value);
  if (urlMatch) return urlMatch[2] ?? value;
  const quotedMatch = /^(['"])(.*?)\1$/.exec(value);
  if (quotedMatch) return quotedMatch[2] ?? value;
  return value;
}

function findComponentImportErrors(root: string, baseStylesheet: PostCssRoot, componentPaths: string[]): string[] {
  const errors = [];
  const basePath = path.join(root, 'src', 'css', 'base.css');
  const importedFiles = new Set();

  baseStylesheet.walkAtRules('import', (rule) => {
    const specifier = importedPath(rule.params);
    if (!specifier.startsWith('.')) return;

    const resolved = path.resolve(path.dirname(basePath), specifier);
    importedFiles.add(resolved);
    if (!fs.existsSync(resolved)) {
      errors.push(`${path.relative(root, basePath)}:${rule.source?.start?.line ?? 0} referenced stylesheet does not exist: ${specifier}`);
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

async function runSanityChecks(root = ROOT): Promise<string[]> {
  const errors: string[] = [];
  const htmlPaths = collectHtmlPaths(root);
  const cssPaths = collectCssPaths(root);
  const validator = new HtmlValidate({
    extends: ['html-validate:recommended'],
    // The style guide uses inline declarations to show token values beside examples.
    rules: { 'no-inline-style': 'off' }
  });
  for (const htmlPath of htmlPaths) {
    const htmlResult = await validator.validateFile(htmlPath);
    for (const result of htmlResult.results) {
      for (const message of result.messages) {
        errors.push(`${path.relative(root, result.filePath)}:${message.line}:${message.column} ${message.ruleId}: ${message.message}`);
      }
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
      const cssError = error as { line?: number; column?: number; reason?: string };
      errors.push(`${path.relative(root, filePath)}:${cssError.line}:${cssError.column} CSS parse error: ${cssError.reason}`);
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

  console.log('✓ All style guide HTML pages pass html-validate');
  console.log('✓ Generated, base, discovered component, and style guide CSS parse successfully');
}

if (require.main === module) main().catch((error: unknown) => {
  console.error(`Sanity check failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});

export { collectCssPaths, collectHtmlPaths, findComponentImportErrors, runSanityChecks };
