import { isValidNextUrl } from 'infra/page-guard';

describe('isValidNextUrl', () => {
  it('accepts valid internal paths', () => {
    expect(isValidNextUrl('/dates')).toBe(true);
    expect(isValidNextUrl('/join-group?code=abc123')).toBe(true);
    expect(isValidNextUrl('/groups')).toBe(true);
  });

  it('rejects URLs that do not start with /', () => {
    expect(isValidNextUrl('https://evil.com')).toBe(false);
    expect(isValidNextUrl('http://evil.com')).toBe(false);
    expect(isValidNextUrl('evil.com/path')).toBe(false);
    expect(isValidNextUrl('')).toBe(false);
  });

  it('rejects URLs that start with // (protocol-relative)', () => {
    expect(isValidNextUrl('//evil.com')).toBe(false);
    expect(isValidNextUrl('//evil.com/path')).toBe(false);
  });

  it('rejects paths to /api/', () => {
    expect(isValidNextUrl('/api/v1/users')).toBe(false);
    expect(isValidNextUrl('/api/v1/sessions')).toBe(false);
  });

  it('rejects URLs longer than 500 characters', () => {
    const longPath = '/' + 'a'.repeat(500);
    expect(isValidNextUrl(longPath)).toBe(false);
  });

  it('rejects non-string values', () => {
    expect(isValidNextUrl(null as unknown as string)).toBe(false);
    expect(isValidNextUrl(undefined as unknown as string)).toBe(false);
    expect(isValidNextUrl(123 as unknown as string)).toBe(false);
  });
});
