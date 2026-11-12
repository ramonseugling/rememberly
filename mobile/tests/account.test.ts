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
  assert.deepEqual(form, {
    first_name: 'Alex',
    last_name: '',
    day: '',
    month: '',
    year: '',
  });
  assert.deepEqual(
    profileUpdate(
      { ...form, first_name: '  Alex ', last_name: ' Example ' },
      user,
    ),
    { first_name: 'Alex', last_name: 'Example' },
  );
});

test('profile updates parse numeric input and preserve a missing optional year', () => {
  assert.deepEqual(
    profileUpdate(
      { first_name: 'Alex', last_name: '', day: '09', month: '2', year: '' },
      user,
    ),
    { first_name: 'Alex', last_name: '', birth_day: 9, birth_month: 2 },
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
      /não pode ser removida/,
    );
  }
});

test('profile validates names and birthday ranges without permissive number parsing', () => {
  for (const first_name of [' ', 'a'.repeat(61)])
    assert.throws(() =>
      profileUpdate({ ...profileForm(user), first_name }, user),
    );
  assert.throws(() =>
    profileUpdate({ ...profileForm(user), last_name: 'a'.repeat(61) }, user),
  );
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
  assert.equal(occasionLabel({ key: 'christmas', label: 'Natal' }), 'Natal');
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
  assert.equal(civilDateLabel('2026-01-01'), '01/01/2026');
  assert.equal(civilDateLabel('2028-02-29'), '29/02/2028');
  assert.equal(daysUntilLabel(0), 'Hoje! 🎉');
  assert.equal(daysUntilLabel(1), 'Em 1 dia');
  assert.equal(daysUntilLabel(51), 'Em 51 dias');
});

test('profile refuses a birth date under 12 and accepts exactly 12', () => {
  const today = new Date(2026, 10, 6);
  const update = (year: string, month: string, day: string) =>
    profileUpdate(
      { first_name: 'Alex', last_name: '', day, month, year },
      user,
      2026,
      today,
    );
  assert.equal(update('2014', '11', '6').birth_year, 2014);
  assert.throws(
    () => update('2014', '11', '7'),
    /É preciso ter 12 anos ou mais para usar o Rememberly\./,
  );
  assert.deepEqual(update('', '11', '7'), {
    first_name: 'Alex',
    last_name: '',
    birth_day: 7,
    birth_month: 11,
  });
});
