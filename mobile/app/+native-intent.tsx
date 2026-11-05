import { apiConfiguration } from '../src/config/environment';
import { intentPath, parseNativeLink } from '../src/navigation/intents';

export function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}) {
  const intent = parseNativeLink(
    path,
    apiConfiguration.environment === 'development'
      ? apiConfiguration.apiOrigin
      : undefined,
  );
  return intent ? intentPath(intent) : '/';
}
