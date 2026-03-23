import type { NextApiResponse } from 'next';
import { createGroupEventSchema, parseSchema } from '@/lib/validators';
import {
  AuthenticatedRequest,
  authenticatedController,
} from 'infra/controller';
import groupEvent from 'models/group-event';
import groupMember from 'models/group-member';

export default authenticatedController({
  POST: handlePost,
  GET: handleGet,
});

async function handlePost(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };
  await groupMember.assertMember(id, req.user.id);

  const data = parseSchema(createGroupEventSchema, req.body);
  const createdEvent = await groupEvent.create(id, req.user.id, data);
  res.status(201).json(createdEvent);
}

async function handleGet(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };
  await groupMember.assertMember(id, req.user.id);

  const events = await groupEvent.findAllByGroupId(id);
  res.status(200).json(events);
}
