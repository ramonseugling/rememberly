import orchestrator from 'tests/orchestrator';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe('GET /api/v1/auth/google/callback', () => {
  it('returns an error with an invalid state', async () => {
    const response = await fetch(
      'http://localhost:3000/api/v1/auth/google/callback?code=fake&state=invalid',
      { redirect: 'manual' },
    );

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.name).toBe('ValidationError');
    expect(data.message).toBe('Estado de autenticação inválido.');
  });

  it('returns an error without a code', async () => {
    // First get a valid state from the auth endpoint
    const authResponse = await fetch(
      'http://localhost:3000/api/v1/auth/google',
      { redirect: 'manual' },
    );

    const cookies = authResponse.headers.get('set-cookie') ?? '';
    const stateMatch = cookies.match(/google_oauth_state=([^;]+)/);
    const state = stateMatch?.[1];

    const response = await fetch(
      `http://localhost:3000/api/v1/auth/google/callback?state=${state}`,
      {
        redirect: 'manual',
        headers: { Cookie: `google_oauth_state=${state}` },
      },
    );

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.name).toBe('ValidationError');
    expect(data.message).toBe('Código de autorização não fornecido.');
  });
});
