import nextJest from 'next/jest';
import type { Config } from 'jest';

const createJestConfig = nextJest({ dir: './' });

const customConfig: Config = {
  testEnvironment: 'node',
  testTimeout: 60000,
  moduleNameMapper: {
    '^infra/(.*)$': '<rootDir>/infra/$1',
    '^models/(.*)$': '<rootDir>/models/$1',
    '^tests/(.*)$': '<rootDir>/tests/$1',
    '^lib/(.*)$': '<rootDir>/lib/$1',
  },
};

export default async () => {
  const nextJestConfig = await createJestConfig(customConfig)();
  return {
    ...nextJestConfig,
    transformIgnorePatterns: [
      '/node_modules/(?!(node-pg-migrate|@faker-js/faker)/)',
    ],
  };
};
