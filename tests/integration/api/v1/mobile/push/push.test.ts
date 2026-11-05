import crypto from 'crypto';
import orchestrator from 'tests/orchestrator';
import database from 'infra/database';

const base = 'http://localhost:3000/api/v1/mobile';
let user: Awaited<ReturnType<typeof orchestrator.createUser>>;
let auth: Awaited<ReturnType<typeof orchestrator.createSessionForUser>>;
let other: Awaited<ReturnType<typeof orchestrator.createUser>>;
let otherAuth: Awaited<ReturnType<typeof orchestrator.createSessionForUser>>;
let installation: string;
beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  user = await orchestrator.createUser();
  auth = await orchestrator.createSessionForUser(user.id);
  other = await orchestrator.createUser();
  otherAuth = await orchestrator.createSessionForUser(other.id);
  installation = crypto.randomUUID();
});
async function request(
  path: string,
  method = 'GET',
  body?: unknown,
  token = auth.token,
) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  expect(response.headers.get('cache-control')).toBe('no-store');
  expect(response.headers.get('set-cookie')).toBeNull();
  return response;
}
const registration = () => ({
  installation_id: installation,
  expo_push_token: 'ExpoPushToken[api-test-installation]',
  platform: 'ios',
});
const routes = [
  ['/notification-preferences', 'GET'],
  ['/push-devices', 'POST'],
  ['/push-devices/00000000-0000-0000-0000-000000000000', 'DELETE'],
];
describe.each(routes)('%s transport', (path, method) => {
  test('rejects cookie-only, invalid and expired sessions', async () => {
    for (const headers of [
      { Cookie: `session_token=${auth.token}` },
      { Authorization: 'Basic invalid', Cookie: `session_token=${auth.token}` },
    ]) {
      const response = await fetch(`${base}${path}`, {
        method,
        headers: headers as Record<string, string>,
      });
      expect(response.status).toBe(401);
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(response.headers.get('www-authenticate')).toBe(
        'Bearer realm="rememberly"',
      );
    }
    const expired = await orchestrator.createSessionForUser(user.id);
    await database.query('UPDATE sessions SET expires_at=now() WHERE id=$1', [
      expired.id,
    ]);
    expect((await request(path, method, undefined, expired.token)).status).toBe(
      401,
    );
  });
  test('rejects selector queries after authentication', async () => {
    expect((await request(`${path}?user_id=${other.id}`, method)).status).toBe(
      400,
    );
  });
  test('rejects unsupported methods with no-store and Allow', async () => {
    const response = await request(path, 'PUT');
    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toBeTruthy();
  });
});
test('preference default is off; PATCH accepts only push_enabled and preserves fixed time fields', async () => {
  expect(await (await request('/notification-preferences')).json()).toEqual({
    push_enabled: false,
    time_zone: 'America/Sao_Paulo',
    daily_time: '09:00',
  });
  for (const body of [
    {},
    { push_enabled: 'true' },
    { push_enabled: true, daily_time: '10:00' },
    null,
  ])
    expect(
      (await request('/notification-preferences', 'PATCH', body)).status,
    ).toBe(400);
  const response = await request('/notification-preferences', 'PATCH', {
    push_enabled: true,
  });
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({
    push_enabled: true,
    time_zone: 'America/Sao_Paulo',
    daily_time: '09:00',
  });
  expect(
    (
      await (
        await request(
          '/notification-preferences',
          'GET',
          undefined,
          otherAuth.token,
        )
      ).json()
    ).push_enabled,
  ).toBe(false);
});
test('device registration validates its exact schema and never returns the token', async () => {
  for (const body of [
    { ...registration(), installation_id: 'invalid' },
    { ...registration(), expo_push_token: 'not-an-expo-token' },
    { ...registration(), platform: 'web' },
    { ...registration(), user_id: other.id },
  ])
    expect((await request('/push-devices', 'POST', body)).status).toBe(400);
  const response = await request('/push-devices', 'POST', registration());
  expect(response.status).toBe(204);
  expect(await response.text()).toBe('');
  expect((await request('/push-devices', 'POST', registration())).status).toBe(
    204,
  );
  const devices = (
    await database.query('SELECT user_id,session_id FROM push_devices')
  ).rows;
  expect(devices).toEqual([{ user_id: user.id, session_id: auth.id }]);
});
test('device deletion is idempotent, user scoped, and accepts only UUID paths', async () => {
  expect(
    (
      await request(
        `/push-devices/${installation}`,
        'DELETE',
        undefined,
        otherAuth.token,
      )
    ).status,
  ).toBe(204);
  expect((await database.query('SELECT id FROM push_devices')).rowCount).toBe(
    1,
  );
  expect((await request('/push-devices/invalid', 'DELETE')).status).toBe(400);
  expect(
    (await request(`/push-devices/${installation}`, 'DELETE')).status,
  ).toBe(204);
  expect(
    (await request(`/push-devices/${installation}`, 'DELETE')).status,
  ).toBe(204);
  expect((await database.query('SELECT id FROM push_devices')).rowCount).toBe(
    0,
  );
});
test('a web cookie cannot change which account owns a Bearer registration', async () => {
  const response = await fetch(`${base}/push-devices`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${auth.token}`,
      Cookie: `session_token=${otherAuth.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(registration()),
  });
  expect(response.status).toBe(204);
  expect(
    (await database.query('SELECT user_id FROM push_devices')).rows[0].user_id,
  ).toBe(user.id);
});
test('cron route rejects public/session credentials without invoking the provider', async () => {
  const response = await fetch(
    'http://localhost:3000/api/v1/notifications/push',
    { headers: { Authorization: `Bearer ${auth.token}` } },
  );
  expect(response.status).toBe(401);
  expect(response.headers.get('cache-control')).toBe('no-store');
});
