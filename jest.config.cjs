// Jest configuration in CommonJS format
module.exports = {
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'ts', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  testMatch: ['**/tests/unit/**/*.test.(ts|js)'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
};
