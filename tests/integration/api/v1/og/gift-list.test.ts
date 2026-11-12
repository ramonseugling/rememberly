import orchestrator from 'tests/orchestrator';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe('GET /api/v1/og/gift-list', () => {
  it('renders a PNG preview for an existing user without authentication', async () => {
    const user = await orchestrator.createUser({
      birth_day: 10,
      birth_month: 5,
    });

    const response = await fetch(
      `http://localhost:3000/api/v1/og/gift-list?user=${user.id}`,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/png');
    const bytes = Buffer.from(await response.arrayBuffer());
    expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  });

  it('returns 404 for an unknown or malformed user id', async () => {
    const unknown = await fetch(
      'http://localhost:3000/api/v1/og/gift-list?user=3f2504e0-4f89-41d3-9a0c-0305e82c3301',
    );
    expect(unknown.status).toBe(404);

    const malformed = await fetch(
      'http://localhost:3000/api/v1/og/gift-list?user=abc',
    );
    expect(malformed.status).toBe(404);
  });
});

describe('GET /gift-list link preview', () => {
  it('exposes the open graph tags with the preview image', async () => {
    const user = await orchestrator.createUser({
      birth_day: 10,
      birth_month: 5,
    });

    const response = await fetch(
      `http://localhost:3000/gift-list?user=${user.id}`,
    );
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('og:image');
    expect(html).toContain(`/api/v1/og/gift-list?user=${user.id}`);
    expect(html).toContain('Lista de presentes de');
  });

  it('renders the full list page and preview image for a share code', async () => {
    const owner = await orchestrator.createUser({
      birth_day: 10,
      birth_month: 5,
    });
    const session = await orchestrator.createSessionForUser(owner.id);
    await fetch('http://localhost:3000/api/v1/gifts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Cafeteira italiana',
        link: 'https://example.com/cafeteira',
      }),
    });
    const { token } = await (
      await fetch('http://localhost:3000/api/v1/gifts/share-link', {
        headers: { Authorization: `Bearer ${session.token}` },
      })
    ).json();

    const page = await fetch(`http://localhost:3000/gift-list?list=${token}`);
    const html = await page.text();
    expect(page.status).toBe(200);
    expect(html).toContain('Cafeteira italiana');
    expect(html).toContain(`/api/v1/og/gift-list?list=${token}`);

    const image = await fetch(
      `http://localhost:3000/api/v1/og/gift-list?list=${token}`,
    );
    expect(image.status).toBe(200);
    expect(image.headers.get('content-type')).toBe('image/png');
  });
});
