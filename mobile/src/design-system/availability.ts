export function isDesignCatalogEnabled(
  environment: string,
  developmentBundle: boolean,
): boolean {
  return environment === 'development' && developmentBundle;
}
