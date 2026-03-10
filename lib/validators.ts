import { z } from 'zod';
import { ValidationError } from 'infra/errors';

export const createUserSchema = z.object({
  name: z
    .string({
      required_error: 'O nome é obrigatório.',
    })
    .trim()
    .min(2, 'O nome deve ter pelo menos 2 caracteres.')
    .max(100, 'O nome deve ter no máximo 100 caracteres.'),
  email: z
    .string({
      required_error: 'O e-mail é obrigatório.',
    })
    .trim()
    .email('E-mail inválido.')
    .max(254, 'O e-mail deve ter no máximo 254 caracteres.')
    .transform((val) => val.toLowerCase()),
  password: z
    .string({
      required_error: 'A senha é obrigatória.',
    })
    .min(8, 'A senha deve ter pelo menos 8 caracteres.')
    .max(72, 'A senha deve ter no máximo 72 caracteres.'),
});

export const createSessionSchema = z.object({
  email: z
    .string({
      required_error: 'O e-mail é obrigatório.',
    })
    .trim()
    .email('E-mail inválido.'),
  password: z
    .string({
      required_error: 'A senha é obrigatória.',
    })
    .min(1, 'A senha é obrigatória.'),
});

export const createEventSchema = z.object({
  title: z
    .string({
      required_error: 'O título do evento é obrigatório.',
    })
    .trim()
    .min(1, 'O título do evento é obrigatório.')
    .max(200, 'O título deve ter no máximo 200 caracteres.'),
  type: z.enum(
    ['birthday', 'dating_anniversary', 'wedding_anniversary', 'celebration'],
    {
      errorMap: () => ({
        message:
          'Tipo de evento inválido. Use: birthday, dating_anniversary, wedding_anniversary ou celebration.',
      }),
    },
  ),
  event_day: z
    .number({
      required_error: 'O dia do evento é obrigatório.',
      invalid_type_error: 'O dia do evento deve ser um número.',
    })
    .int('O dia deve ser um número inteiro.')
    .min(1, 'O dia deve ser entre 1 e 31.')
    .max(31, 'O dia deve ser entre 1 e 31.'),
  event_month: z
    .number({
      required_error: 'O mês do evento é obrigatório.',
      invalid_type_error: 'O mês do evento deve ser um número.',
    })
    .int('O mês deve ser um número inteiro.')
    .min(1, 'O mês deve ser entre 1 e 12.')
    .max(12, 'O mês deve ser entre 1 e 12.'),
});

export const updateEventSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'O título do evento não pode ser vazio.')
      .max(200, 'O título deve ter no máximo 200 caracteres.')
      .optional(),
    type: z
      .enum(
        [
          'birthday',
          'dating_anniversary',
          'wedding_anniversary',
          'celebration',
        ],
        {
          errorMap: () => ({
            message:
              'Tipo de evento inválido. Use: birthday, dating_anniversary, wedding_anniversary ou celebration.',
          }),
        },
      )
      .optional(),
    event_day: z
      .number({
        invalid_type_error: 'O dia do evento deve ser um número.',
      })
      .int('O dia deve ser um número inteiro.')
      .min(1, 'O dia deve ser entre 1 e 31.')
      .max(31, 'O dia deve ser entre 1 e 31.')
      .optional(),
    event_month: z
      .number({
        invalid_type_error: 'O mês do evento deve ser um número.',
      })
      .int('O mês deve ser um número inteiro.')
      .min(1, 'O mês deve ser entre 1 e 12.')
      .max(12, 'O mês deve ser entre 1 e 12.')
      .optional(),
  })
  .refine(
    (data) => Object.values(data).some((v) => v !== undefined),
    'Informe ao menos um campo para atualizar.',
  );

export const forgotPasswordSchema = z.object({
  email: z
    .string({
      required_error: 'O e-mail é obrigatório.',
    })
    .trim()
    .email('E-mail inválido.'),
});

export const resetPasswordSchema = z.object({
  token: z
    .string({
      required_error: 'O token é obrigatório.',
    })
    .min(1, 'O token é obrigatório.'),
  password: z
    .string({
      required_error: 'A nova senha é obrigatória.',
    })
    .min(8, 'A senha deve ter pelo menos 8 caracteres.')
    .max(72, 'A senha deve ter no máximo 72 caracteres.'),
});

export function parseSchema<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const firstError = result.error.errors[0];
    throw new ValidationError({
      message: firstError.message,
      action: 'Corrija os dados enviados e tente novamente.',
    });
  }

  return result.data;
}
