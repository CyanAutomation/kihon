#!/usr/bin/env node

const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const esbuild = require('esbuild');

const ROOT = path.join(__dirname, '..');
const SOURCE = path.join(ROOT, 'src', 'ts', 'dialogs.ts');
const OUTPUT = path.join(ROOT, 'src', 'js', 'dialogs.js');
const DECLARATION_CONFIG = path.join(ROOT, 'tsconfig.declarations.json');
const TSC = path.join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc');

async function createRuntimeOutputs() {
  const result = await esbuild.build({
    entryPoints: [SOURCE],
    outfile: OUTPUT,
    bundle: true,
    format: 'iife',
    globalName: 'KihonDialogs',
    target: 'es2022',
    sourcemap: 'external',
    sourcesContent: true,
    footer: {
      js: 'if (typeof module === "object" && module.exports) module.exports = KihonDialogs;'
    },
    write: false,
    logLevel: 'silent'
  });

  return result.outputFiles;
}

async function createDeclarationOutputs() {
  const temporaryOutput = await fs.mkdtemp(path.join(os.tmpdir(), 'kihon-types-'));
  try {
    execFileSync(process.execPath, [TSC, '--project', DECLARATION_CONFIG, '--outDir', temporaryOutput], {
      cwd: ROOT,
      stdio: 'pipe'
    });
    const declaration = await fs.readFile(path.join(temporaryOutput, 'dialogs.d.ts'));
    return [{ path: path.join(ROOT, 'src', 'js', 'dialogs.d.ts'), contents: declaration }];
  } catch (error) {
    const compilerOutput = [error.stdout, error.stderr]
      .filter(Boolean)
      .map((part) => part.toString())
      .join('\n');
    throw new Error(compilerOutput || error.message);
  } finally {
    await fs.rm(temporaryOutput, { recursive: true, force: true });
  }
}

async function getRuntimeOutputs() {
  const [bundleOutputs, declarationOutputs] = await Promise.all([
    createRuntimeOutputs(),
    createDeclarationOutputs()
  ]);
  return [...bundleOutputs, ...declarationOutputs];
}

async function buildRuntime() {
  const outputs = await getRuntimeOutputs();
  for (const output of outputs) {
    await fs.mkdir(path.dirname(output.path), { recursive: true });
    await fs.writeFile(output.path, output.contents);
  }
  console.log('✓ Generated browser/CommonJS dialog helper and TypeScript declarations');
}

if (require.main === module) {
  buildRuntime().catch((error) => {
    console.error(`Runtime build failed: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { getRuntimeOutputs };
