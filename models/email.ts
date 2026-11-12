import { log } from 'next-axiom';
import { Resend } from 'resend';
import type { Announcement } from '@/lib/announcements';
import { renderCommunicationBody } from '@/lib/communication-markdown';
import { escapeHtml } from '@/lib/sanitize';

const FROM = process.env.EMAIL_FROM ?? 'Rememberly <noreply@rememberly.com.br>';

const APP_URL = process.env.APP_URL ?? 'https://www.rememberly.com.br';

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

// Outlook (Windows) ignores linear-gradient; the solid background-color is the
// fallback while other clients apply the gradient on top.
const BRAND_GRADIENT_BG = `background-color: ${COLOR.brandPink}; background-image: linear-gradient(135deg, ${COLOR.brandPink}, ${COLOR.brandOrange});`;

// Gradient text via background-clip. Clients without support (Gmail, Outlook)
// fall back to the solid color; Apple Mail/iOS apply the gradient to the text.
const BRAND_GRADIENT_TEXT = `color: ${COLOR.brandPink}; background-image: linear-gradient(135deg, ${COLOR.brandPink}, ${COLOR.brandOrange}); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;`;

const EVENT_TYPE_LABELS: Record<string, string> = {
  birthday: '🎂 Aniversário',
  dating_anniversary: '💕 Aniversário de Namoro',
  wedding_anniversary: '💍 Aniversário de Casamento',
  celebration: '🎉 Celebração',
};

function ctaButton(url: string, label: string) {
  return `
    <div style="margin-top: 24px;">
      <a href="${url}" style="display: block; box-sizing: border-box; width: 100%; text-align: center; ${BRAND_GRADIENT_BG} color: #ffffff; font-size: 16px; font-weight: 600; padding: 16px 0; border-radius: 20px; text-decoration: none;">
        ${label}
      </a>
    </div>
  `;
}

interface EmailLayoutOptions {
  greeting: string;
  content: string;
  footerNote?: string;
  cta?: string;
}

function buildEmailLayout({
  greeting,
  content,
  footerNote,
  cta,
}: EmailLayoutOptions) {
  return `
    <div style="font-family: ${FONT_STACK}; background: ${COLOR.background}; padding: 24px 16px;">
      <div style="max-width: 480px; margin: 0 auto; background: ${COLOR.cardBg}; border-radius: 20px; padding: 32px; box-shadow: 0 4px 20px rgba(235, 93, 142, 0.08);">
        <div style="margin-bottom: 24px;">
          <p style="${BRAND_GRADIENT_TEXT} font-size: 22px; font-weight: 700; margin: 0; letter-spacing: -0.01em;">
            Rememberly
          </p>
          <div style="height: 3px; width: 48px; background-color: ${COLOR.brandPink}; background-image: linear-gradient(90deg, ${COLOR.brandPink}, ${COLOR.brandOrange}); border-radius: 2px; margin-top: 8px;"></div>
        </div>
        <p style="color: ${COLOR.text}; font-size: 16px; margin: 0 0 24px 0;">
          ${greeting}
        </p>
        ${content}
        ${cta ?? ''}
        ${
          footerNote
            ? `<p style="color: ${COLOR.textMuted}; font-size: 14px; margin: 24px 0 0 0;">${footerNote}</p>`
            : ''
        }
        <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid ${COLOR.border};">
          <p style="color: ${COLOR.textMuted}; font-size: 12px; margin: 0; text-align: center;">
            Enviado por <strong style="${BRAND_GRADIENT_TEXT}">Rememberly</strong>. Adicione uma data. Lembre todos os anos.
          </p>
        </div>
      </div>
    </div>
  `;
}

