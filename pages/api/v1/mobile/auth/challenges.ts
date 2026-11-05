import { nativeSocialHandler } from 'models/native-social-auth-controller';

export const config = { api: { bodyParser: false } };
export default nativeSocialHandler('challenges');
