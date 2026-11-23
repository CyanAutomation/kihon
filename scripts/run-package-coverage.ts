#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = path.join(__dirname, '..');
const PACKAGE_TEST = path.join(ROOT, 'tests', 'package', 'test-package.ts');
const COVERAGE_DIRECTORY = process.env.NODE_V8_COVERAGE || path.join(ROOT, 'coverage', 'v8');

function runPackageTestWithCoverage(): number {
  fs.mkdirSync(COVERAGE_DIRECTORY, { recursive: true });
  const result = spawnSync(process.execPath, ['--import', 'tsx', PACKAGE_TEST], {
    cwd: ROOT,
    env: { ...process.env, NODE_V8_COVERAGE: COVERAGE_DIRECTORY },
    stdio: 'inherit'
  });

  if (result.error) throw result.error;
  return result.status ?? 1;
}

process.exitCode = runPackageTestWithCoverage();