function brandHeroCard(label: string, title: string, extra?: string) {
  return `
    <div style="${BRAND_GRADIENT_BG} padding: 24px; border-radius: 20px; margin-bottom: 8px;">
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
    eventType: input.eventType,
  });
}

export function buildEventNotificationHtml(
  userName: string,
  eventTitle: string,
  typeLabel: string,
) {
  return buildEmailLayout({
    greeting: `Bom dia, <strong>${userName}</strong>. Hoje é um dia especial! Não esqueça de celebrar. 🎉`,
    content: brandHeroCard(typeLabel, eventTitle),
    cta: ctaButton(`${APP_URL}/dates`, 'Ver no Rememberly'),
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
    eventType: input.eventType,
    daysUntil: input.daysUntil,
  });
}

export function buildReminderHtml(
  userName: string,
  eventTitle: string,
  typeLabel: string,
  daysText: string,
) {
  return buildEmailLayout({
    greeting: `Bom dia, <strong>${userName}</strong>! 👋`,
    content: brandHeroCard(typeLabel, eventTitle, `⏰ Faltam ${daysText}!`),
    footerNote: 'Ainda dá tempo de preparar algo especial. 🎁',
    cta: ctaButton(`${APP_URL}/dates`, 'Ver no Rememberly'),
  });
}

export type OtpEmailPurpose = 'signup' | 'password_reset';

interface SendOtpEmailInput {
  to: string;
  code: string;
  purpose?: OtpEmailPurpose;
}

async function sendOtpEmail(input: SendOtpEmailInput) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const safeCode = escapeHtml(input.code);

  await resend.emails.send({
    from: FROM,
    to: input.to,
    subject:
      input.purpose === 'password_reset'
        ? 'Código para redefinir sua senha'
        : 'Seu código de verificação',
    html: buildOtpHtml(safeCode, input.purpose),
  });

  log.info('otp_email_sent');
}

async function sendAccountDeletionCodeEmail(input: SendOtpEmailInput) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const safeCode = escapeHtml(input.code);

  await resend.emails.send({
    from: FROM,
    to: input.to,
    subject: 'CÃ³digo para excluir sua conta',
    html: buildAccountDeletionCodeHtml(safeCode),
  });

  log.info('account_deletion_code_email_sent');
}

export function buildAccountDeletionCodeHtml(code: string) {
  const content = `
    <p style="color: ${COLOR.text}; font-size: 15px; margin: 0 0 20px 0; line-height: 1.5;">
      Recebemos um pedido para excluir a sua conta do Rememberly. Para confirmar, digite o cÃ³digo abaixo no aplicativo:
    </p>
    <div style="${BRAND_GRADIENT_BG} padding: 24px; border-radius: 20px; margin-bottom: 8px; text-align: center;">
      <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0 0 12px 0; font-weight: 500;">
        CÃ³digo de confirmaÃ§Ã£o
      </p>
      <p style="color: #ffffff; font-size: 32px; font-weight: 700; margin: 0; letter-spacing: 8px; font-family: 'Courier New', monospace;">
        ${code}
      </p>
    </div>
    <p style="color: ${COLOR.textMuted}; font-size: 13px; margin: 24px 0 8px 0;">
      Este cÃ³digo expira em <strong>10 minutos</strong>. A exclusÃ£o Ã© permanente e nÃ£o pode ser desfeita.
    </p>
    <p style="color: ${COLOR.textMuted}; font-size: 13px; margin: 0;">
      Se vocÃª nÃ£o pediu para excluir a conta, ignore este e-mail: nada serÃ¡ alterado.
    </p>
  `;

  return buildEmailLayout({
    greeting: 'OlÃ¡! ð',
    content,
  });
}

export function buildOtpHtml(
  code: string,
  purpose: OtpEmailPurpose = 'signup',
) {
  const intro =
    purpose === 'password_reset'
      ? 'Recebemos uma solicitação para redefinir a senha da sua conta. Use o código abaixo no aplicativo para continuar:'
      : 'Use o código abaixo para verificar seu e-mail e concluir o cadastro:';
  const content = `
    <p style="color: ${COLOR.text}; font-size: 15px; margin: 0 0 20px 0; line-height: 1.5;">
      ${intro}
    </p>
    <div style="${BRAND_GRADIENT_BG} padding: 24px; border-radius: 20px; margin-bottom: 8px; text-align: center;">
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
      Se você não solicitou este código, ignore este e-mail${
        purpose === 'password_reset' ? ' — sua senha permanece a mesma' : ''
      }.
    </p>
  `;

  return buildEmailLayout({
    greeting: 'Olá! 👋',
    content,
  });
}

export interface DigestData {
  dateLabel: string;
  signups: { total: number; viaGoogle: number; viaPassword: number };
  logins: number;
  eventsCreated: { total: number; byType: { type: string; count: number }[] };
  totals: { users: number; events: number; groups: number };
  cronRuns: {
    job_name: string;
    status: string;
    metrics: Record<string, unknown>;
    duration_ms: number;
  }[];
  errors: { total: number; topByName: { error_name: string; count: number }[] };
}

interface SendDailyDigestEmailInput {
  to: string[];
  data: DigestData;
}

async function sendDailyDigestEmail(input: SendDailyDigestEmailInput) {
  if (input.to.length === 0) return;
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: FROM,
    to: input.to,
    subject: `Rememberly • Resumo de ${input.data.dateLabel}`,
    html: buildDigestHtml(input.data),
  });

  log.info('daily_digest_email_sent', {
    recipients: input.to.length,
    dateLabel: input.data.dateLabel,
  });
}

export function buildDigestHtml(data: DigestData) {
  const eventTypeLabel = (t: string) =>
    EVENT_TYPE_LABELS[t] ?? (t === 'custom' ? '✨ Personalizado' : t);

  const hasActivity =
    data.signups.total > 0 ||
    data.logins > 0 ||
    data.eventsCreated.total > 0 ||
    data.errors.total > 0;

  const sectionTitleStyle = `color: ${COLOR.text}; font-size: 14px; font-weight: 700; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.04em;`;
  const cardStyle = `background: #fff7f2; border: 1px solid ${COLOR.border}; border-radius: 16px; padding: 16px 20px; margin-bottom: 16px;`;

  // Tables (instead of display:flex) to align label/value reliably: Gmail on
  // mobile ignores flexbox and stacks everything onto a single line.
  const metricTable = (rows: string) =>
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">${rows}</table>`;

  const metricRow = (
    label: string,
    value: string | number,
    opts?: { valueColor?: string; labelColor?: string },
  ) =>
    `<tr>
      <td style="padding: 6px 0; color: ${opts?.labelColor ?? COLOR.text}; font-size: 14px;">${label}</td>
      <td style="padding: 6px 0; color: ${opts?.valueColor ?? COLOR.text}; font-size: 14px; font-weight: 700; text-align: right; white-space: nowrap;">${value}</td>
    </tr>`;

  const captionRow = (text: string) =>
    `<tr><td colspan="2" style="padding: 0 0 8px 0; color: ${COLOR.textMuted}; font-size: 12px; line-height: 1.4;">${text}</td></tr>`;

  const card = (title: string, inner: string) =>
    `<div style="${cardStyle}"><p style="${sectionTitleStyle}">${title}</p>${inner}</div>`;

  const engagementBlock = card(
    'Engajamento (ontem)',
    metricTable(
      metricRow('Cadastros', data.signups.total) +
        captionRow(
          `Google: ${data.signups.viaGoogle} · Senha: ${data.signups.viaPassword}`,
        ) +
        metricRow('Logins (novas sessões)', data.logins) +
        metricRow('Eventos criados', data.eventsCreated.total) +
        (data.eventsCreated.byType.length > 0
          ? captionRow(
              data.eventsCreated.byType
                .map((r) => `${escapeHtml(eventTypeLabel(r.type))}: ${r.count}`)
                .join(' · '),
            )
          : ''),
    ),
  );

  const totalsBlock = card(
    'Snapshot atual',
    metricTable(
      metricRow('Usuários', data.totals.users) +
        metricRow('Eventos', data.totals.events) +
        metricRow('Grupos', data.totals.groups),
    ),
  );

  const cronBlock = card(
    'Cron de notificações (ontem)',
    data.cronRuns.length === 0
      ? `<p style="color: ${COLOR.textMuted}; font-size: 13px; margin: 0;">Nenhuma execução registrada.</p>`
      : data.cronRuns
          .map((run) => {
            const statusColor =
              run.status === 'success'
                ? '#3fa66a'
                : run.status === 'partial'
                  ? '#d9893a'
                  : '#c84343';
            return `<div style="padding: 8px 0; border-bottom: 1px dashed ${COLOR.border};">${metricTable(
              metricRow(
                `<span style="font-weight: 600;">${escapeHtml(run.job_name)}</span>`,
                `<span style="text-transform: uppercase; font-size: 12px;">${escapeHtml(run.status)}</span>`,
                { valueColor: statusColor },
              ) +
                captionRow(
                  `${escapeHtml(JSON.stringify(run.metrics))} · ${run.duration_ms}ms`,
                ),
            )}</div>`;
          })
          .join(''),
  );

  const errorsBlock = card(
    'Erros (ontem)',
    metricTable(
      metricRow('Total', data.errors.total) +
        data.errors.topByName
          .map((e) =>
            metricRow(escapeHtml(e.error_name), e.count, {
              labelColor: COLOR.textMuted,
            }),
          )
          .join(''),
    ),
  );

  const summary = hasActivity
    ? `Aqui está o resumo do que aconteceu em ${data.dateLabel}.`
    : `Nenhuma atividade registrada em ${data.dateLabel} — o cron está vivo.`;

  return buildEmailLayout({
    greeting: `Resumo diário · <strong>${data.dateLabel}</strong>`,
    content: `
      <p style="color: ${COLOR.text}; font-size: 15px; margin: 0 0 20px 0; line-height: 1.5;">
        ${summary}
      </p>
      ${engagementBlock}
      ${totalsBlock}
      ${cronBlock}
      ${errorsBlock}
    `,
    footerNote: 'Métricas agregadas, sem dados pessoais.',
  });
}

