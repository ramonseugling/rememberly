import { log } from 'next-axiom';
import { Resend } from 'resend';
import { escapeHtml } from '@/lib/sanitize';

const FROM =
  process.env.EMAIL_FROM ?? 'Rememberly <noreply@myforeverdates.com.br>';

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

const COLOR = {
  brandPink: '#eb5d8e',
  brandOrange: '#f5934f',
  text: '#3b4571',
  textMuted: '#7a7fa5',
  border: '#f0d9e3',
  background: '#fdf7f4',
  cardBg: '#ffffff',
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  birthday: '🎂 Aniversário',
  dating_anniversary: '💕 Aniversário de Namoro',
  wedding_anniversary: '💍 Aniversário de Casamento',
  celebration: '🎉 Celebração',
};

interface EmailLayoutOptions {
  greeting: string;
  content: string;
  footerNote?: string;
}

function buildEmailLayout({
  greeting,
  content,
  footerNote,
}: EmailLayoutOptions) {
  return `
    <div style="font-family: ${FONT_STACK}; background: ${COLOR.background}; padding: 24px 16px;">
      <div style="max-width: 480px; margin: 0 auto; background: ${COLOR.cardBg}; border-radius: 20px; padding: 32px; box-shadow: 0 4px 20px rgba(235, 93, 142, 0.08);">
        <div style="margin-bottom: 24px;">
          <p style="color: ${COLOR.brandPink}; font-size: 22px; font-weight: 700; margin: 0; letter-spacing: -0.01em;">
            Rememberly
          </p>
          <div style="height: 3px; width: 48px; background: linear-gradient(90deg, ${COLOR.brandPink}, ${COLOR.brandOrange}); border-radius: 2px; margin-top: 8px;"></div>
        </div>
        <p style="color: ${COLOR.text}; font-size: 16px; margin: 0 0 24px 0;">
          ${greeting}
        </p>
        ${content}
        ${
          footerNote
            ? `<p style="color: ${COLOR.textMuted}; font-size: 14px; margin: 24px 0 0 0;">${footerNote}</p>`
            : ''
        }
        <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid ${COLOR.border};">
          <p style="color: ${COLOR.textMuted}; font-size: 12px; margin: 0; text-align: center;">
            Enviado por <strong style="color: ${COLOR.brandPink};">Rememberly</strong> — para você nunca mais esquecer das datas que importam.
          </p>
        </div>
      </div>
    </div>
  `;
}

function brandHeroCard(label: string, title: string, extra?: string) {
  return `
    <div style="background: linear-gradient(135deg, ${COLOR.brandPink}, ${COLOR.brandOrange}); padding: 24px; border-radius: 20px; margin-bottom: 8px;">
      <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0 0 8px 0; font-weight: 500;">
        ${label}
      </p>
      <p style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0; line-height: 1.2;">
        ${title}
      </p>
      ${
        extra
          ? `<p style="color: rgba(255,255,255,0.95); font-size: 15px; font-weight: 500; margin: 12px 0 0 0;">${extra}</p>`
          : ''
      }
    </div>
  `;
}

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
    from: FROM,
    to: input.to,
    subject: `${typeLabel} — ${input.eventTitle}`,
    html: buildEventNotificationHtml(
      safeUserName,
      safeEventTitle,
      safeTypeLabel,
    ),
  });

  log.info('event_notification_sent', {
    to: input.to,
    eventType: input.eventType,
    eventTitle: input.eventTitle,
  });
}

function buildEventNotificationHtml(
  userName: string,
  eventTitle: string,
  typeLabel: string,
) {
  return buildEmailLayout({
    greeting: `Olá, <strong>${userName}</strong>! 👋`,
    content: brandHeroCard(typeLabel, eventTitle),
    footerNote: 'Hoje é um dia especial! Não esqueça de celebrar. 🎉',
  });
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
    from: FROM,
    to: input.to,
    subject: `⏰ Faltam ${daysText} para ${typeLabel.replace(/^[^\w]+ /, '')} — ${input.eventTitle}`,
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
  return buildEmailLayout({
    greeting: `Olá, <strong>${userName}</strong>! 👋`,
    content: brandHeroCard(typeLabel, eventTitle, `⏰ Faltam ${daysText}!`),
    footerNote: 'Ainda dá tempo de preparar algo especial. 🎁',
  });
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
    from: FROM,
    to: input.to,
    subject: 'Redefinição de senha',
    html: buildPasswordResetHtml(safeUserName, safeResetUrl),
  });

  log.info('password_reset_email_sent', { to: input.to });
}

function buildPasswordResetHtml(userName: string, resetUrl: string) {
  const content = `
    <p style="color: ${COLOR.text}; font-size: 15px; margin: 0 0 24px 0; line-height: 1.5;">
      Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha:
    </p>
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, ${COLOR.brandPink}, ${COLOR.brandOrange}); color: #ffffff; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 999px; text-decoration: none;">
        Redefinir senha
      </a>
    </div>
    <p style="color: ${COLOR.textMuted}; font-size: 13px; margin: 0 0 8px 0;">
      Este link expira em <strong>1 hora</strong>.
    </p>
    <p style="color: ${COLOR.textMuted}; font-size: 13px; margin: 0;">
      Se você não solicitou a redefinição, ignore este e-mail — sua senha permanece a mesma.
    </p>
  `;

  return buildEmailLayout({
    greeting: `Olá, <strong>${userName}</strong>! 👋`,
    content,
  });
}

interface SendOtpEmailInput {
  to: string;
  code: string;
}

async function sendOtpEmail(input: SendOtpEmailInput) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const safeCode = escapeHtml(input.code);

  await resend.emails.send({
    from: FROM,
    to: input.to,
    subject: 'Seu código de verificação',
    html: buildOtpHtml(safeCode),
  });

  log.info('otp_email_sent', { to: input.to });
}

function buildOtpHtml(code: string) {
  const content = `
    <p style="color: ${COLOR.text}; font-size: 15px; margin: 0 0 20px 0; line-height: 1.5;">
      Use o código abaixo para verificar seu e-mail e concluir o cadastro:
    </p>
    <div style="background: linear-gradient(135deg, ${COLOR.brandPink}, ${COLOR.brandOrange}); padding: 24px; border-radius: 20px; margin-bottom: 8px; text-align: center;">
      <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0 0 12px 0; font-weight: 500;">
        Código de verificação
      </p>
      <p style="color: #ffffff; font-size: 32px; font-weight: 700; margin: 0; letter-spacing: 8px; font-family: 'Courier New', monospace;">
        ${code}
      </p>
    </div>
    <p style="color: ${COLOR.textMuted}; font-size: 13px; margin: 24px 0 8px 0;">
      Este código expira em <strong>10 minutos</strong>.
    </p>
    <p style="color: ${COLOR.textMuted}; font-size: 13px; margin: 0;">
      Se você não solicitou este código, ignore este e-mail.
    </p>
  `;

  return buildEmailLayout({
    greeting: 'Olá! 👋',
    content,
  });
}

const email = {
  sendEventNotification,
  sendReminderNotification,
  sendPasswordResetEmail,
  sendOtpEmail,
};

export default email;
