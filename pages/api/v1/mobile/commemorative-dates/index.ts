import { mobileGet } from 'infra/mobile-controller';
import mobileData from 'models/mobile-data';

export const config = { api: { bodyParser: false } };

export default mobileGet('/api/v1/mobile/commemorative-dates', (identity) =>
  mobileData.commemorativeDates(identity.user_id),
);
