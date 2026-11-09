import { writeFileSync } from 'node:fs';
import { ANNOUNCEMENTS } from '../lib/announcements';
import {
  buildAccountDeletionCodeHtml,
  buildAnnouncementHtml,
  buildEventNotificationHtml,
  buildReminderHtml,
} from '../models/email';

const sections: { title: string; html: string }[] = [
  {
    title: 'ðï¸ CÃ³digo para excluir a conta',
    html: buildAccountDeletionCodeHtml('482915'),
  },
  {
    title: '🎂 Aniversário (no dia)',
    html: buildEventNotificationHtml('Ramon', 'Pedro', '🎂 Aniversário'),
  },
  {
    title: '⏰ Lembrete (faltam 7 dias)',
    html: buildReminderHtml('Ramon', 'Pedro', '🎂 Aniversário', '7 dias'),
  },
  {
    title: '📣 Anúncio — Datas Comemorativas',
    html: buildAnnouncementHtml(
      'Ramon',
      ANNOUNCEMENTS[0],
      'https://www.rememberly.com.br/api/v1/unsubscribe?token=demo',
    ),
  },
];

const body = sections
  .map(
    (s) =>
      `<h2 style="font-family:sans-serif;padding:16px 16px 0;color:#333;">${s.title}</h2>${s.html}`,
  )
  .join('\n');

const page = `<!doctype html><html><head><meta charset="utf-8"><title>Preview e-mails Rememberly</title></head>
<body style="margin:0;background:#eee;">
${body}
</body></html>`;

writeFileSync('email-preview.html', page);
console.log('Gerado: email-preview.html');
