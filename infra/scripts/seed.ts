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
import { mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import database from 'infra/database';

const DEV_EMAIL = 'dev@dev.com';
const DEV_PASSWORD = 'senha123';

// Set to 1, 2 or 3 and run `npm run seed` to validate the highlights carousel
const HIGHLIGHTS_COUNT = 3;

const today = new Date();
today.setHours(0, 0, 0, 0);

function addDays(n: number): { birth_day: number; birth_month: number } {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return { birth_day: d.getDate(), birth_month: d.getMonth() + 1 };
}

// Photos are served by Next from public/uploads. A phone cannot reach
// localhost, so prefer the machine's LAN address when there is one.
function publicBase() {
  const lan = Object.values(os.networkInterfaces())
    .flat()
    .find(
      (net) => net?.family === 'IPv4' && net.address.startsWith('192.168.'),
    );
  if (lan) return `http://${lan.address}:3000`;
  return (process.env.APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}

async function giftPhoto(slug: string, background: string, accent: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    <rect width="512" height="512" fill="${background}"/>
    <rect x="150" y="250" width="212" height="160" rx="14" fill="#ffffff"/>
    <rect x="132" y="200" width="248" height="56" rx="12" fill="#ffffff"/>
    <rect x="244" y="200" width="24" height="210" fill="${accent}"/>
    <circle cx="222" cy="176" r="30" fill="none" stroke="${accent}" stroke-width="16"/>
    <circle cx="290" cy="176" r="30" fill="none" stroke="${accent}" stroke-width="16"/>
  </svg>`;
  const directory = path.join(process.cwd(), 'public', 'uploads', 'gifts');
  await mkdir(directory, { recursive: true });
  const file = `seed-${slug}.webp`;
  await sharp(Buffer.from(svg))
    .webp({ quality: 82 })
    .toFile(path.join(directory, file));
  return `${publicBase()}/uploads/gifts/${file}`;
}

async function clearDatabase() {
  await database.query(`
    TRUNCATE TABLE
      otp_tokens,
      password_reset_tokens,
      sessions,
      events,
      gift_reservations,
      gift_items,
      gift_lists,
      group_members,
      groups,
      users
    RESTART IDENTITY CASCADE
  `);
  console.log('✓ Database cleared');
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

async function createGiftList(
  userId: string,
  items: {
    title: string;
    link?: string;
    description?: string;
    photo?: [slug: string, background: string, accent: string];
  }[],
) {
  const list = await database.query(
    `INSERT INTO gift_lists (user_id) VALUES ($1) RETURNING id`,
    [userId],
  );
  const ids: string[] = [];
  for (const [position, item] of items.entries()) {
    const created = await database.query(
      `INSERT INTO gift_items (list_id, title, link, description, photo_url, created_at)
       VALUES ($1, $2, $3, $4, $5, now() - ($6 || ' minutes')::interval)
       RETURNING id`,
      [
        list.rows[0].id,
        item.title,
        item.link ?? null,
        item.description ?? null,
        item.photo ? await giftPhoto(...item.photo) : null,
        String(position),
      ],
    );
    ids.push(created.rows[0].id);
  }
  return ids;
}

async function reserveGift(
  itemId: string,
  userId: string,
  status: 'reserved' | 'purchased',
) {
  await database.query(
    `INSERT INTO gift_reservations (item_id, user_id, status) VALUES ($1, $2, $3)`,
    [itemId, userId, status],
  );
}

async function seed() {
  console.log('\n🌱 Starting seed...\n');

  await clearDatabase();

  // --- Users ---

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

  const rafael = await createUser({
    name: 'Rafael Lima',
    email: 'rafael@exemplo.com',
    password: 'senha123',
    ...addDays(-9),
    birth_year: 1992,
  });

  const julia = await createUser({
    name: 'Julia Santos',
    email: 'julia@exemplo.com',
    password: 'senha123',
    ...addDays(35),
    birth_year: 1997,
  });

  console.log('✓ Users created');

  // --- Groups ---

  const familia = await createGroup('Família', dev.id);
  await addMember(familia.id, maria.id);
  await addMember(familia.id, joao.id);
  await addMember(familia.id, ana.id);
  await addMember(familia.id, pedro.id);
  await addMember(familia.id, rafael.id);

  const trabalho = await createGroup('Trabalho', dev.id);
  await addMember(trabalho.id, carla.id);
  await addMember(trabalho.id, lucas.id);
  await addMember(trabalho.id, julia.id);

  const amigos = await createGroup('Amigos', dev.id);
  await addMember(amigos.id, maria.id);
  await addMember(amigos.id, lucas.id);

  // Group created by someone else — dev is just a member
  const devBoys = await createGroup('Dev Boys', lucas.id);
  await addMember(devBoys.id, dev.id);
  await addMember(devBoys.id, joao.id);
  await addMember(devBoys.id, pedro.id);

  console.log('✓ Groups created');

  // --- Dev user events ---

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

  // Dates already past this year show up as next year's events (dimmed)
  await createEvent(dev.id, {
    title: 'Aniversário de casamento dos avós',
    type: 'wedding_anniversary',
    event_day: addDays(-12).birth_day,
    event_month: addDays(-12).birth_month,
  });

  await createEvent(dev.id, {
    title: 'Formatura do Lucas',
    type: 'celebration',
    event_day: addDays(-30).birth_day,
    event_month: addDays(-30).birth_month,
  });

  console.log('✓ Events created');

  // --- Gift lists ---

  await createGiftList(dev.id, [
    {
      title: 'Fone de ouvido sem fio',
      link: 'https://example.com/fone',
      description: 'Preto, de preferência com cancelamento de ruído',
      photo: ['dev-fone', '#FDE3EC', '#E53565'],
    },
    { title: 'Livro: O Hobbit', description: 'Edição de capa dura' },
    {
      title: 'Cafeteira italiana',
      link: 'https://example.com/cafeteira',
      photo: ['dev-cafeteira', '#FEE8D6', '#F69855'],
    },
  ]);

  const [lucasTenis, lucasLivro] = await createGiftList(lucas.id, [
    {
      title: 'Tênis de corrida',
      link: 'https://example.com/tenis',
      description: 'Tamanho 42',
      photo: ['lucas-tenis', '#DCEBFB', '#1D4ED8'],
    },
    { title: 'Livro: Hábitos Atômicos' },
    {
      title: 'Mochila para notebook',
      link: 'https://example.com/mochila',
      photo: ['lucas-mochila', '#DFF3E4', '#245B34'],
    },
  ]);
  await reserveGift(lucasTenis!, carla.id, 'reserved');
  await reserveGift(lucasLivro!, dev.id, 'reserved');

  const [mariaVela, mariaVinho] = await createGiftList(maria.id, [
    {
      title: 'Kit de velas aromáticas',
      description: 'Cheiro de lavanda',
      photo: ['maria-velas', '#F1E4F8', '#AC26A4'],
    },
    {
      title: 'Vinho tinto',
      link: 'https://example.com/vinho',
      photo: ['maria-vinho', '#FBE0E3', '#B42335'],
    },
    { title: 'Jogo de panelas' },
  ]);
  await reserveGift(mariaVela!, dev.id, 'reserved');
  await reserveGift(mariaVinho!, ana.id, 'purchased');

  const [joaoCamisa] = await createGiftList(joao.id, [
    {
      title: 'Camisa do time',
      description: 'Tamanho M',
      photo: ['joao-camisa', '#DFF3E4', '#245B34'],
    },
    { title: 'Churrasqueira portátil', link: 'https://example.com/churras' },
  ]);
  await reserveGift(joaoCamisa!, dev.id, 'purchased');

  await createGiftList(ana.id, [
    { title: 'Vaso de cerâmica' },
    { title: 'Caderno de sketch', description: 'Folhas pretas' },
  ]);

  await createGiftList(carla.id, [
    {
      title: 'Câmera instantânea',
      link: 'https://example.com/camera',
      photo: ['carla-camera', '#FFF3C9', '#B7791F'],
    },
  ]);

  console.log('✓ Gift lists created');

  // --- Summary ---

  const highlightLines = [
    '║  • Lucas    — today (highlight 1)    ║',
    HIGHLIGHTS_COUNT >= 2
      ? '║  • Maria    — in 2 days (highlight 2)║'
      : '║  • Maria    — in 35 days             ║',
    HIGHLIGHTS_COUNT >= 3
      ? '║  • João     — in 5 days (highlight 3)║'
      : '║  • João     — in 40 days             ║',
  ].join('\n');

  console.log(`
╔══════════════════════════════════════╗
║         Seed complete! ✅             ║
╠══════════════════════════════════════╣
║  Dev user login:                     ║
║  email:    ${DEV_EMAIL.padEnd(25)}║
║  password: ${DEV_PASSWORD.padEnd(25)}║
╠══════════════════════════════════════╣
║  Groups created:                     ║
║  • Família  (6 members) — owner      ║
║  • Trabalho (4 members) — owner      ║
║  • Amigos   (3 members) — owner      ║
║  • Dev Boys (4 members) — member     ║
╠══════════════════════════════════════╣
║  Active highlights: ${String(HIGHLIGHTS_COUNT).padEnd(17)}║
${highlightLines}
╚══════════════════════════════════════╝
  `);

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
