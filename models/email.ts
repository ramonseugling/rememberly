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

const email = { sendEventNotification };

export default email;
