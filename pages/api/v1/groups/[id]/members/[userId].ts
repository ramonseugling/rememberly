import type { NextApiResponse } from 'next';
import {
  AuthenticatedRequest,
  authenticatedController,
} from 'infra/controller';
import groupMember from 'models/group-member';

export default authenticatedController({
  DELETE: handleDelete,
});

async function handleDelete(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id, userId } = req.query as { id: string; userId: string };
  await groupMember.remove(id, userId, req.user.id);
  res.status(204).end();
}
