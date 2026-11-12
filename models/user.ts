import { MIN_AGE, MIN_AGE_MESSAGE, isAtLeastAge } from '@/lib/age';
import { getToday } from '@/lib/date-utils';
import { LEGAL_VERSION } from '@/lib/legal/shared';
import { resolveName } from '@/lib/person-name';
import database from 'infra/database';
import { NotFoundError, ValidationError } from 'infra/errors';
import { createDefaults } from 'models/notification-preferences';
import password from 'models/password';

interface CreateUserInput {
  name?: string;
  first_name?: string;
  last_name?: string | null;
  email: string;
  password: string;
  birth_day: number;
  birth_month: number;
  birth_year: number;
  marketing_consent?: boolean;
}

interface UpdateUserInput {
  name?: string;
  first_name?: string;
  last_name?: string | null;
  birth_day?: number;
  birth_month?: number;
  birth_year?: number;
}

async function create(input: CreateUserInput) {
  validateMinimumAge(input);
  await validateUniqueEmail(input.email);

  const hashedPassword = await password.hash(input.password);

  const newUser = await runInsertQuery({
    ...input,
    password: hashedPassword,
  });

  return newUser;

  async function runInsertQuery(values: CreateUserInput) {
    const fullName = resolveName(values)!;
    const result = await database.query(
      `INSERT INTO users (name, first_name, last_name, email, password, birth_day, birth_month, birth_year, marketing_consent, terms_accepted_at, terms_version)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10)
       RETURNING id, name, first_name, last_name, email, birth_day, birth_month, birth_year, marketing_consent, created_at, updated_at`,
      [
        fullName.name,
        fullName.first_name,
        fullName.last_name,
        values.email.toLowerCase(),
        values.password,
        values.birth_day,
        values.birth_month,
        values.birth_year,
        values.marketing_consent ?? true,
        LEGAL_VERSION,
      ],
    );
    await createDefaults(
      database,
      result.rows[0].id,
      result.rows[0].marketing_consent,
    );

    return result.rows[0];
  }
}

async function update(userId: string, input: UpdateUserInput) {
  if (
    input.birth_day !== undefined ||
    input.birth_month !== undefined ||
    input.birth_year !== undefined
  ) {
    const current = await database.query(
      'SELECT birth_day, birth_month, birth_year FROM users WHERE id = $1',
      [userId],
    );
    const row = current.rows[0];
    if (row) {
      validateMinimumAge({
        birth_day: input.birth_day ?? row.birth_day,
        birth_month: input.birth_month ?? row.birth_month,
        birth_year: input.birth_year ?? row.birth_year,
      });
    }
  }

  const newName = resolveName(input);

  const result = await database.query(
    `UPDATE users
     SET name = COALESCE($1, name),
         first_name = COALESCE($2, first_name),
         last_name = CASE WHEN $2::text IS NULL THEN last_name ELSE $3 END,
         birth_day = COALESCE($4, birth_day),
         birth_month = COALESCE($5, birth_month),
         birth_year = COALESCE($6, birth_year),
         updated_at = NOW()
     WHERE id = $7
     RETURNING id, name, first_name, last_name, email, avatar_url, birth_day, birth_month, birth_year, created_at, updated_at`,
    [
      newName?.name ?? null,
      newName?.first_name ?? null,
      newName?.last_name ?? null,
      input.birth_day ?? null,
      input.birth_month ?? null,
      input.birth_year ?? null,
      userId,
    ],
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

function validateMinimumAge(birth: {
  birth_day?: number | null;
  birth_month?: number | null;
  birth_year?: number | null;
}) {
  if (!birth.birth_day || !birth.birth_month) return;

  const allowed = isAtLeastAge(
    { day: birth.birth_day, month: birth.birth_month, year: birth.birth_year },
    MIN_AGE,
    getToday(),
  );

  if (!allowed) {
    throw new ValidationError({
      message: MIN_AGE_MESSAGE,
      action: 'Confira a data de nascimento informada e tente novamente.',
    });
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
