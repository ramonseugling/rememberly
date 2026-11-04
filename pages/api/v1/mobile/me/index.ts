import { mobileGet } from 'infra/mobile-controller';

export const config = { api: { bodyParser: false } };

export default mobileGet('/api/v1/mobile/me', async (identity) => ({
  user: {
    id: identity.user_id,
    name: identity.name,
    email: identity.email,
    birth_day: identity.birth_day,
    birth_month: identity.birth_month,
    birth_year: identity.birth_year,
  },
}));
