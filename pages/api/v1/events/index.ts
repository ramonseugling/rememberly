import type { NextApiResponse } from 'next';
import { createEventSchema, parseSchema } from '@/lib/validators';
import {
  AuthenticatedRequest,
  authenticatedController,
} from 'infra/controller';
import event from 'models/event';

export default authenticatedController({
  GET: handleGet,
  POST: handlePost,
});

async function handleGet(req: AuthenticatedRequest, res: NextApiResponse) {
  const events = await event.findAllByUserId(req.user.id);
  res.status(200).json({ events });
}

async function handlePost(req: AuthenticatedRequest, res: NextApiResponse) {
  const {
    title,
    type,
    custom_type,
    event_day,
    event_month,
    reminder_days_before,
  } = parseSchema(createEventSchema, req.body);

  const createdEvent = await event.create(req.user.id, {
    title,
    type,
    custom_type,
    event_day,
    event_month,
    reminder_days_before,
  });

  res.status(201).json(createdEvent);
}
