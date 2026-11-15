import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { buildStyleGuide, getStyleGuideOutputs } from '../../scripts/build-style-guide.ts';

test('style-guide TypeScript sources compile to browser JavaScript with their directory layout', async () => {
  const outputDirectory = await mkdtemp(path.join(os.tmpdir(), 'kihon-style-guide-test-'));

  try {
    const outputs = await getStyleGuideOutputs(outputDirectory);
    const relativePaths = outputs
      .map((output) => path.relative(outputDirectory, output.path))
      .sort();

    assert.deepEqual(relativePaths, [
      'buttons.js',
      'dialogs.js',
      'experience/experience.js',
      'forms.js',
      'settings.js',
      'sidebar.js',
      'theme.js'
    ]);
    for (const output of outputs) {
      const contents = Buffer.from(output.contents).toString('utf8');
      assert.doesNotMatch(contents, /\b(?:interface|type)\s+\w+/);
      assert.doesNotMatch(contents, /^\s*(?:import|export)\s/m);
    }
  } finally {
    await rm(outputDirectory, { recursive: true, force: true });
  }
});

test('style-guide build replaces its destination from a same-filesystem staging directory', async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), 'kihon-style-guide-build-test-'));
  const outputDirectory = path.join(temporaryRoot, 'generated');
  await mkdir(outputDirectory);
  await writeFile(path.join(outputDirectory, 'stale.js'), 'stale');

  try {
    await buildStyleGuide(outputDirectory);

    assert.deepEqual((await readdir(outputDirectory)).sort(), [
      'buttons.js',
      'dialogs.js',
      'experience',
      'forms.js',
      'settings.js',
      'sidebar.js',
      'theme.js'
    ]);
    assert.deepEqual(await readdir(path.join(outputDirectory, 'experience')), ['experience.js']);
    assert.equal((await readFile(path.join(outputDirectory, 'dialogs.js'), 'utf8')).includes('KihonDialogs'), true);
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});
