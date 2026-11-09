import orchestrator from 'tests/orchestrator';

const BASE = 'http://localhost:3000/api/v1/gifts';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

function call(token: string | null, method: string, body?: unknown, path = '') {
  return fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe('gift list API (owner)', () => {
  it('requires authentication on every route', async () => {
    const created = await call(null, 'POST', { title: 'x' });
    expect(created.status).toBe(401);
    expect((await call(null, 'GET')).status).toBe(401);
    expect((await call(null, 'PATCH', { title: 'x' }, '/abc')).status).toBe(
      401,
    );
    expect((await call(null, 'DELETE', undefined, '/abc')).status).toBe(401);
  });

  it('starts empty, creates items and lists them newest first with the limit', async () => {
    const token = await orchestrator.createUserAndToken();

    const empty = await (await call(token, 'GET')).json();
    expect(empty).toEqual({ items: [], limit: 50 });

    const first = await call(token, 'POST', { title: 'Livro de receitas' });
    expect(first.status).toBe(201);
    const second = await call(token, 'POST', {
      title: 'Fone de ouvido',
      link: 'https://loja.example.com/fone',
      description: 'Na cor preta',
    });
    expect(second.status).toBe(201);
    const created = await second.json();
    expect(Object.keys(created).sort()).toEqual([
      'created_at',
      'description',
      'id',
      'link',
      'title',
      'updated_at',
    ]);

    const list = await (await call(token, 'GET')).json();
    expect(list.items.map((item: { title: string }) => item.title)).toEqual([
      'Fone de ouvido',
      'Livro de receitas',
    ]);
  });

  it('rejects invalid input with Portuguese validation errors', async () => {
    const token = await orchestrator.createUserAndToken();
    const cases: [unknown, string][] = [
      [{}, 'O nome do presente é obrigatório.'],
      [{ title: '   ' }, 'O nome do presente é obrigatório.'],
      [{ title: 'a'.repeat(101) }, 'O nome do presente deve ter no máximo'],
      [
        { title: 'ok', link: 'javascript:alert(1)' },
        'O link do presente é inválido.',
      ],
      [{ title: 'ok', extra: true }, 'Unrecognized key'],
      [{ title: 123 }, 'inválido'],
    ];
    for (const [body, message] of cases) {
      const response = await call(token, 'POST', body);
      expect(response.status).toBe(400);
      expect((await response.json()).message).toContain(message);
    }
  });

  it('enforces the 50 item limit', async () => {
    const token = await orchestrator.createUserAndToken();
    for (let index = 0; index < 50; index += 1)
      expect(
        (await call(token, 'POST', { title: `Item ${index}` })).status,
      ).toBe(201);

    const response = await call(token, 'POST', { title: 'Item 51' });

    expect(response.status).toBe(400);
    expect((await response.json()).message).toBe(
      'Sua lista já tem 50 presentes.',
    );
  });

  it('reads, edits partially and deletes an item', async () => {
    const token = await orchestrator.createUserAndToken();
    const item = await (
      await call(token, 'POST', {
        title: 'Tênis',
        link: 'https://loja.example.com/tenis',
        description: 'Número 38',
      })
    ).json();

    const read = await call(token, 'GET', undefined, `/${item.id}`);
    expect(read.status).toBe(200);

    const renamed = await call(
      token,
      'PATCH',
      { title: 'Tênis de corrida' },
      `/${item.id}`,
    );
    expect(renamed.status).toBe(200);
    expect(await renamed.json()).toMatchObject({
      title: 'Tênis de corrida',
      link: 'https://loja.example.com/tenis',
      description: 'Número 38',
    });

    const cleared = await call(
      token,
      'PATCH',
      { link: null, description: '' },
      `/${item.id}`,
    );
    expect(await cleared.json()).toMatchObject({
      link: null,
      description: null,
    });

    expect((await call(token, 'PATCH', {}, `/${item.id}`)).status).toBe(400);
    expect(
      (await call(token, 'PATCH', { title: '' }, `/${item.id}`)).status,
    ).toBe(400);

    const removed = await call(token, 'DELETE', undefined, `/${item.id}`);
    expect(removed.status).toBe(204);
    expect((await call(token, 'GET', undefined, `/${item.id}`)).status).toBe(
      404,
    );
    expect((await (await call(token, 'GET')).json()).items).toEqual([]);
  });

  it('hides other people items: 404 for reads, edits and deletes', async () => {
    const ownerToken = await orchestrator.createUserAndToken();
    const otherToken = await orchestrator.createUserAndToken();
    const item = await (
      await call(ownerToken, 'POST', { title: 'Privado' })
    ).json();

    expect(
      (await call(otherToken, 'GET', undefined, `/${item.id}`)).status,
    ).toBe(404);
    expect(
      (await call(otherToken, 'PATCH', { title: 'Invadido' }, `/${item.id}`))
        .status,
    ).toBe(404);
    expect(
      (await call(otherToken, 'DELETE', undefined, `/${item.id}`)).status,
    ).toBe(404);
    expect((await (await call(otherToken, 'GET')).json()).items).toEqual([]);
    expect(
      (await call(ownerToken, 'GET', undefined, `/${item.id}`)).status,
    ).toBe(200);
  });

  it('returns 404 for malformed ids instead of failing', async () => {
    const token = await orchestrator.createUserAndToken();

    expect((await call(token, 'GET', undefined, '/not-a-uuid')).status).toBe(
      404,
    );
    expect(
      (await call(token, 'DELETE', undefined, "/1'%20OR%20'1'='1")).status,
    ).toBe(404);
  });
});
