import orchestrator from 'tests/orchestrator';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe('GET /groups', () => {
  it('deve redirecionar para / quando usuário não está autenticado', async () => {
    const response = await fetch('http://localhost:3000/groups', {
      redirect: 'manual',
    });

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('/');
  });

  it('deve exibir a página de grupos quando usuário está autenticado', async () => {
    const cookie = await orchestrator.createAuthCookie();

    const response = await fetch('http://localhost:3000/groups', {
      redirect: 'manual',
      headers: { Cookie: cookie },
    });

    expect(response.status).toBe(200);
  });

  it('deve exibir a página de grupos quando user tem grupos', async () => {
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
