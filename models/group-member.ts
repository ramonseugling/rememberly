import database from 'infra/database';
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from 'infra/errors';
import group from 'models/group';

const MAX_MEMBERS = 50;

async function autoCreateBirthdayEvent(groupId: string, userId: string) {
  const userResult = await database.query(
    `SELECT name, birth_day, birth_month FROM users WHERE id = $1`,
    [userId],
  );

  const user = userResult.rows[0];

  if (!user || !user.birth_day || !user.birth_month) {
    return;
  }

  await database.query(
    `INSERT INTO group_events (group_id, title, type, event_day, event_month, created_by, source_user_id)
     VALUES ($1, $2, 'birthday', $3, $4, $5, $5)`,
    [groupId, user.name, user.birth_day, user.birth_month, userId],
  );
}

async function deleteAutoBirthdayEvents(groupId: string, userId: string) {
  await database.query(
    `DELETE FROM group_events WHERE group_id = $1 AND source_user_id = $2`,
    [groupId, userId],
  );
}

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

  await autoCreateBirthdayEvent(foundGroup.id, userId);

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

  await deleteAutoBirthdayEvents(groupId, targetUserId);

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

const groupMember = {
  join,
  remove,
  findAllByGroupId,
  findMembership,
  assertMember,
  assertOwner,
  countMembers,
  autoCreateBirthdayEvent,
};

export default groupMember;
