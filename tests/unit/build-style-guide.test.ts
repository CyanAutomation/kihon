import assert from 'node:assert/strict';
import { access, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
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
      'buttons.js.map',
      'dialogs.js',
      'dialogs.js.map',
      'experience/experience.js',
      'experience/experience.js.map',
      'forms.js',
      'forms.js.map',
      'settings.js',
      'settings.js.map',
      'sidebar.js',
      'sidebar.js.map',
      'theme.js',
      'theme.js.map'
    ]);
    for (const output of outputs.filter((candidate) => candidate.path.endsWith('.js'))) {
      const contents = Buffer.from(output.contents).toString('utf8');
      assert.doesNotMatch(contents, /\b(?:interface|type)\s+\w+/);
      assert.doesNotMatch(contents, /^\s*(?:import|export)\s/m);
    }
    const experienceMap = outputs.find((output) => output.path.endsWith('experience.js.map'));
    assert.ok(experienceMap);
    assert.ok(JSON.parse(Buffer.from(experienceMap.contents).toString('utf8')).sources
      .some((source: string) => source.endsWith('experience.ts')));
  } finally {
    await rm(outputDirectory, { recursive: true, force: true });
  }
});

test('style-guide build replaces stale output with the generated browser scripts', async () => {
  const temporaryRoot = await mkdtemp(path.join(process.cwd(), 'style-guide', '.build-test-'));
  const outputDirectory = path.join(temporaryRoot, 'generated');
  await mkdir(outputDirectory);
  await writeFile(path.join(outputDirectory, 'stale.js'), 'stale');

  try {
    await buildStyleGuide(outputDirectory);

    assert.deepEqual((await readdir(outputDirectory)).sort(), [
      'buttons.js',
      'buttons.js.map',
      'dialogs.js',
      'dialogs.js.map',
      'experience',
      'forms.js',
      'forms.js.map',
      'settings.js',
      'settings.js.map',
      'sidebar.js',
      'sidebar.js.map',
      'theme.js',
      'theme.js.map'
    ]);
    assert.deepEqual((await readdir(path.join(outputDirectory, 'experience'))).sort(), ['experience.js', 'experience.js.map']);
    assert.match(await readFile(path.join(outputDirectory, 'dialogs.js'), 'utf8'), /KihonDialogs/);
    const experienceMap = JSON.parse(await readFile(path.join(outputDirectory, 'experience', 'experience.js.map'), 'utf8'));
    await access(path.resolve(path.dirname(path.join(outputDirectory, 'experience', 'experience.js.map')), experienceMap.sources[0]));
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});
