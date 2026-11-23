#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = path.join(__dirname, '..');
const UNIT_TESTS = path.join(ROOT, 'tests', 'unit');
const COVERAGE_DIRECTORY = path.join(ROOT, 'coverage', 'v8');

function getUnitTestFiles(): string[] {
  return fs.readdirSync(UNIT_TESTS)
    .filter((fileName) => fileName.endsWith('.test.ts'))
    .sort()
    .map((fileName) => path.join(UNIT_TESTS, fileName));
}

function runUnitTestsWithCoverage(): number {
  fs.rmSync(COVERAGE_DIRECTORY, { recursive: true, force: true });
  fs.mkdirSync(COVERAGE_DIRECTORY, { recursive: true });

  const result = spawnSync(process.execPath, [
    '--import',
    'tsx',
    '--test',
    ...getUnitTestFiles()
  ], {
    cwd: ROOT,
    env: { ...process.env, NODE_V8_COVERAGE: COVERAGE_DIRECTORY },
    stdio: 'inherit'
  });

  if (result.error) throw result.error;
  return result.status ?? 1;
}

process.exitCode = runUnitTestsWithCoverage();
