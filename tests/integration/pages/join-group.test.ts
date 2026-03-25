import orchestrator from 'tests/orchestrator';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe('GET /join-group', () => {
  it('deve redirecionar para / quando usuário não está autenticado', async () => {
    const response = await fetch('http://localhost:3000/join-group?code=abc', {
      redirect: 'manual',
    });

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('/');
  });

  it('deve redirecionar para /groups quando não tem código de convite', async () => {
    const cookie = await orchestrator.createAuthCookie();

    const response = await fetch('http://localhost:3000/join-group', {
      redirect: 'manual',
      headers: { Cookie: cookie },
    });

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('/groups');
  });

  it('deve exibir a página de convite quando tem código e auth', async () => {
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