interface SendAnnouncementEmailInput {
  to: string;
  userName: string;
  announcement: Announcement;
  unsubscribeUrl: string;
}

export function buildAnnouncementHtml(
  userName: string,
  announcement: Announcement,
  unsubscribeUrl: string,
) {
  const safeUserName = escapeHtml(userName);

  const paragraphs = announcement.body
    .map(
      (p) =>
        `<p style="color: ${COLOR.text}; font-size: 15px; margin: 0 0 16px 0; line-height: 1.6;">${p}</p>`,
    )
    .join('');

  return buildEmailLayout({
    greeting: `Oi, <strong>${safeUserName}</strong>! 👋`,
    content:
      brandHeroCard(announcement.heroLabel, announcement.heroTitle) +
      paragraphs,
    cta: ctaButton(`${APP_URL}${announcement.ctaPath}`, announcement.ctaLabel),
    footerNote: `Não quer mais receber novidades? <a href="${unsubscribeUrl}" style="color: ${COLOR.textMuted}; text-decoration: underline;">Descadastrar</a>`,
  });
}

async function sendAnnouncementEmail(input: SendAnnouncementEmailInput) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const html = buildAnnouncementHtml(
    input.userName,
    input.announcement,
    input.unsubscribeUrl,
  );

  await resend.emails.send({
    from: FROM,
    to: input.to,
    subject: input.announcement.subject,
    html,
  });

  log.info('announcement_email_sent', {
    announcementKey: input.announcement.key,
  });
}

