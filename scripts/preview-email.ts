import { writeFileSync } from 'node:fs';
import { buildEventNotificationHtml, buildReminderHtml } from '../models/email';

const sections: { title: string; html: string }[] = [
  {
    title: '🎂 Aniversário (no dia)',
    html: buildEventNotificationHtml('Ramon', 'Pedro', '🎂 Aniversário'),
  },
  {
    title: '⏰ Lembrete (faltam 7 dias)',
    html: buildReminderHtml('Ramon', 'Pedro', '🎂 Aniversário', '7 dias'),
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
