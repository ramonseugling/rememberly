import type { NextApiResponse } from 'next';
import { z } from 'zod';
import { parseSchema } from '@/lib/validators';
import { assertAdmin } from 'infra/admin-guard';
import {
  AuthenticatedRequest,
  authenticatedController,
} from 'infra/controller';
import { buildCommunicationHtml } from 'models/email';

const previewSchema = z
  .object({
    title: z.string().max(120).default(''),
    email_body: z.string().max(5000).default(''),
  })
  .strict();

export default authenticatedController({ POST: handlePost });

async function handlePost(req: AuthenticatedRequest, res: NextApiResponse) {
  await assertAdmin(req);
  const input = parseSchema(previewSchema, req.body);

  const html = buildCommunicationHtml(
    req.user.name,
    { title: input.title ?? '', body: input.email_body ?? '' },
    '#',
  );

  res.status(200).json({ html });
}