export interface CommunicationEmailContent {
  title: string;
  subject: string;
  body: string;
}

export function buildCommunicationHtml(
  userName: string,
  communication: Pick<CommunicationEmailContent, 'title' | 'body'>,
  unsubscribeUrl: string,
) {
  return buildEmailLayout({
    greeting: `Oi, <strong>${escapeHtml(userName)}</strong>! 👋`,
    content:
      brandHeroCard('Novidades e dicas', escapeHtml(communication.title)) +
      renderCommunicationBody(communication.body),
    footerNote: `Não quer mais receber novidades? <a href="${unsubscribeUrl}" style="color: ${COLOR.textMuted}; text-decoration: underline;">Descadastrar</a>`,
  });
}

interface SendCommunicationEmailInput {
  to: string;
  userName: string;
  communication: CommunicationEmailContent;
  unsubscribeUrl: string;
  isTest?: boolean;
}

async function sendCommunicationEmail(input: SendCommunicationEmailInput) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { error } = await resend.emails.send({
    from: FROM,
    to: input.to,
    subject: `${input.isTest ? '[Teste] ' : ''}${input.communication.subject}`,
    html: buildCommunicationHtml(
      input.userName,
      input.communication,
      input.unsubscribeUrl,
    ),
  });

  if (error) throw new Error(error.message);

  log.info('communication_email_sent');
}

