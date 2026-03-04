import { cn } from 'lib/utils';

describe('cn', () => {
  it('deve retornar classes concatenadas', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('deve ignorar valores falsy', () => {
    expect(cn('foo', undefined, null, false, 'bar')).toBe('foo bar');
  });

  it('deve resolver conflitos de classes Tailwind', () => {
    expect(cn('p-4', 'p-8')).toBe('p-8');
  });

  it('deve suportar objetos condicionais', () => {
    expect(cn('foo', { bar: true, baz: false })).toBe('foo bar');
  });
});
