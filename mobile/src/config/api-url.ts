export type AppEnvironment = 'development' | 'staging' | 'production';

export function parseApiConfiguration(
  environment: string | undefined,
  apiUrl: string | undefined,
): { environment: AppEnvironment; apiOrigin: string } {
  if (
    environment !== 'development' &&
    environment !== 'staging' &&
    environment !== 'production'
  ) {
    throw new Error(
      'Set EXPO_PUBLIC_APP_ENV to development, staging, or production.',
    );
  }
  if (!apiUrl || apiUrl !== apiUrl.trim()) {
    throw new Error(
      'Set EXPO_PUBLIC_API_URL to an API origin without whitespace.',
    );
  }

  let url: URL;
  try {
    url = new URL(apiUrl);
  } catch {
    throw new Error('EXPO_PUBLIC_API_URL must be an absolute API origin.');
  }
  const allowedProtocol =
    url.protocol === 'https:' ||
    (environment === 'development' && url.protocol === 'http:');
  if (
    !allowedProtocol ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      'Use an HTTPS API origin without credentials, path, query, or fragment. HTTP is allowed only in development.',
    );
  }
  return { environment, apiOrigin: url.origin };
}
