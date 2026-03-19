import { log } from 'next-axiom';
import { Resend } from 'resend';
import { escapeHtml } from '@/lib/sanitize';

const EVENT_TYPE_LABELS: Record<string, string> = {
  birthday: '🎂 Aniversário',
  dating_anniversary: '💕 Aniversário de Namoro',
  wedding_anniversary: '💍 Aniversário de Casamento',
  celebration: '🎉 Celebração',
};

interface SendEventNotificationInput {
  to: string;
  userName: string;
  eventTitle: string;
  eventType: string;
  customType?: string | null;
}

async function sendEventNotification(input: SendEventNotificationInput) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const typeLabel =
    input.eventType === 'custom' && input.customType
      ? `✨ ${input.customType}`
      : (EVENT_TYPE_LABELS[input.eventType] ?? input.eventType);

  const safeUserName = escapeHtml(input.userName);
  const safeEventTitle = escapeHtml(input.eventTitle);
  const safeTypeLabel = escapeHtml(typeLabel);

  await resend.emails.send({
    from:
      process.env.EMAIL_FROM ?? 'My Forever Dates <noreply@myforeverdates.com>',
    to: input.to,
    subject: `${typeLabel} — ${input.eventTitle}`,
    html: buildEmailHtml(safeUserName, safeEventTitle, safeTypeLabel),
  });

  log.info('event_notification_sent', {
    to: input.to,
    eventType: input.eventType,
    eventTitle: input.eventTitle,
  });
}

function buildEmailHtml(
  userName: string,
  eventTitle: string,
  typeLabel: string,
) {
  return `
    <div style="font-family: 'Quicksand', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #fff; border-radius: 16px;">
      <h1 style="font-family: 'Fredoka', sans-serif; color: #e0668a; font-size: 24px; margin-bottom: 8px;">
        My Forever Dates
      </h1>
      <p style="color: #3b4571; font-size: 16px; margin-bottom: 24px;">
        Olá, <strong>${userName}</strong>! 👋
      </p>
      <div style="background: linear-gradient(135deg, #e06490, #f0894d); padding: 24px; border-radius: 24px; margin-bottom: 24px;">
        <p style="color: rgba(255,255,255,0.85); font-size: 14px; margin: 0 0 8px 0;">
          ${typeLabel}
        </p>
        <p style="color: #ffffff; font-size: 20px; font-weight: 600; margin: 0;">
          ${eventTitle}
        </p>
      </div>
      <p style="color: #7a7fa5; font-size: 14px;">
        Hoje é um dia especial! Não esqueça de celebrar. 🎉
      </p>
    </div>
  `;
}

interface SendReminderNotificationInput {
  to: string;
  userName: string;
  eventTitle: string;
  eventType: string;
  customType?: string | null;
  daysUntil: number;
}

async function sendReminderNotification(input: SendReminderNotificationInput) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const typeLabel =
    input.eventType === 'custom' && input.customType
      ? `✨ ${input.customType}`
      : (EVENT_TYPE_LABELS[input.eventType] ?? input.eventType);

  const safeUserName = escapeHtml(input.userName);
  const safeEventTitle = escapeHtml(input.eventTitle);
  const safeTypeLabel = escapeHtml(typeLabel);

  const daysText = input.daysUntil === 1 ? '1 dia' : `${input.daysUntil} dias`;

  await resend.emails.send({
    from:
      process.env.EMAIL_FROM ?? 'My Forever Dates <noreply@myforeverdates.com>',
    to: input.to,
    subject: `⏰ Lembrete: Faltam ${daysText} para ${typeLabel.replace(/^[^\w]+ /, '')} — ${input.eventTitle}`,
    html: buildReminderHtml(
      safeUserName,
      safeEventTitle,
      safeTypeLabel,
      daysText,
    ),
  });

  log.info('reminder_notification_sent', {
    to: input.to,
    eventType: input.eventType,
    eventTitle: input.eventTitle,
    daysUntil: input.daysUntil,
  });
}

