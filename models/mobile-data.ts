import { COMMEMORATIVE_DATES } from '@/lib/commemorative-dates';
import {
  MOBILE_TIME_ZONE,
  annualOccurrence,
  commemorativeOccurrence,
  compareStable,
  dateOnly,
  referenceDay,
} from '@/lib/mobile-calendar';
import type { EventType } from '@/lib/types';
import database from 'infra/database';
import event from 'models/event';
import groupMember from 'models/group-member';

interface PersonalEvent {
  id: string;
  title: string;
  type: EventType;
  custom_type: string | null;
  event_day: number;
  event_month: number;
  reminder_days_before: number;
}

async function agenda(userId: string) {
  const today = referenceDay();
  const [personal, birthdays] = await Promise.all([
    event.findAllByUserId(userId) as Promise<PersonalEvent[]>,
    groupMember.findAllBirthdaysForUser(userId),
  ]);
  const items = [
    ...personal.map((row) => ({
      id: `event:${row.id}`,
      source: { kind: 'personal_event', event_id: row.id },
      title: row.title,
      type: row.type,
      custom_type: row.type === 'custom' ? row.custom_type : null,
      event_day: row.event_day,
      event_month: row.event_month,
      reminder_days_before: row.reminder_days_before ?? 0,
      ...annualOccurrence(row.event_day, row.event_month, today),
      can_edit: true,
    })),
    ...birthdays.map((row) => ({
      id: `group-birthday:${row.user_id}`,
      source: {
        kind: 'group_birthday',
        user_id: row.user_id,
        group_name: row.group_name,
        group_count: row.group_count,
      },
      title: row.title,
      type: 'birthday',
      custom_type: null,
      event_day: row.event_day,
      event_month: row.event_month,
      reminder_days_before: null,
      ...annualOccurrence(row.event_day, row.event_month, today),
      can_edit: false,
    })),
  ].sort(
    (a, b) =>
      compareStable(a.next_date, b.next_date) || compareStable(a.id, b.id),
  );
  return { today: dateOnly(today), time_zone: MOBILE_TIME_ZONE, items };
}

async function commemorativeDates(userId: string) {
  const today = referenceDay();
  const result = await database.query(
    'SELECT date_key FROM commemorative_subscriptions WHERE user_id = $1',
    [userId],
  );
  const enabled = new Set(
    result.rows.map((row: { date_key: string }) => row.date_key),
  );
  const items = COMMEMORATIVE_DATES.map((def) => {
    const next = commemorativeOccurrence(def, today);
    return {
      key: def.key,
      label: def.label,
      emoji: def.emoji,
      enabled: enabled.has(def.key),
      next_date: next.next_date,
      days_until: next.days_until,
    };
  }).sort(
    (a, b) =>
      compareStable(a.next_date, b.next_date) || compareStable(a.key, b.key),
  );
  return { today: dateOnly(today), time_zone: MOBILE_TIME_ZONE, items };
}

export default { agenda, commemorativeDates };
