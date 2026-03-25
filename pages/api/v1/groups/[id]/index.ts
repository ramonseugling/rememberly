import type { NextApiResponse } from 'next';
import { parseSchema, updateGroupSchema } from '@/lib/validators';
import {
  AuthenticatedRequest,
  authenticatedController,
} from 'infra/controller';
import group from 'models/group';
import groupMember from 'models/group-member';

export default authenticatedController({
  GET: handleGet,
  PATCH: handlePatch,
  DELETE: handleDelete,
});

async function handleGet(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };
  const membership = await groupMember.assertMember(id, req.user.id);
  const foundGroup = await group.findById(id);
  const members = await groupMember.findAllByGroupId(id);
  const memberCount = await groupMember.countMembers(id);

  res.status(200).json({
    ...foundGroup,
    role: membership.role,
    member_count: memberCount,
    members,
  });
}

async function handlePatch(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };
  await groupMember.assertOwner(id, req.user.id);
  const { name } = parseSchema(updateGroupSchema, req.body);
  const updatedGroup = await group.update(id, { name });
  res.status(200).json(updatedGroup);
}

async function handleDelete(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };
  await groupMember.assertOwner(id, req.user.id);
  await group.deleteById(id);
  res.status(204).end();
}
