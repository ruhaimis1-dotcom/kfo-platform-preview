import test from 'node:test';
import assert from 'node:assert/strict';
import { authErrorMessage, passwordIssue } from '../auth/validation.mjs';

test('recovery password rejects short or mismatched values', () => {
  assert.match(passwordIssue('short', 'short'), /8/);
  assert.match(passwordIssue('abcdefgh', 'abcd1234'), /غير متطابقتين/);
  assert.equal(passwordIssue('abcdefgh', 'abcdefgh'), null);
});

test('authentication errors do not expose provider internals', () => {
  assert.match(authErrorMessage({ code: 'invalid_credentials' }, 'login'), /غير صحيحة/);
  assert.match(authErrorMessage({ status: 429 }, 'forgot'), /بعد قليل/);
  assert.doesNotMatch(authErrorMessage({ message: 'sensitive internal detail' }, 'forgot'), /sensitive/);
});
