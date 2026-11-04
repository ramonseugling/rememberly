import assert from 'node:assert/strict';
import test from 'node:test';
import { parseApiConfiguration } from '../src/config/api-url.ts';

test('development accepts device-reachable HTTP origins and normalizes a trailing slash', () => {
  assert.deepEqual(
    parseApiConfiguration('development', 'http://192.0.2.1:3000/'),
    {
      environment: 'development',
      apiOrigin: 'http://192.0.2.1:3000',
    },
  );
});

test('staging and production require HTTPS without an implicit production default', () => {
  for (const environment of ['staging', 'production']) {
    assert.equal(
      parseApiConfiguration(environment, 'https://api.example.com').apiOrigin,
      'https://api.example.com',
    );
    assert.throws(() =>
      parseApiConfiguration(environment, 'http://api.example.com'),
    );
  }
  assert.throws(() => parseApiConfiguration(undefined, undefined));
  assert.throws(() => parseApiConfiguration('development', undefined));
  assert.throws(() =>
    parseApiConfiguration('preview', 'https://api.example.com'),
  );
});

test('rejects embedded credentials, API paths, query strings, fragments, and unsupported protocols', () => {
  for (const origin of [
    'https://user:secret@example.com',
    'https://api.example.com/api/v1',
    'https://api.example.com?token=secret',
    'https://api.example.com#fragment',
    'file:///tmp/api',
    'not-a-url',
    ' https://api.example.com',
  ]) {
    assert.throws(() => parseApiConfiguration('development', origin));
  }
});
