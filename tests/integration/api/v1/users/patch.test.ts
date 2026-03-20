import orchestrator from 'tests/orchestrator';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe('PATCH /api/v1/users', () => {
  it('deve atualizar a data de nascimento com sucesso', async () => {
    const cookie = await orchestrator.createAuthCookie();

    const response = await fetch('http://localhost:3000/api/v1/users', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({
        birth_day: 25,
        birth_month: 12,
        birth_year: 1995,
      }),
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.birth_day).toBe(25);
    expect(data.birth_month).toBe(12);
    expect(data.birth_year).toBe(1995);
    expect(data.password).toBeUndefined();
  });

  it('deve retornar 401 quando não autenticado', async () => {
    const response = await fetch('http://localhost:3000/api/v1/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        birth_day: 1,
        birth_month: 1,
        birth_year: 2000,
      }),
    });

    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data.name).toBe('UnauthorizedError');
  });

  it('deve retornar 400 quando dia é inválido', async () => {
    const cookie = await orchestrator.createAuthCookie();

    const response = await fetch('http://localhost:3000/api/v1/users', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({
        birth_day: 32,
        birth_month: 1,
        birth_year: 2000,
      }),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.name).toBe('ValidationError');
  });

  it('deve retornar 400 quando mês é inválido', async () => {
    const cookie = await orchestrator.createAuthCookie();

    const response = await fetch('http://localhost:3000/api/v1/users', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({
        birth_day: 1,
        birth_month: 13,
        birth_year: 2000,
      }),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.name).toBe('ValidationError');
  });

  it('deve retornar 400 quando ano é no futuro', async () => {
    const cookie = await orchestrator.createAuthCookie();

    const response = await fetch('http://localhost:3000/api/v1/users', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({
        birth_day: 1,
        birth_month: 1,
        birth_year: 2999,
      }),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.name).toBe('ValidationError');
  });

  it('deve retornar 400 quando ano é anterior a 1900', async () => {
    const cookie = await orchestrator.createAuthCookie();

    const response = await fetch('http://localhost:3000/api/v1/users', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({
        birth_day: 1,
        birth_month: 1,
        birth_year: 1899,
      }),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.name).toBe('ValidationError');
  });

  it('deve retornar 400 quando campos obrigatórios não são enviados', async () => {
    const cookie = await orchestrator.createAuthCookie();

    const response = await fetch('http://localhost:3000/api/v1/users', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.name).toBe('ValidationError');
  });

  it('deve retornar 400 quando dia é zero', async () => {
    const cookie = await orchestrator.createAuthCookie();

    const response = await fetch('http://localhost:3000/api/v1/users', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({
        birth_day: 0,
        birth_month: 1,
        birth_year: 2000,
      }),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.name).toBe('ValidationError');
  });
});
