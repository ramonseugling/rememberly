import { parseApiConfiguration } from './api-url';

export const apiConfiguration = parseApiConfiguration(
  process.env.EXPO_PUBLIC_APP_ENV,
  process.env.EXPO_PUBLIC_API_URL,
);
