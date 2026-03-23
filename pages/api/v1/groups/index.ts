import type { NextApiResponse } from 'next';
import { createGroupSchema, parseSchema } from '@/lib/validators';
import {
  AuthenticatedRequest,
  authenticatedController,
} from 'infra/controller';
import group from 'models/group';

export default authenticatedController({
  POST: handlePost,
  GET: handleGet,
});

async function handlePost(req: AuthenticatedRequest, res: NextApiResponse) {
  const { name } = parseSchema(createGroupSchema, req.body);
  const createdGroup = await group.create(req.user.id, { name });
  res.status(201).json(createdGroup);
}

async function handleGet(req: AuthenticatedRequest, res: NextApiResponse) {
  const groups = await group.findAllByUserId(req.user.id);
  res.status(200).json(groups);
}
