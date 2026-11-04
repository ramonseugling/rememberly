import { mobileGet } from 'infra/mobile-controller';
import mobileData from 'models/mobile-data';

export const config = { api: { bodyParser: false } };

export default mobileGet('/api/v1/mobile/agenda', (identity) =>
  mobileData.agenda(identity.user_id),
);
