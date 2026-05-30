import { cn } from 'lib/utils';

describe('cn', () => {
  it('returns concatenated classes', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('ignores falsy values', () => {
    expect(cn('foo', undefined, null, false, 'bar')).toBe('foo bar');
  });

  it('resolves Tailwind class conflicts', () => {
    expect(cn('p-4', 'p-8')).toBe('p-8');
  });

  it('supports conditional objects', () => {
    expect(cn('foo', { bar: true, baz: false })).toBe('foo bar');
  });
});