interface SendCommemorativeReminderInput {
  to: string;
  userName: string;
  label: string;
  emoji: string;
  daysUntil: number;
}

async function sendCommemorativeReminder(
  input: SendCommemorativeReminderInput,
) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const safeUserName = escapeHtml(input.userName);
  const safeLabel = escapeHtml(input.label);

  await resend.emails.send({
    from: FROM,
    to: input.to,
    subject: `⏰ Faltam 7 dias para o ${input.label}`,
    html: buildCommemorativeReminderHtml(safeUserName, safeLabel, input.emoji),
  });

  log.info('commemorative_reminder_sent', {
    label: input.label,
    daysUntil: input.daysUntil,
  });
}

export function buildCommemorativeReminderHtml(
  userName: string,
  label: string,
  emoji: string,
) {
  return buildEmailLayout({
    greeting: `Bom dia, <strong>${userName}</strong>! 👋`,
    content: brandHeroCard(
      `${emoji} Data Comemorativa`,
      label,
      `⏰ Faltam 7 dias!`,
    ),
    footerNote: 'Ainda dá tempo de preparar algo especial. 🎁',
    cta: ctaButton(`${APP_URL}/commemorative-dates`, 'Ver Datas Comemorativas'),
  });
}

interface SendGiftReleasedEmailInput {
  to: string;
  userName: string;
  ownerName: string;
  giftTitle: string;
  action: 'edited' | 'deleted';
}

async function sendGiftReleasedEmail(input: SendGiftReleasedEmailInput) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: FROM,
    to: input.to,
    subject: `Sua reserva de presente foi cancelada — ${input.giftTitle}`,
    html: buildGiftReleasedHtml(
      escapeHtml(input.userName),
      escapeHtml(input.ownerName),
      escapeHtml(input.giftTitle),
      input.action,
    ),
  });

  log.info('gift_released_email_sent');
}

export function buildGiftReleasedHtml(
  userName: string,
  ownerName: string,
  giftTitle: string,
  action: 'edited' | 'deleted',
) {
  const what =
    action === 'deleted'
      ? 'removeu um presente da lista'
      : 'alterou um presente da lista';
  return buildEmailLayout({
    greeting: `Olá, <strong>${userName}</strong>! 👋`,
    content: brandHeroCard(
      '🎁 Reserva cancelada',
      giftTitle,
      `${ownerName} ${what}`,
    ),
    footerNote:
      'Como o presente mudou, a sua reserva foi cancelada. Você pode reservar de novo se ainda fizer sentido.',
    cta: ctaButton(`${APP_URL}/dates`, 'Ver no Rememberly'),
  });
}

const email = {
  sendEventNotification,
  sendReminderNotification,
  sendOtpEmail,
  sendAccountDeletionCodeEmail,
  sendDailyDigestEmail,
  sendCommemorativeReminder,
  sendAnnouncementEmail,
  sendCommunicationEmail,
  sendGiftReleasedEmail,
};

export default email;
