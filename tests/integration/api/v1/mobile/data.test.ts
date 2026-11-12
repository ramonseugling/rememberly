import crypto from 'crypto';
import orchestrator from 'tests/orchestrator';
import { COMMEMORATIVE_DATES } from '@/lib/commemorative-dates';
import { getToday } from '@/lib/date-utils';
import { dateOnly, referenceDay } from '@/lib/mobile-calendar';
import database from 'infra/database';
import group from 'models/group';
import mobileData from 'models/mobile-data';
import session from 'models/session';

const base = 'http://localhost:3000';
const paths = [
  '/api/v1/mobile/me',
  '/api/v1/mobile/agenda',
  '/api/v1/mobile/commemorative-dates',
];
let user: { id: string; name: string; email: string };
let other: { id: string; name: string; email: string };
let token: string;
let cookie: string;

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  user = await orchestrator.createUser();
  other = await orchestrator.createUser();
  await database.query(
    'UPDATE users SET birth_day = NULL, birth_month = NULL, birth_year = NULL WHERE id = $1',
    [user.id],
  );
  token = (await orchestrator.createSessionForUser(user.id)).token;
  await database.query(
    'UPDATE sessions SET expires_at = NULL WHERE token = $1',
    [token],
  );
  cookie = (await session.createForUser(other)).token;
});

async function request(path: string, options: RequestInit = {}) {
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...options.headers },
  });
  expect(response.headers.get('cache-control')).toBe('no-store');
  expect(response.headers.get('set-cookie')).toBeNull();
  return response;
}

describe.each(paths)('%s transport', (path) => {
  test('accepts persistent and finite Bearer sessions and ignores a conflicting cookie', async () => {
    expect((await request(path)).status).toBe(200);
    expect(
      (await request(path, { headers: { Authorization: `Bearer ${cookie}` } }))
        .status,
    ).toBe(200);
    expect(
      (await request(path, { headers: { Cookie: `session_token=${cookie}` } }))
        .status,
    ).toBe(200);
  });

  test.each(['', 'Basic invalid', `Bearer ${'f'.repeat(96)}`])(
    'rejects invalid credentials %# without cookie fallback',
    async (Authorization) => {
      const response = await request(path, {
        headers: { Authorization, Cookie: `session_token=${cookie}` },
      });
      expect(response.status).toBe(401);
      expect(response.headers.get('www-authenticate')).toBe(
        'Bearer realm="rememberly"',
      );
      expect(await response.json()).toMatchObject({
        name: 'UnauthorizedError',
        status_code: 401,
        message: 'A valid Bearer session is required.',
      });
    },
  );

  test('rejects cookie-only and expired/revoked sessions', async () => {
    const cookieOnly = await fetch(`${base}${path}`, {
      headers: { Cookie: `session_token=${cookie}` },
    });
    expect(cookieOnly.status).toBe(401);
    expect(cookieOnly.headers.get('cache-control')).toBe('no-store');
    const expired = await session.createForUser(user);
    await session.expireByToken(expired.token);
    expect(
      (
        await request(path, {
          headers: { Authorization: `Bearer ${expired.token}` },
        })
      ).status,
    ).toBe(401);
  });

  test('authenticates before rejecting query selectors', async () => {
    const response = await request(`${path}?user_id=${other.id}`);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      name: 'ValidationError',
      message: 'Query parameters are not supported.',
      action: 'Remove query parameters and try again.',
      status_code: 400,
    });
    expect(
      (
        await request(`${path}?today=2026-01-01`, {
          headers: { Authorization: '' },
        })
      ).status,
    ).toBe(401);
  });

  test.each(['POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'])(
    'rejects unsupported %s even with malformed bodies',
    async (method) => {
      const response = await request(path, {
        method,
        ...(method === 'HEAD'
          ? {}
          : { body: '{', headers: { 'Content-Type': 'application/json' } }),
      });
      if (path === paths[0] && method === 'DELETE') {
        expect(response.status).toBe(400);
        expect((await request(path)).status).toBe(200);
        return;
      }
      expect(response.status).toBe(405);
      expect(response.headers.get('allow')).toBe(
        path === paths[0] ? 'GET, DELETE' : 'GET',
      );
      if (method !== 'HEAD')
        expect(await response.json()).toMatchObject({
          name: 'MethodNotAllowedError',
          action: path === paths[0] ? 'Use GET or DELETE.' : 'Use GET.',
        });
    },
  );
});

