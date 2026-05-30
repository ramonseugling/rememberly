import orchestrator from 'tests/orchestrator';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe('GET /login', () => {
  it('shows the login page to an unauthenticated user', async () => {
    const response = await fetch('http://localhost:3000/login', {
      redirect: 'manual',
    });

    expect(response.status).toBe(200);
  });

  it('redirects to /dates when the user is authenticated', async () => {
    const cookie = await orchestrator.createAuthCookie();

    const response = await fetch('http://localhost:3000/login', {
      redirect: 'manual',
      headers: { Cookie: cookie },
    });

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('/dates');
  });

  it('redirects to next when the user is authenticated and next is valid', async () => {
    const cookie = await orchestrator.createAuthCookie();

    const response = await fetch(
      'http://localhost:3000/login?next=%2Fjoin-group%3Fcode%3Dabc',
      {
        redirect: 'manual',
        headers: { Cookie: cookie },
      },
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('/join-group?code=abc');
  });

  it('redirects to /dates when next is invalid', async () => {
    const cookie = await orchestrator.createAuthCookie();

    const response = await fetch(
      'http://localhost:3000/login?next=//evil.com',
      {
        redirect: 'manual',
        headers: { Cookie: cookie },
      },
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('/dates');
  });
});
