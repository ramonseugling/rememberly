import { spawnSync } from 'child_process';
import { COMMEMORATIVE_DATES } from '@/lib/commemorative-dates';
import {
  annualOccurrence,
  commemorativeOccurrence,
  dateOnly,
} from '@/lib/mobile-calendar';

test.each([
  [30, 10, '2026-10-30', '2026-10-30', 0],
  [1, 1, '2026-12-31', '2027-01-01', 1],
  [29, 2, '2027-02-28', '2027-03-01', 1],
  [29, 2, '2028-02-28', '2028-02-29', 1],
  [31, 2, '2026-02-28', '2026-03-03', 3],
  [1, 1, '2026-01-02', '2027-01-01', 364],
])(
  'annual recurrence %s/%s from %s',
  (day, month, reference, expected, days) => {
    expect(
      annualOccurrence(day, month, new Date(`${reference}T00:00:00Z`)),
    ).toEqual({
      next_date: expected,
      days_until: days,
      is_next_year: expected.slice(0, 4) > reference.slice(0, 4),
    });
  },
);

test('nth-Sunday commemorative definitions roll into the next year after the occurrence', () => {
  const mother = COMMEMORATIVE_DATES.find((def) => def.key === 'mothers_day')!;
  expect(
    commemorativeOccurrence(mother, new Date('2026-05-10T00:00:00Z'))
      .days_until,
  ).toBe(0);
  expect(
    commemorativeOccurrence(mother, new Date('2026-05-11T00:00:00Z')).next_date,
  ).toBe('2027-05-09');
  expect(dateOnly(new Date('2026-12-25T00:00:00Z'))).toBe('2026-12-25');
});

test('calendar results are independent of host timezone, including daylight-saving changes', () => {
  const script = `const { referenceDay, annualOccurrence, dateOnly } = require('./lib/mobile-calendar.ts'); const day = referenceDay(); console.log(JSON.stringify({today:dateOnly(day),next:annualOccurrence(10,3,day)}));`;
  const results = [
    'UTC',
    'America/New_York',
    'Asia/Tokyo',
    'Pacific/Auckland',
  ].map((TZ) => {
    const result = spawnSync(
      process.execPath,
      ['--import', 'tsx', '--eval', script],
      {
        cwd: process.cwd(),
        env: { ...process.env, TZ, DEMO_TODAY: '2026-03-07' },
        encoding: 'utf8',
      },
    );
    expect(result.status).toBe(0);
    return JSON.parse(result.stdout);
  });
  for (const result of results)
    expect(result).toEqual({
      today: '2026-03-07',
      next: { next_date: '2026-03-10', days_until: 3, is_next_year: false },
    });
});
