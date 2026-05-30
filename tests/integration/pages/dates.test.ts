import orchestrator from 'tests/orchestrator';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe('GET /dates', () => {
  it('redirects to / when the user is not authenticated', async () => {
    const response = await fetch('http://localhost:3000/dates', {
      redirect: 'manual',
    });

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('/');
  });

  it('shows the dates page when the user is authenticated', async () => {
    const cookie = await orchestrator.createAuthCookie();

    const response = await fetch('http://localhost:3000/dates', {
      redirect: 'manual',
      headers: { Cookie: cookie },
    });

    expect(response.status).toBe(200);
  });

  it('shows the dates page when the user has group events', async () => {
    const cookie = await orchestrator.createAuthCookie({
      birth_day: 15,
      birth_month: 6,
    });
    const token = orchestrator.extractToken(cookie);

    await orchestrator.createGroup(token, 'Família');

    const response = await fetch('http://localhost:3000/dates', {
      redirect: 'manual',
      headers: { Cookie: cookie },
    });

    expect(response.status).toBe(200);
  });
});
