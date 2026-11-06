import { Redirect } from 'expo-router';
import { apiConfiguration } from '../src/config/environment';
import { isDesignCatalogEnabled } from '../src/design-system/availability';
import { DesignSystemCatalog } from '../src/design-system/catalog';

export default function DesignSystemPage() {
  if (!isDesignCatalogEnabled(apiConfiguration.environment, __DEV__))
    return <Redirect href="/" />;
  return <DesignSystemCatalog />;
}
