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
await cp(join(root, 'qa', 'qa.css'), join(out, 'assets', 'qa.css'));
await cp(join(root, 'qa', 'qa.html'), join(out, 'auth-check.html'));
await cp(join(root, 'business', 'business.css'), join(out, 'assets', 'business.css'));
await cp(join(root, 'business', 'business.js'), join(out, 'assets', 'business.js'));
await cp(join(root, 'business', 'employees.css'), join(out, 'assets', 'employees.css'));
await cp(join(root, 'business', 'employees.js'), join(out, 'assets', 'employees.js'));
await cp(join(root, 'business', 'flow.css'), join(out, 'assets', 'flow.css'));
await cp(join(root, 'business', 'flow.js'), join(out, 'assets', 'flow.js'));
await cp(join(root, 'business', 'insights.css'), join(out, 'assets', 'insights.css'));
await cp(join(root, 'business', 'insights.js'), join(out, 'assets', 'insights.js'));
await cp(join(root, 'business', 'settings.css'), join(out, 'assets', 'settings.css'));
await cp(join(root, 'business', 'settings.js'), join(out, 'assets', 'settings.js'));
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
await mkdir(join(out, 'business'), { recursive: true });
await cp(join(root, 'business', 'dashboard.html'), join(out, 'business', 'dashboard.html'));
await cp(join(root, 'business', 'employees.html'), join(out, 'business', 'employees.html'));
await cp(join(root, 'business', 'courses.html'), join(out, 'business', 'courses.html'));
await cp(join(root, 'business', 'assignments.html'), join(out, 'business', 'assignments.html'));
await cp(join(root, 'business', 'reports.html'), join(out, 'business', 'reports.html'));
await cp(join(root, 'business', 'orders.html'), join(out, 'business', 'orders.html'));
await cp(join(root, 'business', 'settings.html'), join(out, 'business', 'settings.html'));
await cp(join(root, 'review'), join(out, 'review'), { recursive: true });
await cp(join(root, 'review', 'index.html'), join(out, 'review.html'));
await build({
  entryPoints: [join(root, 'auth', 'auth.js')],
  bundle: true,
  minify: true,
  format: 'esm',
  target: ['es2020'],
  outfile: join(out, 'assets', 'auth.js'),
});
await build({
  entryPoints: [join(root, 'qa', 'qa.js')],
  bundle: true, minify: true, format: 'esm', target: ['es2020'],
  outfile: join(out, 'assets', 'qa.js'),
});
