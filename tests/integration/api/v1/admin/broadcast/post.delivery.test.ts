import orchestrator from 'tests/orchestrator';
import database from 'infra/database';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

beforeEach(async () => {
  await database.query('TRUNCATE users CASCADE');
});

describe('POST /api/v1/admin/broadcast (provider delivery)', () => {
  test('should populate broadcast_deliveries and return sent count', async () => {
    const { session } = await orchestrator.createAdminUserAndSession();

    // Create 2 opted-in users and 1 opted-out
    await orchestrator.createUser({ marketing_consent: true });
    await orchestrator.createUser({ marketing_consent: true });
    await orchestrator.createUser({ marketing_consent: false });

    const countRes = await fetch(
      'http://localhost:3000/api/v1/admin/broadcast?key=commemorative_dates',
      { headers: { Authorization: `Bearer ${session.token}` } },
    );
    const { recipientCount } = await countRes.json();

    const response = await fetch(
      'http://localhost:3000/api/v1/admin/broadcast',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({ announcementKey: 'commemorative_dates' }),
      },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(recipientCount).toBe(3);
    expect(body.sent).toBe(recipientCount);
    expect(body.failed).toBe(0);
    expect(body.total).toBe(recipientCount);

    // Verify deliveries were recorded
    const deliveries = await database.query(
      `SELECT COUNT(*)::int AS count FROM broadcast_deliveries WHERE announcement_key = $1`,
      ['commemorative_dates'],
    );
    expect(deliveries.rows[0].count).toBe(recipientCount);
  });
  test('second POST returns sent:0 (idempotency)', async () => {
    const { session } = await orchestrator.createAdminUserAndSession();

    // First send
    const first = await fetch('http://localhost:3000/api/v1/admin/broadcast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify({ announcementKey: 'commemorative_dates' }),
    });

    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({ sent: 1, failed: 0, total: 1 });

    // Second send should find 0 new recipients
    const response = await fetch(
      'http://localhost:3000/api/v1/admin/broadcast',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({ announcementKey: 'commemorative_dates' }),
      },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.sent).toBe(0);
    expect(body.total).toBe(0);
  });
});
