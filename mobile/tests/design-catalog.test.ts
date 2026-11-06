import assert from 'node:assert/strict';
import test from 'node:test';
import { isDesignCatalogEnabled } from '../src/design-system/availability.ts';

test('design catalog requires both development environment and a development bundle', () => {
  assert.equal(isDesignCatalogEnabled('development', true), true);
  for (const environment of ['staging', 'production', '', 'unknown']) {
    assert.equal(isDesignCatalogEnabled(environment, true), false);
    assert.equal(isDesignCatalogEnabled(environment, false), false);
  }
  assert.equal(isDesignCatalogEnabled('development', false), false);
});
