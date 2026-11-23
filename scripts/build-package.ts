#!/usr/bin/env node

import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { execFileSync } from 'node:child_process';
import * as esbuild from 'esbuild';
import postcss from 'postcss';
import { RUNTIMES, type BuildOutput, type RuntimeDefinition } from './build-runtime.ts';

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const DECLARATION_CONFIG = path.join(ROOT, 'tsconfig.declarations.json');
const TSC = path.join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc');
const CSS_ENTRY = path.join(ROOT, 'src', 'css', 'base.css');
const JAVASCRIPT_FORMATS = {
  esm: { directory: 'esm', extension: '.mjs', format: 'esm' },
  cjs: { directory: 'cjs', extension: '.cjs', format: 'cjs' },
  browser: { directory: 'browser', extension: '.global.js', format: 'iife' }
} as const;
type JavaScriptFormat = keyof typeof JAVASCRIPT_FORMATS;

function relativeOutputPath(outputPath: string, distribution = DIST): string {
  const relative = path.relative(distribution, outputPath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Package output must be inside dist/: ${outputPath}`);
  }
  return relative;
}

function unwrapCascadeLayers(css: string): string {
  const root = postcss.parse(css, { from: undefined });
  root.walkAtRules('layer', (rule) => {
    if (!rule.nodes) {
      rule.remove();
      return;
    }

    rule.replaceWith(...rule.nodes);
  });
  return root.toString();
}

async function buildJavaScriptOutput(runtime: RuntimeDefinition, format: string): Promise<BuildOutput[]> {
  const entryPoint = path.join(ROOT, 'src', 'ts', `${runtime.name}.ts`);
  const formatOptions = Object.hasOwn(JAVASCRIPT_FORMATS, format)
    ? JAVASCRIPT_FORMATS[format as JavaScriptFormat]
    : null;
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

  const outputFiles = result.outputFiles;
  if (!outputFiles || outputFiles.length !== 1) {
    throw new Error(`Expected one ${format} output for ${runtime.name}, found ${outputFiles?.length ?? 0}.`);
  }
  return outputFiles.map((output) => ({ path: output.path, contents: output.contents }));
}

async function buildDeclarations(): Promise<BuildOutput[]> {
  const temporaryOutput = await fs.mkdtemp(path.join(os.tmpdir(), 'kihon-package-types-'));
  try {
    execFileSync(process.execPath, [TSC, '--project', DECLARATION_CONFIG, '--outDir', temporaryOutput], {
      cwd: ROOT,
      stdio: 'pipe'
    });

    const outputs: BuildOutput[] = [];
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
    const commandError = error as NodeJS.ErrnoException & { stdout?: Uint8Array; stderr?: Uint8Array };
    const compilerOutput = [commandError.stdout, commandError.stderr]
      .filter((part): part is Uint8Array => part !== undefined)
      .map((part) => part.toString())
      .join('\n');
    throw new Error(compilerOutput || (error instanceof Error ? error.message : String(error)));
  } finally {
    await fs.rm(temporaryOutput, { recursive: true, force: true });
  }
}

async function getPackageOutputs(): Promise<BuildOutput[]> {
  const outputs: BuildOutput[] = [];
  for (const runtime of RUNTIMES) {
    for (const format of ['esm', 'cjs', 'browser'] as const) {
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
  const cssOutput = cssResult.outputFiles[0];
  if (!cssOutput) throw new Error('CSS bundle output is missing.');
  const css = cssOutput.contents;
  outputs.push({ path: path.join(DIST, 'styles.css'), contents: css });
  outputs.push({
    path: path.join(DIST, 'styles.compat.css'),
    contents: Buffer.from(unwrapCascadeLayers(Buffer.from(css).toString('utf8')))
  });
  outputs.push(...await buildDeclarations());

  const seen = new Set();
  for (const output of outputs) {
    const relativePath = relativeOutputPath(output.path);
    if (seen.has(relativePath)) throw new Error(`Duplicate package output: ${relativePath}`);
    seen.add(relativePath);
  }
  return outputs;
}

async function replaceDistribution(outputs: BuildOutput[], distribution = DIST, root = ROOT): Promise<void> {
  const temporaryRoot = await fs.mkdtemp(path.join(root, '.kihon-dist-build-'));
  const temporaryDist = path.join(temporaryRoot, 'dist');
  const backupDist = path.join(temporaryRoot, 'previous-dist');
  let backedUp = false;
  try {
    for (const output of outputs) {
      const destination = path.join(temporaryDist, relativeOutputPath(output.path, distribution));
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.writeFile(destination, output.contents);
    }

    try {
      await fs.rename(distribution, backupDist);
      backedUp = true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }

    try {
      await fs.rename(temporaryDist, distribution);
    } catch (error) {
      if (backedUp) await fs.rename(backupDist, distribution);
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
  buildPackage().catch((error: unknown) => {
    console.error(`Package build failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}

export { buildJavaScriptOutput, buildPackage, getPackageOutputs, relativeOutputPath, replaceDistribution, unwrapCascadeLayers };
