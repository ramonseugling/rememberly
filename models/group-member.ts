import database from 'infra/database';
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from 'infra/errors';
import group from 'models/group';

const MAX_MEMBERS = 50;

async function join(inviteCode: string, userId: string) {
  if (!inviteCode || inviteCode.trim() === '') {
    throw new ValidationError({
      message: 'O código de convite é obrigatório.',
      action: 'Informe o código de convite do grupo.',
    });
  }

  const foundGroup = await group.findByInviteCode(inviteCode.trim());

  if (!foundGroup) {
    throw new NotFoundError({
      message: 'Grupo não encontrado.',
      action: 'Verifique o código de convite e tente novamente.',
    });
  }

  const existingMember = await database.query(
    `SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2`,
    [foundGroup.id, userId],
  );

  if (existingMember.rows.length > 0) {
    throw new ValidationError({
      message: 'Você já faz parte deste grupo.',
      action: 'Acesse o grupo pela lista de grupos.',
    });
  }

  const memberCount = await countMembers(foundGroup.id);

  if (memberCount >= MAX_MEMBERS) {
    throw new ValidationError({
      message: `Este grupo atingiu o limite de ${MAX_MEMBERS} membros.`,
      action: 'Solicite ao criador do grupo para liberar vagas.',
    });
  }

  await database.query(
    `INSERT INTO group_members (group_id, user_id, role)
     VALUES ($1, $2, 'member')`,
    [foundGroup.id, userId],
  );

  const newCount = memberCount + 1;

  return { ...foundGroup, member_count: newCount, role: 'member' };
}

async function remove(
  groupId: string,
  targetUserId: string,
  requestingUserId: string,
) {
  await assertMember(groupId, requestingUserId);
  const targetMembership = await findMembership(groupId, targetUserId);

  if (!targetMembership) {
    throw new NotFoundError({
      message: 'Membro não encontrado neste grupo.',
      action: 'Verifique o ID do membro.',
    });
  }

  if (targetUserId === requestingUserId) {
    if (targetMembership.role === 'owner') {
      throw new ValidationError({
        message:
          'O criador do grupo não pode sair. Delete o grupo para encerrá-lo.',
        action: 'Use a opção de deletar grupo.',
      });
    }
  } else {
    const requestingMembership = await findMembership(
      groupId,
      requestingUserId,
    );
    if (requestingMembership?.role !== 'owner') {
      throw new UnauthorizedError({
        message: 'Apenas o criador do grupo pode remover membros.',
        action: 'Solicite ao criador do grupo.',
      });
    }
  }

  await database.query(
    `DELETE FROM group_members WHERE group_id = $1 AND user_id = $2`,
    [groupId, targetUserId],
  );
}

async function findAllByGroupId(groupId: string) {
  const result = await database.query(
    `SELECT u.id, u.name, u.email, u.birth_day, u.birth_month, u.birth_year,
            gm.role, gm.created_at AS joined_at
     FROM group_members gm
     JOIN users u ON u.id = gm.user_id
     WHERE gm.group_id = $1
     ORDER BY (gm.role = 'owner') DESC, gm.created_at ASC`,
    [groupId],
  );

  return result.rows;
}

async function findMembership(groupId: string, userId: string) {
  const result = await database.query(
    `SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2`,
    [groupId, userId],
  );

  return result.rows[0] ?? null;
}

async function assertMember(groupId: string, userId: string) {
  const membership = await findMembership(groupId, userId);

  if (!membership) {
    throw new NotFoundError({
      message: 'Grupo não encontrado.',
      action: 'Verifique o ID do grupo.',
    });
  }

  return membership;
}

async function assertOwner(groupId: string, userId: string) {
  const membership = await assertMember(groupId, userId);

  if (membership.role !== 'owner') {
    throw new UnauthorizedError({
      message: 'Apenas o criador do grupo pode realizar esta ação.',
      action: 'Solicite ao criador do grupo.',
    });
  }

  return membership;
}

async function countMembers(groupId: string): Promise<number> {
  const result = await database.query(
    `SELECT COUNT(*)::int AS count FROM group_members WHERE group_id = $1`,
    [groupId],
  );

  return result.rows[0].count;
}

async function findAllBirthdaysByUserId(userId: string) {
  const result = await database.query(
    `SELECT gm.group_id, u.name, u.birth_day, u.birth_month
     FROM group_members gm
     JOIN users u ON u.id = gm.user_id
     JOIN group_members my_membership
       ON my_membership.group_id = gm.group_id
       AND my_membership.user_id = $1
     WHERE gm.user_id != $1
       AND u.birth_day IS NOT NULL
       AND u.birth_month IS NOT NULL
     ORDER BY u.birth_month ASC, u.birth_day ASC`,
    [userId],
  );

  return result.rows as {
    group_id: string;
    name: string;
    birth_day: number;
    birth_month: number;
  }[];
}

async function findAllBirthdaysForUser(userId: string) {
  const result = await database.query(
    `SELECT u.id AS user_id, u.name AS title,
            u.birth_day AS event_day, u.birth_month AS event_month,
            MIN(g.name) AS group_name,
            COUNT(DISTINCT g.id)::int AS group_count
     FROM group_members gm
     JOIN groups g ON g.id = gm.group_id
     JOIN group_members my_membership ON my_membership.group_id = gm.group_id AND my_membership.user_id = $1
     JOIN users u ON u.id = gm.user_id
     WHERE gm.user_id != $1
       AND u.birth_day IS NOT NULL AND u.birth_month IS NOT NULL
     GROUP BY u.id, u.name, u.birth_day, u.birth_month
     ORDER BY u.birth_month ASC, u.birth_day ASC`,
    [userId],
  );

  return result.rows as {
    user_id: string;
    title: string;
    event_day: number;
    event_month: number;
    group_name: string;
    group_count: number;
  }[];
}

const groupMember = {
  join,
  remove,
  findAllByGroupId,
  findAllBirthdaysByUserId,
  findAllBirthdaysForUser,
  findMembership,
  assertMember,
  assertOwner,
  countMembers,
};

export default groupMember;
