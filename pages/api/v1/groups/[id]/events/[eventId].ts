import type { NextApiResponse } from 'next';
import { parseSchema, updateGroupEventSchema } from '@/lib/validators';
import {
  AuthenticatedRequest,
  authenticatedController,
} from 'infra/controller';
import groupEvent from 'models/group-event';
import groupMember from 'models/group-member';

export default authenticatedController({
  PATCH: handlePatch,
  DELETE: handleDelete,
});

async function handlePatch(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id, eventId } = req.query as { id: string; eventId: string };
  await groupMember.assertMember(id, req.user.id);

  const data = parseSchema(updateGroupEventSchema, req.body);
  const updatedEvent = await groupEvent.update(eventId, id, data);
  res.status(200).json(updatedEvent);
}

async function handleDelete(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id, eventId } = req.query as { id: string; eventId: string };
  await groupMember.assertOwner(id, req.user.id);
  await groupEvent.deleteById(eventId, id);
  res.status(204).end();
}
