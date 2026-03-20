import database from 'infra/database';
import { NotFoundError, ValidationError } from 'infra/errors';
import password from 'models/password';

interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  birth_day: number;
  birth_month: number;
  birth_year: number;
}

interface UpdateUserInput {
  birth_day: number;
  birth_month: number;
  birth_year: number;
}

async function create(input: CreateUserInput) {
  await validateUniqueEmail(input.email);

  const hashedPassword = await password.hash(input.password);

  const newUser = await runInsertQuery({
    ...input,
    password: hashedPassword,
  });

  return newUser;

  async function runInsertQuery(values: CreateUserInput) {
    const result = await database.query(
      `INSERT INTO users (name, email, password, birth_day, birth_month, birth_year)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, birth_day, birth_month, birth_year, created_at, updated_at`,
      [
        values.name,
        values.email.toLowerCase(),
        values.password,
        values.birth_day,
        values.birth_month,
        values.birth_year,
      ],
    );

    return result.rows[0];
  }
}

async function update(userId: string, input: UpdateUserInput) {
  const result = await database.query(
    `UPDATE users
     SET birth_day = $1, birth_month = $2, birth_year = $3, updated_at = NOW()
     WHERE id = $4
     RETURNING id, name, email, birth_day, birth_month, birth_year, created_at, updated_at`,
    [input.birth_day, input.birth_month, input.birth_year, userId],
  );

  if (!result.rows[0]) {
    throw new NotFoundError({
      message: 'Usuário não encontrado.',
      action: 'Verifique o ID do usuário.',
    });
  }

  return result.rows[0];
}

async function findOneByEmail(email: string) {
  const userFound = await runSelectQuery(email);

  return userFound;

  async function runSelectQuery(email: string) {
    const result = await database.query(
      `SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [email],
    );

    return result.rows[0] ?? null;
  }
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

const user = { create, update, findOneByEmail };

export default user;
