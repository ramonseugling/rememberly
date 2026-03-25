import { z } from 'zod';
import { ValidationError } from 'infra/errors';

const birthdayFields = {
  birth_day: z
    .number({
      required_error: 'O dia de nascimento é obrigatório.',
      invalid_type_error: 'O dia de nascimento deve ser um número.',
    })
    .int('O dia deve ser um número inteiro.')
    .min(1, 'O dia deve ser entre 1 e 31.')
    .max(31, 'O dia deve ser entre 1 e 31.'),
  birth_month: z
    .number({
      required_error: 'O mês de nascimento é obrigatório.',
      invalid_type_error: 'O mês de nascimento deve ser um número.',
    })
    .int('O mês deve ser um número inteiro.')
    .min(1, 'O mês deve ser entre 1 e 12.')
    .max(12, 'O mês deve ser entre 1 e 12.'),
  birth_year: z
    .number({
      required_error: 'O ano de nascimento é obrigatório.',
      invalid_type_error: 'O ano de nascimento deve ser um número.',
    })
    .int('O ano deve ser um número inteiro.')
    .min(1900, 'O ano deve ser a partir de 1900.')
    .max(new Date().getFullYear(), 'O ano não pode ser no futuro.'),
};

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
  otp_code: z
    .string({
      required_error: 'O código de verificação é obrigatório.',
    })
    .length(6, 'O código de verificação deve ter 6 dígitos.')
    .regex(/^\d{6}$/, 'O código de verificação deve conter apenas números.'),
  ...birthdayFields,
});

export const updateUserSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'O nome deve ter pelo menos 2 caracteres.')
      .max(100, 'O nome deve ter no máximo 100 caracteres.')
      .optional(),
    birth_day: birthdayFields.birth_day.optional(),
    birth_month: birthdayFields.birth_month.optional(),
    birth_year: birthdayFields.birth_year.optional(),
  })
  .refine(
    (data) => Object.values(data).some((v) => v !== undefined),
    'Informe ao menos um campo para atualizar.',
  );

export const createOtpSchema = z.object({
  email: z
    .string({
      required_error: 'O e-mail é obrigatório.',
    })
    .trim()
    .email('E-mail inválido.')
    .max(254, 'O e-mail deve ter no máximo 254 caracteres.')
    .transform((val) => val.toLowerCase()),
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

export const createEventSchema = z
  .object({
    title: z
      .string({
        required_error: 'O título do evento é obrigatório.',
      })
      .trim()
      .min(1, 'O título do evento é obrigatório.')
      .max(200, 'O título deve ter no máximo 200 caracteres.'),
    type: z.enum(
      [
        'birthday',
        'dating_anniversary',
        'wedding_anniversary',
        'celebration',
        'custom',
      ],
      {
        errorMap: () => ({
          message:
            'Tipo de evento inválido. Use: birthday, dating_anniversary, wedding_anniversary, celebration ou custom.',
        }),
      },
    ),
    custom_type: z
      .string()
      .trim()
      .min(
        1,
        'O tipo personalizado é obrigatório quando o tipo é "Personalizado".',
      )
      .max(100, 'O tipo personalizado deve ter no máximo 100 caracteres.')
      .optional()
      .nullable(),
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
    reminder_days_before: z
      .number({
        invalid_type_error: 'A notificação antecipada deve ser um número.',
      })
      .int('A notificação antecipada deve ser um número inteiro.')
      .refine(
        (v) => [0, 1, 3, 7, 15, 30].includes(v),
        'Valor inválido para notificação antecipada. Use: 0, 1, 3, 7, 15 ou 30.',
      )
      .default(0),
  })
  .refine(
    (data) => {
      if (data.type === 'custom') {
        return !!data.custom_type && data.custom_type.trim().length > 0;
      }
      return true;
    },
    {
      message:
        'O tipo personalizado é obrigatório quando o tipo é "Personalizado".',
      path: ['custom_type'],
    },
  );

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
          'custom',
        ],
        {
          errorMap: () => ({
            message:
              'Tipo de evento inválido. Use: birthday, dating_anniversary, wedding_anniversary, celebration ou custom.',
          }),
        },
      )
      .optional(),
    custom_type: z
      .string()
      .trim()
      .min(1, 'O tipo personalizado não pode ser vazio.')
      .max(100, 'O tipo personalizado deve ter no máximo 100 caracteres.')
      .optional()
      .nullable(),
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
    reminder_days_before: z
      .number({
        invalid_type_error: 'A notificação antecipada deve ser um número.',
      })
      .int('A notificação antecipada deve ser um número inteiro.')
      .refine(
        (v) => [0, 1, 3, 7, 15, 30].includes(v),
        'Valor inválido para notificação antecipada. Use: 0, 1, 3, 7, 15 ou 30.',
      )
      .optional(),
  })
  .refine(
    (data) => Object.values(data).some((v) => v !== undefined),
    'Informe ao menos um campo para atualizar.',
  )
  .refine(
    (data) => {
      if (data.type === 'custom') {
        return !!data.custom_type && data.custom_type.trim().length > 0;
      }
      return true;
    },
    {
      message:
        'O tipo personalizado é obrigatório quando o tipo é "Personalizado".',
      path: ['custom_type'],
    },
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

export const createGroupSchema = z.object({
  name: z
    .string({
      required_error: 'O nome do grupo é obrigatório.',
    })
    .trim()
    .min(1, 'O nome do grupo é obrigatório.')
    .max(100, 'O nome do grupo deve ter no máximo 100 caracteres.'),
});

export const updateGroupSchema = z.object({
  name: z
    .string({
      required_error: 'O nome do grupo é obrigatório.',
    })
    .trim()
    .min(1, 'O nome do grupo é obrigatório.')
    .max(100, 'O nome do grupo deve ter no máximo 100 caracteres.'),
});

export const joinGroupSchema = z.object({
  invite_code: z
    .string({
      required_error: 'O código de convite é obrigatório.',
    })
    .trim()
    .min(1, 'O código de convite é obrigatório.'),
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
