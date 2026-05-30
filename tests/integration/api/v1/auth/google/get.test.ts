import orchestrator from 'tests/orchestrator';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe('GET /api/v1/auth/google', () => {
  it('redirects to Google with a state cookie', async () => {
    const response = await fetch('http://localhost:3000/api/v1/auth/google', {
      redirect: 'manual',
    });

    expect(response.status).toBe(302);

    const location = response.headers.get('location');
    expect(location).toContain('accounts.google.com');
    expect(location).toContain('response_type=code');
    expect(location).toContain('scope=email+profile');

    const cookies = response.headers.get('set-cookie');
    expect(cookies).toContain('google_oauth_state=');
    expect(cookies).toContain('HttpOnly');
  });
});
