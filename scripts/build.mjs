import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { build } from 'esbuild';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'dist');
await mkdir(join(out, 'assets'), { recursive: true });
for (const name of ['index.html', 'hero-industrial-v2.png', 'home-preview.png', 'logo-approved.png', 'screens-preview.png']) {
  await cp(join(root, name), join(out, name));
}
await cp(join(root, 'upload'), join(out, 'upload'), { recursive: true });
await cp(join(root, 'auth', 'auth.css'), join(out, 'assets', 'auth.css'));
await mkdir(join(out, 'assets', 'fonts'), { recursive: true });
const fontFaces = [];
for (const [family, weights, subsets] of [
  ['ibm-plex-sans-arabic', [400, 500, 600, 700], ['arabic', 'latin']],
  ['inter', [400, 600, 700], ['latin']],
]) {
  for (const weight of weights) {
    const css = await readFile(join(root, 'node_modules', '@fontsource', family, `${weight}.css`), 'utf8');
    for (const subset of subsets) {
      const filename = `${family}-${subset}-${weight}-normal`;
      const match = css.match(new RegExp(`/\\* ${filename} \\*/\\s*(@font-face \\{[^}]+\\})`));
      if (!match) throw new Error(`Missing font face: ${filename}`);
      fontFaces.push(match[1]
        .replaceAll('./files/', '/assets/fonts/')
        .replace(/, url\([^)]*\.woff\) format\('woff'\)/, ''));
      await cp(join(root, 'node_modules', '@fontsource', family, 'files', `${filename}.woff2`),
        join(out, 'assets', 'fonts', `${filename}.woff2`));
    }
  }
}
await writeFile(join(out, 'assets', 'fonts.css'), fontFaces.join('\n\n'));
for (const name of ['login', 'forgot-password', 'reset-password']) {
  await cp(join(root, 'auth', `${name}.html`), join(out, `${name}.html`));
}
await build({
  entryPoints: [join(root, 'auth', 'auth.js')],
  bundle: true,
  minify: true,
  format: 'esm',
  target: ['es2020'],
  outfile: join(out, 'assets', 'auth.js'),
});
