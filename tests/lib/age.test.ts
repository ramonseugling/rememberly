import { isAtLeastAge } from 'lib/age';

const today = new Date(2026, 10, 10);

describe('isAtLeastAge', () => {
  it('allows someone turning 12 today', () => {
    expect(isAtLeastAge({ day: 10, month: 11, year: 2014 }, 12, today)).toBe(
      true,
    );
  });

  it('refuses someone one day short of 12', () => {
    expect(isAtLeastAge({ day: 11, month: 11, year: 2014 }, 12, today)).toBe(
      false,
    );
  });

  it('allows someone who turned 12 yesterday', () => {
    expect(isAtLeastAge({ day: 9, month: 11, year: 2014 }, 12, today)).toBe(
      true,
    );
  });

  it('refuses a child and allows an adult', () => {
    expect(isAtLeastAge({ day: 1, month: 1, year: 2020 }, 12, today)).toBe(
      false,
    );
    expect(isAtLeastAge({ day: 1, month: 1, year: 1990 }, 12, today)).toBe(
      true,
    );
  });

  it('handles the month boundary within the same year', () => {
    expect(isAtLeastAge({ day: 31, month: 10, year: 2014 }, 12, today)).toBe(
      true,
    );
    expect(isAtLeastAge({ day: 1, month: 12, year: 2014 }, 12, today)).toBe(
      false,
    );
  });

  it('counts a Feb 29 birthday as reached on Mar 1 in non-leap years', () => {
    const feb28 = new Date(2026, 1, 28);
    const mar1 = new Date(2026, 2, 1);
    const birth = { day: 29, month: 2, year: 2014 };

    expect(isAtLeastAge(birth, 12, feb28)).toBe(false);
    expect(isAtLeastAge(birth, 12, mar1)).toBe(true);
  });

  it('allows a Feb 29 birthday on the leap day itself', () => {
    expect(
      isAtLeastAge(
        { day: 29, month: 2, year: 2012 },
        12,
        new Date(2024, 1, 29),
      ),
    ).toBe(true);
  });

  it('allows when the birth year is missing or null', () => {
    expect(isAtLeastAge({ day: 10, month: 11 }, 12, today)).toBe(true);
    expect(isAtLeastAge({ day: 10, month: 11, year: null }, 12, today)).toBe(
      true,
    );
  });
});
