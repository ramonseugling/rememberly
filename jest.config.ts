import type { Config } from 'jest';
import nextJest from 'next/jest';

const createJestConfig = nextJest({ dir: './' });

const config: Config = {
  testEnvironment: 'node',
  testTimeout: 60000,
  moduleNameMapper: {
    '^infra/(.*)$': '<rootDir>/infra/$1',
    '^models/(.*)$': '<rootDir>/models/$1',
    '^tests/(.*)$': '<rootDir>/tests/$1',
  },
};

export default createJestConfig(config);
