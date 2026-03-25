import crypto from 'crypto';
import database from 'infra/database';
import { NotFoundError, ValidationError } from 'infra/errors';

const MAX_NAME_LENGTH = 100;
const INVITE_CODE_LENGTH = 8;
const MAX_RETRIES = 3;

function generateInviteCode(): string {
  return crypto
    .randomBytes(6)
    .toString('base64url')
    .slice(0, INVITE_CODE_LENGTH)
    .toLowerCase();
}

function validateName(name: string | undefined | null): string {
  if (!name || name.trim() === '') {
    throw new ValidationError({
      message: 'O nome do grupo é obrigatório.',
      action: 'Informe um nome para o grupo.',
    });
  }

  const trimmed = name.trim();

  if (trimmed.length > MAX_NAME_LENGTH) {
    throw new ValidationError({
      message: `O nome do grupo deve ter no máximo ${MAX_NAME_LENGTH} caracteres.`,
      action: 'Reduza o tamanho do nome.',
    });
  }

  return trimmed;
}

async function create(userId: string, input: { name: string }) {
  const name = validateName(input.name);

  let inviteCode = '';
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const code = generateInviteCode();
    const existing = await database.query(
      `SELECT id FROM groups WHERE invite_code = $1`,
      [code],
    );
    if (existing.rows.length === 0) {
      inviteCode = code;
      break;
    }
  }

  if (!inviteCode) {
    throw new ValidationError({
      message: 'Não foi possível gerar um código de convite único.',
      action: 'Tente novamente.',
    });
  }

  const groupResult = await database.query(
    `INSERT INTO groups (name, invite_code, created_by)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [name, inviteCode, userId],
  );

  const createdGroup = groupResult.rows[0];

  await database.query(
    `INSERT INTO group_members (group_id, user_id, role)
     VALUES ($1, $2, 'owner')`,
    [createdGroup.id, userId],
  );

  return { ...createdGroup, member_count: 1, role: 'owner' };
}

async function findById(groupId: string) {
  const result = await database.query(`SELECT * FROM groups WHERE id = $1`, [
    groupId,
  ]);

  if (!result.rows[0]) {
    throw new NotFoundError({
      message: 'Grupo não encontrado.',
      action: 'Verifique o ID do grupo.',
    });
  }

  return result.rows[0];
}

async function findAllByUserId(userId: string) {
  const result = await database.query(
    `SELECT g.*, gm.role,
            (SELECT COUNT(*) FROM group_members gm2 WHERE gm2.group_id = g.id)::int AS member_count
     FROM groups g
     JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = $1
     ORDER BY g.created_at DESC`,
    [userId],
  );

  return result.rows;
}

async function findByInviteCode(inviteCode: string) {
  const result = await database.query(
    `SELECT * FROM groups WHERE invite_code = $1`,
    [inviteCode],
  );

  return result.rows[0] ?? null;
}

async function update(groupId: string, input: { name: string }) {
  const name = validateName(input.name);

  const result = await database.query(
    `UPDATE groups SET name = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [name, groupId],
  );

  return result.rows[0];
}

async function deleteById(groupId: string) {
  await database.query(`DELETE FROM groups WHERE id = $1`, [groupId]);
}

const group = {
  create,
  findById,
  findAllByUserId,
  findByInviteCode,
  update,
  deleteById,
};

export default group;
