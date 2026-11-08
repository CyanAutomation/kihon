#!/usr/bin/env node

const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const esbuild = require('esbuild');

const ROOT = path.join(__dirname, '..');
const DECLARATION_CONFIG = path.join(ROOT, 'tsconfig.declarations.json');
const TSC = path.join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc');
const RUNTIMES = [
  { name: 'dialogs', globalName: 'KihonDialogs' },
  { name: 'sidebar', globalName: 'KihonSidebar' }
];

async function createRuntimeOutput(runtime) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, 'src', 'ts', `${runtime.name}.ts`)],
    outfile: path.join(ROOT, 'src', 'js', `${runtime.name}.js`),
    bundle: true,
    format: 'iife',
    globalName: runtime.globalName,
    target: 'es2022',
    sourcemap: 'external',
    sourcesContent: true,
    footer: {
      js: `if (typeof module === "object" && module.exports) module.exports = ${runtime.globalName};`
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
    return await Promise.all(RUNTIMES.map(async (runtime) => ({
      path: path.join(ROOT, 'src', 'js', `${runtime.name}.d.ts`),
      contents: await fs.readFile(path.join(temporaryOutput, `${runtime.name}.d.ts`))
    })));
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
  const [bundleOutputGroups, declarationOutputs] = await Promise.all([
    Promise.all(RUNTIMES.map(createRuntimeOutput)),
    createDeclarationOutputs()
  ]);
  return [...bundleOutputGroups.flat(), ...declarationOutputs];
}

async function buildRuntime() {
  const outputs = await getRuntimeOutputs();
  for (const output of outputs) {
    await fs.mkdir(path.dirname(output.path), { recursive: true });
    await fs.writeFile(output.path, output.contents);
  }
  console.log('✓ Generated browser/CommonJS runtime helpers and TypeScript declarations');
}

if (require.main === module) {
  buildRuntime().catch((error) => {
    console.error(`Runtime build failed: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { getRuntimeOutputs };
