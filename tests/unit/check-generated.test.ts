import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyGeneratedOutput, findUnexpectedPackageFiles } from '../../scripts/check-generated.ts';

test('classifies generated outputs as current, missing, or stale', () => {
  const expected = Buffer.from('expected output');

  assert.equal(classifyGeneratedOutput(Buffer.from('expected output'), expected), 'current');
  assert.equal(classifyGeneratedOutput(null, expected), 'missing');
  assert.equal(classifyGeneratedOutput(Buffer.from('old output'), expected), 'stale');
});

test('finds package artifacts that are not in the expected output list', () => {
  assert.deepEqual(
    findUnexpectedPackageFiles(['dist/extra.js', 'dist/index.js'], ['dist/index.js']),
    ['dist/extra.js']
  );
  assert.deepEqual(findUnexpectedPackageFiles([], ['dist/index.js']), []);
});
