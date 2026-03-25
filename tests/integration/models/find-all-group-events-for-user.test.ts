import orchestrator from 'tests/orchestrator';
import database from 'infra/database';
import groupMember from 'models/group-member';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe('groupMember.findAllBirthdaysForUser()', () => {
  it('deve retornar lista vazia quando user não tem grupos', async () => {
    const cookie = await orchestrator.createAuthCookie();
    const token = orchestrator.extractToken(cookie);

    const userResult = await database.query(
      `SELECT user_id FROM sessions WHERE token = $1`,
      [token],
    );
    const userId = userResult.rows[0].user_id;

    const birthdays = await groupMember.findAllBirthdaysForUser(userId);

    expect(birthdays).toEqual([]);
  });

  it('deve retornar aniversários dos outros membros do grupo', async () => {
    const ownerCookie = await orchestrator.createAuthCookie({
      name: 'Maria',
      birth_day: 15,
      birth_month: 3,
    });
    const ownerToken = orchestrator.extractToken(ownerCookie);

    const group = await orchestrator.createGroup(ownerToken, 'Família');

    const memberCookie = await orchestrator.createAuthCookie({
      name: 'João',
      birth_day: 22,
      birth_month: 7,
    });
    const memberToken = orchestrator.extractToken(memberCookie);
    await orchestrator.joinGroup(memberToken, group.invite_code);

    const ownerResult = await database.query(
      `SELECT user_id FROM sessions WHERE token = $1`,
      [ownerToken],
    );
    const ownerId = ownerResult.rows[0].user_id;

    const birthdays = await groupMember.findAllBirthdaysForUser(ownerId);

    expect(birthdays.length).toBeGreaterThanOrEqual(1);
    const joaoBirthday = birthdays.find((b) => b.title === 'João');
    expect(joaoBirthday).toBeDefined();
    expect(joaoBirthday.event_day).toBe(22);
    expect(joaoBirthday.event_month).toBe(7);
    expect(joaoBirthday.group_name).toBe('Família');
  });

  it('não deve retornar o próprio aniversário do user', async () => {
    const ownerCookie = await orchestrator.createAuthCookie({
      name: 'Carlos',
      birth_day: 10,
      birth_month: 5,
    });
    const ownerToken = orchestrator.extractToken(ownerCookie);

    await orchestrator.createGroup(ownerToken, 'Solo');

    const ownerResult = await database.query(
      `SELECT user_id FROM sessions WHERE token = $1`,
      [ownerToken],
    );
    const ownerId = ownerResult.rows[0].user_id;

    const birthdays = await groupMember.findAllBirthdaysForUser(ownerId);

    const ownBirthday = birthdays.find((b) => b.title === 'Carlos');
    expect(ownBirthday).toBeUndefined();
  });

  it('deve retornar aniversários de múltiplos grupos', async () => {
    const userCookie = await orchestrator.createAuthCookie({
      name: 'Ana',
      birth_day: 1,
      birth_month: 1,
    });
    const userToken = orchestrator.extractToken(userCookie);

    const group1 = await orchestrator.createGroup(userToken, 'Trabalho');
    const group2 = await orchestrator.createGroup(userToken, 'Amigos');

    const member1Cookie = await orchestrator.createAuthCookie({
      name: 'Pedro',
      birth_day: 8,
      birth_month: 4,
    });
    const member1Token = orchestrator.extractToken(member1Cookie);
    await orchestrator.joinGroup(member1Token, group1.invite_code);

    const member2Cookie = await orchestrator.createAuthCookie({
      name: 'Lucas',
      birth_day: 20,
      birth_month: 12,
    });
    const member2Token = orchestrator.extractToken(member2Cookie);
    await orchestrator.joinGroup(member2Token, group2.invite_code);

    const userResult = await database.query(
      `SELECT user_id FROM sessions WHERE token = $1`,
      [userToken],
    );
    const userId = userResult.rows[0].user_id;

    const birthdays = await groupMember.findAllBirthdaysForUser(userId);

    const names = birthdays.map((b) => b.title);
    expect(names).toContain('Pedro');
    expect(names).toContain('Lucas');

    const groups = birthdays.map((b) => b.group_name);
    expect(groups).toContain('Trabalho');
    expect(groups).toContain('Amigos');
  });

  it('não deve retornar membros sem data de aniversário', async () => {
    const ownerCookie = await orchestrator.createAuthCookie({
      name: 'Dono',
      birth_day: 5,
      birth_month: 9,
    });
    const ownerToken = orchestrator.extractToken(ownerCookie);

    const group = await orchestrator.createGroup(ownerToken, 'Misto');

    // Membro sem aniversário cadastrado
    const memberCookie = await orchestrator.createAuthCookie({
      name: 'SemData',
    });
    const memberToken = orchestrator.extractToken(memberCookie);
    await orchestrator.joinGroup(memberToken, group.invite_code);

    // Remove birthday from this member
    const memberResult = await database.query(
      `SELECT user_id FROM sessions WHERE token = $1`,
      [memberToken],
    );
    await database.query(
      `UPDATE users SET birth_day = NULL, birth_month = NULL WHERE id = $1`,
      [memberResult.rows[0].user_id],
    );

    const ownerResult = await database.query(
      `SELECT user_id FROM sessions WHERE token = $1`,
      [ownerToken],
    );
    const ownerId = ownerResult.rows[0].user_id;

    const birthdays = await groupMember.findAllBirthdaysForUser(ownerId);

    const semData = birthdays.find((b) => b.title === 'SemData');
    expect(semData).toBeUndefined();
  });

  it('deve ordenar por mês e dia', async () => {
    const ownerCookie = await orchestrator.createAuthCookie({
      name: 'Ordenador',
      birth_day: 1,
      birth_month: 6,
    });
    const ownerToken = orchestrator.extractToken(ownerCookie);

    const group = await orchestrator.createGroup(ownerToken, 'Ordem');

    const m1Cookie = await orchestrator.createAuthCookie({
      name: 'Dezembro',
      birth_day: 25,
      birth_month: 12,
    });
    await orchestrator.joinGroup(
      orchestrator.extractToken(m1Cookie),
      group.invite_code,
    );

    const m2Cookie = await orchestrator.createAuthCookie({
      name: 'Fevereiro',
      birth_day: 14,
      birth_month: 2,
    });
    await orchestrator.joinGroup(
      orchestrator.extractToken(m2Cookie),
      group.invite_code,
    );

    const m3Cookie = await orchestrator.createAuthCookie({
      name: 'Agosto',
      birth_day: 3,
      birth_month: 8,
    });
    await orchestrator.joinGroup(
      orchestrator.extractToken(m3Cookie),
      group.invite_code,
    );

    const ownerResult = await database.query(
      `SELECT user_id FROM sessions WHERE token = $1`,
      [ownerToken],
    );
    const ownerId = ownerResult.rows[0].user_id;

    const birthdays = await groupMember.findAllBirthdaysForUser(ownerId);
    const groupBirthdays = birthdays.filter((b) => b.group_name === 'Ordem');

    for (let i = 1; i < groupBirthdays.length; i++) {
      const prev = groupBirthdays[i - 1];
      const curr = groupBirthdays[i];
      const prevSort = prev.event_month * 100 + prev.event_day;
      const currSort = curr.event_month * 100 + curr.event_day;
      expect(prevSort).toBeLessThanOrEqual(currSort);
    }
  });
});
