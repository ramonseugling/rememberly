import { log } from 'next-axiom';
import { Resend } from 'resend';

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
}

async function sendEventNotification(input: SendEventNotificationInput) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const typeLabel = EVENT_TYPE_LABELS[input.eventType] ?? input.eventType;

  await resend.emails.send({
    from:
      process.env.EMAIL_FROM ?? 'My Forever Dates <noreply@myforeverdates.com>',
    to: input.to,
    subject: `${typeLabel} — ${input.eventTitle}`,
    html: buildEmailHtml(input.userName, input.eventTitle, typeLabel),
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

interface SendPasswordResetEmailInput {
  to: string;
  userName: string;
  resetUrl: string;
}

async function sendPasswordResetEmail(input: SendPasswordResetEmailInput) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from:
      process.env.EMAIL_FROM ?? 'My Forever Dates <noreply@myforeverdates.com>',
    to: input.to,
    subject: 'Redefinição de senha — My Forever Dates',
    html: buildPasswordResetHtml(input.userName, input.resetUrl),
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

const email = { sendEventNotification, sendPasswordResetEmail };

export default email;
