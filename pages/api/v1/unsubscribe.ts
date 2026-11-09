import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyUnsubscribeToken } from '@/lib/unsubscribe-token';
import controller from 'infra/controller';
import database from 'infra/database';
import { ValidationError } from 'infra/errors';
import { setEmailMarketing } from 'models/notification-preferences';

export default controller({ GET: handleGet });

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const token = typeof req.query.token === 'string' ? req.query.token : '';

  const userId = verifyUnsubscribeToken(token);

  if (!userId) {
    throw new ValidationError({
      message: 'Token de descadastro inválido ou expirado.',
      action: 'Solicite um novo e-mail para obter um link válido.',
    });
  }

  await database.query(
    `UPDATE users SET marketing_consent = false WHERE id = $1`,
    [userId],
  );
  await setEmailMarketing(userId, false);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(`<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Descadastro confirmado — Rememberly</title>
  <style>
    body { font-family: sans-serif; background: #fdf7f4; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .card { background: #fff; border-radius: 20px; padding: 40px 32px; max-width: 400px; text-align: center; box-shadow: 0 4px 20px rgba(235, 93, 142, 0.08); }
    h1 { color: #3b4571; font-size: 22px; margin: 0 0 12px 0; }
    p { color: #7a7fa5; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0; }
    a { color: #eb5d8e; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Descadastro confirmado</h1>
    <p>Você não receberá mais novidades e anúncios do Rememberly.<br>Lembretes de datas que você cadastrou continuam ativos.</p>
    <a href="/">Voltar ao Rememberly</a>
  </div>
</body>
</html>`);
}
