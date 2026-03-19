import type { NextApiResponse } from 'next';
import { parseSchema, updateEventSchema } from '@/lib/validators';
import {
  AuthenticatedRequest,
  authenticatedController,
} from 'infra/controller';
import event from 'models/event';

export default authenticatedController({
  GET: handleGet,
  PATCH: handlePatch,
  DELETE: handleDelete,
});

async function handleGet(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };
  const foundEvent = await event.findOneById(id, req.user.id);
  res.status(200).json(foundEvent);
}

async function handlePatch(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };
  const {
    title,
    type,
    custom_type,
    event_day,
    event_month,
    reminder_days_before,
  } = parseSchema(updateEventSchema, req.body);

  const updatedEvent = await event.update(id, req.user.id, {
    title,
    type,
    custom_type,
    event_day,
    event_month,
    reminder_days_before,
  });

  res.status(200).json(updatedEvent);
}

async function handleDelete(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };
  await event.deleteById(id, req.user.id);
  res.status(204).end();
}
