import orchestrator from 'tests/orchestrator';
import database from 'infra/database';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

beforeEach(async () => {
  await database.query('TRUNCATE users CASCADE');
});

describe('POST /api/v1/admin/broadcast', () => {
  describe('anonymous user', () => {
    test('should return 401', async () => {
      const response = await fetch(
        'http://localhost:3000/api/v1/admin/broadcast',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ announcementKey: 'commemorative_dates' }),
        },
      );
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.name).toBe('UnauthorizedError');
    });
  });

  describe('authenticated non-admin user', () => {
    test('should return 401', async () => {
      const { session } = await orchestrator.createUserAndSession();

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

      expect(response.status).toBe(401);
      expect(body.name).toBe('UnauthorizedError');
    });
  });

  describe('authenticated admin user', () => {
    test('does not resend to users with a persisted delivery', async () => {
      const { user, session } = await orchestrator.createAdminUserAndSession();
      await database.query(
        'INSERT INTO broadcast_deliveries (user_id, announcement_key) VALUES ($1, $2)',
        [user.id, 'commemorative_dates'],
      );
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
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ sent: 0, failed: 0, total: 0 });
      const deliveries = await database.query(
        'SELECT COUNT(*)::int AS count FROM broadcast_deliveries',
      );
      expect(deliveries.rows[0].count).toBe(1);
    });

    test('should return 400 when announcementKey is missing', async () => {
      const { session } = await orchestrator.createAdminUserAndSession();

      const response = await fetch(
        'http://localhost:3000/api/v1/admin/broadcast',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.token}`,
          },
          body: JSON.stringify({}),
        },
      );
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.name).toBe('ValidationError');
    });

    test('should return 400 for unknown key', async () => {
      const { session } = await orchestrator.createAdminUserAndSession();

      const response = await fetch(
        'http://localhost:3000/api/v1/admin/broadcast',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.token}`,
          },
          body: JSON.stringify({ announcementKey: 'nonexistent_key' }),
        },
      );
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.name).toBe('ValidationError');
    });

    test('should exclude users with marketing_consent=false', async () => {
      const { session } = await orchestrator.createAdminUserAndSession();

      // Isolate the opt-out decision: no other eligible recipients exist.
      await database.query('UPDATE users SET marketing_consent = false');
      const optedOut = await orchestrator.createUser({
        marketing_consent: false,
      });
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

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ sent: 0, failed: 0, total: 0 });

      // The opted-out user must never appear in broadcast_deliveries
      const delivery = await database.query(
        `SELECT 1 FROM broadcast_deliveries WHERE user_id = $1 AND announcement_key = $2`,
        [optedOut.id, 'commemorative_dates'],
      );
      expect(delivery.rows.length).toBe(0);
    });
  });
});
