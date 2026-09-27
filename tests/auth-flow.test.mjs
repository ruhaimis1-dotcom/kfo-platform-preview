import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { runInNewContext } from 'node:vm';

const bundle = await build({
  entryPoints: ['auth/auth.js'],
  absWorkingDir: new URL('..', import.meta.url).pathname,
  bundle: true,
  write: false,
  format: 'iife',
  plugins: [{
    name: 'mock-supabase',
    setup(api) {
      api.onResolve({ filter: /^@supabase\/supabase-js$/ }, () => ({ path: 'supabase', namespace: 'mock' }));
      api.onLoad({ filter: /.*/, namespace: 'mock' }, () => ({
        contents: 'export const createClient = () => globalThis.__client;',
        loader: 'js',
      }));
    },
  }],
});
const code = bundle.outputFiles[0].text;

function page(kind, auth, href = 'https://preview.example/reset-password') {
  const handlers = {};
  const hidden = new Set(kind === 'reset' ? ['hidden'] : []);
  const form = {
    elements: {
      email: { value: 'person@example.com' },
      password: { value: 'correct-password' },
      confirm: { value: 'correct-password' },
    },
    classList: {
      add: (name) => hidden.add(name),
      remove: (name) => hidden.delete(name),
    },
    querySelector: () => submit,
    addEventListener: (name, handler) => { handlers[name] = handler; },
    reportValidity: () => true,
    reset: () => {},
  };
  const submit = { textContent: 'إرسال', disabled: false };
  const message = { dataset: {}, textContent: '' };
  let route = null;
  const location = new URL(href);
  const context = {
    __client: { auth },
    document: {
      body: { dataset: { page: kind } },
      getElementById: (id) => id === 'auth-form' ? form : message,
    },
    window: { location: { href, origin: location.origin } },
    history: { replaceState: (_state, _title, path) => { route = path; } },
    URL,
    URLSearchParams,
  };
  runInNewContext(code, context);
  return {
    form, message, hidden,
    submit: () => handlers.submit({ preventDefault() {} }),
    route: () => route,
  };
}

test('login submits password credentials and does not enter a mock dashboard', async () => {
  let credentials;
  const ui = page('login', { signInWithPassword: async (value) => {
    credentials = value;
    return { error: null };
  } });
  await ui.submit();
  assert.deepEqual(JSON.parse(JSON.stringify(credentials)), {
    email: 'person@example.com', password: 'correct-password',
  });
  assert.equal(ui.message.dataset.kind, 'success');
  assert.equal(ui.hidden.has('hidden'), true);
  assert.equal(ui.route(), null);
});

test('forgot password sends an origin-specific reset URL', async () => {
  let request;
  const ui = page('forgot', { resetPasswordForEmail: async (...args) => {
    request = args;
    return { error: null };
  } }, 'https://kfo-preview.example/forgot-password');
  await ui.submit();
  assert.equal(request[0], 'person@example.com');
  assert.equal(request[1].redirectTo, 'https://kfo-preview.example/reset-password');
  assert.equal(ui.message.dataset.kind, 'success');
});

test('reset form requires a recovery event and signs out after updating', async () => {
  let authChange, password, signOut;
  const ui = page('reset', {
    onAuthStateChange: (callback) => { authChange = callback; },
    updateUser: async (value) => { password = value.password; return { error: null }; },
    signOut: async (options) => { signOut = options; return { error: null }; },
  });
  authChange('INITIAL_SESSION', { user: { id: 'existing-session' } });
  assert.equal(ui.hidden.has('hidden'), true);
  await ui.submit();
  assert.equal(password, undefined);
  authChange('PASSWORD_RECOVERY', { user: { id: 'recovery' } });
  assert.equal(ui.hidden.has('hidden'), false);
  assert.equal(ui.route(), '/reset-password');
  await ui.submit();
  assert.equal(password, 'correct-password');
  assert.equal(signOut.scope, 'local');
  assert.equal(ui.message.dataset.kind, 'success');
});
