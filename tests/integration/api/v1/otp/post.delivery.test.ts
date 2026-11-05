import { faker } from '@faker-js/faker';
import orchestrator from 'tests/orchestrator';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe('POST /api/v1/otp (provider delivery)', () => {
  it('sends an OTP to a valid and unregistered email', async () => {
    const body = { email: faker.internet.email() };

    const response = await fetch('http://localhost:3000/api/v1/otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data.message).toBe('Código enviado com sucesso.');
  });
});
