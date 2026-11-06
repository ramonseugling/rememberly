import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  profileFieldChange,
  profileHasChanges,
  profileMonths,
} from '../src/features/account/profile-presentation.ts';
import type {
  ProfileForm,
  ProfileUser,
} from '../src/features/account/forms.ts';

const user: ProfileUser = {
  id: 'profile',
  name: 'Ana Silva',
  email: 'ana@example.com',
  birth_day: 31,
  birth_month: 1,
  birth_year: 2000,
};
const form: ProfileForm = {
  name: user.name,
  day: '31',
  month: '1',
  year: '2000',
};

test('profile save eligibility returns to unchanged when edits are reverted', () => {
  assert.equal(profileHasChanges(form, user), false);
  assert.equal(
    profileHasChanges({ ...form, name: '  Ana Silva  ', day: '031' }, user),
    false,
  );
  assert.equal(profileHasChanges({ ...form, name: 'Ana Santos' }, user), true);
  assert.equal(profileHasChanges({ ...form, name: 'Ana Silva' }, user), false);
  assert.equal(profileHasChanges({ ...form, year: '' }, user), true);
  assert.equal(
    profileHasChanges(
      { ...form, day: '', month: '', year: '' },
      { ...user, birth_day: null, birth_month: null, birth_year: null },
    ),
    false,
  );
});

test('profile month changes clamp days like the web including February 29', () => {
  assert.equal(profileFieldChange(form, 'month', '2').day, '29');
  assert.equal(profileFieldChange(form, 'month', '4').day, '30');
  assert.equal(profileFieldChange(form, 'month', '12').day, '31');
  assert.equal(form.day, '31');
  assert.equal(profileMonths[1]?.label, 'Fevereiro');
  assert.equal(profileMonths[11]?.value, '12');
});

test('profile day input rejects nonnumeric and out-of-month values while allowing blank optional input', () => {
  const april = { ...form, day: '30', month: '4' };
  for (const value of ['0', '31', '-1', '2x', '1.5'])
    assert.equal(profileFieldChange(april, 'day', value), april);
  assert.equal(profileFieldChange(april, 'day', '').day, '');
  assert.equal(profileFieldChange(april, 'day', '09').day, '09');
});
