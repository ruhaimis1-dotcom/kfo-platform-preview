import test from 'node:test';
import assert from 'node:assert/strict';
import { authErrorMessage, passwordIssue, authDiagnostic } from '../auth/validation.mjs';

test('recovery password rejects short or mismatched values', () => {
  assert.match(passwordIssue('short', 'short'), /8/);
  assert.match(passwordIssue('abcdefgh', 'abcd1234'), /غير متطابقتين/);
  assert.equal(passwordIssue('abcdefgh', 'abcdefgh'), null);
});

test('authentication errors do not expose provider internals', () => {
  assert.match(authErrorMessage({ code: 'invalid_credentials' }, 'login'), /كلمة مرور جديدة/);
  assert.match(authErrorMessage({ status: 429 }, 'forgot'), /بعد قليل/);
  assert.match(authErrorMessage({ name: 'AuthRetryableFetchError', status: 0 }, 'login'), /تعذر الاتصال/);
  assert.doesNotMatch(authErrorMessage({ message: 'sensitive internal detail' }, 'forgot'), /sensitive/);
});

test('safe diagnostics distinguish connection, gateway, credential and rate-limit errors', () => {
  assert.equal(authDiagnostic({ name: 'AuthRetryableFetchError', status: 0 }, 'login').category, 'connection');
  for (const status of [502, 503, 504]) assert.equal(authDiagnostic({ name: 'AuthRetryableFetchError', status }, 'login').category, 'service-gateway');
  assert.equal(authDiagnostic({ code: 'invalid_credentials', status: 400 }, 'login').category, 'credentials');
  assert.equal(authDiagnostic({ status: 429 }, 'login').category, 'rate-limit');
  assert.deepEqual(authDiagnostic({ code: 'secret-token', message: 'private password', status: 'secret', url: 'private' }, 'untrusted-action'),
    { action: 'unknown', category: 'unknown', status: null });
});
