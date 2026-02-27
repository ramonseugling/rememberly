import database from 'infra/database';
import { ValidationError } from 'infra/errors';
import password from 'models/password';

interface CreateUserInput {
  name: string;
  email: string;
  password: string;
}

async function create(input: CreateUserInput) {
  await validateUniqueEmail(input.email);

  const hashedPassword = await password.hash(input.password);

  const result = await database.query(
    `INSERT INTO users (name, email, password)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, created_at, updated_at`,
    [input.name, input.email.toLowerCase(), hashedPassword],
  );

  return result.rows[0];
}

async function findOneByEmail(email: string) {
  const result = await database.query(
    `SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
    [email],
  );

  return result.rows[0] ?? null;
}

async function validateUniqueEmail(email: string) {
  const existing = await findOneByEmail(email);

  if (existing) {
    throw new ValidationError({
      message: 'Este e-mail já está em uso.',
      action: 'Utilize outro e-mail ou faça login.',
    });
  }
}

const user = { create, findOneByEmail };

export default user;
