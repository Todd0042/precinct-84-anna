import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const VENDOR_DIR = path.join(PROJECT_ROOT, 'bundle', 'vendor');
const CSS_SRC = path.join(PROJECT_ROOT, 'node_modules', '@xterm', 'xterm', 'css', 'xterm.css');

async function buildVendor() {
  fs.mkdirSync(VENDOR_DIR, { recursive: true });

  const jsOut = path.join(VENDOR_DIR, 'xterm.bundle.js');
  const cssOut = path.join(VENDOR_DIR, 'xterm.css');

  await esbuild.build({
    stdin: {
      contents: [
        "export { Terminal } from '@xterm/xterm';",
        "export { FitAddon } from '@xterm/addon-fit';",
      ].join('\n'),
      resolveDir: PROJECT_ROOT,
      loader: 'js',
    },
    bundle: true,
    minify: true,
    format: 'esm',
    platform: 'browser',
    target: ['es2020'],
    outfile: jsOut,
  });

  await esbuild.build({
    entryPoints: [CSS_SRC],
    bundle: true,
    minify: true,
    outfile: cssOut,
  });

  for (const file of [jsOut, cssOut]) {
    const content = fs.readFileSync(file, 'utf8');
    const lineCount = content.split('\n').length;
    if (lineCount >= 100) {
      throw new Error(`Expected minified vendor file ${file} to be < 100 lines, got ${lineCount}`);
    }
    const kb = (Buffer.byteLength(content, 'utf8') / 1024).toFixed(1);
    console.log(`Built ${path.relative(PROJECT_ROOT, file)} (${kb} KB, ${lineCount} lines)`);
  }
}

buildVendor().catch((err) => {
  console.error('Failed to vendor xterm.js:', err);
  process.exit(1);
});
