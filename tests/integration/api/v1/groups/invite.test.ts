import orchestrator from 'tests/orchestrator';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe('GET /api/v1/groups/invite', () => {
  it('returns only the group name for a valid code, without authentication', async () => {
    const ownerToken = await orchestrator.createUserAndToken();
    const created = await orchestrator.createGroup(ownerToken, 'Família Silva');

    const response = await fetch(
      `http://localhost:3000/api/v1/groups/invite?code=${created.invite_code}`,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({ name: 'Família Silva' });
  });

  it('returns 404 for an unknown code', async () => {
    const response = await fetch(
      'http://localhost:3000/api/v1/groups/invite?code=zzzzzzzz',
    );

    expect(response.status).toBe(404);
    expect((await response.json()).name).toBe('NotFoundError');
  });

  it('returns 400 for a malformed or missing code', async () => {
    const missing = await fetch('http://localhost:3000/api/v1/groups/invite');
    expect(missing.status).toBe(400);

    const malformed = await fetch(
      'http://localhost:3000/api/v1/groups/invite?code=a%20b%27%3B--',
    );
    expect(malformed.status).toBe(400);
  });
});
