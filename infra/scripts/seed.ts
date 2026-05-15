/**
 * Seed script for local development.
 * Clears all data and populates the DB with realistic mock data.
 *
 * Usage:
 *   npm run seed
 *
 * Credentials for the main dev user:
 *   email: dev@dev.com
 *   password: senha123
 */
import bcrypt from 'bcryptjs';
import database from 'infra/database';

const DEV_EMAIL = 'dev@dev.com';
const DEV_PASSWORD = 'senha123';

// Troque para 1, 2 ou 3 e rode `npm run seed` para validar o carrossel de destaques
const HIGHLIGHTS_COUNT = 3;

const today = new Date();
today.setHours(0, 0, 0, 0);

function addDays(n: number): { birth_day: number; birth_month: number } {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return { birth_day: d.getDate(), birth_month: d.getMonth() + 1 };
}

async function clearDatabase() {
  await database.query(`
    TRUNCATE TABLE
      otp_tokens,
      password_reset_tokens,
      sessions,
      events,
      group_members,
      groups,
      users
    RESTART IDENTITY CASCADE
  `);
  console.log('✓ Banco limpo');
}

async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}

async function createUser(input: {
  name: string;
  email: string;
  password: string;
  birth_day: number;
  birth_month: number;
  birth_year: number;
}) {
  const hashed = await hashPassword(input.password);
  const result = await database.query(
    `INSERT INTO users (name, email, password, birth_day, birth_month, birth_year)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, email`,
    [
      input.name,
      input.email.toLowerCase(),
      hashed,
      input.birth_day,
      input.birth_month,
      input.birth_year,
    ],
  );
  return result.rows[0];
}

async function createGroup(name: string, createdBy: string) {
  const inviteCode = Math.random().toString(36).slice(2, 10).toLowerCase();
  const result = await database.query(
    `INSERT INTO groups (name, invite_code, created_by)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [name, inviteCode, createdBy],
  );
  const group = result.rows[0];

  await database.query(
    `INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, 'owner')`,
    [group.id, createdBy],
  );

  return group;
}

async function addMember(groupId: string, userId: string) {
  await database.query(
    `INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, 'member')`,
    [groupId, userId],
  );
}

async function createEvent(
  userId: string,
  input: {
    title: string;
    type: string;
    event_day: number;
    event_month: number;
  },
) {
  await database.query(
    `INSERT INTO events (title, type, event_day, event_month, user_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [input.title, input.type, input.event_day, input.event_month, userId],
  );
}

async function seed() {
  console.log('\n🌱 Iniciando seed...\n');

  await clearDatabase();

  // --- Usuários ---

  const dev = await createUser({
    name: 'Você (Dev)',
    email: DEV_EMAIL,
    password: DEV_PASSWORD,
    ...addDays(25),
    birth_year: 1995,
  });

  const maria = await createUser({
    name: 'Maria Silva',
    email: 'maria@exemplo.com',
    password: 'senha123',
    ...addDays(HIGHLIGHTS_COUNT >= 2 ? 2 : 35),
    birth_year: 1990,
  });

  const joao = await createUser({
    name: 'João Pedro',
    email: 'joao@exemplo.com',
    password: 'senha123',
    ...addDays(HIGHLIGHTS_COUNT >= 3 ? 5 : 40),
    birth_year: 1988,
  });

  const ana = await createUser({
    name: 'Ana Costa',
    email: 'ana@exemplo.com',
    password: 'senha123',
    ...addDays(22),
    birth_year: 1993,
  });

  const pedro = await createUser({
    name: 'Pedro Oliveira',
    email: 'pedro@exemplo.com',
    password: 'senha123',
    ...addDays(28),
    birth_year: 1991,
  });

  const carla = await createUser({
    name: 'Carla Souza',
    email: 'carla@exemplo.com',
    password: 'senha123',
    ...addDays(20),
    birth_year: 1996,
  });

  const lucas = await createUser({
    name: 'Lucas Mendes',
    email: 'lucas@exemplo.com',
    password: 'senha123',
    ...addDays(0),
    birth_year: 1994,
  });

  const julia = await createUser({
    name: 'Julia Santos',
    email: 'julia@exemplo.com',
    password: 'senha123',
    ...addDays(35),
    birth_year: 1997,
  });

  console.log('✓ Usuários criados');

  // --- Grupos ---

  const familia = await createGroup('Família', dev.id);
  await addMember(familia.id, maria.id);
  await addMember(familia.id, joao.id);
  await addMember(familia.id, ana.id);
  await addMember(familia.id, pedro.id);

  const trabalho = await createGroup('Trabalho', dev.id);
  await addMember(trabalho.id, carla.id);
  await addMember(trabalho.id, lucas.id);
  await addMember(trabalho.id, julia.id);

  const amigos = await createGroup('Amigos', dev.id);
  await addMember(amigos.id, maria.id);
  await addMember(amigos.id, lucas.id);

  // Grupo criado por outra pessoa — dev é apenas membro
  const devBoys = await createGroup('Dev Boys', lucas.id);
  await addMember(devBoys.id, dev.id);
  await addMember(devBoys.id, joao.id);
  await addMember(devBoys.id, pedro.id);

  console.log('✓ Grupos criados');

  // --- Eventos do usuário dev ---

  const eventMonth = addDays(3);
  const eventMonth2 = addDays(15);

  await createEvent(dev.id, {
    title: 'Aniversário de namoro',
    type: 'dating_anniversary',
    event_day: eventMonth.birth_day,
    event_month: eventMonth.birth_month,
  });

  await createEvent(dev.id, {
    title: 'Casamento dos meus pais',
    type: 'wedding_anniversary',
    event_day: eventMonth2.birth_day,
    event_month: eventMonth2.birth_month,
  });

  await createEvent(dev.id, {
    title: 'Viagem para o Japão',
    type: 'celebration',
    event_day: addDays(10).birth_day,
    event_month: addDays(10).birth_month,
  });

  await createEvent(dev.id, {
    title: 'Formatura da Ana',
    type: 'celebration',
    event_day: addDays(28).birth_day,
    event_month: addDays(28).birth_month,
  });

  console.log('✓ Eventos criados');

  // --- Resumo ---

  const highlightLines = [
    '║  • Lucas    — hoje (destaque 1)      ║',
    HIGHLIGHTS_COUNT >= 2
      ? '║  • Maria    — em 2 dias (destaque 2) ║'
      : '║  • Maria    — em 35 dias             ║',
    HIGHLIGHTS_COUNT >= 3
      ? '║  • João     — em 5 dias (destaque 3) ║'
      : '║  • João     — em 40 dias             ║',
  ].join('\n');

  console.log(`
╔══════════════════════════════════════╗
║         Seed concluído! ✅            ║
╠══════════════════════════════════════╣
║  Login do usuário dev:               ║
║  email:  ${DEV_EMAIL.padEnd(27)}║
║  senha:  ${DEV_PASSWORD.padEnd(27)}║
╠══════════════════════════════════════╣
║  Grupos criados:                     ║
║  • Família  (5 membros) — seu        ║
║  • Trabalho (4 membros) — seu        ║
║  • Amigos   (3 membros) — seu        ║
║  • Dev Boys (4 membros) — membro     ║
╠══════════════════════════════════════╣
║  Destaques ativos: ${String(HIGHLIGHTS_COUNT).padEnd(18)}║
${highlightLines}
╚══════════════════════════════════════╝
  `);

  process.exit(0);
}

seed().catch((err) => {
  console.error('Erro no seed:', err);
  process.exit(1);
});
