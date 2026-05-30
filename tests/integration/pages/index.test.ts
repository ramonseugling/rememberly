import orchestrator from 'tests/orchestrator';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe('GET /', () => {
  it('shows the landing page to an unauthenticated user', async () => {
    const response = await fetch('http://localhost:3000/', {
      redirect: 'manual',
    });

    expect(response.status).toBe(200);
  });

  it('redirects to /dates when the user is authenticated', async () => {
    const cookie = await orchestrator.createAuthCookie();

    const response = await fetch('http://localhost:3000/', {
      redirect: 'manual',
      headers: { Cookie: cookie },
    });

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('/dates');
  });
});
