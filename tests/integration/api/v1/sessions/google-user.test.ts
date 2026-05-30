import { faker } from '@faker-js/faker';
import orchestrator from 'tests/orchestrator';
import database from 'infra/database';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe('POST /api/v1/sessions (Google-only user)', () => {
  it('returns an error when trying to log in with a password on a Google account', async () => {
    const email = faker.internet.email().toLowerCase();
    const name = faker.person.fullName();

    // Create a user without a password (as if via Google)
    await database.query(`INSERT INTO users (name, email) VALUES ($1, $2)`, [
      name,
      email,
    ]);

    const response = await fetch('http://localhost:3000/api/v1/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'qualquersenha' }),
    });

    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data.name).toBe('UnauthorizedError');
    expect(data.message).toBe('Esta conta usa login com Google.');
    expect(data.action).toBe('Use o botão "Continuar com Google" para entrar.');
  });
});
