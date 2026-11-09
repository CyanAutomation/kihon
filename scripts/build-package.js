#!/usr/bin/env node

const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const esbuild = require('esbuild');
const { RUNTIMES } = require('./build-runtime');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const DECLARATION_CONFIG = path.join(ROOT, 'tsconfig.declarations.json');
const TSC = path.join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc');
const CSS_ENTRY = path.join(ROOT, 'src', 'css', 'base.css');
const JAVASCRIPT_FORMATS = {
  esm: { directory: 'esm', extension: '.mjs', format: 'esm' },
  cjs: { directory: 'cjs', extension: '.cjs', format: 'cjs' },
  browser: { directory: 'browser', extension: '.global.js', format: 'iife' }
};

function relativeOutputPath(outputPath) {
  const relative = path.relative(DIST, outputPath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Package output must be inside dist/: ${outputPath}`);
  }
  return relative;
}

async function buildJavaScriptOutput(runtime, format) {
  const entryPoint = path.join(ROOT, 'src', 'ts', `${runtime.name}.ts`);
  const formatOptions = Object.hasOwn(JAVASCRIPT_FORMATS, format) ? JAVASCRIPT_FORMATS[format] : null;
  if (!formatOptions) {
    throw new Error(`Unknown build format: ${format}. Expected one of: esm, cjs, browser.`);
  }

  const outfile = path.join(DIST, formatOptions.directory, `${runtime.name}${formatOptions.extension}`);
  const result = await esbuild.build({
    entryPoints: [entryPoint],
    outfile,
    bundle: true,
    format: formatOptions.format,
    ...(format === 'browser' ? {
      globalName: runtime.globalName,
      footer: {
        js: `if (typeof module === "object" && module.exports) module.exports = ${runtime.globalName};`
      }
    } : {}),
    target: 'es2022',
    write: false,
    logLevel: 'silent'
  });

  if (result.outputFiles.length !== 1) {
    throw new Error(`Expected one ${format} output for ${runtime.name}, found ${result.outputFiles.length}.`);
  }
  return result.outputFiles.map((output) => ({ path: output.path, contents: output.contents }));
}

async function buildDeclarations() {
  const temporaryOutput = await fs.mkdtemp(path.join(os.tmpdir(), 'kihon-package-types-'));
  try {
    execFileSync(process.execPath, [TSC, '--project', DECLARATION_CONFIG, '--outDir', temporaryOutput], {
      cwd: ROOT,
      stdio: 'pipe'
    });

    const outputs = [];
    for (const runtime of RUNTIMES) {
      const declaration = await fs.readFile(path.join(temporaryOutput, `${runtime.name}.d.ts`));
      const text = declaration.toString('utf8');
      if (!/^export\s/m.test(text)) {
        throw new Error(`Generated declarations for ${runtime.name} do not expose an ES module API.`);
      }
      if (/from\s+['"](?:\.\.?\/|src\/)/.test(text)) {
        throw new Error(`Generated declarations for ${runtime.name} reference files outside the package API.`);
      }
      outputs.push(
        { path: path.join(DIST, 'types', `${runtime.name}.d.mts`), contents: declaration },
        { path: path.join(DIST, 'types', `${runtime.name}.d.cts`), contents: declaration }
      );
    }
    return outputs;
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

async function getPackageOutputs() {
  const outputs = [];
  for (const runtime of RUNTIMES) {
    for (const format of ['esm', 'cjs', 'browser']) {
      outputs.push(...await buildJavaScriptOutput(runtime, format));
    }
  }

  const cssResult = await esbuild.build({
    entryPoints: [CSS_ENTRY],
    outfile: path.join(DIST, 'styles.css'),
    bundle: true,
    minify: false,
    write: false,
    logLevel: 'silent'
  });
  if (cssResult.outputFiles.length !== 1) {
    throw new Error(`Expected one bundled stylesheet, found ${cssResult.outputFiles.length}.`);
  }
  outputs.push({ path: cssResult.outputFiles[0].path, contents: cssResult.outputFiles[0].contents });
  outputs.push(...await buildDeclarations());

  const seen = new Set();
  for (const output of outputs) {
    const relativePath = relativeOutputPath(output.path);
    if (seen.has(relativePath)) throw new Error(`Duplicate package output: ${relativePath}`);
    seen.add(relativePath);
  }
  return outputs;
}

async function replaceDistribution(outputs) {
  const temporaryRoot = await fs.mkdtemp(path.join(ROOT, '.kihon-dist-build-'));
  const temporaryDist = path.join(temporaryRoot, 'dist');
  const backupDist = path.join(temporaryRoot, 'previous-dist');
  let backedUp = false;
  try {
    for (const output of outputs) {
      const destination = path.join(temporaryDist, relativeOutputPath(output.path));
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.writeFile(destination, output.contents);
    }

    try {
      await fs.rename(DIST, backupDist);
      backedUp = true;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }

    try {
      await fs.rename(temporaryDist, DIST);
    } catch (error) {
      if (backedUp) await fs.rename(backupDist, DIST);
      throw error;
    }
  } finally {
    await fs.rm(temporaryRoot, { recursive: true, force: true });
  }
}

async function buildPackage() {
  const outputs = await getPackageOutputs();
  await replaceDistribution(outputs);
  console.log(`✓ Generated ${outputs.length} package files in dist/`);
}

if (require.main === module) {
  buildPackage().catch((error) => {
    console.error(`Package build failed: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { buildJavaScriptOutput, buildPackage, getPackageOutputs, relativeOutputPath };
