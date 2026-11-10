import { log } from 'next-axiom';
import { makeUnsubscribeToken } from '@/lib/unsubscribe-token';
import database from 'infra/database';
import { ConflictError, NotFoundError, ValidationError } from 'infra/errors';
import email, { type CommunicationEmailContent } from 'models/email';
import { enqueuePush } from 'models/push-delivery';
import systemLog from 'models/system-log';

const APP_URL = process.env.APP_URL ?? 'https://www.rememberly.com.br';

export interface Communication {
  id: string;
  title: string;
  push_title: string | null;
  push_body: string | null;
  email_subject: string | null;
  email_body: string | null;
  send_email: boolean;
  send_push: boolean;
  status: 'draft' | 'sending' | 'sent';
  created_by: string | null;
  sent_at: Date | null;
  email_sent: number;
  email_failed: number;
  push_users: number;
  push_devices: number;
  created_at: Date;
  updated_at: Date;
}

export interface CommunicationInput {
  title: string;
  push_title?: string | null;
  push_body?: string | null;
  email_subject?: string | null;
  email_body?: string | null;
  send_email?: boolean;
  send_push?: boolean;
}

export interface RecipientCounts {
  email: number;
  push: number;
}

interface EmailRecipient {
  id: string;
  name: string;
  email: string;
}

export interface SendDeps {
  sendEmail: (input: {
    to: string;
    userName: string;
    communication: CommunicationEmailContent;
    unsubscribeUrl: string;
    isTest?: boolean;
  }) => Promise<void>;
}

const defaultDeps: SendDeps = { sendEmail: email.sendCommunicationEmail };

const EMAIL_RECIPIENTS_SQL = `
  FROM users u
  LEFT JOIN notification_preferences np ON np.user_id = u.id
  WHERE COALESCE(np.email_marketing, u.marketing_consent)
    AND NOT EXISTS (
      SELECT 1 FROM communication_deliveries cd
      WHERE cd.user_id = u.id AND cd.communication_id = $1 AND cd.channel = 'email'
    )`;

// Same device/session rules as the push queue, with the announcement preference.
const PUSH_DEVICES_SQL = `
  FROM push_devices d
  JOIN notification_preferences p ON p.user_id = d.user_id
  JOIN sessions s ON s.id = d.session_id
  WHERE d.disabled_at IS NULL AND p.push_marketing = true
    AND s.user_id = d.user_id AND (s.expires_at IS NULL OR s.expires_at > now())
    AND NOT EXISTS (
      SELECT 1 FROM communication_deliveries cd
      WHERE cd.user_id = d.user_id AND cd.communication_id = $1 AND cd.channel = 'push'
    )`;

