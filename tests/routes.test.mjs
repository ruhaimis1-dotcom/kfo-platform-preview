import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const root = new URL('../dist/', import.meta.url);
const pages = [
  'index.html',
  'review/index.html',
  'login.html',
  'forgot-password.html',
  'reset-password.html',
  'auth-check.html',
  ...['dashboard', 'employees', 'courses', 'assignments', 'reports', 'orders', 'settings']
    .map((page) => `business/${page}.html`),
];

async function exists(url) {
  try {
    await access(url);
    return true;
  } catch {
    return false;
  }
}

test('built preview pages resolve their local assets and clean URL links', async () => {
  const missing = [];
  for (const page of pages) {
    const html = await readFile(new URL(page, root), 'utf8');
    for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
      const ref = match[1];
      if (!ref.startsWith('/') || ref.startsWith('//')) continue;
      const pathname = decodeURIComponent(new URL(ref, 'https://kfo.example').pathname);
      if (pathname === '/') continue;
      const target = new URL(`.${pathname}`, root);
      const resolved = await exists(target)
        || await exists(new URL(`.${pathname}.html`, root))
        || await exists(new URL(`.${pathname}/index.html`, root));
      if (!resolved) missing.push(`${page}: ${ref}`);
    }
  }
  assert.deepEqual(missing, [], 'Unresolved local references in dist');
});
