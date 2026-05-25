import type { NextApiResponse } from 'next';
import { getBirthdayDateInfo } from '@/lib/date-utils';
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
  const enriched = members.map(
    (m: { birth_day: number | null; birth_month: number | null }) => ({
      ...m,
      ...getBirthdayDateInfo(m.birth_day, m.birth_month),
    }),
  );
  res.status(200).json(enriched);
}