async function create(input: CommunicationInput, createdBy: string) {
  const result = await database.query(
    `INSERT INTO communications
       (title, push_title, push_body, email_subject, email_body, send_email, send_push, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [
      input.title,
      input.push_title ?? null,
      input.push_body ?? null,
      input.email_subject ?? null,
      input.email_body ?? null,
      input.send_email ?? true,
      input.send_push ?? false,
      createdBy,
    ],
  );

  return result.rows[0] as Communication;
}

async function findById(id: string): Promise<Communication> {
  const result = await database.query(
    'SELECT * FROM communications WHERE id = $1',
    [id],
  );

  if (!result.rows[0]) {
    throw new NotFoundError({
      message: 'Comunicado não encontrado.',
      action: 'Verifique o identificador e tente novamente.',
    });
  }

  return result.rows[0] as Communication;
}

async function list() {
  const result = await database.query(
    'SELECT * FROM communications ORDER BY created_at DESC',
  );

  return result.rows as Communication[];
}

function alreadySent() {
  return new ConflictError({
    message: 'Este comunicado já foi enviado.',
    action: 'Crie um novo comunicado para enviar outra mensagem.',
    reason: 'already_sent',
  });
}

function definedOnly<T extends object>(input: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

async function update(id: string, input: Partial<CommunicationInput>) {
  const current = await findById(id);

  if (current.status !== 'draft') throw alreadySent();

  const merged = { ...current, ...definedOnly(input) };
  const result = await database.query(
    `UPDATE communications SET
       title = $2, push_title = $3, push_body = $4, email_subject = $5,
       email_body = $6, send_email = $7, send_push = $8, updated_at = now()
     WHERE id = $1 AND status = 'draft' RETURNING *`,
    [
      id,
      merged.title,
      merged.push_title,
      merged.push_body,
      merged.email_subject,
      merged.email_body,
      merged.send_email,
      merged.send_push,
    ],
  );

  if (!result.rows[0]) throw alreadySent();

  return result.rows[0] as Communication;
}

function assertSendable(communication: Communication) {
  if (!communication.send_email && !communication.send_push) {
    throw new ValidationError({
      message: 'Selecione ao menos um canal (e-mail ou push).',
      action: 'Marque e-mail e/ou push e tente novamente.',
    });
  }

  if (
    communication.send_email &&
    (!communication.email_subject || !communication.email_body)
  ) {
    throw new ValidationError({
      message: 'Preencha o assunto e o texto do e-mail.',
      action: 'Complete o conteúdo do e-mail ou desmarque o canal.',
    });
  }

  if (
    communication.send_push &&
    (!communication.push_title || !communication.push_body)
  ) {
    throw new ValidationError({
      message: 'Preencha o título e o texto do push.',
      action: 'Complete o conteúdo do push ou desmarque o canal.',
    });
  }
}

async function countRecipients(id: string): Promise<RecipientCounts> {
  const communication = await findById(id);

  const [emailResult, pushResult] = await Promise.all([
    communication.send_email
      ? database.query(
          `SELECT COUNT(*)::int AS count ${EMAIL_RECIPIENTS_SQL}`,
          [id],
        )
      : null,
    communication.send_push
      ? database.query(
          `SELECT COUNT(DISTINCT d.user_id)::int AS count ${PUSH_DEVICES_SQL}`,
          [id],
        )
      : null,
  ]);

  return {
    email: emailResult?.rows[0]?.count ?? 0,
    push: pushResult?.rows[0]?.count ?? 0,
  };
}

function emailContent(communication: Communication): CommunicationEmailContent {
  return {
    title: communication.title,
    subject: communication.email_subject ?? '',
    body: communication.email_body ?? '',
  };
}

function unsubscribeUrlFor(userId: string) {
  return `${APP_URL}/api/v1/unsubscribe?token=${makeUnsubscribeToken(userId)}`;
}

export interface TestSendResult {
  email: 'sent' | 'failed' | null;
  push_devices: number | null;
}

/** Sends the message only to the calling admin; nothing is recorded as delivered. */
async function sendTest(
  id: string,
  admin: { id: string; name: string; email: string },
  deps: SendDeps = defaultDeps,
): Promise<TestSendResult> {
  const communication = await findById(id);
  assertSendable(communication);

  const result: TestSendResult = { email: null, push_devices: null };

  if (communication.send_email) {
    try {
      await deps.sendEmail({
        to: admin.email,
        userName: admin.name,
        communication: emailContent(communication),
        unsubscribeUrl: unsubscribeUrlFor(admin.id),
        isTest: true,
      });
      result.email = 'sent';
    } catch (err) {
      result.email = 'failed';
      log.error('communication_test_email_failed', {
        communicationId: id,
        error: String(err),
      });
    }
  }

  if (communication.send_push) {
    result.push_devices = await enqueuePush(
      admin.id,
      `announcement-test:${id}:${Date.now()}`,
      { kind: 'announcement_test', communication_id: id },
    );
  }

  return result;
}

async function sendEmails(
  communication: Communication,
  deps: SendDeps,
): Promise<{ sent: number; failed: number }> {
  const recipients = (
    await database.query(
      `SELECT u.id, u.name, u.email ${EMAIL_RECIPIENTS_SQL}`,
      [communication.id],
    )
  ).rows as EmailRecipient[];

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i];

    try {
      await deps.sendEmail({
        to: recipient.email,
        userName: recipient.name,
        communication: emailContent(communication),
        unsubscribeUrl: unsubscribeUrlFor(recipient.id),
      });

      await database.query(
        `INSERT INTO communication_deliveries (communication_id, user_id, channel)
         VALUES ($1, $2, 'email') ON CONFLICT DO NOTHING`,
        [communication.id, recipient.id],
      );

      sent++;
    } catch (err) {
      failed++;
      log.error('communication_email_failed', {
        communicationId: communication.id,
        error: String(err),
      });
    }

    // Throttle: pause every 10 sends to respect rate limits
    if ((i + 1) % 10 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return { sent, failed };
}

async function enqueuePushes(
  communication: Communication,
): Promise<{ users: number; devices: number }> {
  const queued = await database.query(
    `INSERT INTO push_deliveries (device_id, user_id, session_id, dedup_key, data)
     SELECT d.id, d.user_id, d.session_id, $2, $3::jsonb ${PUSH_DEVICES_SQL}
     ON CONFLICT (device_id, dedup_key) DO NOTHING
     RETURNING user_id`,
    [
      communication.id,
      `announcement:${communication.id}`,
      JSON.stringify({
        kind: 'announcement',
        communication_id: communication.id,
      }),
    ],
  );

  const userIds = [
    ...new Set(queued.rows.map((row: { user_id: string }) => row.user_id)),
  ];

  if (userIds.length > 0) {
    await database.query(
      `INSERT INTO communication_deliveries (communication_id, user_id, channel)
       SELECT $1::uuid, unnest($2::uuid[]), 'push' ON CONFLICT DO NOTHING`,
      [communication.id, userIds],
    );
  }

  return { users: userIds.length, devices: queued.rows.length };
}

async function send(
  id: string,
  confirmed: RecipientCounts,
  deps: SendDeps = defaultDeps,
) {
  const communication = await findById(id);

  if (communication.status !== 'draft') throw alreadySent();

  assertSendable(communication);

  const counts = await countRecipients(id);

  if (counts.email !== confirmed.email || counts.push !== confirmed.push) {
    throw new ConflictError({
      message: `A contagem de destinatários mudou: agora são ${counts.email} por e-mail e ${counts.push} por push.`,
      action: 'Revise os números e confirme o envio novamente.',
      reason: 'recipients_changed',
    });
  }

  const claimed = await database.query(
    `UPDATE communications SET status = 'sending', updated_at = now()
     WHERE id = $1 AND status = 'draft' RETURNING id`,
    [id],
  );

  if (!claimed.rows[0]) throw alreadySent();

  const startTime = Date.now();
  log.info('communication_start', { communicationId: id, ...counts });

  try {
    const emailResult = communication.send_email
      ? await sendEmails(communication, deps)
      : { sent: 0, failed: 0 };
    const pushResult = communication.send_push
      ? await enqueuePushes(communication)
      : { users: 0, devices: 0 };

    const result = await database.query(
      `UPDATE communications SET status = 'sent', sent_at = now(), updated_at = now(),
         email_sent = $2, email_failed = $3, push_users = $4, push_devices = $5
       WHERE id = $1 RETURNING *`,
      [
        id,
        emailResult.sent,
        emailResult.failed,
        pushResult.users,
        pushResult.devices,
      ],
    );

    const status =
      emailResult.failed === 0
        ? 'success'
        : emailResult.sent === 0 && pushResult.users === 0
          ? 'failed'
          : 'partial';

    log.info('communication_done', {
      communicationId: id,
      emailSent: emailResult.sent,
      emailFailed: emailResult.failed,
      pushUsers: pushResult.users,
      pushDevices: pushResult.devices,
    });

    await systemLog.recordCronRun({
      job_name: 'communication_send',
      status,
      metrics: {
        email_sent: emailResult.sent,
        email_failed: emailResult.failed,
        push_users: pushResult.users,
      },
      duration_ms: Date.now() - startTime,
    });

    return result.rows[0] as Communication;
  } catch (err) {
    // Per-user dedup makes a later retry safe, so hand the draft back.
    await database.query(
      `UPDATE communications SET status = 'draft', updated_at = now()
       WHERE id = $1 AND status = 'sending'`,
      [id],
    );
    throw err;
  }
}

const communication = {
  create,
  findById,
  list,
  update,
  countRecipients,
  sendTest,
  send,
};

export default communication;
