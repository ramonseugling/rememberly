import { writeFileSync } from 'node:fs';
import { buildEventNotificationHtml, buildReminderHtml } from '../models/email';

// Path relative to email-preview.html (generated at the repo root) so the local
// GIFs load when opening the file directly in the browser (file://).
const localGif = (type: string, month: number) =>
  `public/images/email/gifs/${type}/${String(month).padStart(2, '0')}.gif`;

const MONTH_LABELS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const sections: { title: string; html: string }[] = MONTH_LABELS.flatMap(
  (label, i) => {
    const month = i + 1;
    const mm = String(month).padStart(2, '0');
    const gif = localGif('birthday', month);
    return [
      {
        title: `🎂 Aniversário (no dia) — ${mm} (${label})`,
        html: buildEventNotificationHtml(
          'Ramon',
          'Pedro',
          '🎂 Aniversário',
          gif,
        ),
      },
      {
        title: `⏰ Lembrete (faltam 7 dias) — ${mm} (${label})`,
        html: buildReminderHtml('Ramon', 'Pedro', '🎂 Aniversário', '7 dias'),
      },
    ];
  },
);

const body = sections
  .map(
    (s) =>
      `<h2 style="font-family:sans-serif;padding:16px 16px 0;color:#333;">${s.title}</h2>${s.html}`,
  )
  .join('\n');

const page = `<!doctype html><html><head><meta charset="utf-8"><title>Preview e-mails Rememberly — GIFs de aniversário</title></head>
<body style="margin:0;background:#eee;">
${body}
</body></html>`;

writeFileSync('email-preview.html', page);
console.log('Gerado: email-preview.html');
