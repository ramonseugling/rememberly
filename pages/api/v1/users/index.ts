import type { NextApiRequest, NextApiResponse } from 'next';
import {
  createUserSchema,
  parseSchema,
  updateUserSchema,
} from '@/lib/validators';
import controller, {
  type AuthenticatedRequest,
  authenticatedController,
} from 'infra/controller';
import otp from 'models/otp';
import user from 'models/user';

const publicHandler = controller({ POST: handlePost });
const authHandler = authenticatedController({ PATCH: handlePatch });

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === 'PATCH') {
    return authHandler(req, res);
  }
  return publicHandler(req, res);
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const {
    name,
    email,
    password,
    otp_code,
    birth_day,
    birth_month,
    birth_year,
  } = parseSchema(createUserSchema, req.body);

  const otpRecord = await otp.verify(email, otp_code);

  const createdUser = await user.create({
    name,
    email,
    password,
    birth_day,
    birth_month,
    birth_year,
  });

  await otp.markAsUsed(otpRecord.id);

  res.status(201).json(createdUser);
}

async function handlePatch(req: AuthenticatedRequest, res: NextApiResponse) {
  const { birth_day, birth_month, birth_year } = parseSchema(
    updateUserSchema,
    req.body,
  );

  const updatedUser = await user.update(req.user.id, {
    birth_day,
    birth_month,
    birth_year,
  });

  res.status(200).json(updatedUser);
}
