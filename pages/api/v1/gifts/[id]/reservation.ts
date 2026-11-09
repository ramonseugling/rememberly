import type { NextApiResponse } from 'next';
import { parseSchema, reserveGiftSchema } from '@/lib/validators';
import {
  AuthenticatedRequest,
  authenticatedController,
} from 'infra/controller';
import giftReservation from 'models/gift-reservation';

export default authenticatedController({
  PUT: handlePut,
  DELETE: handleDelete,
});

async function handlePut(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };
  const { status } = parseSchema(reserveGiftSchema, req.body);
  const reservation = await giftReservation.reserve(req.user.id, id, status);
  res.status(200).json({
    item_id: reservation.item_id,
    availability: reservation.status,
    reserved_by_me: true,
  });
}

async function handleDelete(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };
  await giftReservation.cancel(req.user.id, id);
  res.status(204).end();
}
