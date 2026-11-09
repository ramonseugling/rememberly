import { z } from 'zod';
import controller from '@/infra/controller';
import { NotFoundError, ValidationError } from '@/infra/errors';
import { consumeLoginIp, respondToLoginLimit } from '@/models/login-rate-limit';
import group from 'models/group';

const querySchema = z.object({
  code: z.string().regex(/^[A-Za-z0-9_-]{1,32}$/),
});

export default controller({
  GET: async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    try {
      await consumeLoginIp(req);
    } catch (error) {
      if (respondToLoginLimit(res, error)) return;
      throw error;
    }
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new ValidationError({
        message: 'O código de convite é inválido.',
        action: 'Peça um novo convite a quem administra o grupo.',
      });
    }
    const found = await group.findByInviteCode(parsed.data.code);
    if (!found) {
      throw new NotFoundError({
        message: 'Grupo não encontrado.',
        action: 'Verifique o convite e tente novamente.',
      });
    }
    res.status(200).json({ name: found.name });
  },
});
