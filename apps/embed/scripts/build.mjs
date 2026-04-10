import * as esbuild from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'dist');
const outfile = join(outDir, 'embed.min.js');

await mkdir(outDir, { recursive: true });

await esbuild.build({
  entryPoints: [join(root, 'src', 'index.ts')],
  outfile,
  bundle: true,
  minify: true,
  format: 'iife',
  platform: 'browser',
  target: ['es2020'],
  legalComments: 'none',
});

const { gzipSync } = await import('node:zlib');
const { readFile } = await import('node:fs/promises');
const bytes = await readFile(outfile);
const gz = gzipSync(bytes).length;
console.log(`embed.min.js: ${bytes.length} bytes (${gz} bytes gzip)`);