test('profile returns exact current fields, including null birthday and subsequent existing write', async () => {
  const response = await request(paths[0], {
    headers: { Cookie: `session_token=${cookie}` },
  });
  expect(await response.json()).toEqual({
    user: {
      id: user.id,
      name: user.name,
      first_name: null,
      last_name: null,
      email: user.email,
      birth_day: null,
      birth_month: null,
      birth_year: null,
      avatar_url: null,
      has_password: false,
    },
  });
  const update = await fetch(`${base}/api/v1/users`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Updated Profile',
      birth_day: 4,
      birth_month: 5,
      birth_year: 1990,
    }),
  });
  expect(update.status).toBe(200);
  expect((await (await request(paths[0])).json()).user).toEqual({
    id: user.id,
    name: 'Updated Profile',
    first_name: 'Updated',
    last_name: 'Profile',
    email: user.email,
    birth_day: 4,
    birth_month: 5,
    birth_year: 1990,
    avatar_url: null,
    has_password: false,
  });
});

test('agenda is initially empty and personal rows remain owned, stable, and deterministically ordered', async () => {
  expect((await (await request(paths[1])).json()).items).toEqual([]);
  const today = getToday();
  const ids: string[] = [];
  for (const type of [
    'custom',
    'celebration',
    'wedding_anniversary',
    'dating_anniversary',
    'birthday',
  ]) {
    const id = crypto.randomUUID();
    ids.push(id);
    await database.query(
      'INSERT INTO events (id, title, type, custom_type, event_day, event_month, reminder_days_before, user_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [
        id,
        type,
        type,
        type === 'custom' ? 'Custom label' : null,
        today.getDate(),
        today.getMonth() + 1,
        7,
        user.id,
      ],
    );
  }
  await orchestrator.createEvent(other.id, { title: 'Private Other' });
  const response = await (await request(paths[1])).json();
  expect(response.today).toBe(dateOnly(referenceDay()));
  expect(response.time_zone).toBe('America/Sao_Paulo');
  expect(response.items.map((item: { id: string }) => item.id)).toEqual(
    ids.map((id) => `event:${id}`).sort(),
  );
  expect(response.items).toHaveLength(5);
  for (const item of response.items) {
    expect(item).toEqual({
      id: `event:${item.source.event_id}`,
      source: { kind: 'personal_event', event_id: item.source.event_id },
      title: item.type,
      type: item.type,
      custom_type: item.type === 'custom' ? 'Custom label' : null,
      event_day: today.getDate(),
      event_month: today.getMonth() + 1,
      reminder_days_before: 7,
      next_date: response.today,
      days_until: 0,
      is_next_year: false,
      can_edit: true,
    });
  }
  const id = ids[0];
  const updated = await fetch(`${base}/api/v1/events/${id}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title: 'Edited personal event' }),
  });
  expect(updated.status).toBe(200);
  expect(
    (await (await request(paths[1])).json()).items.find(
      (item: { id: string }) => item.id === `event:${id}`,
    ).title,
  ).toBe('Edited personal event');
  const denied = await fetch(`${base}/api/v1/events/${id}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${cookie}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title: 'Denied' }),
  });
  expect(denied.status).toBe(404);
});

