import { getBirthdayDateInfo, getBirthdayInfo, getToday } from 'lib/date-utils';

const WEEKDAYS = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
];

describe('getToday', () => {
  afterEach(() => {
    delete process.env.DEMO_TODAY;
  });

  it('returns the current date in the Brazil timezone when DEMO_TODAY is not set', () => {
    delete process.env.DEMO_TODAY;
    const [year, month, day] = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .format(new Date())
      .split('-')
      .map(Number);
    const today = getToday();
    expect(today.getFullYear()).toBe(year);
    expect(today.getMonth()).toBe(month - 1);
    expect(today.getDate()).toBe(day);
  });

  it('respects DEMO_TODAY as a local date (without timezone offset)', () => {
    process.env.DEMO_TODAY = '2026-05-26';
    const today = getToday();
    expect(today.getFullYear()).toBe(2026);
    expect(today.getMonth()).toBe(4); // May (0-indexed)
    expect(today.getDate()).toBe(26);
  });
});

describe('getBirthdayInfo', () => {
  afterEach(() => {
    delete process.env.DEMO_TODAY;
  });

  it('returns daysUntil 0 for a birthday today', () => {
    process.env.DEMO_TODAY = '2026-05-26';
    expect(getBirthdayInfo(26, 5)).toEqual({ daysUntil: 0, isNextYear: false });
  });

  it('returns daysUntil 1 for a birthday tomorrow', () => {
    process.env.DEMO_TODAY = '2026-05-26';
    expect(getBirthdayInfo(27, 5)).toEqual({ daysUntil: 1, isNextYear: false });
  });

  it('flags isNextYear for a birthday already passed this year', () => {
    process.env.DEMO_TODAY = '2026-05-26';
    const { daysUntil, isNextYear } = getBirthdayInfo(25, 5);
    expect(isNextYear).toBe(true);
    expect(daysUntil).toBeGreaterThan(360);
  });

  it('returns null when there is no birthday date', () => {
    expect(getBirthdayInfo(null, null)).toEqual({
      daysUntil: null,
      isNextYear: false,
    });
  });
});

describe('getBirthdayDateInfo', () => {
  afterEach(() => {
    delete process.env.DEMO_TODAY;
  });

  it('includes the correct weekday of the next birthday', () => {
    process.env.DEMO_TODAY = '2026-05-26';
    const info = getBirthdayDateInfo(27, 5);
    expect(info.daysUntil).toBe(1);
    expect(info.isNextYear).toBe(false);
    expect(info.weekday).toBe(WEEKDAYS[new Date(2026, 4, 27).getDay()]);
  });

  it('returns an empty weekday when there is no date', () => {
    expect(getBirthdayDateInfo(null, null)).toEqual({
      daysUntil: null,
      isNextYear: false,
      weekday: '',
    });
  });
});
