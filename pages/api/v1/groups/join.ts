import type { NextApiResponse } from 'next';
import { joinGroupSchema, parseSchema } from '@/lib/validators';
import {
  AuthenticatedRequest,
  authenticatedController,
} from 'infra/controller';
import groupMember from 'models/group-member';

export default authenticatedController({
  POST: handlePost,
});

async function handlePost(req: AuthenticatedRequest, res: NextApiResponse) {
  const { invite_code } = parseSchema(joinGroupSchema, req.body);
  const result = await groupMember.join(invite_code, req.user.id);
  res.status(201).json(result);
}
