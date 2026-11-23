#!/usr/bin/env node

import * as fs from 'node:fs';
import * as path from 'node:path';
import { generateTokensCss } from './build-tokens.ts';
import { getRuntimeOutputs } from './build-runtime.ts';
import { getPackageOutputs } from './build-package.ts';
import packageMetadata from '../package.json';

const ROOT = path.join(__dirname, '..');
const outputPath = path.join(ROOT, 'src', 'css', 'tokens.css');

export type GeneratedOutputState = 'current' | 'missing' | 'stale';

export function classifyGeneratedOutput(actual: Uint8Array | null, expected: Uint8Array): GeneratedOutputState {
  if (actual === null) return 'missing';
  return Buffer.from(actual).equals(Buffer.from(expected)) ? 'current' : 'stale';
}

interface OutputMessages {
  current: string;
  missing: string;
  stale: string;
}

function checkOutput(filePath: string, expected: Uint8Array, messages: OutputMessages): boolean {
  const actual = fs.existsSync(filePath) ? fs.readFileSync(filePath) : null;
  const state = classifyGeneratedOutput(actual, expected);
  if (state === 'current') {
    console.log(`✓ ${messages.current}`);
    return false;
  }
  console.error(state === 'missing' ? messages.missing : messages.stale);
  return true;
}

function listFiles(directory: string, prefix = ''): string[] {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relative = path.join(prefix, entry.name);
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(absolute, relative) : [relative];
  });
}

function checkTokenCss(): boolean {
  return checkOutput(outputPath, Buffer.from(generateTokensCss()), {
    current: 'src/css/tokens.css matches the token source',
    missing: 'Generated CSS is missing. Run: npm run build',
    stale: 'src/css/tokens.css is stale. Run: npm run build and commit the generated output.'
  });
}

async function checkRuntimeOutputs(): Promise<boolean> {
  let failed = false;
  const runtimeOutputs = await getRuntimeOutputs();
  for (const output of runtimeOutputs) {
    const relativePath = path.relative(path.join(__dirname, '..'), output.path);
    if (checkOutput(output.path, output.contents, {
      current: `${relativePath} matches its TypeScript source`,
      missing: `${relativePath} is stale or missing. Run: npm run build and commit the generated output.`,
      stale: `${relativePath} is stale or missing. Run: npm run build and commit the generated output.`
    })) failed = true;
  }
  return failed;
}

function collectExportTargets(entry: unknown, targets: string[] = []): string[] {
  if (typeof entry === 'string') targets.push(entry);
  else if (entry && typeof entry === 'object') Object.values(entry).forEach((child) => collectExportTargets(child, targets));
  return targets;
}

function checkPackageExportTargets(exportTargets: string[]): boolean {
  let failed = false;
  for (const target of exportTargets) {
    if (!target.startsWith('./dist/')) {
      console.error(`Package export ${target} must point inside dist/.`);
      failed = true;
    } else if (!fs.existsSync(path.join(ROOT, target))) {
      console.error(`Package export target ${target} is missing. Run: npm run build.`);
      failed = true;
    }
  }
  return failed;
}

export function findUnexpectedPackageFiles(actualPackageFiles: string[], expectedPackageFiles: Iterable<string>): string[] {
  const expected = new Set(expectedPackageFiles);
  return actualPackageFiles.filter((relativePath) => !expected.has(relativePath));
}

function checkExpectedPackageOutputs(packageOutputs: Awaited<ReturnType<typeof getPackageOutputs>>): boolean {
  let failed = false;
  for (const output of packageOutputs) {
    const relativePath = path.relative(ROOT, output.path);
    if (checkOutput(output.path, output.contents, {
      current: `${relativePath} matches its package source`,
      missing: `${relativePath} is stale or missing. Run: npm run build and regenerate dist/.`,
      stale: `${relativePath} is stale or missing. Run: npm run build and regenerate dist/.`
    })) failed = true;
  }

  return failed;
}

function checkUnexpectedPackageOutputs(expectedPackageFiles: Iterable<string>): boolean {
  const actualPackageFiles = listFiles(path.join(ROOT, 'dist'))
    .map((relativePath: string) => path.join('dist', relativePath));
  const unexpectedFiles = findUnexpectedPackageFiles(actualPackageFiles, expectedPackageFiles);
  unexpectedFiles.forEach((relativePath) => {
    console.error(`${relativePath} is an unexpected package artifact. Run: npm run build to replace dist/.`);
  });
  return unexpectedFiles.length > 0;
}

async function checkPackageOutputs(): Promise<boolean> {
  const packageOutputs = await getPackageOutputs();
  const expectedPackageFiles = packageOutputs.map((output) => path.relative(ROOT, output.path));
  const failed = checkExpectedPackageOutputs(packageOutputs);
  const unexpected = checkUnexpectedPackageOutputs(expectedPackageFiles);

  const exportTargets = Object.values(packageMetadata.exports || {})
    .flatMap((entry) => collectExportTargets(entry));
  return checkPackageExportTargets(exportTargets) || unexpected || failed;
}

async function main(): Promise<void> {
  let failed = checkTokenCss();
  if (await checkRuntimeOutputs()) failed = true;
  if (await checkPackageOutputs()) failed = true;
  if (failed) process.exitCode = 1;
}

if (require.main === module) {
  main().catch((error: unknown) => {
    console.error(`Generated-file check failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
