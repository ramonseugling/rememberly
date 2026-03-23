import database from 'infra/database';
import { NotFoundError, ValidationError } from 'infra/errors';
import event from 'models/event';
import {
  VALID_TYPES,
  validateCustomType,
  validateDay,
  validateMonth,
  validateTitle,
  validateType,
} from 'models/event-validators';

interface CreateGroupEventInput {
  title?: string;
  type?: string;
  custom_type?: string | null;
  event_day?: number;
  event_month?: number;
  source_event_id?: string;
  source_user_id?: string;
}

interface UpdateGroupEventInput {
  title?: string;
  type?: string;
  custom_type?: string | null;
  event_day?: number;
  event_month?: number;
}

async function create(
  groupId: string,
  userId: string,
  input: CreateGroupEventInput,
) {
  let title: string;
  let type: string;
  let customType: string | null = null;
  let eventDay: number;
  let eventMonth: number;

  if (input.source_event_id) {
    const sourceEvent = await event.findOneById(input.source_event_id, userId);
    title = sourceEvent.title;
    type = sourceEvent.type;
    customType = sourceEvent.custom_type;
    eventDay = sourceEvent.event_day;
    eventMonth = sourceEvent.event_month;
  } else {
    title = validateTitle(input.title);

    if (!input.type) {
      throw new ValidationError({
        message: 'O tipo do evento é obrigatório.',
        action: `Use um dos tipos válidos: ${VALID_TYPES.join(', ')}.`,
      });
    }

    validateType(input.type);
    validateDay(input.event_day!);
    validateMonth(input.event_month!);

    type = input.type;
    customType =
      type === 'custom' ? validateCustomType(input.custom_type) : null;
    eventDay = input.event_day!;
    eventMonth = input.event_month!;
  }

  const result = await database.query(
    `INSERT INTO group_events (group_id, title, type, custom_type, event_day, event_month, created_by, source_user_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      groupId,
      title,
      type,
      customType,
      eventDay,
      eventMonth,
      userId,
      input.source_user_id ?? null,
    ],
  );

  return result.rows[0];
}

async function findAllByGroupId(groupId: string) {
  const result = await database.query(
    `SELECT ge.*,
            u.id AS creator_id,
            u.name AS creator_name
     FROM group_events ge
     LEFT JOIN users u ON u.id = ge.created_by
     WHERE ge.group_id = $1
     ORDER BY ge.event_month ASC, ge.event_day ASC`,
    [groupId],
  );

  return result.rows.map((row) => ({
    id: row.id,
    group_id: row.group_id,
    title: row.title,
    type: row.type,
    custom_type: row.custom_type,
    event_day: row.event_day,
    event_month: row.event_month,
    source_user_id: row.source_user_id,
    created_by: row.creator_id
      ? { id: row.creator_id, name: row.creator_name }
      : null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

async function findOneById(eventId: string, groupId: string) {
  const result = await database.query(
    `SELECT * FROM group_events WHERE id = $1 AND group_id = $2 LIMIT 1`,
    [eventId, groupId],
  );

  if (!result.rows[0]) {
    throw new NotFoundError({
      message: 'Evento do grupo não encontrado.',
      action: 'Verifique o ID do evento.',
    });
  }

  return result.rows[0];
}

async function update(
  eventId: string,
  groupId: string,
  input: UpdateGroupEventInput,
) {
  const existing = await findOneById(eventId, groupId);

  if (input.type !== undefined) {
    validateType(input.type);
  }

  if (input.event_day !== undefined) {
    validateDay(input.event_day);
  }

  if (input.event_month !== undefined) {
    validateMonth(input.event_month);
  }

  const effectiveType = input.type ?? existing.type;

  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (input.title !== undefined) {
    const trimmed = validateTitle(input.title);
    fields.push(`title = $${paramIndex++}`);
    values.push(trimmed);
  }

  if (input.type !== undefined) {
    fields.push(`type = $${paramIndex++}`);
    values.push(input.type);
  }

  if (effectiveType === 'custom') {
    const customType = validateCustomType(
      input.custom_type ?? existing.custom_type,
    );
    fields.push(`custom_type = $${paramIndex++}`);
    values.push(customType);
  } else if (input.type !== undefined) {
    fields.push(`custom_type = $${paramIndex++}`);
    values.push(null);
  }

  if (input.event_day !== undefined) {
    fields.push(`event_day = $${paramIndex++}`);
    values.push(input.event_day);
  }

  if (input.event_month !== undefined) {
    fields.push(`event_month = $${paramIndex++}`);
    values.push(input.event_month);
  }

  if (fields.length === 0) {
    throw new ValidationError({
      message: 'Nenhum campo para atualizar foi informado.',
      action: 'Informe ao menos um campo para atualizar.',
    });
  }

  fields.push(`updated_at = NOW()`);
  values.push(eventId, groupId);

  const result = await database.query(
    `UPDATE group_events SET ${fields.join(', ')}
     WHERE id = $${paramIndex++} AND group_id = $${paramIndex}
     RETURNING *`,
    values,
  );

  return result.rows[0];
}

async function deleteById(eventId: string, groupId: string) {
  await findOneById(eventId, groupId);

  await database.query(
    `DELETE FROM group_events WHERE id = $1 AND group_id = $2`,
    [eventId, groupId],
  );
}

const groupEvent = {
  create,
  findAllByGroupId,
  findOneById,
  update,
  deleteById,
};

export default groupEvent;