function buildReminderHtml(
  userName: string,
  eventTitle: string,
  typeLabel: string,
  daysText: string,
) {
  return `
    <div style="font-family: 'Quicksand', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #fff; border-radius: 16px;">
      <h1 style="font-family: 'Fredoka', sans-serif; color: #6366f1; font-size: 24px; margin-bottom: 8px;">
        My Forever Dates
      </h1>
      <p style="color: #3b4571; font-size: 16px; margin-bottom: 24px;">
        Olá, <strong>${userName}</strong>! 👋
      </p>
      <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 24px; border-radius: 24px; margin-bottom: 24px;">
        <p style="color: rgba(255,255,255,0.85); font-size: 14px; margin: 0 0 8px 0;">
          ${typeLabel}
        </p>
        <p style="color: #ffffff; font-size: 20px; font-weight: 600; margin: 0;">
          ${eventTitle}
        </p>
        <p style="color: rgba(255,255,255,0.9); font-size: 16px; font-weight: 500; margin: 12px 0 0 0;">
          ⏰ Faltam ${daysText}!
        </p>
      </div>
      <p style="color: #7a7fa5; font-size: 14px;">
        Ainda dá tempo de preparar algo especial! 🎁
      </p>
    </div>
  `;
}

interface SendPasswordResetEmailInput {
  to: string;
  userName: string;
  resetUrl: string;
}

async function sendPasswordResetEmail(input: SendPasswordResetEmailInput) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const safeUserName = escapeHtml(input.userName);
  const safeResetUrl = escapeHtml(input.resetUrl);

  await resend.emails.send({
    from:
      process.env.EMAIL_FROM ?? 'My Forever Dates <noreply@myforeverdates.com>',
    to: input.to,
    subject: 'Redefinição de senha',
    html: buildPasswordResetHtml(safeUserName, safeResetUrl),
  });

  log.info('password_reset_email_sent', { to: input.to });
}

function buildPasswordResetHtml(userName: string, resetUrl: string) {
  return `
    <div style="font-family: 'Quicksand', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #fff; border-radius: 16px;">
      <h1 style="font-family: 'Fredoka', sans-serif; color: #e0668a; font-size: 24px; margin-bottom: 8px;">
        My Forever Dates
      </h1>
      <p style="color: #3b4571; font-size: 16px; margin-bottom: 24px;">
        Olá, <strong>${userName}</strong>! 👋
      </p>
      <p style="color: #3b4571; font-size: 15px; margin-bottom: 24px;">
        Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha:
      </p>
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #e06490, #f0894d); color: #ffffff; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 24px; text-decoration: none;">
          Redefinir senha
        </a>
      </div>
      <p style="color: #7a7fa5; font-size: 13px; margin-bottom: 8px;">
        Este link expira em <strong>1 hora</strong>.
      </p>
      <p style="color: #7a7fa5; font-size: 13px;">
        Se você não solicitou a redefinição, ignore este e-mail — sua senha permanece a mesma.
      </p>
    </div>
  `;
}

interface SendOtpEmailInput {
  to: string;
  code: string;
}

async function sendOtpEmail(input: SendOtpEmailInput) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const safeCode = escapeHtml(input.code);

  await resend.emails.send({
    from:
      process.env.EMAIL_FROM ?? 'My Forever Dates <noreply@myforeverdates.com>',
    to: input.to,
    subject: 'Seu código de verificação',
    html: buildOtpHtml(safeCode),
  });

  log.info('otp_email_sent', { to: input.to });
}

function buildOtpHtml(code: string) {
  return `
    <div style="font-family: 'Quicksand', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #fff; border-radius: 16px;">
      <h1 style="font-family: 'Fredoka', sans-serif; color: #e0668a; font-size: 24px; margin-bottom: 8px;">
        My Forever Dates
      </h1>
      <p style="color: #3b4571; font-size: 16px; margin-bottom: 24px;">
        Olá! 👋
      </p>
      <p style="color: #3b4571; font-size: 15px; margin-bottom: 24px;">
        Use o código abaixo para verificar seu e-mail e concluir o cadastro:
      </p>
      <div style="background: linear-gradient(135deg, #e06490, #f0894d); padding: 24px; border-radius: 24px; margin-bottom: 24px; text-align: center;">
        <p style="color: rgba(255,255,255,0.85); font-size: 14px; margin: 0 0 8px 0;">
          Código de verificação
        </p>
        <p style="color: #ffffff; font-size: 32px; font-weight: 700; margin: 0; letter-spacing: 8px; font-family: monospace;">
          ${code}
        </p>
      </div>
      <p style="color: #7a7fa5; font-size: 13px; margin-bottom: 8px;">
        Este código expira em <strong>10 minutos</strong>.
      </p>
      <p style="color: #7a7fa5; font-size: 13px;">
        Se você não solicitou este código, ignore este e-mail.
      </p>
    </div>
  `;
}

const email = {
  sendEventNotification,
  sendReminderNotification,
  sendPasswordResetEmail,
  sendOtpEmail,
};

export default email;
