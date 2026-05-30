import orchestrator from 'tests/orchestrator';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe('PATCH /api/v1/users', () => {
  it('updates the birth date successfully', async () => {
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

  it('returns 401 when not authenticated', async () => {
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

  it('returns 400 when the day is invalid', async () => {
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

  it('returns 400 when the month is invalid', async () => {
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

  it('returns 400 when the year is in the future', async () => {
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

  it('returns 400 when the year is before 1900', async () => {
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

  it('returns 400 when required fields are not sent', async () => {
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

  it('returns 400 when the day is zero', async () => {
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

  it('updates the name successfully', async () => {
    const cookie = await orchestrator.createAuthCookie();

    const response = await fetch('http://localhost:3000/api/v1/users', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({ name: 'Novo Nome' }),
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.name).toBe('Novo Nome');
    expect(data.password).toBeUndefined();
  });

  it('updates name and birth date together', async () => {
    const cookie = await orchestrator.createAuthCookie();

    const response = await fetch('http://localhost:3000/api/v1/users', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({
        name: 'Nome Atualizado',
        birth_day: 10,
        birth_month: 5,
        birth_year: 1990,
      }),
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.name).toBe('Nome Atualizado');
    expect(data.birth_day).toBe(10);
    expect(data.birth_month).toBe(5);
    expect(data.birth_year).toBe(1990);
  });

  it('returns 400 when the name has fewer than 2 characters', async () => {
    const cookie = await orchestrator.createAuthCookie();

    const response = await fetch('http://localhost:3000/api/v1/users', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({ name: 'A' }),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.name).toBe('ValidationError');
  });

  it('keeps unsent fields unchanged when updating only the name', async () => {
    const cookie = await orchestrator.createAuthCookie();

    await fetch('http://localhost:3000/api/v1/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ birth_day: 15, birth_month: 6, birth_year: 1985 }),
    });

    const response = await fetch('http://localhost:3000/api/v1/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ name: 'Apenas Nome' }),
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.name).toBe('Apenas Nome');
    expect(data.birth_day).toBe(15);
    expect(data.birth_month).toBe(6);
    expect(data.birth_year).toBe(1985);
  });
});
