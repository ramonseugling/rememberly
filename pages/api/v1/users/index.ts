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
import emailVerification from 'models/email-verification';
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
    first_name,
    last_name,
    email,
    password,
    otp_code,
    verification_token,
    birth_day,
    birth_month,
    birth_year,
    marketing_consent,
  } = parseSchema(createUserSchema, req.body);

  const markVerified = verification_token
    ? await verifyToken(email, verification_token)
    : await verifyCode(email, otp_code ?? '');

  const createdUser = await user.create({
    name,
    first_name,
    last_name,
    email,
    password,
    birth_day,
    birth_month,
    birth_year,
    marketing_consent,
  });

  await markVerified();

  res.status(201).json(createdUser);
}

async function verifyToken(email: string, token: string) {
  const record = await emailVerification.verify(email, token);
  return () => emailVerification.markAsUsed(record.id);
}

async function verifyCode(email: string, code: string) {
  const record = await otp.verify(email, code);
  return () => otp.markAsUsed(record.id);
}

async function handlePatch(req: AuthenticatedRequest, res: NextApiResponse) {
  const { name, first_name, last_name, birth_day, birth_month, birth_year } =
    parseSchema(updateUserSchema, req.body);

  const updatedUser = await user.update(req.user.id, {
    name,
    first_name,
    last_name,
    birth_day,
    birth_month,
    birth_year,
  });

  res.status(200).json(updatedUser);
}
