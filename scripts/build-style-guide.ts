#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import * as esbuild from 'esbuild';

const ROOT = path.resolve(__dirname, '..');
const STYLE_GUIDE = path.join(ROOT, 'style-guide');
const GENERATED = path.join(STYLE_GUIDE, 'generated');
const ENTRY_POINTS = [
  'buttons.ts',
  'dialogs.ts',
  'experience/experience.ts',
  'forms.ts',
  'settings.ts',
  'sidebar.ts',
  'theme.ts'
].map((entry) => path.join(STYLE_GUIDE, entry));

export async function getStyleGuideOutputs(outputDirectory = GENERATED): Promise<esbuild.OutputFile[]> {
  const result = await esbuild.build({
    entryPoints: ENTRY_POINTS,
    outdir: outputDirectory,
    outbase: STYLE_GUIDE,
    bundle: true,
    format: 'iife',
    target: 'es2022',
    write: false,
    logLevel: 'silent'
  });

  return result.outputFiles;
}

export async function buildStyleGuide(outputDirectory = GENERATED): Promise<void> {
  const outputParent = path.dirname(outputDirectory);
  await fs.mkdir(outputParent, { recursive: true });
  const temporaryRoot = await fs.mkdtemp(path.join(outputParent, '.kihon-style-guide-'));
  const temporaryOutput = path.join(temporaryRoot, 'generated');
  const backupOutput = path.join(temporaryRoot, 'previous-generated');
  let backedUp = false;

  try {
    const outputs = await getStyleGuideOutputs(temporaryOutput);
    for (const output of outputs) {
      await fs.mkdir(path.dirname(output.path), { recursive: true });
      await fs.writeFile(output.path, output.contents);
    }

    try {
      await fs.rename(outputDirectory, backupOutput);
      backedUp = true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }

    try {
      await fs.rename(temporaryOutput, outputDirectory);
    } catch (error) {
      if (backedUp) await fs.rename(backupOutput, outputDirectory);
      throw error;
    }
  } finally {
    await fs.rm(temporaryRoot, { recursive: true, force: true });
  }

  console.log(`✓ Generated ${ENTRY_POINTS.length} style-guide browser scripts`);
}

if (require.main === module) {
  buildStyleGuide().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Style-guide build failed: ${message}`);
    process.exitCode = 1;
  });
}
