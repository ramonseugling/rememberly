import orchestrator from 'tests/orchestrator';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe('GET /signup', () => {
  it('shows the signup page to an unauthenticated user', async () => {
    const response = await fetch('http://localhost:3000/signup', {
      redirect: 'manual',
    });

    expect(response.status).toBe(200);
  });

  it('redirects to /dates when the user is authenticated', async () => {
    const cookie = await orchestrator.createAuthCookie();

    const response = await fetch('http://localhost:3000/signup', {
      redirect: 'manual',
      headers: { Cookie: cookie },
    });

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('/dates');
  });

  it('redirects to next when the user is authenticated and next is valid', async () => {
    const cookie = await orchestrator.createAuthCookie();

    const response = await fetch(
      'http://localhost:3000/signup?next=%2Fjoin-group%3Fcode%3Dabc',
      {
        redirect: 'manual',
        headers: { Cookie: cookie },
      },
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('/join-group?code=abc');
  });

  it('redirects to /dates when next starts with /api/', async () => {
    const cookie = await orchestrator.createAuthCookie();

    const response = await fetch(
      'http://localhost:3000/signup?next=%2Fapi%2Fv1%2Fusers',
      {
        redirect: 'manual',
        headers: { Cookie: cookie },
      },
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('/dates');
  });
});
