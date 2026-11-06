import assert from 'node:assert/strict';
import test from 'node:test';
import {
  daysLabel,
  editableEventId,
  eventPayload,
  formForEvent,
  occurrenceLabel,
  reminderDays,
} from '../src/features/dates/model.ts';
import type { AgendaItem } from '../src/features/dates/model.ts';

const item: AgendaItem = {
  id: 'event:personal-uuid',
  source: { kind: 'personal_event', event_id: 'personal-uuid' },
  title: 'Annual celebration',
  type: 'custom',
  custom_type: 'Family day',
  event_day: 29,
  event_month: 2,
  reminder_days_before: 7,
  next_date: '2027-03-01',
  days_until: 2,
  is_next_year: true,
  can_edit: true,
};

test('only editable personal sources provide mutation UUIDs, never namespaced row IDs', () => {
  assert.equal(editableEventId(item), 'personal-uuid');
  assert.equal(editableEventId({ ...item, can_edit: false }), null);
  assert.equal(
    editableEventId({
      ...item,
      id: 'group-birthday:member-uuid',
      source: {
        kind: 'group_birthday',
        user_id: 'member-uuid',
        group_name: 'Family',
        group_count: 2,
      },
      can_edit: true,
    }),
    null,
  );
});

test('edit form round trips supported fields, preserving annual February 29 semantics', () => {
  assert.deepEqual(eventPayload(formForEvent(item)), {
    payload: {
      title: 'Annual celebration',
      type: 'custom',
      custom_type: 'Family day',
      event_day: 29,
      event_month: 2,
      reminder_days_before: 7,
    },
    error: null,
  });
});

test('trim text and clear stale custom type when changing to a standard event', () => {
  const result = eventPayload({
    ...formForEvent(item),
    title: ' Birthday ',
    type: 'birthday',
  });
  assert.equal(result.payload?.title, 'Birthday');
  assert.equal(result.payload?.custom_type, null);
  assert.equal(
    eventPayload({ ...formForEvent(item), customType: ' Family ' }).payload
      ?.custom_type,
    'Family',
  );
});

test('new date has no invented title or calendar values and requires input', () => {
  const form = formForEvent();
  assert.equal(form.title, '');
  assert.equal(form.day, '');
  assert.equal(form.month, '');
  assert.ok(eventPayload(form).error);
});

test('validate title and custom-type requirements and server field limits', () => {
  for (const title of ['', '   ', 'a'.repeat(201)]) {
    assert.ok(eventPayload({ ...formForEvent(item), title }).error);
  }
  for (const customType of ['', '   ', 'a'.repeat(101)]) {
    assert.ok(eventPayload({ ...formForEvent(item), customType }).error);
  }
  assert.equal(
    eventPayload({
      ...formForEvent(item),
      title: 'a'.repeat(200),
      customType: 'b'.repeat(100),
    }).error,
    null,
  );
});

test('reject noninteger and out-of-range day/month input before writes', () => {
  for (const day of ['', '0', '32', '1.5', '-1', '1e1', ' 1']) {
    assert.ok(eventPayload({ ...formForEvent(item), day }).error);
  }
  for (const month of ['', '0', '13', '2.5', '-1', ' 2']) {
    assert.ok(eventPayload({ ...formForEvent(item), month }).error);
  }
  assert.equal(
    eventPayload({ ...formForEvent(item), day: '01', month: '12' }).payload
      ?.event_day,
    1,
  );
});

test('only the complete server-supported reminder set can be saved', () => {
  for (const reminder of reminderDays) {
    assert.equal(
      eventPayload({ ...formForEvent(item), reminder }).payload
        ?.reminder_days_before,
      reminder,
    );
  }
  for (const reminder of [-1, 2, 5, 31, 0.5, NaN]) {
    assert.ok(eventPayload({ ...formForEvent(item), reminder }).error);
  }
});

test('display server occurrence date without parsing an instant or shifting timezone', () => {
  assert.equal(occurrenceLabel(item), '01/03/2027 · Em 2 dias');
  assert.equal(
    occurrenceLabel({ ...item, days_until: 0 }),
    '01/03/2027 · Hoje!',
  );
  assert.equal(
    occurrenceLabel({ ...item, days_until: 1 }),
    '01/03/2027 · Amanhã',
  );
});

test('countdown copy follows web week/month boundaries', () => {
  const cases: [number, string][] = [
    [0, 'Hoje! 🎉'],
    [1, 'Amanhã'],
    [7, 'Em 7 dias'],
    [8, 'Em 1 semana'],
    [14, 'Em 2 semanas'],
    [29, 'Em 4 semanas'],
    [30, 'Em 1 mês'],
    [45, 'Em 2 meses'],
    [365, 'Em 12 meses'],
  ];
  for (const [days, expected] of cases) assert.equal(daysLabel(days), expected);
});
