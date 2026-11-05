import assert from 'node:assert/strict';
import test from 'node:test';
import {
  civilDateLabel,
  daysUntilLabel,
  occasionLabel,
  profileForm,
  profileUpdate,
  type ProfileUser,
} from '../src/features/account/forms.ts';

const user: ProfileUser = {
  id: 'a',
  name: 'Alex',
  email: 'alex@example.com',
  birth_day: null,
  birth_month: null,
  birth_year: null,
};

test('missing birthday fields stay empty and are omitted from profile writes', () => {
  const form = profileForm(user);
  assert.deepEqual(form, { name: 'Alex', day: '', month: '', year: '' });
  assert.deepEqual(profileUpdate({ ...form, name: '  Alex Example  ' }, user), {
    name: 'Alex Example',
  });
});

test('profile updates parse numeric input and preserve a missing optional year', () => {
  assert.deepEqual(
    profileUpdate({ name: 'Alex', day: '09', month: '2', year: '' }, user),
    { name: 'Alex', birth_day: 9, birth_month: 2 },
  );
});

test('existing birthday values cannot silently be cleared through COALESCE writes', () => {
  for (const [field, key] of [
    ['day', 'birth_day'],
    ['month', 'birth_month'],
    ['year', 'birth_year'],
  ] as const) {
    const existing = { ...user, [key]: field === 'year' ? 2000 : 1 };
    assert.throws(
      () => profileUpdate({ ...profileForm(existing), [field]: '' }, existing),
      /cannot be removed/,
    );
  }
});

test('profile validates names and birthday ranges without permissive number parsing', () => {
  for (const name of [' ', 'a', 'a'.repeat(101)])
    assert.throws(() => profileUpdate({ ...profileForm(user), name }, user));
  for (const [field, values] of [
    ['day', ['0', '32', '1.5', '2x', '-1']],
    ['month', ['0', '13']],
    ['year', ['1899', '2027']],
  ] as const) {
    for (const value of values)
      assert.throws(() =>
        profileUpdate({ ...profileForm(user), [field]: value }, user, 2026),
      );
  }
});

test('catalog localization retains unknown labels and does not use inherited object keys', () => {
  assert.equal(
    occasionLabel({ key: 'christmas', label: 'Natal' }),
    'Christmas',
  );
  assert.equal(
    occasionLabel({ key: 'new_day', label: 'Future Day' }),
    'Future Day',
  );
  assert.equal(
    occasionLabel({ key: 'constructor', label: 'Custom Day' }),
    'Custom Day',
  );
  assert.equal(occasionLabel({ key: 'unknown', label: '' }), 'unknown');
});

test('civil dates render their exact calendar components without timezone conversion', () => {
  assert.equal(civilDateLabel('2026-01-01'), 'January 1, 2026');
  assert.equal(civilDateLabel('2028-02-29'), 'February 29, 2028');
  assert.equal(daysUntilLabel(0), 'Today');
  assert.equal(daysUntilLabel(1), 'Tomorrow');
  assert.equal(daysUntilLabel(51), 'In 51 days');
});
