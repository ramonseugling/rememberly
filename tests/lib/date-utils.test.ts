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

  it('retorna a data real quando DEMO_TODAY não está definido', () => {
    delete process.env.DEMO_TODAY;
    expect(Math.abs(getToday().getTime() - Date.now())).toBeLessThan(1000);
  });

  it('respeita DEMO_TODAY como data local (sem deslocamento de fuso)', () => {
    process.env.DEMO_TODAY = '2026-05-26';
    const today = getToday();
    expect(today.getFullYear()).toBe(2026);
    expect(today.getMonth()).toBe(4); // maio (0-indexed)
    expect(today.getDate()).toBe(26);
  });
});

describe('getBirthdayInfo', () => {
  afterEach(() => {
    delete process.env.DEMO_TODAY;
  });

  it('retorna daysUntil 0 para aniversário hoje', () => {
    process.env.DEMO_TODAY = '2026-05-26';
    expect(getBirthdayInfo(26, 5)).toEqual({ daysUntil: 0, isNextYear: false });
  });

  it('retorna daysUntil 1 para aniversário amanhã', () => {
    process.env.DEMO_TODAY = '2026-05-26';
    expect(getBirthdayInfo(27, 5)).toEqual({ daysUntil: 1, isNextYear: false });
  });

  it('marca isNextYear para aniversário já passado no ano', () => {
    process.env.DEMO_TODAY = '2026-05-26';
    const { daysUntil, isNextYear } = getBirthdayInfo(25, 5);
    expect(isNextYear).toBe(true);
    expect(daysUntil).toBeGreaterThan(360);
  });

  it('retorna null quando não há data de aniversário', () => {
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

  it('inclui o dia da semana correto do próximo aniversário', () => {
    process.env.DEMO_TODAY = '2026-05-26';
    const info = getBirthdayDateInfo(27, 5);
    expect(info.daysUntil).toBe(1);
    expect(info.isNextYear).toBe(false);
    expect(info.weekday).toBe(WEEKDAYS[new Date(2026, 4, 27).getDay()]);
  });

  it('retorna weekday vazio quando não há data', () => {
    expect(getBirthdayDateInfo(null, null)).toEqual({
      daysUntil: null,
      isNextYear: false,
      weekday: '',
    });
  });
});
