import type { NextApiRequest } from 'next';
import { loginSourceIp } from 'models/login-rate-limit';

function request(
  headers: NextApiRequest['headers'] = {},
  address = '::ffff:127.0.0.1',
) {
  return { headers, socket: { remoteAddress: address } } as NextApiRequest;
}

test('uses canonical socket IP and ignores client-supplied forwarding headers', () => {
  expect(
    loginSourceIp(
      request({
        'x-forwarded-for': '198.51.100.1',
        'x-vercel-forwarded-for': '198.51.100.2',
      }),
      {},
    ),
  ).toBe('127.0.0.1');
  expect(
    loginSourceIp(request({}, '2001:0db8:0000:0000:0000:0000:0000:0001'), {}),
  ).toBe('2001:db8::1');
});

test('trusts only a valid reserved Vercel header with all runtime markers', () => {
  const environment = {
    VERCEL: '1',
    VERCEL_ENV: 'production',
    VERCEL_REGION: 'iad1',
  };
  expect(
    loginSourceIp(
      request({ 'x-vercel-forwarded-for': '198.51.100.2' }),
      environment,
    ),
  ).toBe('198.51.100.2');
  expect(
    loginSourceIp(request({ 'x-vercel-forwarded-for': '198.51.100.2' }), {
      VERCEL: '1',
    }),
  ).toBe('127.0.0.1');
  for (const value of ['bad', '198.51.100.2, 198.51.100.3', 'fe80::1%en0']) {
    expect(
      loginSourceIp(request({ 'x-vercel-forwarded-for': value }), environment),
    ).toBe('127.0.0.1');
  }
});

test('uses one conservative fallback bucket when source IP is unavailable', () => {
  expect(loginSourceIp(request({}, ''), {})).toBe('unknown-source');
});

test('merges equivalent mapped IPv4 and IPv6 spellings into one source identity', () => {
  for (const address of [
    '192.0.2.1',
    '::ffff:192.0.2.1',
    '::ffff:c000:201',
    '0:0:0:0:0:ffff:c000:0201',
  ]) {
    expect(loginSourceIp(request({}, address), {})).toBe('192.0.2.1');
  }
});
