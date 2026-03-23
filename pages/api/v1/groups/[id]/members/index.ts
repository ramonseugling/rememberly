import type { NextApiResponse } from 'next';
import {
  AuthenticatedRequest,
  authenticatedController,
} from 'infra/controller';
import groupMember from 'models/group-member';

export default authenticatedController({
  GET: handleGet,
});

async function handleGet(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };
  await groupMember.assertMember(id, req.user.id);
  const members = await groupMember.findAllByGroupId(id);
  res.status(200).json(members);
}
