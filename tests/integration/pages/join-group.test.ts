import orchestrator from 'tests/orchestrator';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe('GET /join-group', () => {
  it('redirects to /signup with next when the user is not authenticated', async () => {
    const response = await fetch('http://localhost:3000/join-group?code=abc', {
      redirect: 'manual',
    });

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      '/signup?next=%2Fjoin-group%3Fcode%3Dabc',
    );
  });

  it('redirects to /signup without next when there is no code', async () => {
    const response = await fetch('http://localhost:3000/join-group', {
      redirect: 'manual',
    });

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('/signup');
  });

  it('redirects to /groups when there is no invite code and the user is authenticated', async () => {
    const cookie = await orchestrator.createAuthCookie();

    const response = await fetch('http://localhost:3000/join-group', {
      redirect: 'manual',
      headers: { Cookie: cookie },
    });

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('/groups');
  });

  it('shows the invite page when there is a code and the user is authenticated', async () => {
    const ownerToken = await orchestrator.createUserAndToken();
    const group = await orchestrator.createGroup(ownerToken, 'Família');

    const memberCookie = await orchestrator.createAuthCookie();

    const response = await fetch(
      `http://localhost:3000/join-group?code=${group.invite_code}`,
      {
        redirect: 'manual',
        headers: { Cookie: memberCookie },
      },
    );

    expect(response.status).toBe(200);
  });
});
