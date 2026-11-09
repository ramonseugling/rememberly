import assert from 'node:assert/strict';
import test from 'node:test';
import { LEGAL_LINKS } from '../src/features/legal/links.ts';

test('legal links are HTTPS pages on the production site', () => {
  for (const link of Object.values(LEGAL_LINKS)) {
    const url = new URL(link);
    assert.equal(url.protocol, 'https:');
    assert.equal(url.hostname, 'rememberly.com.br');
  }
});