test('group agenda deduplicates shared members, excludes viewer/outsiders/missing birthdays, and follows membership removal', async () => {
  const first = await group.create(user.id, { name: 'Alpha' });
  const second = await group.create(user.id, { name: 'Beta' });
  const hidden = await group.create(other.id, { name: 'Private' });
  const noBirthday = await orchestrator.createUser();
  await database.query(
    'UPDATE users SET birth_day = NULL, birth_month = NULL WHERE id = $1',
    [noBirthday.id],
  );
  for (const id of [first.id, second.id])
    await database.query(
      "INSERT INTO group_members (group_id,user_id,role) VALUES ($1,$2,'member')",
      [id, other.id],
    );
  await database.query(
    "INSERT INTO group_members (group_id,user_id,role) VALUES ($1,$2,'member')",
    [first.id, noBirthday.id],
  );
  const outsider = await orchestrator.createUser();
  await database.query(
    "INSERT INTO group_members (group_id,user_id,role) VALUES ($1,$2,'member')",
    [hidden.id, outsider.id],
  );
  const list = (await (await request(paths[1])).json()).items.filter(
    (item: { source: { kind: string } }) =>
      item.source.kind === 'group_birthday',
  );
  expect(list).toHaveLength(1);
  expect(list[0]).toMatchObject({
    id: `group-birthday:${other.id}`,
    source: {
      kind: 'group_birthday',
      user_id: other.id,
      group_name: 'Alpha',
      group_count: 2,
    },
    type: 'birthday',
    custom_type: null,
    reminder_days_before: null,
    can_edit: false,
  });
  expect(Object.keys(list[0].source).sort()).toEqual([
    'group_count',
    'group_name',
    'kind',
    'user_id',
  ]);
  expect(list[0]).not.toHaveProperty('birth_year');
  expect(list[0]).not.toHaveProperty('email');
  await database.query('DELETE FROM group_members WHERE user_id = $1', [
    user.id,
  ]);
  expect(
    (await (await request(paths[1])).json()).items.filter(
      (item: { source: { kind: string } }) =>
        item.source.kind === 'group_birthday',
    ),
  ).toEqual([]);
});

test('catalog returns all definitions and isolated preferences, reflecting existing subscription writes', async () => {
  await database.query(
    'INSERT INTO commemorative_subscriptions (user_id,date_key) VALUES ($1,$2),($3,$4),($1,$5)',
    [user.id, 'christmas', other.id, 'mothers_day', 'obsolete_key'],
  );
  const result = await (await request(paths[2])).json();
  expect(result.items).toHaveLength(COMMEMORATIVE_DATES.length);
  expect(
    result.items
      .filter((item: { enabled: boolean }) => item.enabled)
      .map((item: { key: string }) => item.key),
  ).toEqual(['christmas']);
  for (const item of result.items) {
    const def = COMMEMORATIVE_DATES.find((row) => row.key === item.key)!;
    expect(item).toEqual({
      key: def.key,
      label: def.label,
      emoji: def.emoji,
      enabled: def.key === 'christmas',
      next_date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      days_until: expect.any(Number),
    });
    expect(item.days_until).toBeGreaterThanOrEqual(0);
  }
  expect(
    result.items.map(
      (row: { next_date: string; key: string }) =>
        `${row.next_date}:${row.key}`,
    ),
  ).toEqual(
    result.items
      .map(
        (row: { next_date: string; key: string }) =>
          `${row.next_date}:${row.key}`,
      )
      .sort(),
  );
  const disable = await fetch(`${base}/api/v1/commemorative-dates/christmas`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(disable.status).toBe(204);
  const enable = await fetch(`${base}/api/v1/commemorative-dates/mothers_day`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(enable.status).toBe(200);
  expect(
    (await (await request(paths[2])).json()).items
      .filter((row: { enabled: boolean }) => row.enabled)
      .map((row: { key: string }) => row.key),
  ).toEqual(['mothers_day']);
});

test('model lists use one controlled civil reference without a public date override', async () => {
  const previous = process.env.DEMO_TODAY;
  process.env.DEMO_TODAY = '2026-12-31';
  try {
    const temporary = await orchestrator.createUser();
    await orchestrator.createEvent(temporary.id, {
      event_day: 1,
      event_month: 1,
    });
    const result = await mobileData.agenda(temporary.id);
    expect(result.items[0]).toMatchObject({
      next_date: '2027-01-01',
      days_until: 1,
      is_next_year: true,
    });
    expect(result.today).toBe('2026-12-31');
    const catalog = await mobileData.commemorativeDates(temporary.id);
    expect(
      catalog.items.find((row) => row.key === 'christmas')?.next_date,
    ).toBe('2027-12-25');
  } finally {
    if (previous === undefined) delete process.env.DEMO_TODAY;
    else process.env.DEMO_TODAY = previous;
  }
});

test('database errors remain sanitized on every read', async () => {
  await database.query(
    'ALTER TABLE sessions RENAME TO sessions_temporarily_unavailable',
  );
  try {
    for (const path of paths) {
      const response = await request(path);
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({
        name: 'InternalServerError',
        message: 'An unexpected error occurred.',
        action: 'Try again later.',
        status_code: 500,
      });
    }
  } finally {
    await database.query(
      'ALTER TABLE sessions_temporarily_unavailable RENAME TO sessions',
    );
  }
});
