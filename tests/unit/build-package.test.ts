import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import postcss from 'postcss';
import { buildJavaScriptOutput, getPackageOutputs, replaceDistribution } from '../../scripts/build-package.ts';

function removeCascadeLayerWrappers(css: string): string {
  const root = postcss.parse(css);
  root.walkAtRules('layer', (layer) => {
    if (!layer.nodes) {
      layer.remove();
      return;
    }
    layer.replaceWith(...layer.nodes);
  });
  return root.toString();
}

test('unsupported JavaScript package formats fail with a clear build error', async () => {
  for (const format of ['umd', 'toString', '__proto__']) {
    await assert.rejects(
      buildJavaScriptOutput({ name: 'dialogs', globalName: 'KihonDialogs' }, format),
      { message: `Unknown build format: ${format}. Expected one of: esm, cjs, browser.` }
    );
  }
});

test('bundled stylesheet preserves the declared cascade layers', async () => {
  const outputs = await getPackageOutputs();
  const stylesheet = outputs.find((output) => output.path.endsWith('styles.css'));
  assert.ok(stylesheet, 'package build produces its stylesheet');

  const css = Buffer.from(stylesheet.contents).toString('utf8');
  assert.match(css, /^@layer kh\.tokens, kh\.base, kh\.components;/);
  assert.match(css, /@layer kh\.tokens\s*\{/);
  assert.match(css, /@layer kh\.components\s*\{/);
  assert.match(css, /@layer kh\.base\s*\{/);
  assert.doesNotMatch(css, /@import\s/);
});

test('legacy compatibility stylesheet preserves bundled rules and declarations without layers', async () => {
  const outputs = await getPackageOutputs();
  const layeredStylesheet = outputs.find((output) => output.path.endsWith('styles.css'));
  const compatibilityStylesheet = outputs.find((output) => output.path.endsWith('styles.compat.css'));
  assert.ok(layeredStylesheet, 'package build produces the layered stylesheet');
  assert.ok(compatibilityStylesheet, 'package build produces an unlayered compatibility stylesheet');

  const layeredCss = Buffer.from(layeredStylesheet.contents).toString('utf8');
  const compatibilityCss = Buffer.from(compatibilityStylesheet.contents).toString('utf8');
  assert.equal(compatibilityCss, removeCascadeLayerWrappers(layeredCss));
  assert.doesNotMatch(compatibilityCss, /@layer\s/);
});

test('package distribution replacement atomically replaces old files and cleans its temporary directory', async () => {
  const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'kihon-package-replacement-test-'));
  const distribution = path.join(temporaryRoot, 'dist');
  await fs.mkdir(distribution);
  await fs.writeFile(path.join(distribution, 'stale.txt'), 'old');

  try {
    await replaceDistribution([
      { path: path.join(distribution, 'esm', 'dialogs.mjs'), contents: Buffer.from('export {};') },
      { path: path.join(distribution, 'styles.css'), contents: Buffer.from('body {}') }
    ], distribution, temporaryRoot);

    assert.deepEqual((await fs.readdir(distribution)).sort(), ['esm', 'styles.css']);
    assert.equal(await fs.readFile(path.join(distribution, 'esm', 'dialogs.mjs'), 'utf8'), 'export {};');
    assert.deepEqual(await fs.readdir(temporaryRoot), ['dist']);
  } finally {
    await fs.rm(temporaryRoot, { recursive: true, force: true });
  }
});
