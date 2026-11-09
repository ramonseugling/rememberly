import orchestrator from 'tests/orchestrator';
import database from 'infra/database';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe('POST /api/v1/mobile/me/deletion-code (provider delivery)', () => {
  it('sends a 6-digit code to the account e-mail and stores it', async () => {
    const user = await orchestrator.createUser();
    const session = await orchestrator.createSessionForUser(user.id);

    const response = await fetch(
      'http://localhost:3000/api/v1/mobile/me/deletion-code',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.token}` },
      },
    );

    expect(response.status).toBe(204);
    const stored = await database.query(
      'SELECT code FROM otp_tokens WHERE LOWER(email)=LOWER($1)',
      [user.email],
    );
    expect(stored.rows).toHaveLength(1);
    expect(stored.rows[0].code).toMatch(/^\d{6}$/);
  });
});
