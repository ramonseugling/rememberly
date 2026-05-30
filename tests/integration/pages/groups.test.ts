import orchestrator from 'tests/orchestrator';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe('GET /groups', () => {
  it('redirects to / when the user is not authenticated', async () => {
    const response = await fetch('http://localhost:3000/groups', {
      redirect: 'manual',
    });

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('/');
  });

  it('shows the groups page when the user is authenticated', async () => {
    const cookie = await orchestrator.createAuthCookie();

    const response = await fetch('http://localhost:3000/groups', {
      redirect: 'manual',
      headers: { Cookie: cookie },
    });

    expect(response.status).toBe(200);
  });

  it('shows the groups page when the user has groups', async () => {
    const cookie = await orchestrator.createAuthCookie();
    const token = orchestrator.extractToken(cookie);
    await orchestrator.createGroup(token, 'Família');

    const response = await fetch('http://localhost:3000/groups', {
      redirect: 'manual',
      headers: { Cookie: cookie },
    });

    expect(response.status).toBe(200);
  });
});
