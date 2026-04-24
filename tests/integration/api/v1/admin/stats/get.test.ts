import orchestrator from 'tests/orchestrator';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe('GET /api/v1/admin/stats', () => {
  describe('anonymous user', () => {
    test('should return 401', async () => {
      const response = await fetch('http://localhost:3000/api/v1/admin/stats');
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.name).toBe('UnauthorizedError');
    });
  });

  describe('authenticated non-admin user', () => {
    test('should return 401', async () => {
      const { session } = await orchestrator.createUserAndSession();

      const response = await fetch('http://localhost:3000/api/v1/admin/stats', {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.name).toBe('UnauthorizedError');
    });
  });

  describe('authenticated admin user', () => {
    test('should return stats with correct shape', async () => {
      const { session } = await orchestrator.createAdminUserAndSession();

      const response = await fetch('http://localhost:3000/api/v1/admin/stats', {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(typeof body.totalUsers).toBe('number');
      expect(typeof body.activeUsers30d).toBe('number');
      expect(typeof body.newUsers7d).toBe('number');
      expect(typeof body.newUsers30d).toBe('number');
      expect(typeof body.totalEvents).toBe('number');
      expect(typeof body.avgEventsPerUser).toBe('number');
      expect(typeof body.avgGroupsPerUser).toBe('number');
      expect(typeof body.avgAnnualEmailsPerUser).toBe('number');
      expect(typeof body.avgEventsWithReminderPerUser).toBe('number');
      expect(typeof body.usersWithNoEvents).toBe('number');
      expect(typeof body.usersWithNoEventsPercent).toBe('number');
      expect(typeof body.usersWithBirthdayPercent).toBe('number');
      expect(typeof body.usersViaGooglePercent).toBe('number');
      expect(Array.isArray(body.eventTypeBreakdown)).toBe(true);
      expect(Array.isArray(body.weeklySignups)).toBe(true);
      expect(Array.isArray(body.weeklyEventsCreated)).toBe(true);
    });

    test('should reflect actual data correctly', async () => {
      const { session } = await orchestrator.createAdminUserAndSession();

      const user1 = await orchestrator.createUser();
      const user2 = await orchestrator.createUser();
      await orchestrator.createEvent(user1.id, { reminder_days_before: 7 });
      await orchestrator.createEvent(user1.id, { reminder_days_before: 0 });
      await orchestrator.createEvent(user2.id, { reminder_days_before: 3 });

      const response = await fetch('http://localhost:3000/api/v1/admin/stats', {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.totalUsers).toBeGreaterThanOrEqual(3);
      expect(body.totalEvents).toBeGreaterThanOrEqual(3);
      expect(body.avgEventsPerUser).toBeGreaterThan(0);
    });
  });
});
